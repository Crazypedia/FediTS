import { useState } from 'react';
import type { InstanceReport } from '../types';

interface ReportTabsProps {
  report: InstanceReport;
}

export default function ReportTabs({ report }: ReportTabsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'moderation' | 'federation' | 'trust'>('overview');

  const tabStyle = (tab: string) => ({
    padding: '0.75rem 1.5rem',
    background: activeTab === tab ? 'var(--primary-color)' : 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderBottom: activeTab === tab ? 'none' : '1px solid var(--border-color)'
  });

  return (
    <div className="card">
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '-1px', flexWrap: 'wrap' }}>
        <button style={tabStyle('overview')} onClick={() => setActiveTab('overview')}>
          Overview
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

        {report.software && (
          <>
            <dt style={{ fontWeight: 'bold' }}>Software:</dt>
            <dd style={{ textTransform: 'capitalize' }}>{report.software}</dd>
          </>
        )}

        {report.version && (
          <>
            <dt style={{ fontWeight: 'bold' }}>Version:</dt>
            <dd>{report.version}</dd>
          </>
        )}

        <dt style={{ fontWeight: 'bold' }}>Report Generated:</dt>
        <dd>{report.timestamp.toLocaleString()}</dd>

        <dt style={{ fontWeight: 'bold' }}>Server Covenant:</dt>
        <dd>
          {report.serverCovenant?.listed ? (
            <span className="success">✓ Listed</span>
          ) : (
            <span>Not listed</span>
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

function ModerationTab({ report }: { report: InstanceReport }) {
  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>Moderation Policies</h3>

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
          <h4 style={{ marginBottom: '0.5rem' }}>Blocked Instances</h4>
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
  const blockedCount = report.blockedInstances?.length || 0;

  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>Federation Status</h3>

      <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <strong>Connected Peers:</strong> {peerCount}
          {peerCount === 0 && (
            <span style={{ color: '#888', marginLeft: '0.5rem' }}>
              (Peer list may be disabled)
            </span>
          )}
        </div>
        <div>
          <strong>Blocked Instances:</strong> {blockedCount}
        </div>
      </div>

      {peerCount > 0 && (
        <details>
          <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
            Show peer list ({peerCount} instances)
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
        <h4 style={{ marginBottom: '0.5rem' }}>Blocklist Status</h4>
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
