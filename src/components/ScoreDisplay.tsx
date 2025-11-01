import type { SafetyScore } from '../types';
import { ReportGenerator } from '../services/reportGenerator';

interface ScoreDisplayProps {
  score: SafetyScore;
}

export default function ScoreDisplay({ score }: ScoreDisplayProps) {
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
    </div>
  );
}
