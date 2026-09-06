import "./TabNav.css";

export default function TabNav({ active, onChange, labels }) {
  const tabs = [
    { id: "advisor", label: labels.tabAdvisor },
    { id: "compare", label: labels.tabCompare },
    { id: "about", label: labels.tabAbout },
  ];

  return (
    <nav className="tab-nav" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          className={`tab-btn ${active === tab.id ? "tab-btn-active" : ""}`}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
