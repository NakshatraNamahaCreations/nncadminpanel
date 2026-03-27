/* Imperative toast — no React context needed, call from anywhere */

let _container = null;

function getContainer() {
  if (!_container || !document.body.contains(_container)) {
    _container = document.createElement("div");
    _container.style.cssText =
      "position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;pointer-events:none;max-width:420px;width:calc(100vw - 40px)";
    document.body.appendChild(_container);
  }
  return _container;
}

const THEMES = {
  success: { bg: "#ecfdf5", border: "#6ee7b7", color: "#065f46", iconBg: "#d1fae5", icon: "✓" },
  error:   { bg: "#fef2f2", border: "#fca5a5", color: "#991b1b", iconBg: "#fee2e2", icon: "✕" },
  info:    { bg: "#eff6ff", border: "#93c5fd", color: "#1e40af", iconBg: "#dbeafe", icon: "ℹ" },
  warning: { bg: "#fffbeb", border: "#fcd34d", color: "#92400e", iconBg: "#fef3c7", icon: "⚠" },
};

function show(message, type = "info", duration = 3500) {
  const t = THEMES[type] || THEMES.info;
  const el = document.createElement("div");

  el.setAttribute("data-toast", "1");
  el.style.cssText = [
    `background:${t.bg}`,
    `border:1px solid ${t.border}`,
    `color:${t.color}`,
    "padding:12px 14px 12px 12px",
    "border-radius:14px",
    "font-family:'Plus Jakarta Sans',Inter,sans-serif",
    "font-size:14px",
    "font-weight:600",
    "line-height:1.4",
    "display:flex",
    "align-items:center",
    "gap:10px",
    "box-shadow:0 8px 32px rgba(0,0,0,0.13)",
    "pointer-events:all",
    "animation:toastSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
    "will-change:transform,opacity",
  ].join(";");

  el.innerHTML = `
    <span style="width:30px;height:30px;border-radius:8px;background:${t.iconBg};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;flex-shrink:0">${t.icon}</span>
    <span style="flex:1">${message}</span>
    <button data-close style="background:none;border:none;cursor:pointer;color:${t.color};font-size:22px;line-height:1;padding:0 0 0 6px;opacity:0.45;pointer-events:all;font-family:inherit;flex-shrink:0">×</button>
  `;

  const container = getContainer();
  container.appendChild(el);

  const dismiss = () => {
    el.style.transition = "opacity 0.25s ease, transform 0.25s ease";
    el.style.opacity = "0";
    el.style.transform = "translateX(18px)";
    setTimeout(() => el.remove(), 270);
  };

  const timer = setTimeout(dismiss, duration);
  el.querySelector("[data-close]").addEventListener("click", () => {
    clearTimeout(timer);
    dismiss();
  });
}

export const toast = {
  success: (msg, dur) => show(msg, "success", dur),
  error:   (msg, dur) => show(msg, "error",   dur),
  info:    (msg, dur) => show(msg, "info",     dur),
  warning: (msg, dur) => show(msg, "warning",  dur),
};
