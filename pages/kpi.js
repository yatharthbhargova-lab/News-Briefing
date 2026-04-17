import { useState, useEffect } from "react";

// ── Default KPI structure ─────────────────────────────────────────────────────
const DEFAULT_KPIS = {
  financial: [
    { id: "gmv",        label: "GMV",              unit: "₹Cr",  actual: "",  target: "", prev: "", freq: "Monthly" },
    { id: "revenue",    label: "Revenue",           unit: "₹Cr",  actual: "",  target: "", prev: "", freq: "Monthly" },
    { id: "ocf",        label: "Operating Cash Flow", unit: "₹Cr", actual: "", target: "", prev: "", freq: "Monthly" },
    { id: "ebitda",     label: "EBITDA",            unit: "₹Cr",  actual: "",  target: "", prev: "", freq: "Monthly" },
    { id: "burn",       label: "Burn Rate",         unit: "₹Cr",  actual: "",  target: "", prev: "", freq: "Monthly" },
    { id: "runway",     label: "Runway",            unit: "months",actual: "", target: "", prev: "", freq: "Monthly" },
  ],
  operational: [
    { id: "orders",     label: "Orders",            unit: "Mn",   actual: "",  target: "", prev: "", freq: "Monthly" },
    { id: "aov",        label: "Avg Order Value",   unit: "₹",    actual: "",  target: "", prev: "", freq: "Monthly" },
    { id: "dso",        label: "DSO",               unit: "days", actual: "",  target: "", prev: "", freq: "Monthly" },
    { id: "dpo",        label: "DPO",               unit: "days", actual: "",  target: "", prev: "", freq: "Monthly" },
    { id: "fill_rate",  label: "Fill Rate",         unit: "%",    actual: "",  target: "", prev: "", freq: "Monthly" },
    { id: "nps",        label: "NPS",               unit: "score",actual: "",  target: "", prev: "", freq: "Quarterly" },
  ],
  unit_economics: [
    { id: "cac",        label: "CAC",               unit: "₹",    actual: "",  target: "", prev: "", freq: "Monthly" },
    { id: "ltv",        label: "LTV",               unit: "₹",    actual: "",  target: "", prev: "", freq: "Monthly" },
    { id: "ltv_cac",    label: "LTV:CAC",           unit: "x",    actual: "",  target: "", prev: "", freq: "Monthly" },
    { id: "cm",         label: "Contribution Margin", unit: "%",  actual: "",  target: "", prev: "", freq: "Monthly" },
    { id: "take_rate",  label: "Take Rate",         unit: "%",    actual: "",  target: "", prev: "", freq: "Monthly" },
    { id: "order_margin",label: "Order Margin",     unit: "₹",    actual: "",  target: "", prev: "", freq: "Monthly" },
  ],
  people: [
    { id: "headcount",  label: "Headcount",         unit: "FTEs", actual: "",  target: "", prev: "", freq: "Monthly" },
    { id: "enps",       label: "eNPS",              unit: "score",actual: "",  target: "", prev: "", freq: "Quarterly" },
    { id: "attrition",  label: "Attrition Rate",    unit: "%",    actual: "",  target: "", prev: "", freq: "Monthly" },
    { id: "rph",        label: "Revenue per Head",  unit: "₹L",   actual: "",  target: "", prev: "", freq: "Monthly" },
  ],
  diagnostics: [
    { id: "diag_gmv",   label: "Diagnostics GMV",   unit: "₹Cr",  actual: "",  target: "", prev: "", freq: "Monthly" },
    { id: "tests",      label: "Tests Conducted",   unit: "Mn",   actual: "",  target: "", prev: "", freq: "Monthly" },
    { id: "cpl",        label: "CPL",               unit: "₹",    actual: "",  target: "", prev: "", freq: "Monthly" },
    { id: "rpl",        label: "RPL",               unit: "₹",    actual: "",  target: "", prev: "", freq: "Monthly" },
    { id: "zpl",        label: "ZPL",               unit: "%",    actual: "",  target: "", prev: "", freq: "Monthly" },
    { id: "spl",        label: "SPL",               unit: "%",    actual: "",  target: "", prev: "", freq: "Monthly" },
  ],
};

const SECTION_META = {
  financial:      { label: "Financial",       icon: "💰", color: "#ff8c00" },
  operational:    { label: "Operational",     icon: "⚙️",  color: "#2196f3" },
  unit_economics: { label: "Unit Economics",  icon: "📐", color: "#9c27b0" },
  people:         { label: "People & HR",     icon: "👥", color: "#4caf50" },
  diagnostics:    { label: "Diagnostics",     icon: "🔬", color: "#00838f" },
};

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

function getStatus(actual, target, lowerIsBetter = false) {
  if (!actual || !target) return "empty";
  const a = parseFloat(actual), t = parseFloat(target);
  if (isNaN(a) || isNaN(t)) return "empty";
  const ratio = a / t;
  if (lowerIsBetter) {
    if (ratio <= 0.9) return "green";
    if (ratio <= 1.1) return "amber";
    return "red";
  }
  if (ratio >= 0.95) return "green";
  if (ratio >= 0.8) return "amber";
  return "red";
}

const STATUS_COLOR = { green: "#4caf50", amber: "#ff8c00", red: "#ef5350", empty: "#444" };
const STATUS_ICON  = { green: "▲", amber: "●", red: "▼", empty: "○" };

function getVsTarget(actual, target) {
  if (!actual || !target) return null;
  const a = parseFloat(actual), t = parseFloat(target);
  if (isNaN(a) || isNaN(t) || t === 0) return null;
  const pct = ((a - t) / t * 100).toFixed(1);
  return pct > 0 ? `+${pct}%` : `${pct}%`;
}

function getVsPrev(actual, prev) {
  if (!actual || !prev) return null;
  const a = parseFloat(actual), p = parseFloat(prev);
  if (isNaN(a) || isNaN(p) || p === 0) return null;
  const pct = ((a - p) / p * 100).toFixed(1);
  return pct > 0 ? `+${pct}% MoM` : `${pct}% MoM`;
}

async function callClaude(prompt, system) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: system || "You are a senior healthcare financial analyst. Return only raw JSON. No markdown.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content.map(b => b.text || "").join("");
}

function parseJSON(text) {
  let clean = text.trim().replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(clean); } catch {}
  const os = clean.indexOf("{"), oe = clean.lastIndexOf("}");
  if (os !== -1 && oe !== -1) { try { return JSON.parse(clean.slice(os, oe + 1)); } catch {} }
  return null;
}

// ── Mini sparkline ────────────────────────────────────────────────────────────
function MiniSparkline({ values, color }) {
  if (!values || values.length < 2) return null;
  const nums = values.map(v => parseFloat(v) || 0);
  const min = Math.min(...nums), max = Math.max(...nums), range = max - min || 1;
  const W = 60, H = 20;
  const pts = nums.map((n, i) => `${(i / (nums.length - 1)) * W},${H - ((n - min) / range) * H}`).join(" ");
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={pts.split(" ").pop().split(",")[0]} cy={pts.split(" ").pop().split(",")[1]} r="2" fill={color} />
    </svg>
  );
}

// ── KPI Tile ──────────────────────────────────────────────────────────────────
function KPITile({ kpi, color, onEdit, history }) {
  const status = getStatus(kpi.actual, kpi.target, ["dso", "dpo", "attrition", "burn", "cac", "cpl"].includes(kpi.id));
  const statusColor = STATUS_COLOR[status];
  const vsTarget = getVsTarget(kpi.actual, kpi.target);
  const vsPrev = getVsPrev(kpi.actual, kpi.prev);
  const histValues = (history || []).map(h => h[kpi.id]).filter(Boolean);

  return (
    <div onClick={() => onEdit(kpi)} style={{
      background: "#0c0c18", border: `1px solid ${status === "empty" ? "#151528" : statusColor + "44"}`,
      borderTop: `3px solid ${statusColor}`, borderRadius: "4px", padding: "14px",
      cursor: "pointer", transition: "border-color .2s, transform .2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.08em" }}>{kpi.label}</div>
        <span style={{ fontSize: "12px", color: statusColor }}>{STATUS_ICON[status]}</span>
      </div>
      <div style={{ fontSize: "22px", color: status === "empty" ? "#333" : "#ddd5c5", fontWeight: "bold", marginBottom: "2px" }}>
        {kpi.actual || "—"} <span style={{ fontSize: "12px", fontWeight: "normal", color: "#555" }}>{kpi.unit}</span>
      </div>
      {kpi.target && (
        <div style={{ fontSize: "10px", color: "#555", marginBottom: "6px" }}>Target: {kpi.target} {kpi.unit}</div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {vsTarget && <span style={{ fontSize: "10px", color: vsTarget.startsWith("+") ? "#4caf50" : "#ef5350" }}>vs Target: {vsTarget}</span>}
          {vsPrev && <span style={{ fontSize: "10px", color: vsPrev.startsWith("+") ? "#4caf50" : "#ef5350" }}>{vsPrev}</span>}
        </div>
        {histValues.length > 1 && <MiniSparkline values={histValues} color={color} />}
      </div>
      <div style={{ fontSize: "9px", color: "#333", marginTop: "6px" }}>✏️ Tap to edit</div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ kpi, onSave, onClose, T }) {
  const [actual, setActual] = useState(kpi.actual || "");
  const [target, setTarget] = useState(kpi.target || "");
  const [prev, setPrev] = useState(kpi.prev || "");
  const [note, setNote] = useState(kpi.note || "");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "6px", padding: "22px", width: "100%", maxWidth: "360px" }}>
        <div style={{ fontSize: "10px", color: T.accent, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "4px" }}>Edit KPI</div>
        <div style={{ fontSize: "18px", color: T.text, marginBottom: "18px" }}>{kpi.label} <span style={{ fontSize: "12px", color: T.muted }}>({kpi.unit})</span></div>

        {[["Actual (this month)", actual, setActual], ["Target", target, setTarget], ["Previous month", prev, setPrev]].map(([label, val, setter]) => (
          <div key={label} style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "10px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "5px" }}>{label}</div>
            <input type="number" value={val} onChange={e => setter(e.target.value)} placeholder="Enter value..."
              style={{ width: "100%", background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "9px 12px", borderRadius: "4px", fontSize: "14px", fontFamily: "Georgia, serif", outline: "none" }} />
          </div>
        ))}

        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "5px" }}>Notes (optional)</div>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add context or comments..."
            style={{ width: "100%", background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "9px 12px", borderRadius: "4px", fontSize: "13px", fontFamily: "Georgia, serif", outline: "none", resize: "vertical", minHeight: "60px" }} />
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => onSave({ ...kpi, actual, target, prev, note })} style={{ flex: 1, background: T.accent, color: "#000", border: "none", borderRadius: "4px", padding: "11px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>Save</button>
          <button onClick={onClose} style={{ padding: "11px 16px", background: "none", border: `1px solid ${T.border}`, color: T.muted, borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── AI Commentary ─────────────────────────────────────────────────────────────
function AICommentary({ kpis, T }) {
  const [commentary, setCommentary] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true); setCommentary("");
    const filled = Object.entries(kpis).flatMap(([section, items]) =>
      items.filter(k => k.actual).map(k => `${k.label}: ${k.actual}${k.unit} (target: ${k.target || "not set"}, prev: ${k.prev || "not set"})`)
    );
    if (!filled.length) { setCommentary("Please enter at least a few KPI values first."); setLoading(false); return; }
    try {
      const text = await callClaude(
        `TATA 1MG KPI data this month:\n${filled.join("\n")}\n\nWrite a 4-sentence CFO board commentary covering: (1) overall financial health and progress vs targets, (2) unit economics trends, (3) one area of concern requiring action, (4) one positive outlier to highlight. Be specific, use the actual numbers, and write like a CFO addressing the board.`,
        "You are TATA 1MG's CFO writing board commentary. Be precise, analytical, and use specific numbers. Flowing prose, no bullet points."
      );
      setCommentary(text);
    } catch { setCommentary("Could not generate commentary. Please retry."); }
    setLoading(false);
  }

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: "3px solid #9c27b0", borderRadius: "4px", padding: "16px 18px", marginBottom: "16px" }}>
      <div style={{ fontSize: "10px", color: "#9c27b0", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>◆ AI Board Commentary</div>
      {loading
        ? <p style={{ color: T.muted, fontStyle: "italic", fontSize: "13px", animation: "pulse 1.5s infinite" }}>Drafting board commentary…</p>
        : commentary
        ? <p style={{ lineHeight: 1.78, color: T.text, fontSize: "13px" }}>{commentary}</p>
        : <p style={{ color: T.muted, fontStyle: "italic", fontSize: "13px" }}>Enter your KPI values, then generate an AI-drafted CFO board commentary.</p>
      }
      <button onClick={generate} disabled={loading} style={{ marginTop: "12px", padding: "8px 20px", background: loading ? "none" : "#9c27b0", color: loading ? T.muted : "#fff", border: `1px solid ${loading ? T.border : "#9c27b0"}`, borderRadius: "3px", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer" }}>
        {loading ? "Generating…" : "Generate Board Commentary"}
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function KPIDashboard() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [kpis, setKpis] = useState(DEFAULT_KPIS);
  const [history, setHistory] = useState([]);
  const [editing, setEditing] = useState(null);
  const [activeSection, setActiveSection] = useState("financial");
  const [period, setPeriod] = useState(() => {
    const d = new Date(); return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  });
  const [showHistory, setShowHistory] = useState(false);

  const T = theme === "dark"
    ? { bg: "#080810", surface: "#0c0c18", border: "#151528", text: "#ddd5c5", muted: "#444", accent: "#ff8c00" }
    : { bg: "#f5f3ee", surface: "#ffffff", border: "#e0dbd0", text: "#1a1510", muted: "#888", accent: "#c47000" };

  useEffect(() => {
    setMounted(true);
    try {
      const t = localStorage.getItem("mb_theme"); if (t) setTheme(t);
      const k = localStorage.getItem("mb_kpis"); if (k) setKpis(JSON.parse(k));
      const h = localStorage.getItem("mb_kpi_history"); if (h) setHistory(JSON.parse(h));
    } catch {}
  }, []);

  function saveKPI(updated) {
    const newKpis = { ...kpis };
    for (const section of Object.keys(newKpis)) {
      newKpis[section] = newKpis[section].map(k => k.id === updated.id ? updated : k);
    }
    setKpis(newKpis);
    try { localStorage.setItem("mb_kpis", JSON.stringify(newKpis)); } catch {}
    setEditing(null);
  }

  function archiveMonth() {
    const snapshot = { period, timestamp: new Date().toISOString() };
    Object.entries(kpis).forEach(([, items]) => items.forEach(k => { snapshot[k.id] = k.actual; }));
    const newHistory = [snapshot, ...history.slice(0, 11)];
    setHistory(newHistory);
    try { localStorage.setItem("mb_kpi_history", JSON.stringify(newHistory)); } catch {}
    alert(`✅ ${period} archived to history!`);
  }

  function clearAll() {
    if (!confirm("Clear all KPI values? This cannot be undone.")) return;
    const cleared = {};
    Object.entries(kpis).forEach(([sec, items]) => {
      cleared[sec] = items.map(k => ({ ...k, actual: "", target: "", prev: "", note: "" }));
    });
    setKpis(cleared);
    try { localStorage.setItem("mb_kpis", JSON.stringify(cleared)); } catch {}
  }

  // Summary stats
  const allKpis = Object.values(kpis).flat();
  const filled = allKpis.filter(k => k.actual);
  const onTrack = filled.filter(k => getStatus(k.actual, k.target, ["dso","dpo","attrition","burn","cac","cpl"].includes(k.id)) === "green").length;
  const atRisk = filled.filter(k => getStatus(k.actual, k.target, ["dso","dpo","attrition","burn","cac","cpl"].includes(k.id)) === "amber").length;
  const offTrack = filled.filter(k => getStatus(k.actual, k.target, ["dso","dpo","attrition","burn","cac","cpl"].includes(k.id)) === "red").length;

  if (!mounted) return <div style={{ minHeight: "100vh", background: "#080810", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: "#ff8c00", fontFamily: "Georgia", fontSize: "13px", letterSpacing: "0.2em" }}>LOADING...</div></div>;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        button { font-family: Georgia, serif; cursor: pointer; }
        input, textarea { outline: none; font-family: Georgia, serif; }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <header style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ fontSize: "10px", color: T.accent, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "3px" }}>◆ TATA 1MG Internal</div>
            <h1 style={{ fontSize: "clamp(16px,3.5vw,24px)", fontWeight: "normal", color: T.text, marginBottom: "2px" }}>CFO KPI Dashboard</h1>
            <p style={{ fontSize: "11px", color: T.muted, fontStyle: "italic" }}>Track, monitor & report your internal KPIs — Financial · Operational · Unit Economics · People · Diagnostics</p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <select value={period} onChange={e => setPeriod(e.target.value)}
              style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "6px 10px", borderRadius: "4px", fontSize: "11px", fontFamily: "Georgia, serif" }}>
              {MONTHS.map(m => <option key={m}>{m} {new Date().getFullYear()}</option>)}
            </select>
            <button onClick={archiveMonth} style={{ background: "#4caf50", color: "#000", border: "none", borderRadius: "4px", padding: "6px 12px", fontSize: "11px", fontWeight: "bold" }}>📥 Archive Month</button>
            <button onClick={() => setShowHistory(!showHistory)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, borderRadius: "4px", padding: "6px 12px", fontSize: "11px" }}>📅 History</button>
            <button onClick={clearAll} style={{ background: "none", border: "1px solid #ef5350", color: "#ef5350", borderRadius: "4px", padding: "6px 10px", fontSize: "11px" }}>🗑️ Clear</button>
            <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, padding: "6px 10px", borderRadius: "4px", fontSize: "14px" }}>{theme === "dark" ? "☀️" : "🌙"}</button>
            <a href="/" style={{ background: T.accent, color: "#000", padding: "7px 14px", borderRadius: "4px", fontSize: "11px", textDecoration: "none", fontWeight: "bold" }}>← News</a>
          </div>
        </div>

        {/* Summary strip */}
        {filled.length > 0 && (
          <div style={{ display: "flex", gap: "16px", marginTop: "14px", flexWrap: "wrap" }}>
            {[
              { label: "KPIs Tracked", value: filled.length, color: T.text },
              { label: "On Track", value: onTrack, color: "#4caf50" },
              { label: "At Risk", value: atRisk, color: "#ff8c00" },
              { label: "Off Track", value: offTrack, color: "#ef5350" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "10px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
              </div>
            ))}
            <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <div style={{ width: "100%", height: "6px", background: T.border, borderRadius: "3px", overflow: "hidden", display: "flex" }}>
                <div style={{ width: `${(onTrack / filled.length) * 100}%`, background: "#4caf50" }} />
                <div style={{ width: `${(atRisk / filled.length) * 100}%`, background: "#ff8c00" }} />
                <div style={{ width: `${(offTrack / filled.length) * 100}%`, background: "#ef5350" }} />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* History panel */}
      {showHistory && history.length > 0 && (
        <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "14px 18px", overflowX: "auto" }}>
          <div style={{ fontSize: "10px", color: T.accent, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>📅 Historical Archive</div>
          <div style={{ display: "flex", gap: "10px" }}>
            {history.map((h, i) => (
              <div key={i} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "10px 14px", minWidth: "120px", flexShrink: 0 }}>
                <div style={{ fontSize: "11px", color: T.accent, fontWeight: "bold", marginBottom: "6px" }}>{h.period}</div>
                {allKpis.filter(k => h[k.id]).slice(0, 4).map(k => (
                  <div key={k.id} style={{ fontSize: "10px", color: T.muted, marginBottom: "2px" }}>{k.label}: <span style={{ color: T.text }}>{h[k.id]}</span></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <main style={{ padding: "16px", maxWidth: "1200px", margin: "0 auto" }}>
        <AICommentary kpis={kpis} T={T} />

        {/* Section tabs */}
        <div style={{ display: "flex", gap: "0", borderBottom: `1px solid ${T.border}`, marginBottom: "16px", overflowX: "auto" }}>
          {Object.entries(SECTION_META).map(([id, meta]) => (
            <button key={id} onClick={() => setActiveSection(id)} style={{
              background: "none", border: "none", cursor: "pointer", padding: "10px 16px",
              fontSize: "12px", whiteSpace: "nowrap",
              color: activeSection === id ? meta.color : T.muted,
              borderBottom: activeSection === id ? `2px solid ${meta.color}` : "2px solid transparent",
              letterSpacing: "0.04em",
            }}>
              {meta.icon} {meta.label}
            </button>
          ))}
        </div>

        {/* KPI grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "10px" }}>
          {kpis[activeSection]?.map(kpi => (
            <KPITile key={kpi.id} kpi={kpi} color={SECTION_META[activeSection].color} onEdit={setEditing} history={history} />
          ))}
        </div>

        {/* Off-track alerts */}
        {offTrack > 0 && (
          <div style={{ marginTop: "20px", background: "#ef535010", border: "1px solid #ef535033", borderLeft: "3px solid #ef5350", borderRadius: "4px", padding: "14px 16px" }}>
            <div style={{ fontSize: "10px", color: "#ef5350", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>⚠️ KPIs Off Track — Immediate Attention Required</div>
            {Object.values(kpis).flat().filter(k => getStatus(k.actual, k.target, ["dso","dpo","attrition","burn","cac","cpl"].includes(k.id)) === "red").map(k => (
              <div key={k.id} style={{ fontSize: "12px", color: T.text, marginBottom: "4px" }}>
                <b>{k.label}</b>: actual {k.actual}{k.unit} vs target {k.target}{k.unit}
                <span style={{ color: "#ef5350", marginLeft: "8px" }}>{getVsTarget(k.actual, k.target)}</span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit modal */}
      {editing && <EditModal kpi={editing} onSave={saveKPI} onClose={() => setEditing(null)} T={T} />}
    </div>
  );
}
