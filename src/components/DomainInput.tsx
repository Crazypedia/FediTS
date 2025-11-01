import { useState, FormEvent } from 'react';

interface DomainInputProps {
  onSubmit: (domain: string) => void;
  isLoading: boolean;
}

export default function DomainInput({ onSubmit, isLoading }: DomainInputProps) {
  const [domain, setDomain] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (domain.trim() && !isLoading) {
      onSubmit(domain.trim());
    }
  };

  return (
    <div className="card">
      <h1 style={{ marginBottom: '1rem' }}>Fediverse Trust & Safety</h1>
      <p style={{ marginBottom: '1.5rem', color: '#888' }}>
        Analyze trust, moderation, and transparency for any Fediverse instance
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <input
          type="text"
          placeholder="e.g., mastodon.social"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          disabled={isLoading}
          style={{ minWidth: '300px' }}
          autoFocus
        />
        <button type="submit" disabled={isLoading || !domain.trim()}>
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>

      <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
        <p>Example domains: mastodon.social, fosstodon.org, lemmy.ml</p>
      </div>
    </div>
  );
}
