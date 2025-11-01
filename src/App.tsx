import { useState } from 'react';
import type { InstanceReport } from './types';
import { validateDomain } from './utils/domainUtils';
import { ReportGenerator } from './services/reportGenerator';
import DomainInput from './components/DomainInput';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';
import ScoreDisplay from './components/ScoreDisplay';
import ReportTabs from './components/ReportTabs';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string; details?: string[] } | null>(null);
  const [report, setReport] = useState<InstanceReport | null>(null);

  const handleAnalyze = async (domain: string) => {
    setIsLoading(true);
    setError(null);
    setReport(null);

    try {
      // Validate domain
      const validation = await validateDomain(domain);

      if (!validation.valid) {
        setError({
          message: 'Invalid domain or unreachable instance',
          details: validation.errors
        });
        setIsLoading(false);
        return;
      }

      // Generate report
      const generatedReport = await ReportGenerator.generateReport(validation.normalized);
      setReport(generatedReport);

    } catch (err) {
      setError({
        message: 'Failed to generate report',
        details: [err instanceof Error ? err.message : 'Unknown error']
      });
    } finally {
      setIsLoading(false);
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
          <ScoreDisplay score={report.safetyScore} />
          <ReportTabs report={report} />

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button onClick={handleExportJSON}>
              Export Report (JSON)
            </button>
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', fontSize: '0.85rem', color: '#666', textAlign: 'center' }}>
            <p>
              This report is generated from publicly available data sources and should not be the sole basis for trust decisions.
            </p>
            <p style={{ marginTop: '0.5rem' }}>
              Data sources: FediDB, instance APIs, Server Covenant list, GardenFence, IFTAS DNI
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
