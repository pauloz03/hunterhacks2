export default function LanguageLoadingOverlay({ message }) {
  return (
    <div className="language-loading-overlay" role="status" aria-live="polite">
      <div className="language-loading-card">
        <div className="language-loading-spinner" aria-hidden="true" />
        <p className="language-loading-message">{message}</p>
      </div>
    </div>
  );
}
