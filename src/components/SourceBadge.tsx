/**
 * Small badge component to indicate the source of data
 * Shows where specific information came from (FediDB, Instance API, etc.)
 */

interface SourceBadgeProps {
  source: 'fedidb' | 'instance-api' | 'covenant' | 'blocklist' | 'infrastructure' | 'megalodon' | 'fediverse-observer' | 'nodeinfo' | 'both';
  tooltip?: string;
}

const sourceConfig = {
  'fedidb': {
    label: 'FediDB',
    color: '#10b981', // green
    icon: '📊'
  },
  'instance-api': {
    label: 'Instance API',
    color: '#3b82f6', // blue
    icon: '🔌'
  },
  'covenant': {
    label: 'Server Covenant',
    color: '#8b5cf6', // purple
    icon: '🤝'
  },
  'blocklist': {
    label: 'Blocklists',
    color: '#ef4444', // red
    icon: '🛡️'
  },
  'infrastructure': {
    label: 'Infrastructure',
    color: '#f59e0b', // amber
    icon: '🏗️'
  },
  'megalodon': {
    label: 'Megalodon',
    color: '#06b6d4', // cyan
    icon: '🦣'
  },
  'fediverse-observer': {
    label: 'Fediverse Observer',
    color: '#ec4899', // pink
    icon: '👁️'
  },
  'nodeinfo': {
    label: 'NodeInfo',
    color: '#14b8a6', // teal
    icon: 'ℹ️'
  },
  'both': {
    label: 'API + NodeInfo',
    color: '#00c853', // green success
    icon: '✓'
  }
};

export default function SourceBadge({ source, tooltip }: SourceBadgeProps) {
  const config = sourceConfig[source];

  return (
    <span
      title={tooltip || `Source: ${config.label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.125rem 0.375rem',
        fontSize: '0.7rem',
        fontWeight: '500',
        backgroundColor: `${config.color}15`,
        color: config.color,
        border: `1px solid ${config.color}40`,
        borderRadius: '3px',
        marginLeft: '0.5rem',
        verticalAlign: 'middle',
        cursor: 'help',
        whiteSpace: 'nowrap'
      }}
    >
      <span style={{ fontSize: '0.65rem' }}>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
