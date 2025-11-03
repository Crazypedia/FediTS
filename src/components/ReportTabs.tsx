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
  const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'moderation' | 'federation' | 'trust' | 'metadata'>('overview');

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
        <button style={tabStyle('metadata')} onClick={() => setActiveTab('metadata')}>
          Metadata
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
        {activeTab === 'metadata' && <MetadataTab report={report} />}
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
        {report.version && (
          <>
            <dt style={{ fontWeight: 'bold' }}>Version String:</dt>
            <dd style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
              {report.version}
              <SourceBadge source="instance-api" tooltip="Raw version string from instance API" />
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

      <h3 style={{ marginBottom: '1rem' }}>Infrastructure & Hosting</h3>

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

function MetadataTab({ report }: { report: InstanceReport }) {
  const wellKnown = report.wellKnown;

  if (!wellKnown) {
    return (
      <div>
        <p style={{ color: '#888' }}>No metadata information available.</p>
      </div>
    );
  }

  const hasAnyData = wellKnown.nodeInfo || wellKnown.robotsTxt || wellKnown.securityTxt;

  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>Instance Metadata & Configuration</h3>

      {/* Protocol Support Summary */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '0.75rem' }}>Fediverse Protocol Support</h4>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {wellKnown.supportsActivityPub && (
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '4px'
            }}>
              ✓ ActivityPub Supported
            </div>
          )}
          {wellKnown.supportsWebfinger && (
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '4px'
            }}>
              ✓ Webfinger Supported
            </div>
          )}
          {wellKnown.hasHostMeta && (
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '4px'
            }}>
              ✓ Host-Meta Available
            </div>
          )}
          {!wellKnown.supportsActivityPub && !wellKnown.supportsWebfinger && !wellKnown.hasHostMeta && (
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

      {/* NodeInfo Data (Fediverse-specific) */}
      {wellKnown.nodeInfo && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '0.75rem' }}>
            NodeInfo Data (Fediverse Standard)
            <SourceBadge source="instance-api" tooltip="From .well-known/nodeinfo endpoint" />
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

            {wellKnown.nodeInfo.usage?.users?.activeHalfyear !== undefined && wellKnown.nodeInfo.usage.users.activeHalfyear !== null && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Active Users (6 Months):</dt>
                <dd>{wellKnown.nodeInfo.usage.users.activeHalfyear.toLocaleString()}</dd>
              </>
            )}

            {wellKnown.nodeInfo.usage?.localPosts !== undefined && wellKnown.nodeInfo.usage.localPosts !== null && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Local Posts:</dt>
                <dd>{wellKnown.nodeInfo.usage.localPosts.toLocaleString()}</dd>
              </>
            )}

            {wellKnown.nodeInfo.usage?.localComments !== undefined && wellKnown.nodeInfo.usage.localComments !== null && (
              <>
                <dt style={{ fontWeight: 'bold' }}>Local Comments:</dt>
                <dd>{wellKnown.nodeInfo.usage.localComments.toLocaleString()}</dd>
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

            {wellKnown.nodeInfo.services && (
              <>
                {wellKnown.nodeInfo.services.inbound && wellKnown.nodeInfo.services.inbound.length > 0 && (
                  <>
                    <dt style={{ fontWeight: 'bold' }}>Inbound Services:</dt>
                    <dd>{wellKnown.nodeInfo.services.inbound.join(', ')}</dd>
                  </>
                )}
                {wellKnown.nodeInfo.services.outbound && wellKnown.nodeInfo.services.outbound.length > 0 && (
                  <>
                    <dt style={{ fontWeight: 'bold' }}>Outbound Services:</dt>
                    <dd>{wellKnown.nodeInfo.services.outbound.join(', ')}</dd>
                  </>
                )}
              </>
            )}
          </dl>
        </div>
      )}

      {/* robots.txt Information */}
      {wellKnown.robotsTxt && (
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

      {/* security.txt Information */}
      {wellKnown.securityTxt && (
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
                <dt style={{ fontWeight: 'bold' }}>Policy:</dt>
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

      {/* No Data Message */}
      {!hasAnyData && (!wellKnown.errors || wellKnown.errors.length === 0) && (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#888',
          fontStyle: 'italic'
        }}>
          No metadata endpoints found (.well-known/nodeinfo, robots.txt, security.txt).
        </div>
      )}

      {/* Errors */}
      {wellKnown.errors && wellKnown.errors.length > 0 && (
        <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#888' }}>
          <strong>Note:</strong> Some metadata endpoints could not be accessed.
        </div>
      )}
    </div>
  );
}
