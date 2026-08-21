import "./CommuteControls.css";

const TRANSPORT_OPTIONS = [
  { id: "walking", label: "Walking" },
  { id: "two-wheeler", label: "Two-wheeler" },
  { id: "bus", label: "Bus" },
  { id: "metro", label: "Metro" },
  { id: "car", label: "Car" },
];

const MASK_OPTIONS = [
  { id: "none", label: "No mask" },
  { id: "cloth", label: "Cloth" },
  { id: "surgical", label: "Surgical" },
  { id: "n95", label: "N95" },
  { id: "n95-valve", label: "N95 + valve" },
];

const TIME_OPTIONS = [
  { id: "early-morning", label: "Early morning (5–7am)" },
  { id: "morning-peak", label: "Morning peak (8–10am)" },
  { id: "midday", label: "Midday" },
  { id: "evening-peak", label: "Evening peak (5:30–8pm)" },
  { id: "night", label: "Night" },
];

function ControlGroup({ title, options, value, onChange }) {
  return (
    <div className="control-group">
      <label className="control-label">{title}</label>
      <div className="control-options">
        {options.map((opt) => (
          <button
            key={opt.id}
            className={`control-pill ${value === opt.id ? "control-pill-active" : ""}`}
            onClick={() => onChange(opt.id)}
            type="button"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CommuteControls({
  transport,
  mask,
  timeOfDay,
  onChange,
  sectionTitle = "02 — How you're commuting",
  labels = { transport: "Transport mode", mask: "Mask", timeOfDay: "Time of day" },
}) {
  return (
    <div className="commute-controls">
      <h3 className="section-eyebrow">{sectionTitle}</h3>
      <ControlGroup
        title={labels.transport}
        options={TRANSPORT_OPTIONS}
        value={transport}
        onChange={(v) => onChange({ transport: v })}
      />
      <ControlGroup
        title={labels.mask}
        options={MASK_OPTIONS}
        value={mask}
        onChange={(v) => onChange({ mask: v })}
      />
      <ControlGroup
        title={labels.timeOfDay}
        options={TIME_OPTIONS}
        value={timeOfDay}
        onChange={(v) => onChange({ timeOfDay: v })}
      />
    </div>
  );
}
