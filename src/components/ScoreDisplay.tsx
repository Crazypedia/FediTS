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
          {Object.entries(score.breakdown).map(([key, value]) => {
            // All categories max at 25 for the bar
            const maxScore = 25;
            const baseValue = Math.min(value, 25);
            const bonusValue = key === 'moderation' ? Math.max(0, value - 25) : 0;
            const percentage = (baseValue / maxScore) * 100;

            return (
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
                      width: `${percentage}%`,
                      height: '100%',
                      backgroundColor: value > (maxScore * 0.6) ? 'var(--success-color)' : 'var(--warning-color)',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <span style={{ minWidth: '5rem', textAlign: 'right' }}>
                    {value}/25
                    {bonusValue > 0 && (
                      <span style={{ color: 'var(--success-color)', fontSize: '0.85rem', marginLeft: '0.25rem' }}>
                        (+{bonusValue.toFixed(1)} bonus)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
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

      {/* Enhanced Moderation Analysis */}
      {report.enhancedModerationAnalysis && (
        <div style={{ textAlign: 'left', marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>
            Policy Analysis
            {report.enhancedModerationAnalysis.confidence && (
              <span style={{
                fontSize: '0.8rem',
                marginLeft: '0.5rem',
                color: report.enhancedModerationAnalysis.confidence >= 70 ? 'var(--success-color)' :
                       report.enhancedModerationAnalysis.confidence >= 50 ? 'var(--warning-color)' :
                       'var(--danger-color)',
                fontWeight: 'normal'
              }}>
                ({report.enhancedModerationAnalysis.confidence}% confidence)
              </span>
            )}
          </h3>

          {/* Languages Detected */}
          {report.enhancedModerationAnalysis.detectedLanguages.length > 0 && (
            <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#888' }}>
              Detected languages: {report.enhancedModerationAnalysis.detectedLanguages.map(lang => {
                const names: Record<string, string> = { en: 'English', de: 'German', fr: 'French', es: 'Spanish', ja: 'Japanese' };
                return names[lang] || lang;
              }).join(', ')}
            </div>
          )}

          {/* Strengths */}
          {report.enhancedModerationAnalysis.strengths.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: 'var(--success-color)' }}>✓ Strengths:</strong>
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', color: 'var(--success-color)' }}>
                {report.enhancedModerationAnalysis.strengths.map((strength, idx) => (
                  <li key={idx}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {report.enhancedModerationAnalysis.weaknesses.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: 'var(--warning-color)' }}>⚠ Areas for Improvement:</strong>
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', color: 'var(--warning-color)' }}>
                {report.enhancedModerationAnalysis.weaknesses.map((weakness, idx) => (
                  <li key={idx}>{weakness}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {report.enhancedModerationAnalysis.suggestions.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>💡 Suggestions:</strong>
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                {report.enhancedModerationAnalysis.suggestions.map((suggestion, idx) => (
                  <li key={idx}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Coverage Summary */}
          <details style={{ marginTop: '1rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Coverage Details ({report.enhancedModerationAnalysis.categoriesCovered.length} categories)
            </summary>
            <div style={{ paddingLeft: '1rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              {report.enhancedModerationAnalysis.categoriesCovered.length > 0 && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Covered:</strong> {report.enhancedModerationAnalysis.categoriesCovered.join(', ')}
                </div>
              )}
              {report.enhancedModerationAnalysis.protectedClassesCovered.length > 0 && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Protected Classes:</strong> {report.enhancedModerationAnalysis.protectedClassesCovered.join(', ')}
                </div>
              )}
              {report.enhancedModerationAnalysis.positiveIndicators.length > 0 && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Positive Indicators:</strong> {report.enhancedModerationAnalysis.positiveIndicators.join(', ')}
                </div>
              )}
              {report.enhancedModerationAnalysis.missingCategories.length > 0 && (
                <div style={{ marginBottom: '0.5rem', color: 'var(--warning-color)' }}>
                  <strong>Missing:</strong> {report.enhancedModerationAnalysis.missingCategories.join(', ')}
                </div>
              )}
            </div>
          </details>
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
            <strong style={{ color: 'var(--primary-color)' }}>Moderation Quality (max 25 points toward score, up to 37.5 tracked)</strong>
            <div style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
              <div>Current Score: <strong>{score.breakdown.moderation}</strong> / 25
                {score.breakdown.moderation > 25 && (
                  <span style={{ color: 'var(--success-color)', marginLeft: '0.5rem' }}>
                    (+{(score.breakdown.moderation - 25).toFixed(1)} bonus points - exceptional!)
                  </span>
                )}
              </div>
              <div style={{ marginTop: '0.25rem', color: '#888' }}>
                Source: {report.moderationPolicies && report.moderationPolicies.length > 0 ? (
                  <><SourceBadge source="instance-api" tooltip="Rules from instance API" /> ({report.moderationPolicies.length} rules)</>
                ) : (
                  <>No public rules found</>
                )}
              </div>

              {report.moderationAnalysis && (
                <>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                    <strong>Anti-Hate Speech Analysis (Mastodon Server Covenant Standards)</strong>
                    <div style={{ marginTop: '0.5rem', paddingLeft: '0.5rem' }}>
                      <div>• Keywords found: <strong>{report.moderationAnalysis.totalKeywords}</strong> {report.moderationAnalysis.meetsMinimum ? '✓' : '✗ (minimum 4 required)'}</div>
                      {report.moderationAnalysis.categoriesAddressed.length > 0 && (
                        <div style={{ marginTop: '0.25rem' }}>
                          • Categories addressed: <strong>{report.moderationAnalysis.categoriesAddressed.join(', ')}</strong>
                        </div>
                      )}
                      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                        <details>
                          <summary style={{ cursor: 'pointer' }}>Category Breakdown</summary>
                          <div style={{ marginTop: '0.5rem', paddingLeft: '0.5rem' }}>
                            {report.moderationAnalysis.details.racism > 0 && (
                              <div>• Racism & White Supremacy: {report.moderationAnalysis.details.racism} keywords</div>
                            )}
                            {report.moderationAnalysis.details.sexism > 0 && (
                              <div>• Sexism & Misogyny: {report.moderationAnalysis.details.sexism} keywords</div>
                            )}
                            {report.moderationAnalysis.details.homophobia > 0 && (
                              <div>• Homophobia: {report.moderationAnalysis.details.homophobia} keywords</div>
                            )}
                            {report.moderationAnalysis.details.transphobia > 0 && (
                              <div>• Transphobia: {report.moderationAnalysis.details.transphobia} keywords</div>
                            )}
                            {report.moderationAnalysis.details.antiSemitism > 0 && (
                              <div>• Anti-Semitism: {report.moderationAnalysis.details.antiSemitism} keywords</div>
                            )}
                            {report.moderationAnalysis.details.generalHate > 0 && (
                              <div>• General Hate Speech: {report.moderationAnalysis.details.generalHate} keywords</div>
                            )}
                          </div>
                        </details>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    Scoring:
                    <ul style={{ paddingLeft: '1.5rem', marginTop: '0.25rem' }}>
                      <li>Base score (4+ keywords): 25 points</li>
                      <li>Keyword coverage bonus: +{Math.min(5, Math.max(0, (report.moderationAnalysis.totalKeywords - 4) * 0.5)).toFixed(1)} / 5 points</li>
                      <li>Category diversity bonus: +{Math.min(5, report.moderationAnalysis.categoriesAddressed.length * 0.83).toFixed(1)} / 5 points</li>
                      <li>Critical coverage bonus: up to +2.5 points</li>
                    </ul>
                  </div>
                </>
              )}

              {!report.moderationAnalysis && report.moderationPolicies && report.moderationPolicies.length > 0 && (
                <div style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                  ⚠ Policies present but not analyzed for anti-hate provisions
                </div>
              )}

              {!report.moderationPolicies || report.moderationPolicies.length === 0 ? (
                <div style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                  ✗ No public moderation policies = 0 points
                </div>
              ) : null}
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
              <div>Uptime: {score.breakdown.uptime} / 25</div>
              <div>+ Moderation: {Math.min(score.breakdown.moderation, 25)} / 25
                {score.breakdown.moderation > 25 && (
                  <span style={{ fontSize: '0.85rem', color: '#888', marginLeft: '0.5rem' }}>
                    (scored {score.breakdown.moderation.toFixed(1)}, capped at 25 for total)
                  </span>
                )}
              </div>
              <div>+ Federation: {score.breakdown.federation} / 25</div>
              <div>+ Trust: {score.breakdown.trust} / 25</div>
              <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#888' }}>
                = Subtotal: {(score.breakdown.uptime + Math.min(score.breakdown.moderation, 25) + score.breakdown.federation + score.breakdown.trust).toFixed(1)} / 100
              </div>
              {report.errors.length > 0 && (
                <div>- Errors: {Math.min(report.errors.length * 2, 10)} (2 points per error, max -10)</div>
              )}
              <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <strong>= Total: {score.overall} / 100</strong>
              </div>
              {score.breakdown.moderation > 25 && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--success-color)' }}>
                  Note: Moderation scored {score.breakdown.moderation.toFixed(1)}/37.5 (bonus points don't inflate total, but recognize exceptional policies)
                </div>
              )}
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
