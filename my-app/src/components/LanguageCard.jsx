export default function LanguageCard({
  nativeName,
  englishName,
  isActive,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`language-card ${isActive ? "active" : ""}`}
      aria-pressed={isActive}
      onClick={onClick}
    >
      <span className="native-name">{nativeName}</span>
      <span className="english-name">{englishName}</span>
    </button>
  );
}
