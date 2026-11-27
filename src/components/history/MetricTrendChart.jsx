import { useState } from "react";
import "./metric-trend-chart.css";

const GRID_STEPS = [0, 1 / 3, 2 / 3, 1];

function round(value) {
  return Math.round(value * 10) / 10;
}

function scaleFor(values, domain) {
  if (domain) return { lo: domain[0], hi: domain[1] };
  const lo0 = Math.min(...values);
  const hi0 = Math.max(...values);
  const pad = lo0 === hi0 ? Math.max(Math.abs(hi0) * 0.1, 1) : (hi0 - lo0) * 0.15;
  return { lo: Math.max(0, lo0 - pad), hi: hi0 + pad };
}

export default function MetricTrendChart({ title, points, unit = "", domain, emptyHint }) {
  const [active, setActive] = useState(null);
  const clean = points.filter((point) => point.value != null && Number.isFinite(point.value));

  if (clean.length === 0) {
    return (
      <section className="mtc-section">
        <div className="mtc-head">
          <h3 className="mtc-title">{title}</h3>
        </div>
        <p className="mtc-empty">{emptyHint}</p>
      </section>
    );
  }

  const last = clean.length - 1;
  const { lo, hi } = scaleFor(clean.map((point) => point.value), domain);
  const span = hi - lo || 1;
  const yPct = (value) => ((hi - value) / span) * 100;
  const xPct = (index) => (last === 0 ? 50 : (index / last) * 100);
  const index = active == null ? last : Math.min(active, last);
  const current = clean[index];
  const edge = index === 0 ? "start" : index === last ? "end" : undefined;

  const line = clean
    .map((point, i) => `${(xPct(i) / 100) * 900},${(yPct(point.value) / 100) * 300}`)
    .join(" ");

  return (
    <section className="mtc-section">
      <div className="mtc-head">
        <h3 className="mtc-title">{title}</h3>
        <span className="mtc-latest">{`${round(clean[last].value)}${unit}`}</span>
      </div>

      <div className="mtc-chart">
        <div className="mtc-yaxis" aria-hidden="true">
          <span className="mtc-ysize">{`${round(hi)}${unit}`}</span>
          {GRID_STEPS.map((step) => (
            <span key={step} className="mtc-yl" style={{ top: `${step * 100}%` }}>
              {`${round(hi - span * step)}${unit}`}
            </span>
          ))}
        </div>

        <div className="mtc-plot" data-edge={edge}>
          {GRID_STEPS.map((step) => (
            <div key={step} className="mtc-gridline" style={{ top: `${step * 100}%` }} />
          ))}

          <svg className="mtc-svg" viewBox="0 0 900 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <polyline className="mtc-path" pathLength="100" points={line} />
          </svg>

          {clean.map((point, i) => (
            <span key={i} className="mtc-dot" style={{ left: `${xPct(i)}%`, top: `${yPct(point.value)}%` }} />
          ))}

          <div className="mtc-marker" style={{ "--mtc-x": `${xPct(index)}%` }}>
            <div className="mtc-drop" style={{ "--mtc-drop": 1 - yPct(current.value) / 100 }} />
            <div className="mtc-mrow" style={{ "--mtc-y": `${yPct(current.value)}%` }}>
              <div className="mtc-hdot" />
              <div className="mtc-pill">{`${round(current.value)}${unit}`}</div>
            </div>
          </div>
        </div>

        <div className="mtc-hits">
          {clean.map((point, i) => (
            <button
              key={i}
              type="button"
              className="mtc-hit"
              style={{ left: `${xPct(i)}%`, width: last === 0 ? "100%" : `${100 / last}%` }}
              aria-label={`${point.label}: ${round(point.value)}${unit}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
            />
          ))}
        </div>

        <div className="mtc-xaxis" aria-hidden="true">
          <div className="mtc-xlabels">
            {clean.map((point, i) => (
              <span key={i} className="mtc-xl" style={{ left: `${xPct(i)}%` }} data-on={i === index ? "" : undefined}>
                {point.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
