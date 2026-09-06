import aboutLogo from "../assets/about-logo.png";
import "./AboutView.css";

export default function AboutView({ text }) {
  return (
    <div className="about-view">
      <div className="about-hero panel">
        <img src={aboutLogo} alt="Namma Breath — Fresh air for all" className="about-logo" />
      </div>

      <div className="panel about-section">
        <h3 className="section-eyebrow">{text.aboutWhatTitle}</h3>
        <p className="about-text">{text.aboutWhatBody}</p>
      </div>

      <div className="panel about-section">
        <h3 className="section-eyebrow">{text.aboutWhyTitle}</h3>
        <p className="about-text">{text.aboutWhyBody}</p>
      </div>

      <div className="panel about-section">
        <h3 className="section-eyebrow">{text.aboutHowTitle}</h3>
        <p className="about-text">{text.aboutHowBody}</p>
      </div>

      <div className="panel about-section">
        <h3 className="section-eyebrow">{text.aboutResponsibleTitle}</h3>
        <p className="about-text">{text.aboutResponsibleBody}</p>
      </div>

      <p className="about-credit">{text.aboutCredit}</p>
    </div>
  );
}
