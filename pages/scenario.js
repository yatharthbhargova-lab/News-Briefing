import { useState, useEffect } from "react";

const PRESET_SCENARIOS = [
  {
    id: "pharmeasy_raise",
    title: "PharmEasy raises $500M",
    description: "Competitor secures large funding round",
    variables: [{ label: "Amount Raised", value: "500", unit: "USD Mn" }, { label: "Implied Valuation", value: "2000", unit: "USD Mn" }],
    category: "Competitor",
  },
  {
    id: "rbi_rate_hike",
    title: "RBI raises rates by 50bps",
    description: "Monetary policy tightening",
    variables: [{ label: "Rate Change", value: "+50", unit: "bps" }, { label: "New Repo Rate", value: "7.0", unit: "%" }],
    category: "Macro",
  },
  {
    id: "drug_price_control",
    title: "Govt extends DPCO to OTC drugs",
    description: "Drug Price Control Order expansion",
    variables: [{ label: "OTC SKUs affected", value: "2000", unit: "SKUs" }, { label: "Price reduction", value: "15", unit: "%" }],
    category: "Regulatory",
  },
  {
    id: "online_pharmacy_ban",
    title: "State bans online pharmacy delivery",
    description: "Regulatory restriction on digital pharmacy",
    variables: [{ label: "States affected", value: "3", unit: "states" }, { label: "GMV at risk", value: "12", unit: "%" }],
    category: "Regulatory",
  },
  {
    id: "amazon_health_india",
    title: "Amazon launches full pharmacy in India",
    description: "Big Tech entry into Indian online pharmacy",
    variables: [{ label: "Amazon India GMV", value: "5000", unit: "USD Mn" }, { label: "Health allocation", value: "10", unit: "%" }],
    category: "Competitor",
  },
  {
    id: "usd_depreciation",
    title: "INR depreciates to ₹90/USD",
    description: "Currency impact on imported medicines",
    variables: [{ label: "New USD/INR rate", value: "90", unit: "₹" }, { label: "Import dependency", value: "35", unit: "%" }],
    category: "Macro",
  },
  {
    id: "1mg_ipo",
    title: "TATA 1MG IPO at ₹15,000 Cr",
    description: "Potential public listing scenario",
    variables: [{ label: "IPO Valuation", value: "15000", unit: "₹Cr" }, { label: "Fresh issue size", value: "2000", unit: "₹Cr" }],
    category: "Strategic",
  },
  {
    id: "thyrocare_synergy",
    title: "Full Thyrocare-1MG integration",
    description: "Complete diagnostic-pharmacy synergy realisation",
    variables: [{ label: "Cost synergy", value: "150", unit: "₹Cr" }, { label: "Cross-sell revenue", value: "300", unit: "₹Cr" }],
    category: "Strategic",
  },
];

const CATEGORIES = ["All", "Competitor", "Macro", "Regulatory", "Strategic"];

async function callClaude(prompt, system) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: system || "You are a senior healthcare financial analyst and strategy consultant. Return only raw JSON. No markdown.",
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

const CAT_COLOR = { Competitor: "#ef5350", Macro: "#2196f3", Regulatory: "#ff8c00", Strategic: "#9c27b0", Custom: "#4caf50" };

function ImpactBar({ label, value, color, max = 100 }) {
  const num = parseFloat(value) || 0;
  const pct = Math.min(Math.abs(num / max) * 100, 100);
  const isNeg = num < 0;
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "12px", color: "#888" }}>{label}</span>
        <span style={{ fontSize: "12px", fontWeight: "bold", color: isNeg ? "#ef5350" : "#4caf50" }}>{num > 0 ? "+" : ""}{value}</span>
      </div>
      <div style={{ background: "#151528", borderRadius: "3px", height: "6px", overflow: "hidden" }}>
        <div style={{ background: isNeg ? "#ef5350" : color || "#4caf50", width: `${pct}%`, height: "100%", borderRadius: "3px", transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

function ScenarioCard({ scenario, onSelect, isSelected, T }) {
  const color = CAT_COLOR[scenario.category] || "#666";
  return (
    <div onClick={() => onSelect(scenario)} style={{
      background: isSelected ? color + "15" : T.surface,
      border: `1px solid ${isSelected ? color : T.border}`,
      borderTop: `3px solid ${color}`,
      borderRadius: "4px", padding: "14px", cursor: "pointer",
      transition: "border-color .2s, transform .2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "9px", padding: "2px 7px", background: color + "22", color, borderRadius: "10px" }}>{scenario.category}</span>
        {isSelected && <span style={{ fontSize: "10px", color }}>✓ Selected</span>}
      </div>
      <div style={{ fontSize: "14px", color: T.text, fontWeight: "bold", marginBottom: "4px" }}>{scenario.title}</div>
      <div style={{ fontSize: "11px", color: T.muted, marginBottom: "8px" }}>{scenario.description}</div>
      {scenario.variables.map((v, i) => (
        <div key={i} style={{ fontSize: "11px", color: T.muted }}>
          {v.label}: <b style={{ color: T.text }}>{v.value} {v.unit}</b>
        </div>
      ))}
    </div>
  );
}

export default function ScenarioModelling() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [filterCat, setFilterCat] = useState("All");
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customVars, setCustomVars] = useState([{ label: "", value: "", unit: "" }]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState([]);
  const [compareResults, setCompareResults] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [activeView, setActiveView] = useState("presets"); // presets | custom | compare | saved

  const T = theme === "dark"
    ? { bg: "#080810", surface: "#0c0c18", border: "#151528", text: "#ddd5c5", muted: "#444", accent: "#ff8c00" }
    : { bg: "#f5f3ee", surface: "#ffffff", border: "#e0dbd0", text: "#1a1510", muted: "#888", accent: "#c47000" };

  useEffect(() => {
    setMounted(true);
    try {
      const t = localStorage.getItem("mb_theme"); if (t) setTheme(t);
      const s = localStorage.getItem("mb_saved_scenarios"); if (s) setSavedScenarios(JSON.parse(s));
    } catch {}
  }, []);

  async function runAnalysis(scenario) {
    setSelectedScenario(scenario);
    setAnalysis(null);
    setLoading(true);
    const vars = scenario.variables.map(v => `${v.label}: ${v.value} ${v.unit}`).join(", ");
    try {
      const text = await callClaude(
        `Scenario analysis for TATA 1MG CFO:

Scenario: "${scenario.title}"
Description: ${scenario.description}
Key variables: ${vars}

TATA 1MG context: Online pharmacy and diagnostics platform, GMV ~₹8,500 Cr, revenue ~₹1,820 Cr, growing ~38% YoY, backed by TATA Group, competes with PharmEasy, Apollo 247, Practo in India.

Provide a comprehensive what-if analysis. Return JSON:
{
  "headline_impact": "1 sentence summary of overall impact",
  "probability": "% likelihood this scenario occurs in next 12 months",
  "timeframe": "when this would materialise e.g. 6-12 months",
  "overall_impact": "positive|negative|neutral|mixed",
  "financial_impact": {
    "gmv_impact": "e.g. -5% to -8% or +200 Cr",
    "revenue_impact": "value or %",
    "margin_impact": "bps or %",
    "cac_impact": "value or %",
    "valuation_impact": "value or %",
    "cash_impact": "value"
  },
  "impact_bars": [
    {"metric": "GMV", "value": "-5", "unit": "%", "notes": "explanation"},
    {"metric": "Revenue", "value": "-3", "unit": "%", "notes": ""},
    {"metric": "CAC", "value": "+8", "unit": "%", "notes": ""},
    {"metric": "Margin", "value": "-120", "unit": "bps", "notes": ""},
    {"metric": "Market Share", "value": "-2", "unit": "pp", "notes": ""}
  ],
  "risks": [
    {"title": "risk name", "description": "1 sentence", "severity": "high|medium|low", "mitigation": "1 sentence action"}
  ],
  "opportunities": [
    {"title": "opportunity name", "description": "1 sentence", "potential": "value e.g. +₹200 Cr revenue"}
  ],
  "immediate_actions": ["action 1 for CFO to take now", "action 2", "action 3"],
  "strategic_response": "2 paragraph strategic response TATA 1MG should pursue",
  "board_message": "2 sentences the CFO should say to the board about this scenario",
  "best_case": "description and financial outcome if this goes best for 1MG",
  "worst_case": "description and financial outcome if this goes worst for 1MG",
  "base_case": "most likely outcome description"
}
Return ONLY JSON.`,
        "You are a McKinsey-level healthcare strategy consultant advising TATA 1MG's CFO. Be highly specific with numbers. Return only raw JSON."
      );
      const parsed = parseJSON(text);
      if (parsed) setAnalysis(parsed);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function runCustomScenario() {
    if (!customTitle) return;
    const scenario = {
      id: "custom_" + Date.now(),
      title: customTitle,
      description: customDesc,
      variables: customVars.filter(v => v.label),
      category: "Custom",
    };
    await runAnalysis(scenario);
  }

  function saveCurrentScenario() {
    if (!selectedScenario || !analysis) return;
    const saved = { ...selectedScenario, analysis, savedAt: new Date().toISOString() };
    const updated = [saved, ...savedScenarios.slice(0, 9)];
    setSavedScenarios(updated);
    try { localStorage.setItem("mb_saved_scenarios", JSON.stringify(updated)); } catch {}
    alert("✅ Scenario saved!");
  }

  async function compareScenarios() {
    if (comparing.length < 2) return;
    setCompareLoading(true); setCompareResults(null);
    try {
      const text = await callClaude(
        `Compare these scenarios for TATA 1MG and rank their impact:
${comparing.map((s, i) => `${i + 1}. "${s.title}": ${s.description}. Variables: ${s.variables.map(v => `${v.label}: ${v.value} ${v.unit}`).join(", ")}`).join("\n")}

Return JSON:
{
  "ranking": [{"scenario": "title", "rank": 1, "reason": "why ranked here"}],
  "comparison_table": [
    {"metric": "GMV Impact", ${comparing.map(s => `"${s.title}": "value"`).join(", ")}},
    {"metric": "Revenue Impact", ${comparing.map(s => `"${s.title}": "value"`).join(", ")}},
    {"metric": "CAC Impact", ${comparing.map(s => `"${s.title}": "value"`).join(", ")}},
    {"metric": "Timeline", ${comparing.map(s => `"${s.title}": "value"`).join(", ")}},
    {"metric": "Probability", ${comparing.map(s => `"${s.title}": "value"`).join(", ")}},
    {"metric": "Overall Severity", ${comparing.map(s => `"${s.title}": "high|medium|low"`).join(", ")}}
  ],
  "combined_risk": "what if both/all happen simultaneously",
  "priority_recommendation": "which scenario the CFO should prepare for first and why"
}
Return ONLY JSON.`,
        "You are a strategy consultant. Return only raw JSON."
      );
      const parsed = parseJSON(text);
      if (parsed) setCompareResults(parsed);
    } catch (e) { console.error(e); }
    setCompareLoading(false);
  }

  const filtered = filterCat === "All" ? PRESET_SCENARIOS : PRESET_SCENARIOS.filter(s => s.category === filterCat);
  const impactColor = analysis?.overall_impact === "positive" ? "#4caf50" : analysis?.overall_impact === "negative" ? "#ef5350" : "#ff8c00";

  if (!mounted) return <div style={{ minHeight: "100vh", background: "#080810", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: "#ff8c00", fontFamily: "Georgia", fontSize: "13px", letterSpacing: "0.2em" }}>LOADING...</div></div>;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        button { font-family: Georgia, serif; cursor: pointer; }
        input, textarea, select { outline: none; font-family: Georgia, serif; }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 2px; }
        table { border-collapse: collapse; width: 100%; }
        th { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #555; padding: 8px 10px; border-bottom: 1px solid #151528; text-align: left; }
        td { padding: 8px 10px; border-bottom: 1px solid #151528; font-size: 11px; }
      `}</style>

      {/* Header */}
      <header style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ fontSize: "10px", color: "#9c27b0", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "3px" }}>◆ What-If Analysis</div>
            <h1 style={{ fontSize: "clamp(16px,3.5vw,24px)", fontWeight: "normal", color: T.text, marginBottom: "2px" }}>Scenario Modelling</h1>
            <p style={{ fontSize: "11px", color: T.muted, fontStyle: "italic" }}>Model any scenario and see the financial impact on TATA 1MG — instant CFO-level analysis</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, padding: "6px 10px", borderRadius: "4px", fontSize: "14px" }}>{theme === "dark" ? "☀️" : "🌙"}</button>
            <a href="/" style={{ background: T.accent, color: "#000", padding: "7px 14px", borderRadius: "4px", fontSize: "11px", textDecoration: "none", fontWeight: "bold" }}>← News</a>
          </div>
        </div>
      </header>

      {/* View tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, background: T.surface, overflowX: "auto" }}>
        {[["presets", "📋 Preset Scenarios"], ["custom", "✏️ Custom Scenario"], ["compare", `⚖️ Compare (${comparing.length})`], ["saved", `💾 Saved (${savedScenarios.length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setActiveView(id)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "11px 16px",
            fontSize: "12px", whiteSpace: "nowrap",
            color: activeView === id ? "#9c27b0" : T.muted,
            borderBottom: activeView === id ? "2px solid #9c27b0" : "2px solid transparent",
          }}>{label}</button>
        ))}
      </div>

      <div style={{ display: "flex", maxWidth: "1200px", margin: "0 auto" }}>

        {/* Left panel — scenario picker */}
        <div style={{ width: "380px", flexShrink: 0, padding: "16px", borderRight: `1px solid ${T.border}`, overflowY: "auto", maxHeight: "calc(100vh - 120px)" }}>

          {/* ── PRESETS TAB ── */}
          {activeView === "presets" && (
            <>
              <div style={{ display: "flex", gap: "5px", marginBottom: "12px", flexWrap: "wrap" }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setFilterCat(c)} style={{ background: filterCat === c ? "#9c27b0" : "none", color: filterCat === c ? "#fff" : T.muted, border: `1px solid ${filterCat === c ? "#9c27b0" : T.border}`, padding: "4px 10px", borderRadius: "20px", fontSize: "10px" }}>{c}</button>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {filtered.map(s => (
                  <div key={s.id} style={{ position: "relative" }}>
                    <ScenarioCard scenario={s} onSelect={runAnalysis} isSelected={selectedScenario?.id === s.id} T={T} />
                    <button onClick={e => { e.stopPropagation(); setComparing(prev => prev.find(c => c.id === s.id) ? prev.filter(c => c.id !== s.id) : [...prev.slice(0, 3), s]); }}
                      style={{ position: "absolute", top: "10px", right: "10px", background: comparing.find(c => c.id === s.id) ? "#9c27b0" : "none", color: comparing.find(c => c.id === s.id) ? "#fff" : T.muted, border: `1px solid ${T.border}`, borderRadius: "3px", padding: "2px 7px", fontSize: "10px" }}>
                      {comparing.find(c => c.id === s.id) ? "✓" : "+"} Compare
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── CUSTOM TAB ── */}
          {activeView === "custom" && (
            <div>
              <div style={{ fontSize: "11px", color: T.muted, marginBottom: "14px" }}>Build any what-if scenario and get instant CFO-level analysis.</div>
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "10px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "5px" }}>Scenario Title</div>
                <input type="text" value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder="e.g. WhatsApp enters healthcare India"
                  style={{ width: "100%", background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "9px 12px", borderRadius: "4px", fontSize: "13px" }} />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "10px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "5px" }}>Description</div>
                <textarea value={customDesc} onChange={e => setCustomDesc(e.target.value)} placeholder="Describe the scenario..."
                  style={{ width: "100%", background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "9px 12px", borderRadius: "4px", fontSize: "13px", resize: "vertical", minHeight: "60px" }} />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "10px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Key Variables</div>
                {customVars.map((v, i) => (
                  <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                    <input type="text" value={v.label} onChange={e => setCustomVars(prev => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="Variable name"
                      style={{ flex: 2, background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "7px 10px", borderRadius: "4px", fontSize: "12px" }} />
                    <input type="text" value={v.value} onChange={e => setCustomVars(prev => prev.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} placeholder="Value"
                      style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "7px 10px", borderRadius: "4px", fontSize: "12px" }} />
                    <input type="text" value={v.unit} onChange={e => setCustomVars(prev => prev.map((x, j) => j === i ? { ...x, unit: e.target.value } : x))} placeholder="Unit"
                      style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "7px 10px", borderRadius: "4px", fontSize: "12px" }} />
                  </div>
                ))}
                <button onClick={() => setCustomVars(prev => [...prev, { label: "", value: "", unit: "" }])} style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, borderRadius: "3px", padding: "5px 12px", fontSize: "11px" }}>+ Add Variable</button>
              </div>
              <button onClick={runCustomScenario} disabled={loading || !customTitle} style={{ width: "100%", background: loading || !customTitle ? T.border : "#9c27b0", color: loading || !customTitle ? T.muted : "#fff", border: "none", borderRadius: "4px", padding: "11px", fontSize: "12px", fontWeight: "bold" }}>
                {loading ? "Analysing…" : "Run Scenario Analysis"}
              </button>
            </div>
          )}

          {/* ── COMPARE TAB ── */}
          {activeView === "compare" && (
            <div>
              <div style={{ fontSize: "11px", color: T.muted, marginBottom: "12px" }}>Select up to 4 scenarios from Presets tab, then compare them side by side.</div>
              {comparing.length === 0 ? (
                <p style={{ color: T.muted, fontStyle: "italic", fontSize: "13px" }}>Go to Presets and click "+ Compare" on scenarios to add them here.</p>
              ) : (
                <>
                  {comparing.map(s => (
                    <div key={s.id} style={{ background: T.bg, border: `1px solid ${T.border}`, borderLeft: `3px solid ${CAT_COLOR[s.category]}`, borderRadius: "4px", padding: "10px 12px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "12px", color: T.text, fontWeight: "bold" }}>{s.title}</div>
                        <div style={{ fontSize: "10px", color: T.muted }}>{s.category}</div>
                      </div>
                      <button onClick={() => setComparing(prev => prev.filter(c => c.id !== s.id))} style={{ background: "none", border: "none", color: "#ef5350", cursor: "pointer", fontSize: "14px" }}>✕</button>
                    </div>
                  ))}
                  <button onClick={compareScenarios} disabled={compareLoading || comparing.length < 2} style={{ width: "100%", background: compareLoading || comparing.length < 2 ? T.border : "#9c27b0", color: compareLoading || comparing.length < 2 ? T.muted : "#fff", border: "none", borderRadius: "4px", padding: "11px", fontSize: "12px", fontWeight: "bold", marginTop: "8px" }}>
                    {compareLoading ? "Comparing…" : "Compare Scenarios"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── SAVED TAB ── */}
          {activeView === "saved" && (
            <div>
              {savedScenarios.length === 0 ? (
                <p style={{ color: T.muted, fontStyle: "italic", fontSize: "13px" }}>No saved scenarios. Run an analysis and click "Save Scenario".</p>
              ) : (
                savedScenarios.map(s => (
                  <div key={s.id} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "12px", marginBottom: "8px", cursor: "pointer" }}
                    onClick={() => { setSelectedScenario(s); setAnalysis(s.analysis); }}>
                    <div style={{ fontSize: "12px", color: T.text, fontWeight: "bold", marginBottom: "2px" }}>{s.title}</div>
                    <div style={{ fontSize: "10px", color: T.muted }}>{new Date(s.savedAt).toLocaleDateString("en-IN")}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right panel — analysis results */}
        <div style={{ flex: 1, padding: "16px", overflowY: "auto", maxHeight: "calc(100vh - 120px)" }}>

          {/* Compare results */}
          {activeView === "compare" && compareResults && (
            <div style={{ animation: "fadeUp 0.4s ease both" }}>
              <div style={{ fontSize: "10px", color: "#9c27b0", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "14px" }}>⚖️ Scenario Comparison</div>

              {/* Ranking */}
              <div style={{ marginBottom: "16px" }}>
                {compareResults.ranking?.map((r, i) => (
                  <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${i === 0 ? "#ef5350" : i === 1 ? "#ff8c00" : "#4caf50"}`, borderRadius: "4px", padding: "10px 14px", marginBottom: "6px", display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ fontSize: "20px", fontWeight: "bold", color: i === 0 ? "#ef5350" : i === 1 ? "#ff8c00" : "#4caf50", minWidth: "24px" }}>#{r.rank}</div>
                    <div>
                      <div style={{ fontSize: "13px", color: T.text, fontWeight: "bold" }}>{r.scenario}</div>
                      <div style={{ fontSize: "11px", color: T.muted }}>{r.reason}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comparison table */}
              {compareResults.comparison_table && (
                <div style={{ overflowX: "auto", marginBottom: "14px" }}>
                  <table>
                    <thead><tr style={{ background: T.bg }}>
                      <th>Metric</th>
                      {comparing.map(s => <th key={s.id}>{s.title}</th>)}
                    </tr></thead>
                    <tbody>
                      {compareResults.comparison_table.map((row, i) => (
                        <tr key={i}>
                          <td style={{ color: "#9c27b0", fontWeight: "bold" }}>{row.metric}</td>
                          {comparing.map(s => <td key={s.id}>{row[s.title] || "—"}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ background: "#ef535010", border: "1px solid #ef535033", borderRadius: "4px", padding: "12px 14px", marginBottom: "10px" }}>
                <div style={{ fontSize: "10px", color: "#ef5350", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>⚠️ Combined Risk</div>
                <p style={{ fontSize: "12px", color: T.text }}>{compareResults.combined_risk}</p>
              </div>
              <div style={{ background: "#9c27b010", border: "1px solid #9c27b033", borderLeft: "3px solid #9c27b0", borderRadius: "4px", padding: "12px 14px" }}>
                <div style={{ fontSize: "10px", color: "#9c27b0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>💡 CFO Priority Recommendation</div>
                <p style={{ fontSize: "12px", color: T.text, lineHeight: 1.65 }}>{compareResults.priority_recommendation}</p>
              </div>
            </div>
          )}

          {/* Single scenario analysis */}
          {!compareResults && !loading && !analysis && (
            <div style={{ textAlign: "center", padding: "80px 0", color: T.muted }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>🎯</div>
              <div style={{ fontSize: "14px", marginBottom: "8px", color: T.text }}>Select a scenario to run analysis</div>
              <p style={{ fontSize: "12px" }}>Choose from presets, build a custom scenario, or compare multiple scenarios side by side.</p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: "32px", animation: "pulse 1.2s infinite", marginBottom: "16px" }}>🧠</div>
              <div style={{ fontSize: "13px", color: T.muted, letterSpacing: "0.1em" }}>Running scenario analysis…</div>
            </div>
          )}

          {analysis && selectedScenario && !compareResults && (
            <div style={{ animation: "fadeUp 0.4s ease both" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: CAT_COLOR[selectedScenario.category] || "#666", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "3px" }}>{selectedScenario.category} Scenario</div>
                  <div style={{ fontSize: "18px", color: T.text, fontWeight: "bold", marginBottom: "4px" }}>{selectedScenario.title}</div>
                  <div style={{ fontSize: "12px", color: T.muted }}>{analysis.headline_impact}</div>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <div style={{ background: impactColor + "22", border: `1px solid ${impactColor}44`, borderRadius: "4px", padding: "8px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: "9px", color: T.muted, textTransform: "uppercase" }}>Overall Impact</div>
                    <div style={{ fontSize: "13px", fontWeight: "bold", color: impactColor, textTransform: "capitalize" }}>{analysis.overall_impact}</div>
                  </div>
                  <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "8px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: "9px", color: T.muted, textTransform: "uppercase" }}>Probability</div>
                    <div style={{ fontSize: "13px", fontWeight: "bold", color: T.text }}>{analysis.probability}</div>
                  </div>
                  <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "8px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: "9px", color: T.muted, textTransform: "uppercase" }}>Timeline</div>
                    <div style={{ fontSize: "13px", fontWeight: "bold", color: T.text }}>{analysis.timeframe}</div>
                  </div>
                  <button onClick={saveCurrentScenario} style={{ background: "#4caf50", color: "#000", border: "none", borderRadius: "4px", padding: "8px 14px", fontSize: "11px", fontWeight: "bold" }}>💾 Save</button>
                </div>
              </div>

              {/* Impact bars */}
              {analysis.impact_bars && (
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "14px 16px", marginBottom: "14px" }}>
                  <div style={{ fontSize: "10px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>📊 Financial Impact</div>
                  {analysis.impact_bars.map((bar, i) => (
                    <div key={i} style={{ marginBottom: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <div>
                          <span style={{ fontSize: "12px", color: T.text }}>{bar.metric}</span>
                          {bar.notes && <span style={{ fontSize: "10px", color: T.muted, marginLeft: "8px" }}>{bar.notes}</span>}
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: "bold", color: parseFloat(bar.value) >= 0 ? "#4caf50" : "#ef5350" }}>
                          {parseFloat(bar.value) > 0 ? "+" : ""}{bar.value} {bar.unit}
                        </span>
                      </div>
                      <div style={{ background: T.border, borderRadius: "3px", height: "6px", overflow: "hidden" }}>
                        <div style={{ background: parseFloat(bar.value) >= 0 ? "#4caf50" : "#ef5350", width: `${Math.min(Math.abs(parseFloat(bar.value) || 0) * 2, 100)}%`, height: "100%", borderRadius: "3px", transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cases */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "14px" }}>
                {[["Best Case", analysis.best_case, "#4caf50"], ["Base Case", analysis.base_case, "#ff8c00"], ["Worst Case", analysis.worst_case, "#ef5350"]].map(([label, content, color]) => (
                  <div key={label} style={{ background: T.bg, border: `1px solid ${color}33`, borderTop: `3px solid ${color}`, borderRadius: "4px", padding: "12px" }}>
                    <div style={{ fontSize: "10px", color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>{label}</div>
                    <div style={{ fontSize: "11px", color: T.muted, lineHeight: 1.5 }}>{content}</div>
                  </div>
                ))}
              </div>

              {/* Risks & Opportunities */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "12px" }}>
                  <div style={{ fontSize: "10px", color: "#ef5350", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>⚠️ Risks</div>
                  {analysis.risks?.map((r, i) => (
                    <div key={i} style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: i < analysis.risks.length - 1 ? `1px solid ${T.border}` : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                        <div style={{ fontSize: "12px", color: T.text, fontWeight: "bold" }}>{r.title}</div>
                        <span style={{ fontSize: "9px", padding: "1px 6px", background: PRIORITY_COLOR[r.severity] + "22", color: PRIORITY_COLOR[r.severity], borderRadius: "10px" }}>{r.severity}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: T.muted, marginBottom: "3px" }}>{r.description}</div>
                      <div style={{ fontSize: "10px", color: "#2196f3" }}>Mitigation: {r.mitigation}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "12px" }}>
                  <div style={{ fontSize: "10px", color: "#4caf50", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>🚀 Opportunities</div>
                  {analysis.opportunities?.map((o, i) => (
                    <div key={i} style={{ marginBottom: "10px" }}>
                      <div style={{ fontSize: "12px", color: T.text, fontWeight: "bold", marginBottom: "3px" }}>{o.title}</div>
                      <div style={{ fontSize: "11px", color: T.muted, marginBottom: "3px" }}>{o.description}</div>
                      <div style={{ fontSize: "10px", color: "#4caf50" }}>Potential: {o.potential}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategic response */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: "3px solid #9c27b0", borderRadius: "4px", padding: "14px 16px", marginBottom: "12px" }}>
                <div style={{ fontSize: "10px", color: "#9c27b0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>🎯 Strategic Response</div>
                <p style={{ fontSize: "13px", color: T.text, lineHeight: 1.75, whiteSpace: "pre-line" }}>{analysis.strategic_response}</p>
              </div>

              {/* Immediate actions */}
              <div style={{ background: "#ff8c0010", border: "1px solid #ff8c0033", borderLeft: "3px solid #ff8c00", borderRadius: "4px", padding: "14px 16px", marginBottom: "12px" }}>
                <div style={{ fontSize: "10px", color: "#ff8c00", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>⚡ Immediate CFO Actions</div>
                {analysis.immediate_actions?.map((action, i) => (
                  <div key={i} style={{ fontSize: "12px", color: T.text, marginBottom: "6px", paddingLeft: "10px", borderLeft: "2px solid #ff8c00" }}>{i + 1}. {action}</div>
                ))}
              </div>

              {/* Board message */}
              <div style={{ background: "#2196f310", border: "1px solid #2196f333", borderRadius: "4px", padding: "14px 16px" }}>
                <div style={{ fontSize: "10px", color: "#2196f3", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>🎤 Board Message</div>
                <p style={{ fontSize: "13px", color: T.text, lineHeight: 1.7, fontStyle: "italic" }}>"{analysis.board_message}"</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const PRIORITY_COLOR = { high: "#ef5350", medium: "#ff8c00", low: "#4caf50" };
