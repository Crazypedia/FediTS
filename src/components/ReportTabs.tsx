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
  const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'moderation' | 'federation' | 'trust'>('overview');

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

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '-1px', flexWrap: 'wrap' }}>
        <button style={tabStyle('overview')} onClick={() => setActiveTab('overview')}>
          Overview
        </button>
        <button style={tabStyle('technical')} onClick={() => setActiveTab('technical')}>
          Technical
        </button>
        <button style={tabStyle('moderation')} onClick={() => setActiveTab('moderation')}>
          Moderation
        </button>
        <button style={tabStyle('federation')} onClick={() => setActiveTab('federation')}>
          Federation
        </button>
        <button style={tabStyle('trust')} onClick={() => setActiveTab('trust')}>
          Trust
        </button>
      </div>

      <div style={{
        border: '1px solid var(--border-color)',
        borderRadius: '0 8px 8px 8px',
        padding: '1.5rem',
        minHeight: '200px',
        textAlign: 'left'
      }}>
        {activeTab === 'overview' && <OverviewTab report={report} />}
        {activeTab === 'technical' && <TechnicalTab report={report} />}
        {activeTab === 'moderation' && <ModerationTab report={report} />}
        {activeTab === 'federation' && <FederationTab report={report} />}
        {activeTab === 'trust' && <TrustTab report={report} />}
      </div>
    </div>
  );
}

function OverviewTab({ report }: { report: InstanceReport }) {
  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>Instance Information</h3>
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

        {report.software && (
          <>
            <dt style={{ fontWeight: 'bold' }}>Software:</dt>
            <dd style={{ textTransform: 'capitalize' }}>
              {report.software}
              <SourceBadge source="instance-api" tooltip="Detected from instance API version string" />
            </dd>
          </>
        )}

        {report.version && (
          <>
            <dt style={{ fontWeight: 'bold' }}>Version:</dt>
            <dd>
              {report.version}
              <SourceBadge source="instance-api" tooltip="From instance API metadata" />
            </dd>
          </>
        )}

        <dt style={{ fontWeight: 'bold' }}>Report Generated:</dt>
        <dd>{report.timestamp.toLocaleString()}</dd>

        <dt style={{ fontWeight: 'bold' }}>Server Covenant:</dt>
        <dd>
          {report.serverCovenant?.listed ? (
            <>
              <span className="success">✓ Listed</span>
              <SourceBadge source="covenant" tooltip="Verified against Mastodon Server Covenant API" />
            </>
          ) : (
            <>
              <span>Not listed</span>
              <SourceBadge source="covenant" />
            </>
          )}
        </dd>
      </dl>

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

function TechnicalTab({ report }: { report: InstanceReport }) {
  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>Software Detection</h3>

      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem', marginBottom: '2rem' }}>
        <dt style={{ fontWeight: 'bold' }}>Detected Software:</dt>
        <dd style={{ textTransform: 'capitalize' }}>
          {report.software || 'Unknown'}
          {report.software && <SourceBadge source="instance-api" tooltip="Parsed from version string" />}
        </dd>

        {report.version && (
          <>
            <dt style={{ fontWeight: 'bold' }}>Version:</dt>
            <dd>
              {report.version}
              <SourceBadge source="instance-api" />
            </dd>
          </>
        )}

        {report.serverType && (
          <>
            <dt style={{ fontWeight: 'bold' }}>Server Type (Megalodon):</dt>
            <dd style={{ textTransform: 'capitalize' }}>
              {report.serverType}
              <SourceBadge source="megalodon" tooltip="Detected using Megalodon library" />
            </dd>
          </>
        )}
      </dl>

      <h3 style={{ marginBottom: '1rem' }}>Infrastructure & Hosting</h3>

      {report.infrastructure && (report.infrastructure.hostingProvider || report.infrastructure.cloudProvider || report.infrastructure.country) ? (
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
    </div>
  );
}

function ModerationTab({ report }: { report: InstanceReport }) {
  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>
        Moderation Policies
        {report.moderationPolicies && report.moderationPolicies.length > 0 && (
          <SourceBadge source="instance-api" tooltip="From instance API /rules endpoint" />
        )}
      </h3>

      {report.moderationPolicies && report.moderationPolicies.length > 0 ? (
        <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          {report.moderationPolicies.map(policy => (
            <li key={policy.id} style={{ marginBottom: '0.75rem' }}>
              {policy.text}
            </li>
          ))}
        </ol>
      ) : (
        <p style={{ color: '#888' }}>No public moderation policies found.</p>
      )}

      {report.blockedInstances && report.blockedInstances.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h4 style={{ marginBottom: '0.5rem' }}>
            Blocked Instances
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

function FederationTab({ report }: { report: InstanceReport }) {
  const peerCount = report.peers?.length || 0;
  const totalPeerCount = report.peersTotalCount || peerCount;
  const isTruncated = totalPeerCount > peerCount;
  const blockedCount = report.blockedInstances?.length || 0;

  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>Federation Status</h3>

      <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <strong>Connected Peers:</strong> {totalPeerCount.toLocaleString()}
          {peerCount > 0 && (
            <SourceBadge source="instance-api" tooltip="From instance API /peers endpoint or FediDB fallback" />
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
  );
}

function TrustTab({ report }: { report: InstanceReport }) {
  const hasBlocklistMatches = report.externalBlocklists && report.externalBlocklists.length > 0;

  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>External Trust Lists</h3>

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

      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>
          Blocklist Status
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
    </div>
  );
}
