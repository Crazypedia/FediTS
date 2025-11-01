export default function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem' }}>
      <div className="loading"></div>
      {message && <p>{message}</p>}
    </div>
  );
}
