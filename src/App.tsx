import { useState, useEffect, useCallback } from 'react';
import type { InstanceReport } from './types';
import { validateDomain } from './utils/domainUtils';
import { ReportGenerator } from './services/reportGenerator';
import { CacheService } from './services/cache';
import DomainInput from './components/DomainInput';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';
import ScoreDisplay from './components/ScoreDisplay';
import ReportTabs from './components/ReportTabs';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string; details?: string[] } | null>(null);
  const [report, setReport] = useState<InstanceReport | null>(null);
  const [cacheAge, setCacheAge] = useState<string | null>(null);

  const handleAnalyze = useCallback(async (domain: string, bypassCache: boolean = false) => {
    setIsLoading(true);
    setError(null);
    setReport(null);
    setCacheAge(null);

    try {
      // Validate domain (lenient - only checks format)
      const validation = await validateDomain(domain);

      if (!validation.valid) {
        setError({
          message: 'Invalid domain format',
          details: validation.errors
        });
        setIsLoading(false);
        return;
      }

      const normalizedDomain = validation.normalized;

      // Log warnings but don't stop execution
      if (validation.warnings.length > 0) {
        console.log('Domain validation warnings:', validation.warnings);
      }

      // Update URL path (not hash)
      const basePath = '/FediTS/'; // Must match vite.config.ts base
      const newPath = `${basePath}${normalizedDomain}`;

      // Only update URL if it's different from current path
      if (window.location.pathname !== newPath) {
        window.history.pushState(null, '', newPath);
      }

      // Check cache first (unless bypass requested)
      if (!bypassCache) {
        const cachedReport = CacheService.getCachedReport(normalizedDomain);
        if (cachedReport) {
          console.log('Using cached report');
          setReport(cachedReport);
          setCacheAge(CacheService.getCacheAgeString(normalizedDomain));
          setIsLoading(false);
          return;
        }
      }

      // Generate fresh report
      console.log('Generating fresh report');
      const generatedReport = await ReportGenerator.generateReport(normalizedDomain);

      // Cache the report
      CacheService.setCachedReport(normalizedDomain, generatedReport);

      setReport(generatedReport);
      setCacheAge('just now');

    } catch (err) {
      setError({
        message: 'Failed to generate report',
        details: [err instanceof Error ? err.message : 'Unknown error']
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle URL path changes to auto-load domains
  useEffect(() => {
    const loadFromPath = () => {
      // Get path after base URL
      // For GitHub Pages: /FediTS/mastodon.social -> mastodon.social
      const path = window.location.pathname;
      const basePath = '/FediTS/'; // Must match vite.config.ts base

      if (path.startsWith(basePath)) {
        const domain = path.slice(basePath.length);
        if (domain && domain !== '') {
          console.log(`Loading domain from URL path: ${domain}`);
          handleAnalyze(domain, false); // Don't bypass cache on initial load
        }
      }
    };

    // Load on mount
    loadFromPath();

    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', loadFromPath);

    // Cleanup old caches on mount
    CacheService.cleanupOldCaches();

    return () => {
      window.removeEventListener('popstate', loadFromPath);
    };
  }, [handleAnalyze]);

  const handleRescan = () => {
    if (report) {
      handleAnalyze(report.domain, true); // Bypass cache
    }
  };

  const handleExportJSON = () => {
    if (!report) return;

    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fedits-report-${report.domain}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container">
      <DomainInput onSubmit={handleAnalyze} isLoading={isLoading} />

      {isLoading && <LoadingSpinner message="Analyzing instance..." />}

      {error && <ErrorDisplay message={error.message} errors={error.details} />}

      {report && (
        <>
          {/* Cache status banner */}
          {cacheAge && cacheAge !== 'just now' && (
            <div style={{
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ fontSize: '0.9rem' }}>
                ℹ️ <strong>Cached report</strong> from {cacheAge}
                <span style={{ marginLeft: '0.5rem', color: '#666' }}>
                  (expires after 8 hours)
                </span>
              </div>
              <button
                onClick={handleRescan}
                disabled={isLoading}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.9rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1
                }}
              >
                🔄 Rescan Now
              </button>
            </div>
          )}

          <ScoreDisplay score={report.safetyScore} report={report} />
          <ReportTabs report={report} />

          <div style={{ marginTop: '2rem', textAlign: 'center', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleExportJSON}>
              Export Report (JSON)
            </button>
            <button
              onClick={handleRescan}
              disabled={isLoading}
              style={{
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              🔄 Rescan
            </button>
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', fontSize: '0.85rem', color: '#666', textAlign: 'center' }}>
            <p>
              This report is generated from publicly available data sources and should not be the sole basis for trust decisions.
            </p>
            <p style={{ marginTop: '0.5rem' }}>
              Data sources: FediDB, instance APIs, Server Covenant list, GardenFence, IFTAS DNI
            </p>
            {cacheAge === 'just now' && (
              <p style={{ marginTop: '0.5rem', color: 'var(--success-color)' }}>
                ✓ Fresh scan - cached for 8 hours
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
