import { useState } from 'react';
import type { InstanceReport } from '../types';
import SourceBadge from './SourceBadge';

interface ReportTabsProps {
  report: InstanceReport;
}

// Helper function to get country flag emoji from country code
function getCountryFlag(countryCode: string): string {
  if (countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default function ReportTabs({ report }: ReportTabsProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'safety' | 'security' | 'infrastructure' | 'policies'>('about');

  const tabStyle = (tab: string) => ({
    padding: '0.75rem 1.5rem',
    background: activeTab === tab ? 'var(--primary-color)' : 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderBottom: activeTab === tab ? 'none' : '1px solid var(--border-color)'
  });

  // Format last seen date
  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="card">
      {/* BLOCKLIST WARNING BANNER */}
      {report.externalBlocklists && report.externalBlocklists.length > 0 && (
        <div style={{
          padding: '1.25rem',
          marginBottom: '1.5rem',
          backgroundColor: 'rgba(220, 38, 38, 0.15)',
          border: '3px solid rgba(220, 38, 38, 0.5)',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <span style={{ fontSize: '2rem', lineHeight: 1 }}>🚨</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 0.75rem 0', color: '#dc2626', fontSize: '1.3rem' }}>
                WARNING: Instance Appears on Community Blocklists
              </h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 'bold' }}>
                This instance has been flagged by {report.externalBlocklists.length} blocklist{report.externalBlocklists.length > 1 ? 's' : ''}:
              </p>
              {report.externalBlocklists.map((match, idx) => (
                <div key={idx} style={{
                  padding: '0.75rem',
                  marginBottom: '0.75rem',
                  backgroundColor: match.severity === 'critical'
                    ? 'rgba(220, 38, 38, 0.2)'
                    : 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid ' + (match.severity === 'critical'
                    ? 'rgba(220, 38, 38, 0.4)'
                    : 'rgba(245, 158, 11, 0.4)'),
                  borderRadius: '6px'
                }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.5rem', color: '#dc2626' }}>
                    {match.listName}
                    <span style={{
                      marginLeft: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      backgroundColor: match.severity === 'critical' ? '#dc2626' : '#f59e0b',
                      color: '#fff',
                      borderRadius: '3px',
                      textTransform: 'uppercase'
                    }}>
                      {match.severity}
                    </span>
                  </div>
                  {match.reason ? (
                    <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                      <strong>Reason:</strong> {match.reason}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#888' }}>
                      No specific reason provided by blocklist
                    </div>
                  )}
                </div>
              ))}
              <p style={{ margin: '1rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                <strong>⚠️ Important:</strong> Blocklist inclusion indicates community concerns about this instance's
                moderation practices or content. Exercise caution when federating with this instance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instance Status Banner */}
      {report.instanceStatus && !report.instanceStatus.reachable && (
        <div style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--danger-color)' }}>
                Instance Unreachable
              </h4>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                Unable to connect to this instance directly.
                {report.isHistoricalData ? ' Showing historical/archived data from external sources.' : ' No historical data available.'}
              </p>
              {report.instanceStatus.lastSeenOnline && (
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#888' }}>
                  Last seen online: {formatLastSeen(report.instanceStatus.lastSeenOnline)}
                  {' '}(via {report.instanceStatus.statusSource})
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Historical Data Warning */}
      {report.isHistoricalData && report.instanceStatus?.reachable === false && (
        <div style={{
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '8px',
          fontSize: '0.9rem'
        }}>
          📚 <strong>Historical Data:</strong> This information may be outdated. Data sourced from FediDB and Fediverse Observer archives.
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '-1px', flexWrap: 'wrap' }}>
        <button style={tabStyle('about')} onClick={() => setActiveTab('about')}>
          About
        </button>
        <button style={tabStyle('safety')} onClick={() => setActiveTab('safety')}>
          Safety
        </button>
        <button style={tabStyle('security')} onClick={() => setActiveTab('security')}>
          Security
        </button>
        <button style={tabStyle('infrastructure')} onClick={() => setActiveTab('infrastructure')}>
          Infrastructure
        </button>
        <button style={tabStyle('policies')} onClick={() => setActiveTab('policies')}>
          Policies
        </button>
      </div>

      {/* Tab Content */}
      <div style={{
        border: '1px solid var(--border-color)',
        borderRadius: '0 8px 8px 8px',
        padding: '1.5rem',
        minHeight: '200px',
        textAlign: 'left'
      }}>
        {activeTab === 'about' && <AboutTab report={report} />}
        {activeTab === 'safety' && <SafetyTab report={report} />}
        {activeTab === 'security' && <SecurityTab report={report} />}
        {activeTab === 'infrastructure' && <InfrastructureTab report={report} />}
        {activeTab === 'policies' && <PoliciesTab report={report} />}
      </div>
    </div>
  );
}

/**
 * About Tab - Instance overview, description, banner, contact info
 */
function AboutTab({ report }: { report: InstanceReport }) {
  const instance = report.instanceData;

  // Render cross-referenced field with checkmark or multiple values
  const renderCrossRefField = (
    field: { value: any | null; apiValue: any | null; nodeInfoValue: any | null; match: boolean; sources: ('api' | 'nodeinfo')[] } | undefined,
    formatter?: (val: any) => string
  ) => {
    if (!field || field.value === null) return null;

    const format = formatter || ((v: any) => String(v));
    const greenCheck = <span style={{ color: '#00c853', marginLeft: '0.5rem' }}>✓</span>;

    // Both sources agree
    if (field.match && field.sources.length === 2) {
      return (
        <>
          {format(field.value)}
          {greenCheck}
          <SourceBadge
            source="both"
            tooltip="Confirmed by both Instance API and NodeInfo"
          />
        </>
      );
    }

    // Only one source
    if (field.sources.length === 1) {
      return (
        <>
          {format(field.value)}
          <SourceBadge
            source={field.sources[0] === 'api' ? 'instance-api' : 'nodeinfo'}
            tooltip={field.sources[0] === 'api' ? 'From Instance API' : 'From NodeInfo'}
          />
        </>
      );
    }

    // Both sources but different values - show both
    if (!field.match && field.apiValue !== null && field.nodeInfoValue !== null) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div>
            {format(field.apiValue)}
            <SourceBadge source="instance-api" tooltip="From Instance API" />
          </div>
          <div>
            {format(field.nodeInfoValue)}
            <SourceBadge source="nodeinfo" tooltip="From NodeInfo" />
          </div>
        </div>
      );
    }

    return <>{format(field.value)}</>;
  };

  return (
    <div>
      {/* Instance Banner/Hero Image */}
      {instance?.thumbnail && (
        <div style={{ marginBottom: '1.5rem', borderRadius: '8px', overflow: 'hidden' }}>
          <img
            src={instance.thumbnail}
            alt={`${report.domain} banner`}
            style={{
              width: '100%',
              maxHeight: '200px',
              objectFit: 'cover',
              display: 'block'
            }}
            onError={(e) => {
              // Hide image if it fails to load
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <h3 style={{ marginBottom: '1rem' }}>Instance Information</h3>

      {/* Instance Title & Description */}
      {instance?.title && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>
            {instance.title}
          </h4>
          {instance.short_description && (
            <p style={{ color: '#888', marginBottom: '0.5rem', lineHeight: '1.6' }}>
              {instance.short_description}
            </p>
          )}
          {instance.description && instance.description !== instance.short_description && (
            <details style={{ marginTop: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--primary-color)' }}>
                Read full description
              </summary>
              <p style={{ marginTop: '0.5rem', lineHeight: '1.6', color: '#888' }}>
                {instance.description}
              </p>
            </details>
          )}
        </div>
      )}

      {/* Basic Information */}
      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem' }}>
        <dt style={{ fontWeight: 'bold' }}>Domain:</dt>
        <dd>{report.domain}</dd>

        {report.instanceStatus && (
          <>
            <dt style={{ fontWeight: 'bold' }}>Status:</dt>
            <dd>
              {report.instanceStatus.reachable ? (
                <span className="success">✓ Online</span>
              ) : (
                <span style={{ color: 'var(--danger-color)' }}>⚠ Offline/Unreachable</span>
              )}
            </dd>
          </>
        )}

        {instance?.version && (
          <>
            <dt style={{ fontWeight: 'bold' }}>Version:</dt>
            <dd>
              {instance.version}
              <SourceBadge source="instance-api" tooltip="From /api/v1/instance endpoint" />
            </dd>
          </>
        )}

        {report.software && (
          <>
            <dt style={{ fontWeight: 'bold' }}>Software:</dt>
            <dd style={{ textTransform: 'capitalize' }}>
              {report.software}
              {report.serverType && report.serverType !== report.software && (
                <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: '#888' }}>
                  (Megalodon detected: {report.serverType})
                </span>
              )}
            </dd>
          </>
        )}

        <dt style={{ fontWeight: 'bold' }}>Report Generated:</dt>
        <dd>{report.timestamp.toLocaleString()}</dd>

        {/* User Statistics - Cross-referenced */}
        {report.crossReferencedData?.userCount && (
          <>
            <dt style={{ fontWeight: 'bold' }}>Total Users:</dt>
            <dd>
              {renderCrossRefField(
                report.crossReferencedData.userCount,
                (v: number) => v.toLocaleString()
              )}
            </dd>
          </>
        )}

        {report.crossReferencedData?.localPosts && (
          <>
            <dt style={{ fontWeight: 'bold' }}>Total Posts:</dt>
            <dd>
              {renderCrossRefField(
                report.crossReferencedData.localPosts,
                (v: number) => v.toLocaleString()
              )}
            </dd>
          </>
        )}

        {instance?.stats?.domain_count !== undefined && (
          <>
            <dt style={{ fontWeight: 'bold' }}>Known Instances:</dt>
            <dd>
              {instance.stats.domain_count.toLocaleString()}
              <SourceBadge source="instance-api" tooltip="From /api/v1/instance stats" />
            </dd>
          </>
        )}

        {/* Registration Status - Cross-referenced */}
        {report.crossReferencedData?.openRegistrations && (
          <>
            <dt style={{ fontWeight: 'bold' }}>Registrations:</dt>
            <dd>
              {renderCrossRefField(
                report.crossReferencedData.openRegistrations,
                (v: boolean) => v ? '✓ Open' : '⨯ Closed'
              )}
              {instance?.approval_required && report.crossReferencedData.openRegistrations.value && (
                <span style={{ color: '#888', marginLeft: '0.5rem' }}>(approval required)</span>
              )}
            </dd>
          </>
        )}

        {/* Languages */}
        {instance?.languages && instance.languages.length > 0 && (
          <>
            <dt style={{ fontWeight: 'bold' }}>Languages:</dt>
            <dd>{instance.languages.slice(0, 5).join(', ')}{instance.languages.length > 5 && '...'}</dd>
          </>
        )}
      </dl>

      {/* Contact Information */}
      {(instance?.contact_account || instance?.email) && (
        <div style={{ marginTop: '2rem' }}>
          <h4 style={{ marginBottom: '0.75rem' }}>Contact Information</h4>
          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem' }}>
            {instance.contact_account && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Administrator:</dt>
                <dd>
                  {instance.contact_account.url ? (
                    <a href={instance.contact_account.url} target="_blank" rel="noopener noreferrer">
                      @{instance.contact_account.acct || instance.contact_account.username}
                    </a>
                  ) : (
                    `@${instance.contact_account.acct || instance.contact_account.username}`
                  )}
                  {instance.contact_account.display_name && (
                    <span style={{ marginLeft: '0.5rem', color: '#888' }}>
                      ({instance.contact_account.display_name})
                    </span>
                  )}
                  <SourceBadge source="instance-api" tooltip="From /api/v1/instance contact_account" />
                </dd>
              </>
            )}

            {instance.email && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Email:</dt>
                <dd>
                  <a href={`mailto:${instance.email}`}>{instance.email}</a>
                  <SourceBadge source="instance-api" tooltip="From /api/v1/instance email" />
                </dd>
              </>
            )}
          </dl>
        </div>
      )}

      {/* Server Covenant */}
      <div style={{ marginTop: '2rem' }}>
        <h4 style={{ marginBottom: '0.75rem' }}>Server Covenant</h4>
        {report.serverCovenant?.listed ? (
          <>
            <span className="success">✓ Listed</span>
            <SourceBadge source="covenant" tooltip="Verified against Mastodon Server Covenant API" />
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#888' }}>
              This instance is part of the Fediverse Server Covenant, committing to active moderation,
              daily backups, and providing shutdown notice.
            </p>
          </>
        ) : (
          <>
            <span>Not listed</span>
            <SourceBadge source="covenant" />
          </>
        )}
      </div>

      {/* Errors */}
      {report.errors.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h4 style={{ color: 'var(--warning-color)', marginBottom: '0.5rem' }}>
            Data Collection Issues
          </h4>
          <ul style={{ paddingLeft: '1.5rem', color: '#888' }}>
            {report.errors.map((err, idx) => (
              <li key={idx}>
                <strong>{err.source}:</strong> {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Safety Tab - Moderation policies and rule analysis
 */
function SafetyTab({ report }: { report: InstanceReport }) {
  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>
        Moderation Policies & Safety
        {report.moderationPolicies && report.moderationPolicies.length > 0 && (
          <SourceBadge source="instance-api" tooltip="From /api/v1/instance/rules endpoint" />
        )}
      </h3>

      {/* Algorithmic Detection Disclaimer */}
      <div style={{
        padding: '0.75rem 1rem',
        marginBottom: '1.5rem',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        borderRadius: '8px',
        fontSize: '0.9rem'
      }}>
        <strong>ℹ️ Disclaimer:</strong> The rule analysis below is generated algorithmically using pattern matching
        and natural language processing. While it provides helpful insights, it may not capture all nuances
        of an instance's moderation policies. <strong>Users should read the actual rules carefully and make
        their own informed determination</strong> about whether an instance is suitable for their needs.
      </div>

      {/* Moderation Policies/Rules */}
      {report.moderationPolicies && report.moderationPolicies.length > 0 ? (
        <>
          <p style={{ marginBottom: '1rem', color: '#888' }}>
            This instance has {report.moderationPolicies.length} published moderation rules.
          </p>
          <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
            {report.moderationPolicies.map(policy => (
              <li key={policy.id} style={{ marginBottom: '0.75rem' }}>
                {policy.text}
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p style={{ color: '#888' }}>No public moderation policies found.</p>
      )}

      {/* Enhanced Moderation Analysis */}
      {report.enhancedModerationAnalysis && (
        <div style={{ marginTop: '2rem' }}>
          <h4 style={{ marginBottom: '0.75rem' }}>Rule Analysis</h4>

          {/* Score Display */}
          <div style={{ marginBottom: '1rem' }}>
            <strong>Coverage Score:</strong> {report.enhancedModerationAnalysis.normalizedScore.toFixed(1)}/37.5
            <span style={{ marginLeft: '0.5rem', color: '#888' }}>
              (Confidence: {report.enhancedModerationAnalysis.confidence}%)
            </span>
          </div>

          {/* Server Covenant Alignment */}
          {report.enhancedModerationAnalysis.serverCovenantAlignment && (
            <div style={{
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              backgroundColor: report.enhancedModerationAnalysis.serverCovenantAlignment.meetsRequirements
                ? 'rgba(16, 185, 129, 0.1)'
                : 'rgba(245, 158, 11, 0.1)',
              border: report.enhancedModerationAnalysis.serverCovenantAlignment.meetsRequirements
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px'
            }}>
              <strong>Fediverse Server Covenant Alignment:</strong> {report.enhancedModerationAnalysis.serverCovenantAlignment.score}/100
              {report.enhancedModerationAnalysis.serverCovenantAlignment.meetsRequirements && (
                <span style={{ marginLeft: '0.5rem', color: 'var(--success-color)' }}>✓ Meets Requirements</span>
              )}
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#888' }}>
                Active moderation against:
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <span>{report.enhancedModerationAnalysis.serverCovenantAlignment.details.hasRacismPolicy ? '✓' : '⨯'} Racism</span>
                  <span>{report.enhancedModerationAnalysis.serverCovenantAlignment.details.hasSexismPolicy ? '✓' : '⨯'} Sexism</span>
                  <span>{report.enhancedModerationAnalysis.serverCovenantAlignment.details.hasHomophobiaPolicy ? '✓' : '⨯'} Homophobia</span>
                  <span>{report.enhancedModerationAnalysis.serverCovenantAlignment.details.hasTransphobiaPolicy ? '✓' : '⨯'} Transphobia</span>
                </div>
              </div>
            </div>
          )}

          {/* Categories Covered */}
          {report.enhancedModerationAnalysis.categoriesCovered.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Categories Addressed:</strong>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {report.enhancedModerationAnalysis.categoriesCovered.map((cat, idx) => (
                  <span key={idx} style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '4px',
                    fontSize: '0.85rem'
                  }}>
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Protected Classes */}
          {report.enhancedModerationAnalysis.protectedClassesCovered.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Protected Classes:</strong>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {report.enhancedModerationAnalysis.protectedClassesCovered.map((cls, idx) => (
                  <span key={idx} style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '4px',
                    fontSize: '0.85rem'
                  }}>
                    {cls}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Positive Indicators */}
          {report.enhancedModerationAnalysis.positiveIndicators.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>✓ Strengths:</strong>
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', color: '#888' }}>
                {report.enhancedModerationAnalysis.strengths.map((strength, idx) => (
                  <li key={idx}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Red Flags */}
          {report.enhancedModerationAnalysis.redFlags.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: 'var(--danger-color)' }}>⚠ Red Flags:</strong>
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', color: 'var(--danger-color)' }}>
                {report.enhancedModerationAnalysis.redFlags.map((flag, idx) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {report.enhancedModerationAnalysis.suggestions.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>💡 Suggestions for Improvement:</strong>
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', color: '#888' }}>
                {report.enhancedModerationAnalysis.suggestions.map((suggestion, idx) => (
                  <li key={idx}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Languages Detected */}
          {report.enhancedModerationAnalysis.detectedLanguages.length > 0 && (
            <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>
              Languages detected: {report.enhancedModerationAnalysis.detectedLanguages.join(', ')}
              {report.enhancedModerationAnalysis.detectedLanguages.length > 1 && (
                <span style={{ marginLeft: '0.5rem', color: 'var(--success-color)' }}>
                  (+{(report.enhancedModerationAnalysis.detectedLanguages.length - 1) * 5} multi-language bonus!)
                </span>
              )}
            </div>
          )}

          {/* Debug: Pattern Matches Visualization */}
          {report.enhancedModerationAnalysis.matchedPatterns && report.enhancedModerationAnalysis.matchedPatterns.length > 0 && (
            <details style={{ marginTop: '1.5rem' }}>
              <summary style={{
                cursor: 'pointer',
                padding: '0.75rem',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontWeight: 'bold'
              }}>
                🔍 Debug: Pattern Detection Details ({report.enhancedModerationAnalysis.matchedPatterns.length} matches)
              </summary>
              <div style={{
                marginTop: '0.5rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                maxHeight: '400px',
                overflow: 'auto'
              }}>
                <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>
                  This shows exactly what patterns were detected in the rules and where they were triggered.
                </p>
                {report.enhancedModerationAnalysis.matchedPatterns.map((match, idx) => (
                  <div key={idx} style={{
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    backgroundColor: match.weight > 0
                      ? 'rgba(16, 185, 129, 0.05)'
                      : 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid ' + (match.weight > 0
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(239, 68, 68, 0.2)'),
                    borderRadius: '4px'
                  }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong style={{ color: match.weight > 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                        {match.category} → {match.subcategory}
                      </strong>
                      <span style={{
                        marginLeft: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '3px',
                        fontSize: '0.75rem'
                      }}>
                        {match.language.toUpperCase()}
                      </span>
                      <span style={{
                        marginLeft: '0.5rem',
                        fontSize: '0.85rem',
                        color: '#888'
                      }}>
                        Weight: {match.weight > 0 ? '+' : ''}{match.weight}
                      </span>
                    </div>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      backgroundColor: 'var(--bg-secondary)',
                      padding: '0.5rem',
                      borderRadius: '3px',
                      marginBottom: '0.5rem',
                      lineHeight: '1.6'
                    }}>
                      {/* Highlight the matched text within context */}
                      {(() => {
                        const contextLower = match.context.toLowerCase();
                        const matchLower = match.matchedText.toLowerCase();
                        const matchIndex = contextLower.indexOf(matchLower);

                        if (matchIndex === -1) {
                          return (
                            <>
                              ...{match.context}...
                              <br />
                              <strong style={{
                                backgroundColor: 'rgba(251, 191, 36, 0.3)',
                                padding: '0.125rem 0.25rem',
                                borderRadius: '2px'
                              }}>
                                {match.matchedText}
                              </strong>
                            </>
                          );
                        }

                        const before = match.context.substring(0, matchIndex);
                        const highlighted = match.context.substring(matchIndex, matchIndex + match.matchedText.length);
                        const after = match.context.substring(matchIndex + match.matchedText.length);

                        return (
                          <>
                            {before.length > 0 && '...'}
                            {before}
                            <strong style={{
                              backgroundColor: 'rgba(251, 191, 36, 0.4)',
                              padding: '0.125rem 0.25rem',
                              borderRadius: '2px',
                              color: '#000'
                            }}>
                              {highlighted}
                            </strong>
                            {after}
                            {after.length > 0 && '...'}
                          </>
                        );
                      })()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#888' }}>
                      Pattern: <code>{match.patternUsed}</code>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Metadata Quality Score */}
      {report.metadataScore && (
        <div style={{ marginTop: '2rem' }}>
          <h4 style={{ marginBottom: '0.75rem' }}>Instance Maturity & Transparency</h4>

          <div style={{ marginBottom: '1rem' }}>
            <strong>Quality Score:</strong> {report.metadataScore.totalScore}/25
          </div>

          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '0.5rem 1rem' }}>
            <dt style={{ fontWeight: 'bold' }}>Maturity:</dt>
            <dd>
              {report.metadataScore.details.ageDays !== undefined && (
                <span>{Math.floor(report.metadataScore.details.ageDays / 365)} years old</span>
              )}
              {report.metadataScore.details.userCount !== undefined && (
                <span>, {report.metadataScore.details.userCount.toLocaleString()} users</span>
              )}
            </dd>
            <dd style={{ textAlign: 'right' }}>{report.metadataScore.breakdown.maturity}/8</dd>

            <dt style={{ fontWeight: 'bold' }}>Transparency:</dt>
            <dd>
              {report.metadataScore.details.hasPrivacyPolicy && '✓ Privacy Policy '}
              {report.metadataScore.details.hasTerms && '✓ Terms '}
              {report.metadataScore.details.hasContact && '✓ Contact '}
            </dd>
            <dd style={{ textAlign: 'right' }}>{report.metadataScore.breakdown.transparency}/7</dd>

            <dt style={{ fontWeight: 'bold' }}>Registration:</dt>
            <dd style={{ textTransform: 'capitalize' }}>{report.metadataScore.details.registrationPolicy}</dd>
            <dd style={{ textAlign: 'right' }}>{report.metadataScore.breakdown.registration}/5</dd>

            <dt style={{ fontWeight: 'bold' }}>Description:</dt>
            <dd>{report.metadataScore.details.descriptionQuality} ({report.metadataScore.details.descriptionLength} chars)</dd>
            <dd style={{ textAlign: 'right' }}>{report.metadataScore.breakdown.description}/5</dd>
          </dl>

          {report.metadataScore.flags.length > 0 && (
            <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem', color: '#888', fontSize: '0.9rem' }}>
              {report.metadataScore.flags.map((flag, idx) => (
                <li key={idx}>{flag}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Blocked Instances Count */}
      {report.blockedInstances && report.blockedInstances.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h4 style={{ marginBottom: '0.5rem' }}>
            Defederation Activity
            <SourceBadge source="fedidb" tooltip="From FediDB federation data" />
          </h4>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>
            This instance blocks {report.blockedInstances.length} other instances.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Security Tab - Trust indicators, blocklists, external security checks
 */
function SecurityTab({ report }: { report: InstanceReport }) {
  const hasBlocklistMatches = report.externalBlocklists && report.externalBlocklists.length > 0;

  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>Security & Trust Indicators</h3>

      {/* Server Covenant */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '0.5rem' }}>Fediverse Server Covenant</h4>
        {report.serverCovenant?.listed ? (
          <div className="success">
            ✓ This instance is part of the Fediverse Server Covenant, indicating commitment to:
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', lineHeight: '1.6' }}>
              <li>Active moderation against harassment</li>
              <li>Daily backups</li>
              <li>Multiple people with infrastructure access</li>
              <li>3+ months notice before shutdown</li>
            </ul>
          </div>
        ) : (
          <p style={{ color: '#888' }}>Not listed in the Server Covenant.</p>
        )}
      </div>

      {/* External Blocklists */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '0.5rem' }}>
          External Blocklist Status
          <SourceBadge source="blocklist" tooltip="Checked against GardenFence and IFTAS DNI blocklists" />
        </h4>
        {hasBlocklistMatches ? (
          <div>
            <p className="warning" style={{ marginBottom: '1rem' }}>
              ⚠ This instance appears on {report.externalBlocklists!.length} external blocklist(s):
            </p>
            <ul style={{ paddingLeft: '1.5rem' }}>
              {report.externalBlocklists!.map((match, idx) => (
                <li key={idx} style={{ marginBottom: '0.75rem' }}>
                  <strong
                    style={{
                      color: match.severity === 'critical' ? 'var(--danger-color)' : 'var(--warning-color)'
                    }}
                  >
                    {match.listName}
                  </strong>
                  {match.reason && (
                    <span style={{ display: 'block', marginTop: '0.25rem', color: '#888' }}>
                      Reason: {match.reason}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="success">✓ Not found on checked blocklists (GardenFence, IFTAS DNI).</p>
        )}
      </div>

      {/* Network Health Score */}
      {report.networkHealthScore && (
        <div>
          <h4 style={{ marginBottom: '0.75rem' }}>Network Health Score</h4>

          <div style={{ marginBottom: '1rem' }}>
            <strong>Overall Score:</strong> {report.networkHealthScore.totalScore}/25
          </div>

          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '0.5rem 1rem' }}>
            <dt style={{ fontWeight: 'bold' }}>Federation:</dt>
            <dd>
              {report.networkHealthScore.details.peerCount.toLocaleString()} peers
              {report.networkHealthScore.details.peerPercentile && (
                <span style={{ color: '#888' }}> (top {100 - report.networkHealthScore.details.peerPercentile}%)</span>
              )}
            </dd>
            <dd style={{ textAlign: 'right' }}>{report.networkHealthScore.breakdown.federationHealth}/10</dd>

            <dt style={{ fontWeight: 'bold' }}>Reputation:</dt>
            <dd style={{ textTransform: 'capitalize' }}>{report.networkHealthScore.details.reputationLevel}</dd>
            <dd style={{ textAlign: 'right' }}>{report.networkHealthScore.breakdown.reputation}/8</dd>

            <dt style={{ fontWeight: 'bold' }}>Blocking Behavior:</dt>
            <dd>
              {report.networkHealthScore.details.blockCount} blocked
              {report.networkHealthScore.details.blockRatio && (
                <span style={{ color: '#888' }}> ({report.networkHealthScore.details.blockRatio.toFixed(1)}%)</span>
              )}
            </dd>
            <dd style={{ textAlign: 'right' }}>{report.networkHealthScore.breakdown.blockingBehavior}/4</dd>

            <dt style={{ fontWeight: 'bold' }}>Reciprocity:</dt>
            <dd>
              {report.networkHealthScore.details.blockedByCount === 0 ? (
                <span className="success">Not on external blocklists</span>
              ) : (
                <span className="warning">On {report.networkHealthScore.details.blockedByCount} blocklists</span>
              )}
            </dd>
            <dd style={{ textAlign: 'right' }}>{report.networkHealthScore.breakdown.reciprocity}/3</dd>
          </dl>

          {report.networkHealthScore.flags.length > 0 && (
            <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem', color: '#888', fontSize: '0.9rem' }}>
              {report.networkHealthScore.flags.map((flag, idx) => (
                <li key={idx}>{flag}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Infrastructure Tab - Software, hosting, networking, federation
 */
function InfrastructureTab({ report }: { report: InstanceReport }) {
  const peerCount = report.peers?.length || 0;
  const totalPeerCount = report.peersTotalCount || peerCount;
  const isTruncated = totalPeerCount > peerCount;
  const blockedCount = report.blockedInstances?.length || 0;

  return (
    <div>
      {/* Software Detection */}
      <h3 style={{ marginBottom: '1rem' }}>Software Detection</h3>

      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem', marginBottom: '2rem' }}>
        {report.version && (
          <>
            <dt style={{ fontWeight: 'bold' }}>Version String:</dt>
            <dd style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
              {report.version}
              <SourceBadge source="instance-api" tooltip="Raw version string from /api/v1/instance" />
            </dd>
          </>
        )}

        <dt style={{ fontWeight: 'bold' }}>Parsed Software:</dt>
        <dd style={{ textTransform: 'capitalize' }}>
          {report.software || 'Unknown'}
          {report.software && report.software !== 'other' && (
            <SourceBadge source="instance-api" tooltip="Parsed from version string using regex patterns" />
          )}
          {report.software === 'other' && report.version && (
            <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: '#888' }}>
              (could not classify, showing raw version above)
            </span>
          )}
        </dd>

        {report.serverType && (
          <>
            <dt style={{ fontWeight: 'bold' }}>Megalodon Detection:</dt>
            <dd style={{ textTransform: 'capitalize' }}>
              {report.serverType}
              <SourceBadge source="megalodon" tooltip="Detected using Megalodon library server type detector" />
              {report.software && report.software !== 'unknown' && report.serverType !== report.software && (
                <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: 'var(--warning-color)' }}>
                  ⚠ differs from parsed: {report.software}
                </span>
              )}
            </dd>
          </>
        )}

        {report.nodeInfoSoftware && (
          <>
            <dt style={{ fontWeight: 'bold' }}>NodeInfo Detection:</dt>
            <dd style={{ textTransform: 'capitalize' }}>
              {report.nodeInfoSoftware}
              <SourceBadge source="instance-api" tooltip="From .well-known/nodeinfo software field" />
              {(() => {
                const conflicts = [];
                if (report.software && report.software !== 'unknown' && report.software !== 'other' &&
                    report.nodeInfoSoftware !== report.software) {
                  conflicts.push(`parsed: ${report.software}`);
                }
                if (report.serverType && report.nodeInfoSoftware !== report.serverType) {
                  conflicts.push(`megalodon: ${report.serverType}`);
                }
                return conflicts.length > 0 ? (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: 'var(--warning-color)' }}>
                    ⚠ differs from {conflicts.join(', ')}
                  </span>
                ) : null;
              })()}
            </dd>
          </>
        )}
      </dl>

      {/* Detection consistency warning */}
      {(() => {
        const detections = [
          { name: 'Parsed', value: report.software },
          { name: 'Megalodon', value: report.serverType },
          { name: 'NodeInfo', value: report.nodeInfoSoftware }
        ].filter(d => d.value && d.value !== 'unknown' && d.value !== 'other');

        const uniqueValues = new Set(detections.map(d => d.value));

        if (detections.length >= 2 && uniqueValues.size > 1) {
          return (
            <div style={{
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px',
              fontSize: '0.9rem'
            }}>
              <strong>⚠ Detection Inconsistency:</strong> Multiple detection methods returned different results.
              This is common with forks like Sharkey (Misskey fork) that may be detected as the base software.
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                {detections.map((d, i) => (
                  <div key={i}>• {d.name}: {d.value}</div>
                ))}
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Hosting & Infrastructure */}
      <h3 style={{ marginBottom: '1rem' }}>Hosting & Infrastructure</h3>

      {report.infrastructure && (report.infrastructure.hostingProvider || report.infrastructure.cloudProvider || report.infrastructure.country || report.infrastructure.ip || report.infrastructure.asn || report.infrastructure.cdn || report.infrastructure.server) ? (
        <>
          {/* Summary badges */}
          {report.infrastructure.isCloudflare && (
            <div style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              borderRadius: '4px',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              🛡️ Protected by Cloudflare
            </div>
          )}

          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem' }}>
            {report.infrastructure.hostingProvider && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Hosting Provider:</dt>
                <dd>
                  {report.infrastructure.hostingProvider}
                  <SourceBadge source="infrastructure" tooltip="Detected from ASN/ISP data via ip-api.com" />
                </dd>
              </>
            )}

            {report.infrastructure.cloudProvider && !report.infrastructure.hostingProvider && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Cloud Platform:</dt>
                <dd>
                  {report.infrastructure.cloudProvider}
                  <SourceBadge source="infrastructure" tooltip="Detected from HTTP headers or ASN data" />
                </dd>
              </>
            )}

            {report.infrastructure.country && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Location:</dt>
                <dd>
                  {report.infrastructure.countryCode && getCountryFlag(report.infrastructure.countryCode)}{' '}
                  {report.infrastructure.city && `${report.infrastructure.city}, `}
                  {report.infrastructure.country}
                  <SourceBadge source="infrastructure" tooltip="Geolocation from ip-api.com" />
                </dd>
              </>
            )}

            {report.infrastructure.ip && (
              <>
                <dt style={{ fontWeight: 'bold' }}>IP Address:</dt>
                <dd style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                  {report.infrastructure.ip}
                  <SourceBadge source="infrastructure" tooltip="Resolved via Google DNS-over-HTTPS" />
                </dd>
              </>
            )}

            {report.infrastructure.asn && (
              <>
                <dt style={{ fontWeight: 'bold' }}>ASN:</dt>
                <dd style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                  {report.infrastructure.asn}
                  {report.infrastructure.asnOrg && ` (${report.infrastructure.asnOrg})`}
                  <SourceBadge source="infrastructure" tooltip="Autonomous System Number from ip-api.com" />
                </dd>
              </>
            )}

            {report.infrastructure.cdn && (
              <>
                <dt style={{ fontWeight: 'bold' }}>CDN:</dt>
                <dd>
                  {report.infrastructure.cdn}
                  <SourceBadge source="infrastructure" tooltip="Detected from HTTP headers and DNS CNAME records" />
                </dd>
              </>
            )}

            {report.infrastructure.server && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Server Software:</dt>
                <dd>
                  {report.infrastructure.server}
                  <SourceBadge source="infrastructure" tooltip="From HTTP Server header" />
                </dd>
              </>
            )}
          </dl>
        </>
      ) : (
        <p style={{ color: '#888' }}>Infrastructure details could not be detected. This may be due to CORS restrictions or privacy configurations.</p>
      )}

      {/* HTTP Headers */}
      {report.infrastructure?.headers && Object.keys(report.infrastructure.headers).length > 0 && (
        <details style={{ marginTop: '2rem' }}>
          <summary style={{ cursor: 'pointer', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            HTTP Headers ({Object.keys(report.infrastructure.headers).length} headers)
          </summary>
          <div style={{
            maxHeight: '300px',
            overflow: 'auto',
            marginTop: '0.5rem',
            padding: '1rem',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.85rem'
          }}>
            {Object.entries(report.infrastructure.headers).map(([key, value]) => (
              <div key={key} style={{ marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--primary-color)' }}>{key}:</span> {value}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Federation Status */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Federation Status</h3>

        <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <strong>Connected Peers:</strong> {totalPeerCount.toLocaleString()}
            {peerCount > 0 && (
              <SourceBadge source="instance-api" tooltip="From /api/v1/instance/peers endpoint or FediDB fallback" />
            )}
            {peerCount === 0 && (
              <span style={{ color: '#888', marginLeft: '0.5rem' }}>
                (Peer list may be disabled)
              </span>
            )}
          </div>
          <div>
            <strong>Blocked Instances:</strong> {blockedCount}
            {blockedCount > 0 && (
              <SourceBadge source="fedidb" tooltip="From FediDB federation data" />
            )}
          </div>
        </div>

        {peerCount > 0 && (
          <>
            {isTruncated && (
              <div style={{
                padding: '0.75rem',
                marginBottom: '1rem',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}>
                ℹ️ Showing first {peerCount.toLocaleString()} of {totalPeerCount.toLocaleString()} peers to prevent performance issues
              </div>
            )}
            <details>
              <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                Show peer list ({peerCount.toLocaleString()} {isTruncated ? 'shown' : 'instances'})
              </summary>
              <div style={{
                maxHeight: '300px',
                overflow: 'auto',
                marginTop: '0.5rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '4px'
              }}>
                <ul style={{ columns: '2', columnGap: '2rem' }}>
                  {report.peers?.map((peer, idx) => (
                    <li key={idx} style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                      {peer}
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </>
        )}
      </div>

      {/* Protocol Support */}
      {report.wellKnown && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Protocol Support</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {report.wellKnown.supportsActivityPub && (
              <div style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '4px'
              }}>
                ✓ ActivityPub
                <SourceBadge source="instance-api" tooltip="From .well-known/nodeinfo" />
              </div>
            )}
            {report.wellKnown.supportsWebfinger && (
              <div style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '4px'
              }}>
                ✓ Webfinger
                <SourceBadge source="instance-api" tooltip="From .well-known/webfinger" />
              </div>
            )}
            {report.wellKnown.hasHostMeta && (
              <div style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '4px'
              }}>
                ✓ Host-Meta
                <SourceBadge source="instance-api" tooltip="From .well-known/host-meta" />
              </div>
            )}
            {!report.wellKnown.supportsActivityPub && !report.wellKnown.supportsWebfinger && !report.wellKnown.hasHostMeta && (
              <div style={{
                padding: '0.5rem 1rem',
                color: '#888',
                fontStyle: 'italic'
              }}>
                No standard Fediverse protocols detected
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Policies Tab - Terms, Privacy, Security contacts from multiple sources
 */
function PoliciesTab({ report }: { report: InstanceReport }) {
  const wellKnown = report.wellKnown;
  const instance = report.instanceData;

  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>Terms, Privacy & Security Policies</h3>

      <div style={{
        padding: '0.75rem 1rem',
        marginBottom: '1.5rem',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '8px',
        fontSize: '0.9rem'
      }}>
        ℹ️ <strong>Data Sources:</strong> Policy information is collected from multiple sources:
        <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem', lineHeight: '1.6' }}>
          <li><strong>Mastodon API:</strong> <code>/api/v1/instance</code> endpoint (may include URLs to policies)</li>
          <li><strong>.well-known endpoints:</strong> <code>/.well-known/security.txt</code>, <code>/.well-known/nodeinfo</code></li>
          <li><strong>Megalodon Library:</strong> Server type detection and metadata extraction</li>
        </ul>
      </div>

      {/* Terms of Service & Privacy Policy Links */}
      {(() => {
        const termsUrl = instance?.configuration?.urls?.terms_of_service || (wellKnown?.nodeInfo?.metadata?.termsOfService) || (wellKnown?.nodeInfo?.metadata?.tosUrl) || (wellKnown?.nodeInfo?.metadata?.terms);
        const privacyUrl = instance?.configuration?.urls?.privacy_policy || (wellKnown?.nodeInfo?.metadata?.privacyPolicyUrl) || (wellKnown?.nodeInfo?.metadata?.privacyPolicy) || (wellKnown?.nodeInfo?.metadata?.privacy);

        if (termsUrl || privacyUrl) {
          return (
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>Terms of Service & Privacy Policy</h4>
              <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem' }}>
                {termsUrl && (
                  <>
                    <dt style={{ fontWeight: 'bold' }}>Terms of Service:</dt>
                    <dd>
                      <a href={termsUrl.toString()} target="_blank" rel="noopener noreferrer">
                        {termsUrl.toString()}
                      </a>
                      <SourceBadge
                        source={instance?.configuration?.urls?.terms_of_service ? 'instance-api' : 'instance-api'}
                        tooltip={instance?.configuration?.urls?.terms_of_service ? 'From /api/v1/instance configuration.urls' : 'From .well-known/nodeinfo metadata'}
                      />
                    </dd>
                  </>
                )}
                {privacyUrl && (
                  <>
                    <dt style={{ fontWeight: 'bold' }}>Privacy Policy:</dt>
                    <dd>
                      <a href={privacyUrl.toString()} target="_blank" rel="noopener noreferrer">
                        {privacyUrl.toString()}
                      </a>
                      <SourceBadge
                        source={instance?.configuration?.urls?.privacy_policy ? 'instance-api' : 'instance-api'}
                        tooltip={instance?.configuration?.urls?.privacy_policy ? 'From /api/v1/instance configuration.urls' : 'From .well-known/nodeinfo metadata'}
                      />
                    </dd>
                  </>
                )}
              </dl>
              <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.5rem' }}>
                💡 Tip: Review these documents to understand how your data is handled and what behavior is expected on this instance.
              </p>
            </div>
          );
        }
        return null;
      })()}

      {/* Security Contact Information */}
      {wellKnown?.securityTxt && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '0.75rem' }}>
            Security Contact Information (RFC 9116)
            <SourceBadge source="instance-api" tooltip="From .well-known/security.txt endpoint" />
          </h4>

          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem' }}>
            {wellKnown.securityTxt.contact && wellKnown.securityTxt.contact.length > 0 && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Contact:</dt>
                <dd>
                  {wellKnown.securityTxt.contact.map((contact, idx) => (
                    <div key={idx}>
                      {contact.startsWith('http') ? (
                        <a href={contact} target="_blank" rel="noopener noreferrer">{contact}</a>
                      ) : contact.startsWith('mailto:') ? (
                        <a href={contact}>{contact.replace('mailto:', '')}</a>
                      ) : (
                        <span>{contact}</span>
                      )}
                    </div>
                  ))}
                </dd>
              </>
            )}

            {wellKnown.securityTxt.expires && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Expires:</dt>
                <dd>{wellKnown.securityTxt.expires}</dd>
              </>
            )}

            {wellKnown.securityTxt.encryption && wellKnown.securityTxt.encryption.length > 0 && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Encryption:</dt>
                <dd>
                  {wellKnown.securityTxt.encryption.map((enc, idx) => (
                    <div key={idx}>
                      <a href={enc} target="_blank" rel="noopener noreferrer">{enc}</a>
                    </div>
                  ))}
                </dd>
              </>
            )}

            {wellKnown.securityTxt.policy && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Security Policy:</dt>
                <dd>
                  <a href={wellKnown.securityTxt.policy} target="_blank" rel="noopener noreferrer">
                    {wellKnown.securityTxt.policy}
                  </a>
                </dd>
              </>
            )}

            {wellKnown.securityTxt.acknowledgments && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Acknowledgments:</dt>
                <dd>
                  <a href={wellKnown.securityTxt.acknowledgments} target="_blank" rel="noopener noreferrer">
                    {wellKnown.securityTxt.acknowledgments}
                  </a>
                </dd>
              </>
            )}

            {wellKnown.securityTxt.preferredLanguages && wellKnown.securityTxt.preferredLanguages.length > 0 && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Languages:</dt>
                <dd>{wellKnown.securityTxt.preferredLanguages.join(', ')}</dd>
              </>
            )}

            {wellKnown.securityTxt.hiring && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Hiring:</dt>
                <dd>
                  <a href={wellKnown.securityTxt.hiring} target="_blank" rel="noopener noreferrer">
                    {wellKnown.securityTxt.hiring}
                  </a>
                </dd>
              </>
            )}
          </dl>
        </div>
      )}

      {/* NodeInfo Metadata */}
      {wellKnown?.nodeInfo && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '0.75rem' }}>
            Instance Metadata (NodeInfo)
            <SourceBadge source="instance-api" tooltip="From .well-known/nodeinfo endpoint (Fediverse standard)" />
          </h4>
          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem' }}>
            {wellKnown.nodeInfo.software && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Software:</dt>
                <dd style={{ textTransform: 'capitalize' }}>
                  {wellKnown.nodeInfo.software.name} {wellKnown.nodeInfo.software.version}
                </dd>
              </>
            )}

            {wellKnown.nodeInfo.protocols && wellKnown.nodeInfo.protocols.length > 0 && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Protocols:</dt>
                <dd style={{ textTransform: 'capitalize' }}>
                  {wellKnown.nodeInfo.protocols.join(', ')}
                </dd>
              </>
            )}

            {wellKnown.nodeInfo.openRegistrations !== undefined && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Open Registrations:</dt>
                <dd>
                  {wellKnown.nodeInfo.openRegistrations ? (
                    <span className="success">✓ Yes</span>
                  ) : (
                    <span>⨯ No</span>
                  )}
                </dd>
              </>
            )}

            {wellKnown.nodeInfo.usage?.users?.total !== undefined && wellKnown.nodeInfo.usage.users.total !== null && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Total Users:</dt>
                <dd>{wellKnown.nodeInfo.usage.users.total.toLocaleString()}</dd>
              </>
            )}

            {wellKnown.nodeInfo.usage?.users?.activeMonth !== undefined && wellKnown.nodeInfo.usage.users.activeMonth !== null && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Active Users (Month):</dt>
                <dd>{wellKnown.nodeInfo.usage.users.activeMonth.toLocaleString()}</dd>
              </>
            )}

            {wellKnown.nodeInfo.usage?.localPosts !== undefined && wellKnown.nodeInfo.usage.localPosts !== null && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Local Posts:</dt>
                <dd>{wellKnown.nodeInfo.usage.localPosts.toLocaleString()}</dd>
              </>
            )}

            {wellKnown.nodeInfo.software?.repository && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Repository:</dt>
                <dd>
                  <a href={wellKnown.nodeInfo.software.repository} target="_blank" rel="noopener noreferrer">
                    {wellKnown.nodeInfo.software.repository}
                  </a>
                </dd>
              </>
            )}

            {wellKnown.nodeInfo.software?.homepage && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Homepage:</dt>
                <dd>
                  <a href={wellKnown.nodeInfo.software.homepage} target="_blank" rel="noopener noreferrer">
                    {wellKnown.nodeInfo.software.homepage}
                  </a>
                </dd>
              </>
            )}
          </dl>
        </div>
      )}

      {/* Robots.txt Information */}
      {wellKnown?.robotsTxt && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '0.75rem' }}>
            Crawler Policies (robots.txt)
            <SourceBadge source="instance-api" tooltip="From /robots.txt endpoint" />
          </h4>

          {wellKnown.robotsTxt.hasRestrictivePolicies && (
            <div style={{
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px'
            }}>
              ⚠ <strong>Notice:</strong> This instance has restrictive crawler policies that may limit discoverability.
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <strong>User-Agent Rules:</strong>
            {wellKnown.robotsTxt.userAgents.length > 0 ? (
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                {wellKnown.robotsTxt.userAgents.slice(0, 5).map((ua, idx) => (
                  <li key={idx} style={{ marginBottom: '0.75rem' }}>
                    <strong>{ua.agent}</strong>
                    {ua.rules.disallow.length > 0 && (
                      <div style={{ fontSize: '0.9rem', color: '#888', marginTop: '0.25rem' }}>
                        Disallow: {ua.rules.disallow.slice(0, 3).join(', ')}
                        {ua.rules.disallow.length > 3 && ` (+${ua.rules.disallow.length - 3} more)`}
                      </div>
                    )}
                    {ua.rules.allow.length > 0 && (
                      <div style={{ fontSize: '0.9rem', color: '#888', marginTop: '0.25rem' }}>
                        Allow: {ua.rules.allow.slice(0, 3).join(', ')}
                      </div>
                    )}
                    {ua.rules.crawlDelay && (
                      <div style={{ fontSize: '0.9rem', color: '#888', marginTop: '0.25rem' }}>
                        Crawl-delay: {ua.rules.crawlDelay}s
                      </div>
                    )}
                  </li>
                ))}
                {wellKnown.robotsTxt.userAgents.length > 5 && (
                  <li style={{ color: '#888', fontStyle: 'italic' }}>
                    ... and {wellKnown.robotsTxt.userAgents.length - 5} more user-agent rules
                  </li>
                )}
              </ul>
            ) : (
              <p style={{ color: '#888', marginTop: '0.5rem' }}>No specific user-agent rules defined.</p>
            )}
          </div>

          {wellKnown.robotsTxt.sitemaps && wellKnown.robotsTxt.sitemaps.length > 0 && (
            <div>
              <strong>Sitemaps:</strong>
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                {wellKnown.robotsTxt.sitemaps.map((sitemap, idx) => (
                  <li key={idx}>
                    <a href={sitemap} target="_blank" rel="noopener noreferrer">
                      {sitemap}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* No Data Message */}
      {!wellKnown?.securityTxt && !wellKnown?.nodeInfo && !wellKnown?.robotsTxt && (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#888',
          fontStyle: 'italic'
        }}>
          No policy information found from standard endpoints (.well-known/security.txt, .well-known/nodeinfo, robots.txt).
          {instance && (
            <div style={{ marginTop: '0.5rem' }}>
              Check the About tab for contact information from the Mastodon API.
            </div>
          )}
        </div>
      )}

      {/* Metadata Errors */}
      {wellKnown?.errors && wellKnown.errors.length > 0 && (
        <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#888' }}>
          <strong>Note:</strong> Some metadata endpoints could not be accessed.
        </div>
      )}
    </div>
  );
}
