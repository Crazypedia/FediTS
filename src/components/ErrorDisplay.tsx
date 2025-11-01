interface ErrorDisplayProps {
  message: string;
  errors?: string[];
}

export default function ErrorDisplay({ message, errors }: ErrorDisplayProps) {
  return (
    <div className="error" style={{ textAlign: 'left' }}>
      <h3>Error</h3>
      <p>{message}</p>
      {errors && errors.length > 0 && (
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
          {errors.map((err, idx) => (
            <li key={idx}>{err}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
