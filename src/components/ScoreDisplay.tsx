import type { SafetyScore, InstanceReport } from '../types';
import { ReportGenerator } from '../services/reportGenerator';
import SourceBadge from './SourceBadge';

interface ScoreDisplayProps {
  score: SafetyScore;
  report: InstanceReport;
}

export default function ScoreDisplay({ score, report }: ScoreDisplayProps) {
  const summary = ReportGenerator.getScoreSummary(score.overall);

  return (
    <div className="card">
      <h2>Safety Score</h2>

      <div style={{ margin: '2rem 0', textAlign: 'center' }}>
        <div style={{
          fontSize: '4rem',
          fontWeight: 'bold',
          color: `var(--${summary.color}-color)`
        }}>
          {score.overall}
        </div>
        <div style={{
          fontSize: '1.5rem',
          color: `var(--${summary.color}-color)`,
          marginTop: '0.5rem'
        }}>
          {summary.label}
        </div>
      </div>

      <div style={{ textAlign: 'left', marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Breakdown</h3>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {Object.entries(score.breakdown).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ textTransform: 'capitalize' }}>{key}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '200px',
                  height: '8px',
                  backgroundColor: 'var(--border-color)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${value * 4}%`,
                    height: '100%',
                    backgroundColor: value > 15 ? 'var(--success-color)' : 'var(--warning-color)',
                    transition: 'width 0.3s'
                  }} />
                </div>
                <span style={{ minWidth: '3rem', textAlign: 'right' }}>{value}/25</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {score.flags.length > 0 && (
        <div style={{ textAlign: 'left', marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Warnings</h3>
          <ul style={{ paddingLeft: '1.5rem', color: 'var(--warning-color)' }}>
            {score.flags.map((flag, idx) => (
              <li key={idx}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Score Calculation Formula */}
      <details style={{ textAlign: 'left', marginTop: '2rem' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '1rem' }}>
          Score Calculation Formula
        </summary>
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '4px',
          fontSize: '0.9rem',
          fontFamily: 'monospace'
        }}>
          <p style={{ marginBottom: '1rem', fontFamily: 'sans-serif' }}>
            The safety score (0-100) is calculated from four weighted components:
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            <strong style={{ color: 'var(--primary-color)' }}>Uptime/Responsiveness (max 25 points)</strong>
            <div style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
              <div>Current Score: <strong>{score.breakdown.uptime}</strong> / 25</div>
              <div style={{ marginTop: '0.25rem', color: '#888' }}>
                Source: {report.instanceStatus?.reachable ? (
                  <>Direct connection <SourceBadge source="instance-api" tooltip="Successfully connected to instance" /></>
                ) : (
                  <>Instance offline <SourceBadge source="fediverse-observer" tooltip="Checked via Fediverse Observer" /></>
                )}
              </div>
              <div style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                {report.instanceStatus?.reachable
                  ? '✓ Instance API is reachable = 25 points'
                  : '✗ Instance API unreachable = 0 points'}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <strong style={{ color: 'var(--primary-color)' }}>Moderation Transparency (max 25 points)</strong>
            <div style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
              <div>Current Score: <strong>{score.breakdown.moderation}</strong> / 25</div>
              <div style={{ marginTop: '0.25rem', color: '#888' }}>
                Source: {report.moderationPolicies && report.moderationPolicies.length > 0 ? (
                  <><SourceBadge source="instance-api" tooltip="Rules from instance API" /> ({report.moderationPolicies.length} rules)</>
                ) : (
                  <>No public rules found</>
                )}
              </div>
              <div style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                {report.moderationPolicies && report.moderationPolicies.length > 0
                  ? '✓ Has published rules = 25 points'
                  : '✗ No public moderation policies = 0 points'}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <strong style={{ color: 'var(--primary-color)' }}>Federation Visibility (max 25 points)</strong>
            <div style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
              <div>Current Score: <strong>{score.breakdown.federation}</strong> / 25</div>
              <div style={{ marginTop: '0.25rem', color: '#888' }}>
                Source: {report.peers && report.peers.length > 0 ? (
                  <><SourceBadge source="instance-api" tooltip="Peer list from instance API or FediDB" /> ({report.peersTotalCount || report.peers.length} peers)</>
                ) : (
                  <>Peer list not available</>
                )}
              </div>
              <div style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                {report.peers && report.peers.length > 0
                  ? '✓ Peer list is public = 25 points (or 15 if limited)'
                  : '✗ Peer list not publicly available = 15 points partial credit'}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <strong style={{ color: 'var(--primary-color)' }}>Trust & Reputation (max 25 points)</strong>
            <div style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
              <div>Current Score: <strong>{score.breakdown.trust}</strong> / 25</div>
              <div style={{ marginTop: '0.25rem', color: '#888' }}>
                Sources: <SourceBadge source="blocklist" tooltip="GardenFence, IFTAS DNI" /> <SourceBadge source="covenant" tooltip="Mastodon Server Covenant API" />
              </div>
              <div style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                {report.externalBlocklists && report.externalBlocklists.length > 0 ? (
                  <>⚠ Found on {report.externalBlocklists.length} blocklist(s) = Reduced score</>
                ) : (
                  <>✓ Not on blocklists = 25 points</>
                )}
              </div>
              {report.serverCovenant?.listed && (
                <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--success-color)' }}>
                  ✓ Server Covenant member = +5 bonus points
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <strong>Final Calculation:</strong>
            <div style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
              <div>Uptime: {score.breakdown.uptime}</div>
              <div>+ Moderation: {score.breakdown.moderation}</div>
              <div>+ Federation: {score.breakdown.federation}</div>
              <div>+ Trust: {score.breakdown.trust}</div>
              {report.errors.length > 0 && (
                <div>- Errors: {Math.min(report.errors.length * 2, 10)} (2 points per error, max -10)</div>
              )}
              <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <strong>= Total: {score.overall} / 100</strong>
              </div>
            </div>
          </div>

          <p style={{ marginTop: '1.5rem', fontFamily: 'sans-serif', fontSize: '0.85rem', color: '#888' }}>
            Note: Scores are calculated based on publicly available information. A lower score doesn't necessarily mean an instance is unsafe, just that it has less public transparency.
          </p>
        </div>
      </details>
    </div>
  );
}
