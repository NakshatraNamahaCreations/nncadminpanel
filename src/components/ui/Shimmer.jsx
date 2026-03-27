import "./Shimmer.css";

/* ── Reusable KPI stat card skeleton ──────────────────────────── */
export function ShimmerCard() {
  return (
    <div className="sh-card">
      <div className="sh-icon shim" />
      <div className="sh-card-body">
        <div className="sh-line w60 shim" />
        <div className="sh-line w45 h22 shim" />
      </div>
    </div>
  );
}

/* ── Grid of KPI cards ────────────────────────────────────────── */
export function ShimmerKpiGrid({ count = 4, cols = 4 }) {
  return (
    <div className={`sh-kpi-grid cols${cols}`}>
      {Array(count).fill(0).map((_, i) => <ShimmerCard key={i} />)}
    </div>
  );
}

/* ── Single table row ─────────────────────────────────────────── */
export function ShimmerTableRow({ cells = 6 }) {
  return (
    <div className="sh-table-row">
      <div className="sh-cell avatar shim" />
      {Array(Math.max(1, cells - 1)).fill(0).map((_, i) => (
        <div
          key={i}
          className={`sh-cell shim ${
            i === 0 ? "wide" : i === cells - 2 ? "narrow" : ""
          }`}
        />
      ))}
    </div>
  );
}

/* ── Full table skeleton ──────────────────────────────────────── */
export function ShimmerTable({ rows = 8, cells = 6 }) {
  return (
    <div className="sh-table-wrap">
      {Array(rows).fill(0).map((_, i) => (
        <ShimmerTableRow key={i} cells={cells} />
      ))}
    </div>
  );
}

/* ── Lead list item ───────────────────────────────────────────── */
export function ShimmerLeadItem() {
  return (
    <div className="sh-lead">
      <div className="sh-lead-avatar shim" />
      <div className="sh-lead-body">
        <div className="sh-line w60 shim" />
        <div className="sh-line w45 shim" />
      </div>
      <div className="sh-lead-badges">
        <div className="sh-badge shim" />
        <div className="sh-badge shim" />
      </div>
    </div>
  );
}

/* ── Lead list skeleton ───────────────────────────────────────── */
export function ShimmerLeadList({ rows = 8 }) {
  return (
    <div style={{ padding: "12px 0" }}>
      {Array(rows).fill(0).map((_, i) => <ShimmerLeadItem key={i} />)}
    </div>
  );
}

/* ── Full-page loader ring ────────────────────────────────────── */
export function PageLoader({ text = "Loading…" }) {
  return (
    <div className="pg-loader-wrap">
      <div className="pg-loader-ring" />
      <div className="pg-loader-text">{text}</div>
    </div>
  );
}

/* ── Inline button spinner ────────────────────────────────────── */
export function BtnSpinner({ variant = "white" }) {
  const cls = variant === "dark" ? "btn-spinner dark"
    : variant === "blue" ? "btn-spinner blue"
    : "btn-spinner";
  return <span className={cls} />;
}
