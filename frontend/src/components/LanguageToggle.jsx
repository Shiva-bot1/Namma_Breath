import "./LanguageToggle.css";

export default function LanguageToggle({ lang, onChange }) {
  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button
        className={`lang-btn ${lang === "en" ? "lang-btn-active" : ""}`}
        onClick={() => onChange("en")}
        type="button"
      >
        EN
      </button>
      <button
        className={`lang-btn ${lang === "kn" ? "lang-btn-active" : ""}`}
        onClick={() => onChange("kn")}
        type="button"
      >
        ಕನ್ನಡ
      </button>
    </div>
  );
}
