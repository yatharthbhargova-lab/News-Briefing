import { useState, useEffect, useRef } from "react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseJSON(text) {
  let clean = text.trim().replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(clean); } catch {}
  const s = clean.indexOf("["), e = clean.lastIndexOf("]");
  if (s !== -1 && e !== -1) { try { return JSON.parse(clean.slice(s, e + 1)); } catch {} }
  const os = clean.indexOf("{"), oe = clean.lastIndexOf("}");
  if (os !== -1 && oe !== -1) { try { return JSON.parse(clean.slice(os, oe + 1)); } catch {} }
  return null;
}

async function callClaude(prompt, system, maxTokens = 2000) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system: system || "You are a senior healthcare financial analyst. Return only raw JSON. No markdown fences.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content.map(b => b.text || "").join("");
}

const COMPANIES = [
  "Apollo 247", "Practo", "Netmeds", "PharmEasy", "Medlife", "Medkart",
  "CVS Health", "Walgreens", "Amazon Pharmacy", "Hims & Hers", "GoodRx",
  "Boots UK", "DocMorris", "Ping An Health", "Halodoc",
  "Thyrocare", "Dr Lal PathLabs", "Metropolis", "Redcliffe Labs", "Quest Diagnostics", "LabCorp",
];

// ── Sub-components ───────────────────────────────────────────────────────────

// 1. SWOT Generator
function SWOTGenerator({ T }) {
  const [company, setCompany] = useState("PharmEasy");
  const [custom, setCustom] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    const target = custom || company;
    setLoading(true); setData(null);
    try {
      const text = await callClaude(
        `Generate a comprehensive SWOT analysis for ${target} vs TATA 1MG in the Indian healthcare market.

Return JSON:
{
  "company": "${target}",
  "strengths": [{"point":"","detail":"","impact":"high|medium|low"}],
  "weaknesses": [{"point":"","detail":"","impact":"high|medium|low"}],
  "opportunities": [{"point":"","detail":"","impact":"high|medium|low"}],
  "threats": [{"point":"","detail":"","impact":"high|medium|low"}],
  "vs_1mg": {
    "1mg_advantage": "where TATA 1MG has clear advantage",
    "1mg_vulnerability": "where TATA 1MG is most vulnerable",
    "strategic_recommendation": "2 sentence action recommendation for TATA 1MG CFO"
  },
  "overall_threat_score": "1-10 number",
  "summary": "2 sentence executive summary"
}
Return ONLY JSON.`,
        "You are a McKinsey-level healthcare strategy analyst. Be specific, data-driven, and insightful. Return only raw JSON."
      );
      const parsed = parseJSON(text);
      if (parsed) setData(parsed);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const quadrants = [
    { key: "strengths", label: "Strengths", color: "#4caf50", icon: "✅" },
    { key: "weaknesses", label: "Weaknesses", color: "#ef5350", icon: "⚠️" },
    { key: "opportunities", label: "Opportunities", color: "#2196f3", icon: "🚀" },
    { key: "threats", label: "Threats", color: "#ff8c00", icon: "🔥" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        <select value={company} onChange={e => setCompany(e.target.value)}
          style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "8px 12px", borderRadius: "4px", fontSize: "12px", fontFamily: "Georgia, serif" }}>
          {COMPANIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input type="text" placeholder="Or type any company..." value={custom} onChange={e => setCustom(e.target.value)}
          style={{ flex: 1, minWidth: "160px", background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "8px 12px", borderRadius: "4px", fontSize: "12px", fontFamily: "Georgia, serif", outline: "none" }} />
        <button onClick={generate} disabled={loading}
          style={{ background: loading ? T.border : "#4caf50", color: loading ? T.muted : "#000", border: "none", borderRadius: "4px", padding: "8px 18px", fontSize: "12px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Generating…" : "Generate SWOT"}
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: "40px", color: T.muted, fontSize: "13px" }}>🧠 Analysing competitive position…</div>}

      {data && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <div style={{ fontSize: "16px", color: T.text, fontWeight: "bold" }}>{data.company} — SWOT vs TATA 1MG</div>
              <div style={{ fontSize: "12px", color: T.muted, fontStyle: "italic", marginTop: "2px" }}>{data.summary}</div>
            </div>
            <div style={{ background: parseInt(data.overall_threat_score) > 7 ? "#ef535022" : parseInt(data.overall_threat_score) > 4 ? "#ff8c0022" : "#4caf5022", border: `1px solid ${parseInt(data.overall_threat_score) > 7 ? "#ef5350" : parseInt(data.overall_threat_score) > 4 ? "#ff8c00" : "#4caf50"}`, borderRadius: "4px", padding: "8px 16px", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Threat Score</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: parseInt(data.overall_threat_score) > 7 ? "#ef5350" : parseInt(data.overall_threat_score) > 4 ? "#ff8c00" : "#4caf50" }}>{data.overall_threat_score}/10</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
            {quadrants.map(q => (
              <div key={q.key} style={{ background: T.bg, border: `1px solid ${q.color}33`, borderTop: `3px solid ${q.color}`, borderRadius: "4px", padding: "12px" }}>
                <div style={{ fontSize: "11px", color: q.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>{q.icon} {q.label}</div>
                {data[q.key]?.map((item, i) => (
                  <div key={i} style={{ marginBottom: "8px", paddingLeft: "8px", borderLeft: `2px solid ${q.color}${item.impact === "high" ? "ff" : item.impact === "medium" ? "99" : "44"}` }}>
                    <div style={{ fontSize: "12px", color: T.text, fontWeight: "bold", marginBottom: "2px" }}>{item.point}</div>
                    <div style={{ fontSize: "11px", color: T.muted }}>{item.detail}</div>
                    <span style={{ fontSize: "9px", padding: "1px 5px", background: `${q.color}22`, color: q.color, borderRadius: "10px", marginTop: "3px", display: "inline-block" }}>{item.impact} impact</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {data.vs_1mg && (
            <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderLeft: "3px solid #ff8c00", borderRadius: "4px", padding: "12px 14px" }}>
              <div style={{ fontSize: "10px", color: "#ff8c00", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>🔵 TATA 1MG Strategic Position</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <div><div style={{ fontSize: "10px", color: "#4caf50", marginBottom: "4px" }}>Our Advantage</div><div style={{ fontSize: "12px", color: T.text }}>{data.vs_1mg["1mg_advantage"]}</div></div>
                <div><div style={{ fontSize: "10px", color: "#ef5350", marginBottom: "4px" }}>Our Vulnerability</div><div style={{ fontSize: "12px", color: T.text }}>{data.vs_1mg["1mg_vulnerability"]}</div></div>
              </div>
              <div style={{ fontSize: "12px", color: T.text, lineHeight: 1.6, background: "#ff8c0010", padding: "10px", borderRadius: "4px" }}>
                💡 <b>CFO Action:</b> {data.vs_1mg.strategic_recommendation}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// 2. Market Map
function MarketMap({ T }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [xAxis, setXAxis] = useState("YoY Growth %");
  const [yAxis, setYAxis] = useState("GMV (INR Cr)");
  const [tooltip, setTooltip] = useState(null);

  async function generate() {
    setLoading(true); setData(null);
    try {
      const text = await callClaude(
        `Create a competitive market map for Indian and global healthcare/pharmacy companies including TATA 1MG.

Return a JSON array of companies positioned on axes of "${xAxis}" (x-axis) and "${yAxis}" (y-axis):
[{
  "name": "company name",
  "x": numeric value for ${xAxis},
  "y": numeric value for ${yAxis},
  "region": "India|USA|Europe|Asia",
  "color": "hex color",
  "size": "large|medium|small based on market significance",
  "is_1mg": true or false,
  "label": "short 2-3 word descriptor",
  "funding_stage": "Listed|Series D|Series C|Series B|Bootstrapped"
}]
Include: TATA 1MG, PharmEasy, Apollo 247, Practo, Netmeds, CVS Health, Walgreens, Hims & Hers, GoodRx, Boots UK, Thyrocare, Dr Lal PathLabs, Quest Diagnostics.
Use realistic approximate values. Return ONLY the JSON array.`,
        "You are a healthcare market analyst. Return only raw JSON array."
      );
      const parsed = parseJSON(text);
      if (Array.isArray(parsed)) setData(parsed);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const W = 560, H = 360, PAD = 50;

  const plotData = data ? (() => {
    const xs = data.map(d => d.x), ys = data.map(d => d.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    return data.map(d => ({
      ...d,
      px: PAD + ((d.x - minX) / (maxX - minX || 1)) * (W - PAD * 2),
      py: H - PAD - ((d.y - minY) / (maxY - minY || 1)) * (H - PAD * 2),
      r: d.size === "large" ? 18 : d.size === "medium" ? 13 : 9,
    }));
  })() : [];

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ fontSize: "11px", color: T.muted }}>X axis:</div>
        <select value={xAxis} onChange={e => setXAxis(e.target.value)}
          style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "6px 10px", borderRadius: "4px", fontSize: "11px", fontFamily: "Georgia, serif" }}>
          {["YoY Growth %", "CAC (INR)", "LTV:CAC Ratio", "Take Rate %", "Contribution Margin %"].map(o => <option key={o}>{o}</option>)}
        </select>
        <div style={{ fontSize: "11px", color: T.muted }}>Y axis:</div>
        <select value={yAxis} onChange={e => setYAxis(e.target.value)}
          style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "6px 10px", borderRadius: "4px", fontSize: "11px", fontFamily: "Georgia, serif" }}>
          {["GMV (INR Cr)", "Valuation (INR Cr)", "Revenue (INR Cr)", "LTV (INR)", "Burn Rate (INR Cr/mo)"].map(o => <option key={o}>{o}</option>)}
        </select>
        <button onClick={generate} disabled={loading}
          style={{ background: loading ? T.border : "#9c27b0", color: loading ? T.muted : "#fff", border: "none", borderRadius: "4px", padding: "7px 16px", fontSize: "11px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold" }}>
          {loading ? "Mapping…" : "Generate Map"}
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: "40px", color: T.muted }}>🗺️ Building market map…</div>}

      {plotData.length > 0 && (
        <div style={{ position: "relative", overflowX: "auto" }}>
          <svg width={W} height={H} style={{ background: T.bg, borderRadius: "4px", border: `1px solid ${T.border}` }}>
            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map(f => (
              <g key={f}>
                <line x1={PAD + f * (W - PAD * 2)} y1={PAD} x2={PAD + f * (W - PAD * 2)} y2={H - PAD} stroke={T.border} strokeWidth="1" strokeDasharray="4" />
                <line x1={PAD} y1={PAD + f * (H - PAD * 2)} x2={W - PAD} y2={PAD + f * (H - PAD * 2)} stroke={T.border} strokeWidth="1" strokeDasharray="4" />
              </g>
            ))}
            {/* Axes */}
            <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke={T.muted} strokeWidth="1" />
            <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke={T.muted} strokeWidth="1" />
            {/* Axis labels */}
            <text x={W / 2} y={H - 8} textAnchor="middle" fill={T.muted} fontSize="10">{xAxis}</text>
            <text x={12} y={H / 2} textAnchor="middle" fill={T.muted} fontSize="10" transform={`rotate(-90, 12, ${H / 2})`}>{yAxis}</text>
            {/* Quadrant labels */}
            <text x={PAD + 8} y={PAD + 14} fill={T.muted} fontSize="9" opacity="0.5">Low/Low</text>
            <text x={W - PAD - 8} y={PAD + 14} textAnchor="end" fill={T.muted} fontSize="9" opacity="0.5">High/Low</text>
            <text x={PAD + 8} y={H - PAD - 6} fill={T.muted} fontSize="9" opacity="0.5">Low/High</text>
            <text x={W - PAD - 8} y={H - PAD - 6} textAnchor="end" fill="#4caf50" fontSize="9" opacity="0.7">⭐ Leaders</text>
            {/* Company dots */}
            {plotData.map((d, i) => (
              <g key={i} onMouseEnter={() => setTooltip(d)} onMouseLeave={() => setTooltip(null)} style={{ cursor: "pointer" }}>
                <circle cx={d.px} cy={d.py} r={d.r} fill={d.is_1mg ? "#ff8c00" : d.color || "#666"} opacity={0.85} stroke={d.is_1mg ? "#fff" : "none"} strokeWidth={d.is_1mg ? 2 : 0} />
                {(d.is_1mg || d.size === "large") && (
                  <text x={d.px} y={d.py - d.r - 3} textAnchor="middle" fill={d.is_1mg ? "#ff8c00" : T.muted} fontSize="9" fontWeight={d.is_1mg ? "bold" : "normal"}>
                    {d.name.length > 10 ? d.name.slice(0, 10) + "…" : d.name}
                  </text>
                )}
              </g>
            ))}
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div style={{ position: "absolute", top: "10px", right: "10px", background: T.surface, border: `1px solid ${tooltip.color || T.border}`, borderRadius: "4px", padding: "10px 14px", fontSize: "12px", pointerEvents: "none", maxWidth: "180px" }}>
              <div style={{ fontWeight: "bold", color: tooltip.is_1mg ? "#ff8c00" : tooltip.color, marginBottom: "4px" }}>{tooltip.name}</div>
              <div style={{ color: T.muted, fontSize: "11px" }}>{tooltip.region} · {tooltip.funding_stage}</div>
              <div style={{ color: T.text, marginTop: "4px" }}>{xAxis}: <b>{tooltip.x}</b></div>
              <div style={{ color: T.text }}>{yAxis}: <b>{tooltip.y}</b></div>
              <div style={{ color: T.muted, fontSize: "10px", marginTop: "3px", fontStyle: "italic" }}>{tooltip.label}</div>
            </div>
          )}

          {/* Legend */}
          <div style={{ display: "flex", gap: "12px", marginTop: "10px", flexWrap: "wrap" }}>
            {[...new Set(plotData.map(d => d.region))].map(r => {
              const comp = plotData.find(d => d.region === r);
              return <div key={r} style={{ display: "flex", gap: "5px", alignItems: "center", fontSize: "10px", color: T.muted }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: comp?.color || "#666" }} /> {r}
              </div>;
            })}
            <div style={{ display: "flex", gap: "5px", alignItems: "center", fontSize: "10px", color: "#ff8c00" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff8c00", border: "2px solid white" }} /> TATA 1MG
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 3. M&A & Funding Tracker
function MATracker({ T }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");

  async function fetch() {
    setLoading(true); setData(null);
    try {
      const text = await callClaude(
        `List the most recent and significant M&A deals, funding rounds, and strategic investments in Indian and global healthcare/pharmacy/diagnostics from the last 18 months.

Return a JSON array of 15 deals:
[{
  "date": "MMM YYYY",
  "type": "Funding|Acquisition|Merger|IPO|Strategic Investment",
  "company": "target company",
  "acquirer_investor": "who acquired or invested",
  "amount_orig": "deal value in original currency",
  "amount_inr": "in INR Cr",
  "region": "India|USA|Europe|Asia|Global",
  "stage": "Seed|Series A|Series B|Series C|Series D|Series E|Pre-IPO|IPO|M&A",
  "strategic_rationale": "1 sentence why this deal happened",
  "impact_on_1mg": "1 sentence how this affects TATA 1MG competitive position",
  "significance": "high|medium|low"
}]
Include deals involving PharmEasy, Practo, Apollo, Thyrocare, CVS, Walgreens, and others. Use FX: USD=84, GBP=107. Return ONLY JSON array.`,
        "You are a healthcare M&A analyst with knowledge of recent deals. Return only raw JSON array."
      );
      const parsed = parseJSON(text);
      if (Array.isArray(parsed)) setData(parsed);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const filtered = data ? (filter === "All" ? data : data.filter(d => d.type === filter || d.region === filter)) : [];
  const types = ["All", "Funding", "Acquisition", "Merger", "IPO", "Strategic Investment"];

  const typeColor = t => ({ Funding: "#4caf50", Acquisition: "#ef5350", Merger: "#9c27b0", IPO: "#ff8c00", "Strategic Investment": "#2196f3" }[t] || "#666");

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap", alignItems: "center" }}>
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{ background: filter === t ? typeColor(t) : "none", color: filter === t ? "#fff" : T.muted, border: `1px solid ${filter === t ? typeColor(t) : T.border}`, padding: "5px 12px", borderRadius: "20px", fontSize: "11px", cursor: "pointer" }}>{t}</button>
        ))}
        <button onClick={fetch} disabled={loading} style={{ background: loading ? T.border : "#ef5350", color: loading ? T.muted : "#fff", border: "none", borderRadius: "4px", padding: "6px 16px", fontSize: "11px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold", marginLeft: "auto" }}>
          {loading ? "Loading…" : data ? "↻ Refresh" : "Load Deals"}
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: "40px", color: T.muted }}>💼 Fetching M&A and funding data…</div>}

      {filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map((deal, i) => (
            <div key={i} style={{ background: T.bg, border: `1px solid ${T.border}`, borderLeft: `3px solid ${typeColor(deal.type)}`, borderRadius: "4px", padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "6px", marginBottom: "6px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "10px", padding: "2px 8px", background: typeColor(deal.type) + "22", color: typeColor(deal.type), borderRadius: "10px", fontWeight: "bold" }}>{deal.type}</span>
                  <span style={{ fontSize: "10px", color: T.muted }}>{deal.date}</span>
                  <span style={{ fontSize: "10px", padding: "2px 6px", border: `1px solid ${T.border}`, borderRadius: "10px", color: T.muted }}>{deal.region}</span>
                  {deal.significance === "high" && <span style={{ fontSize: "9px", color: "#ef5350" }}>🔴 High significance</span>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "14px", color: typeColor(deal.type), fontWeight: "bold" }}>{deal.amount_orig}</div>
                  {deal.amount_inr && deal.amount_inr !== deal.amount_orig && <div style={{ fontSize: "10px", color: T.muted }}>≈ ₹{deal.amount_inr}</div>}
                </div>
              </div>
              <div style={{ fontSize: "13px", color: T.text, marginBottom: "4px" }}>
                <b>{deal.company}</b> {deal.acquirer_investor ? `← ${deal.acquirer_investor}` : ""} <span style={{ fontSize: "10px", color: T.muted }}>({deal.stage})</span>
              </div>
              <div style={{ fontSize: "11px", color: T.muted, marginBottom: "4px" }}>{deal.strategic_rationale}</div>
              <div style={{ fontSize: "11px", color: "#ff8c00", fontStyle: "italic" }}>Impact on 1MG: {deal.impact_on_1mg}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 4. Earnings Transcript Summaries
function EarningsTranscripts({ T }) {
  const [company, setCompany] = useState("Dr Lal PathLabs");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const listedCos = ["Dr Lal PathLabs", "Thyrocare", "Metropolis", "Apollo Hospitals", "CVS Health", "Walgreens", "Quest Diagnostics", "LabCorp", "Hims & Hers", "GoodRx"];

  async function fetch() {
    setLoading(true); setData(null);
    try {
      const text = await callClaude(
        `Summarise the most recent earnings call/quarterly results for ${company}. Extract key insights a healthcare CFO would care about.

Return JSON:
{
  "company": "${company}",
  "quarter": "e.g. Q3 FY24",
  "date": "approximate date",
  "revenue": "reported revenue with currency",
  "revenue_growth": "%",
  "ebitda": "reported EBITDA",
  "ebitda_margin": "%",
  "net_profit": "reported",
  "guidance": "management guidance for next quarter/year",
  "key_highlights": ["highlight 1", "highlight 2", "highlight 3", "highlight 4"],
  "management_quotes": ["key quote 1 paraphrased", "key quote 2 paraphrased"],
  "analyst_concerns": ["concern raised by analysts 1", "concern 2"],
  "strategic_initiatives": ["initiative 1", "initiative 2", "initiative 3"],
  "unit_economics_update": "any update on CAC, LTV, order economics mentioned",
  "competitive_mentions": "any competitors mentioned by management",
  "1mg_implications": "2 sentences on what this means for TATA 1MG strategy",
  "sentiment": "positive|neutral|negative",
  "beat_miss": "Beat|Miss|In-line"
}
Return ONLY JSON.`,
        "You are a sell-side healthcare analyst. Return only raw JSON. Use latest available quarterly data."
      );
      const parsed = parseJSON(text);
      if (parsed) setData(parsed);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const sentColor = s => s === "positive" ? "#4caf50" : s === "negative" ? "#ef5350" : "#ff8c00";

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
        <select value={company} onChange={e => setCompany(e.target.value)}
          style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "8px 12px", borderRadius: "4px", fontSize: "12px", fontFamily: "Georgia, serif" }}>
          {listedCos.map(c => <option key={c}>{c}</option>)}
        </select>
        <button onClick={fetch} disabled={loading}
          style={{ background: loading ? T.border : "#2196f3", color: loading ? T.muted : "#fff", border: "none", borderRadius: "4px", padding: "8px 18px", fontSize: "12px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold" }}>
          {loading ? "Loading…" : "Get Earnings Summary"}
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: "40px", color: T.muted }}>📊 Summarising latest earnings call…</div>}

      {data && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "16px", color: T.text, fontWeight: "bold" }}>{data.company} — {data.quarter}</div>
              <div style={{ fontSize: "11px", color: T.muted }}>{data.date}</div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ background: sentColor(data.sentiment) + "22", border: `1px solid ${sentColor(data.sentiment)}44`, borderRadius: "4px", padding: "6px 12px", textAlign: "center" }}>
                <div style={{ fontSize: "9px", color: T.muted }}>Sentiment</div>
                <div style={{ fontSize: "12px", color: sentColor(data.sentiment), fontWeight: "bold", textTransform: "capitalize" }}>{data.sentiment}</div>
              </div>
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "6px 12px", textAlign: "center" }}>
                <div style={{ fontSize: "9px", color: T.muted }}>vs Estimates</div>
                <div style={{ fontSize: "12px", color: data.beat_miss === "Beat" ? "#4caf50" : data.beat_miss === "Miss" ? "#ef5350" : T.muted, fontWeight: "bold" }}>{data.beat_miss}</div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: "8px", marginBottom: "14px" }}>
            {[["Revenue", data.revenue], ["Growth", data.revenue_growth], ["EBITDA", data.ebitda], ["EBITDA Margin", data.ebitda_margin], ["Net Profit", data.net_profit]].map(([k, v]) => (
              <div key={k} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "10px" }}>
                <div style={{ fontSize: "9px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{k}</div>
                <div style={{ fontSize: "14px", color: "#2196f3", fontWeight: "bold" }}>{v || "—"}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
            <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "12px" }}>
              <div style={{ fontSize: "10px", color: "#4caf50", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>✅ Key Highlights</div>
              {data.key_highlights?.map((h, i) => <div key={i} style={{ fontSize: "11px", color: T.text, marginBottom: "5px", paddingLeft: "8px", borderLeft: "2px solid #4caf50" }}>{h}</div>)}
            </div>
            <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "12px" }}>
              <div style={{ fontSize: "10px", color: "#ff8c00", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>🎯 Strategic Initiatives</div>
              {data.strategic_initiatives?.map((s, i) => <div key={i} style={{ fontSize: "11px", color: T.text, marginBottom: "5px", paddingLeft: "8px", borderLeft: "2px solid #ff8c00" }}>{s}</div>)}
            </div>
            <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "12px" }}>
              <div style={{ fontSize: "10px", color: "#9c27b0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>🎤 Management Tone</div>
              {data.management_quotes?.map((q, i) => <div key={i} style={{ fontSize: "11px", color: T.muted, fontStyle: "italic", marginBottom: "5px" }}>"{q}"</div>)}
            </div>
            <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "12px" }}>
              <div style={{ fontSize: "10px", color: "#ef5350", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>⚠️ Analyst Concerns</div>
              {data.analyst_concerns?.map((c, i) => <div key={i} style={{ fontSize: "11px", color: T.text, marginBottom: "5px", paddingLeft: "8px", borderLeft: "2px solid #ef5350" }}>{c}</div>)}
            </div>
          </div>

          <div style={{ background: "#ff8c0010", border: "1px solid #ff8c0033", borderLeft: "3px solid #ff8c00", borderRadius: "4px", padding: "12px 14px" }}>
            <div style={{ fontSize: "10px", color: "#ff8c00", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>💡 Implications for TATA 1MG</div>
            <div style={{ fontSize: "12px", color: T.text, lineHeight: 1.65 }}>{data["1mg_implications"]}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// 5. Regulatory Tracker
function RegulatoryTracker({ T }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState("India");

  async function fetch() {
    setLoading(true); setData(null);
    try {
      const text = await callClaude(
        `List the most recent and important regulatory developments in ${region} healthcare, pharmacy, and diagnostics sector from the last 12 months.

Return a JSON array of 10 regulatory updates:
[{
  "date": "MMM YYYY",
  "regulator": "e.g. CDSCO, IRDAI, MoHFW, FDA, EMA",
  "title": "regulation title max 10 words",
  "description": "2 sentences explaining the regulation",
  "category": "Drug Pricing|Licensing|Digital Health|Insurance|Diagnostics|Pharmacy|Data Privacy|Import/Export",
  "impact": "positive|negative|neutral for online pharmacy/diagnostics",
  "impact_on_1mg": "1 sentence specific impact on TATA 1MG",
  "action_required": "yes|no",
  "action_detail": "what action TATA 1MG should take or N/A",
  "urgency": "immediate|3 months|6 months|monitoring"
}]
Focus on regulations relevant to digital health, online pharmacy, diagnostics, teleconsultation. Return ONLY JSON array.`,
        "You are a healthcare regulatory affairs expert. Return only raw JSON array."
      );
      const parsed = parseJSON(text);
      if (Array.isArray(parsed)) setData(parsed);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const impactColor = i => i === "positive" ? "#4caf50" : i === "negative" ? "#ef5350" : "#ff8c00";
  const urgencyColor = u => u === "immediate" ? "#ef5350" : u === "3 months" ? "#ff8c00" : "#2196f3";

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
        {["India", "USA", "Europe", "Global"].map(r => (
          <button key={r} onClick={() => setRegion(r)} style={{ background: region === r ? "#ff8c00" : "none", color: region === r ? "#000" : T.muted, border: `1px solid ${region === r ? "#ff8c00" : T.border}`, padding: "5px 14px", borderRadius: "20px", fontSize: "11px", cursor: "pointer" }}>{r}</button>
        ))}
        <button onClick={fetch} disabled={loading} style={{ background: loading ? T.border : "#ff8c00", color: loading ? T.muted : "#000", border: "none", borderRadius: "4px", padding: "6px 16px", fontSize: "11px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold", marginLeft: "auto" }}>
          {loading ? "Loading…" : data ? "↻ Refresh" : "Load Regulations"}
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: "40px", color: T.muted }}>⚖️ Fetching regulatory updates…</div>}

      {data && data.map((reg, i) => (
        <div key={i} style={{ background: T.bg, border: `1px solid ${T.border}`, borderLeft: `3px solid ${impactColor(reg.impact)}`, borderRadius: "4px", padding: "12px 14px", marginBottom: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "6px", marginBottom: "6px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "10px", color: "#9c27b0", fontWeight: "bold" }}>{reg.regulator}</span>
              <span style={{ fontSize: "10px", padding: "1px 6px", background: T.border, borderRadius: "10px", color: T.muted }}>{reg.category}</span>
              <span style={{ fontSize: "10px", color: T.muted }}>{reg.date}</span>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {reg.action_required === "yes" && (
                <span style={{ fontSize: "10px", padding: "2px 8px", background: urgencyColor(reg.urgency) + "22", color: urgencyColor(reg.urgency), borderRadius: "10px", border: `1px solid ${urgencyColor(reg.urgency)}44` }}>
                  ⚡ Action: {reg.urgency}
                </span>
              )}
            </div>
          </div>
          <div style={{ fontSize: "13px", color: T.text, fontWeight: "bold", marginBottom: "4px" }}>{reg.title}</div>
          <div style={{ fontSize: "11px", color: T.muted, marginBottom: "6px" }}>{reg.description}</div>
          <div style={{ fontSize: "11px", color: "#ff8c00", fontStyle: "italic", marginBottom: reg.action_detail && reg.action_detail !== "N/A" ? "4px" : "0" }}>
            Impact on 1MG: {reg.impact_on_1mg}
          </div>
          {reg.action_detail && reg.action_detail !== "N/A" && (
            <div style={{ fontSize: "11px", color: "#2196f3", background: "#2196f310", padding: "6px 10px", borderRadius: "3px" }}>
              📋 Action Required: {reg.action_detail}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// 6. Investor Intelligence
function InvestorIntelligence({ T }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetch() {
    setLoading(true); setData(null);
    try {
      const text = await callClaude(
        `Map the investor landscape for Indian and global healthcare/pharmacy/diagnostics startups and companies. Focus on who is backing TATA 1MG's competitors.

Return JSON:
{
  "key_investors": [{
    "name": "investor name",
    "type": "VC|PE|Strategic|SWF|Corporate",
    "portfolio_companies": ["company1", "company2"],
    "total_deployed": "approximate amount in USD",
    "thesis": "1 sentence investment thesis in healthcare",
    "notable_exits": ["exit 1"],
    "threat_to_1mg": "1 sentence"
  }],
  "funding_map": [{
    "company": "competitor name",
    "total_raised": "USD amount",
    "total_raised_inr": "INR Cr",
    "key_investors": ["investor1", "investor2"],
    "latest_round": "type and amount",
    "valuation": "USD",
    "runway_concern": "yes|no"
  }],
  "white_spaces": ["funding opportunity or gap 1", "gap 2"],
  "1mg_investor_recommendation": "2 sentences on strategic investors TATA 1MG should target"
}
Return ONLY JSON.`,
        "You are a healthcare venture capital analyst. Return only raw JSON."
      );
      const parsed = parseJSON(text);
      if (parsed) setData(parsed);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  return (
    <div>
      <button onClick={fetch} disabled={loading} style={{ background: loading ? T.border : "#7b1fa2", color: loading ? T.muted : "#fff", border: "none", borderRadius: "4px", padding: "8px 18px", fontSize: "12px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold", marginBottom: "14px" }}>
        {loading ? "Loading…" : data ? "↻ Refresh" : "Load Investor Map"}
      </button>

      {loading && <div style={{ textAlign: "center", padding: "40px", color: T.muted }}>💰 Mapping investor landscape…</div>}

      {data && (
        <>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "10px", color: "#7b1fa2", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Key Healthcare Investors</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: "8px" }}>
              {data.key_investors?.map((inv, i) => (
                <div key={i} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={{ fontSize: "13px", color: T.text, fontWeight: "bold" }}>{inv.name}</div>
                    <span style={{ fontSize: "10px", padding: "2px 6px", background: "#7b1fa222", color: "#7b1fa2", borderRadius: "10px" }}>{inv.type}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: T.muted, marginBottom: "5px" }}>{inv.thesis}</div>
                  <div style={{ fontSize: "10px", color: "#4caf50", marginBottom: "5px" }}>💰 Deployed: {inv.total_deployed}</div>
                  <div style={{ fontSize: "10px", color: T.muted }}>Portfolio: {inv.portfolio_companies?.join(", ")}</div>
                  <div style={{ fontSize: "10px", color: "#ef5350", marginTop: "5px", fontStyle: "italic" }}>{inv.threat_to_1mg}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "10px", color: "#7b1fa2", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Competitor Funding Map</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "11px" }}>
                <thead><tr style={{ background: T.bg }}>
                  {["Company", "Total Raised", "INR Cr", "Latest Round", "Valuation", "Key Investors", "Runway Risk"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, fontSize: "9px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {data.funding_map?.map((co, i) => (
                    <tr key={i}>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, fontWeight: "bold", color: T.text }}>{co.company}</td>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: "#4caf50" }}>{co.total_raised}</td>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: T.muted }}>{co.total_raised_inr}</td>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}` }}>{co.latest_round}</td>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}` }}>{co.valuation}</td>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: T.muted, fontSize: "10px" }}>{co.key_investors?.join(", ")}</td>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: co.runway_concern === "yes" ? "#ef5350" : "#4caf50" }}>{co.runway_concern === "yes" ? "⚠️ Yes" : "✅ No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: "#7b1fa210", border: "1px solid #7b1fa233", borderLeft: "3px solid #7b1fa2", borderRadius: "4px", padding: "12px 14px" }}>
            <div style={{ fontSize: "10px", color: "#7b1fa2", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>💡 Strategic Investor Recommendation for TATA 1MG</div>
            <div style={{ fontSize: "12px", color: T.text, lineHeight: 1.65 }}>{data["1mg_investor_recommendation"]}</div>
          </div>
        </>
      )}
    </div>
  );
}

// 7. Share of Voice & Brand Tracker
function ShareOfVoice({ T }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetch() {
    setLoading(true); setData(null);
    try {
      const text = await callClaude(
        `Estimate the digital presence and brand share of voice for Indian online pharmacy and health platforms.

Return JSON:
{
  "companies": [{
    "name": "company",
    "app_store_rating_ios": "x.x",
    "app_store_rating_android": "x.x",
    "estimated_monthly_active_users": "number in millions",
    "web_traffic_rank_india": "Alexa/SimilarWeb rank estimate",
    "social_followers_total": "approximate total across platforms in millions",
    "brand_sentiment": "positive|neutral|negative",
    "share_of_voice_pct": "estimated % of category search volume",
    "nps_estimate": "Net Promoter Score estimate",
    "key_brand_strength": "1 sentence"
  }],
  "category_insights": {
    "fastest_growing_brand": "company name",
    "highest_app_rating": "company name",
    "most_searched": "company name",
    "1mg_position": "where TATA 1MG stands overall",
    "1mg_gap": "biggest brand gap to close"
  },
  "recommendations": ["brand recommendation 1", "recommendation 2"]
}
Include: TATA 1MG, PharmEasy, Apollo 247, Practo, Netmeds, MediBuddy. Return ONLY JSON.`,
        "You are a digital brand analyst. Return only raw JSON."
      );
      const parsed = parseJSON(text);
      if (parsed) setData(parsed);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  return (
    <div>
      <button onClick={fetch} disabled={loading} style={{ background: loading ? T.border : "#00838f", color: loading ? T.muted : "#fff", border: "none", borderRadius: "4px", padding: "8px 18px", fontSize: "12px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold", marginBottom: "14px" }}>
        {loading ? "Loading…" : data ? "↻ Refresh" : "Load Brand Data"}
      </button>

      {loading && <div style={{ textAlign: "center", padding: "40px", color: T.muted }}>📊 Analysing share of voice…</div>}

      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "8px", marginBottom: "16px" }}>
            {data.companies?.map((co, i) => {
              const isMe = co.name.toLowerCase().includes("1mg");
              return (
                <div key={i} style={{ background: T.bg, border: `1px solid ${isMe ? "#ff8c00" : T.border}`, borderTop: `3px solid ${isMe ? "#ff8c00" : "#00838f"}`, borderRadius: "4px", padding: "12px" }}>
                  <div style={{ fontSize: "13px", color: isMe ? "#ff8c00" : T.text, fontWeight: "bold", marginBottom: "8px" }}>{isMe ? "🔵 " : ""}{co.name}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "11px" }}>
                    <div><div style={{ fontSize: "9px", color: T.muted }}>iOS Rating</div><div style={{ color: "#4caf50" }}>⭐ {co.app_store_rating_ios}</div></div>
                    <div><div style={{ fontSize: "9px", color: T.muted }}>Android</div><div style={{ color: "#4caf50" }}>⭐ {co.app_store_rating_android}</div></div>
                    <div><div style={{ fontSize: "9px", color: T.muted }}>MAU</div><div style={{ color: T.text }}>{co.estimated_monthly_active_users}M</div></div>
                    <div><div style={{ fontSize: "9px", color: T.muted }}>NPS</div><div style={{ color: T.text }}>{co.nps_estimate}</div></div>
                    <div><div style={{ fontSize: "9px", color: T.muted }}>Share of Voice</div><div style={{ color: "#00838f", fontWeight: "bold" }}>{co.share_of_voice_pct}</div></div>
                    <div><div style={{ fontSize: "9px", color: T.muted }}>Sentiment</div><div style={{ color: co.brand_sentiment === "positive" ? "#4caf50" : co.brand_sentiment === "negative" ? "#ef5350" : "#ff8c00", textTransform: "capitalize" }}>{co.brand_sentiment}</div></div>
                  </div>
                  <div style={{ fontSize: "10px", color: T.muted, marginTop: "8px", fontStyle: "italic" }}>{co.key_brand_strength}</div>
                </div>
              );
            })}
          </div>

          {data.category_insights && (
            <div style={{ background: "#00838f10", border: "1px solid #00838f33", borderRadius: "4px", padding: "12px 14px" }}>
              <div style={{ fontSize: "10px", color: "#00838f", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Category Insights</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "8px", fontSize: "12px" }}>
                {[["Fastest Growing", data.category_insights.fastest_growing_brand], ["Highest App Rating", data.category_insights.highest_app_rating], ["Most Searched", data.category_insights.most_searched]].map(([k, v]) => (
                  <div key={k}><span style={{ color: T.muted }}>{k}: </span><span style={{ color: T.text, fontWeight: "bold" }}>{v}</span></div>
                ))}
              </div>
              <div style={{ fontSize: "12px", color: T.text, marginTop: "8px" }}><b>1MG Position:</b> {data.category_insights["1mg_position"]}</div>
              <div style={{ fontSize: "12px", color: "#ef5350", marginTop: "4px" }}><b>Gap to Close:</b> {data.category_insights["1mg_gap"]}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// 8. Hiring Intelligence
function HiringIntelligence({ T }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetch() {
    setLoading(true); setData(null);
    try {
      const text = await callClaude(
        `Analyse hiring trends and headcount signals for Indian healthcare/pharmacy companies as strategic intelligence.

Return JSON:
{
  "companies": [{
    "name": "company",
    "estimated_headcount": "number",
    "headcount_change_6m": "% change",
    "top_hiring_roles": ["role1", "role2", "role3"],
    "top_hiring_cities": ["city1", "city2"],
    "tech_stack_signals": ["technology being hired for"],
    "strategic_signal": "what hiring pattern signals about strategy",
    "hiring_pace": "aggressive|moderate|slow|layoffs"
  }],
  "market_signals": {
    "hottest_roles_industry": ["role1", "role2", "role3"],
    "salary_benchmark": {"engineering": "range", "data_science": "range", "product": "range"},
    "1mg_talent_risk": "where TATA 1MG is most at risk of losing talent",
    "1mg_hiring_recommendation": "2 sentences on where TATA 1MG should be hiring aggressively"
  }
}
Include: TATA 1MG, PharmEasy, Apollo 247, Practo, Netmeds, Healthians. Return ONLY JSON.`,
        "You are a talent intelligence analyst specialising in Indian healthcare. Return only raw JSON."
      );
      const parsed = parseJSON(text);
      if (parsed) setData(parsed);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const paceColor = p => ({ aggressive: "#4caf50", moderate: "#ff8c00", slow: "#2196f3", layoffs: "#ef5350" }[p] || "#666");

  return (
    <div>
      <button onClick={fetch} disabled={loading} style={{ background: loading ? T.border : "#1565c0", color: loading ? T.muted : "#fff", border: "none", borderRadius: "4px", padding: "8px 18px", fontSize: "12px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold", marginBottom: "14px" }}>
        {loading ? "Loading…" : data ? "↻ Refresh" : "Load Hiring Signals"}
      </button>

      {loading && <div style={{ textAlign: "center", padding: "40px", color: T.muted }}>👥 Analysing hiring patterns…</div>}

      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "8px", marginBottom: "16px" }}>
            {data.companies?.map((co, i) => {
              const isMe = co.name.toLowerCase().includes("1mg");
              return (
                <div key={i} style={{ background: T.bg, border: `1px solid ${isMe ? "#ff8c00" : T.border}`, borderRadius: "4px", padding: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ fontSize: "13px", color: isMe ? "#ff8c00" : T.text, fontWeight: "bold" }}>{isMe ? "🔵 " : ""}{co.name}</div>
                    <span style={{ fontSize: "10px", padding: "2px 8px", background: paceColor(co.hiring_pace) + "22", color: paceColor(co.hiring_pace), borderRadius: "10px" }}>{co.hiring_pace}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "11px", marginBottom: "8px" }}>
                    <div><div style={{ fontSize: "9px", color: T.muted }}>Headcount</div><div style={{ color: T.text }}>{co.estimated_headcount}</div></div>
                    <div><div style={{ fontSize: "9px", color: T.muted }}>6M Change</div><div style={{ color: co.headcount_change_6m?.includes("-") ? "#ef5350" : "#4caf50" }}>{co.headcount_change_6m}</div></div>
                  </div>
                  <div style={{ fontSize: "10px", color: T.muted, marginBottom: "4px" }}>Top roles: {co.top_hiring_roles?.join(", ")}</div>
                  <div style={{ fontSize: "10px", color: T.muted, marginBottom: "4px" }}>Cities: {co.top_hiring_cities?.join(", ")}</div>
                  <div style={{ fontSize: "10px", color: "#2196f3", fontStyle: "italic" }}>{co.strategic_signal}</div>
                </div>
              );
            })}
          </div>

          {data.market_signals && (
            <div style={{ background: "#1565c010", border: "1px solid #1565c033", borderLeft: "3px solid #1565c0", borderRadius: "4px", padding: "12px 14px" }}>
              <div style={{ fontSize: "10px", color: "#1565c0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Market Signals</div>
              <div style={{ fontSize: "12px", color: T.muted, marginBottom: "4px" }}>Hottest roles: <span style={{ color: T.text }}>{data.market_signals.hottest_roles_industry?.join(", ")}</span></div>
              <div style={{ fontSize: "12px", color: "#ef5350", marginBottom: "4px" }}>Talent Risk: {data.market_signals["1mg_talent_risk"]}</div>
              <div style={{ fontSize: "12px", color: "#4caf50" }}>Hiring Rec: {data.market_signals["1mg_hiring_recommendation"]}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// 9. Notes & Annotations
function Notes({ T }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [tag, setTag] = useState("General");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    try { const n = localStorage.getItem("mb_notes"); if (n) setNotes(JSON.parse(n)); } catch {}
  }, []);

  function save(updated) {
    setNotes(updated);
    try { localStorage.setItem("mb_notes", JSON.stringify(updated)); } catch {}
  }

  function add() {
    if (!newNote.trim()) return;
    const note = { id: Date.now(), text: newNote, tag, date: new Date().toLocaleDateString("en-IN"), time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) };
    save([note, ...notes]);
    setNewNote("");
  }

  const tags = ["General", "PharmEasy", "Apollo 247", "Practo", "CVS Health", "Thyrocare", "Strategy", "Risk", "Opportunity", "Regulatory"];
  const tagColor = t => ({ Strategy: "#9c27b0", Risk: "#ef5350", Opportunity: "#4caf50", Regulatory: "#ff8c00" }[t] || "#2196f3");
  const filtered = filter === "All" ? notes : notes.filter(n => n.tag === filter);

  return (
    <div>
      <div style={{ marginBottom: "14px" }}>
        <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note, annotation, or strategic observation..."
          style={{ width: "100%", background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "10px 14px", borderRadius: "4px", fontSize: "13px", fontFamily: "Georgia, serif", outline: "none", resize: "vertical", minHeight: "80px" }} />
        <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
          <select value={tag} onChange={e => setTag(e.target.value)}
            style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "7px 10px", borderRadius: "4px", fontSize: "12px", fontFamily: "Georgia, serif" }}>
            {tags.map(t => <option key={t}>{t}</option>)}
          </select>
          <button onClick={add} style={{ background: "#2196f3", color: "#fff", border: "none", borderRadius: "4px", padding: "7px 18px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>Save Note</button>
          {notes.length > 0 && <button onClick={() => save([])} style={{ background: "none", border: "1px solid #ef5350", color: "#ef5350", borderRadius: "4px", padding: "7px 12px", fontSize: "11px", cursor: "pointer" }}>Clear All</button>}
        </div>
      </div>

      <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
        {["All", ...new Set(notes.map(n => n.tag))].map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{ background: filter === t ? tagColor(t) : "none", color: filter === t ? "#fff" : T.muted, border: `1px solid ${filter === t ? tagColor(t) : T.border}`, padding: "4px 10px", borderRadius: "20px", fontSize: "10px", cursor: "pointer" }}>{t}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px", color: T.muted, fontSize: "13px", fontStyle: "italic" }}>No notes yet. Add your first strategic annotation above.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map(note => (
            <div key={note.id} style={{ background: T.bg, border: `1px solid ${T.border}`, borderLeft: `3px solid ${tagColor(note.tag)}`, borderRadius: "4px", padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "10px", padding: "1px 6px", background: tagColor(note.tag) + "22", color: tagColor(note.tag), borderRadius: "10px" }}>{note.tag}</span>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", color: T.muted }}>{note.date} {note.time}</span>
                  <button onClick={() => save(notes.filter(n => n.id !== note.id))} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: "11px" }}>✕</button>
                </div>
              </div>
              <div style={{ fontSize: "13px", color: T.text, lineHeight: 1.65 }}>{note.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Intelligence Hub Page ────────────────────────────────────────────────
export default function Intelligence() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [activeSection, setActiveSection] = useState("swot");

  const T = theme === "dark"
    ? { bg: "#080810", surface: "#0c0c18", border: "#151528", text: "#ddd5c5", muted: "#444", accent: "#ff8c00" }
    : { bg: "#f5f3ee", surface: "#ffffff", border: "#e0dbd0", text: "#1a1510", muted: "#888", accent: "#c47000" };

  useEffect(() => {
    setMounted(true);
    try { const t = localStorage.getItem("mb_theme"); if (t) setTheme(t); } catch {}
  }, []);

  const sections = [
    { id: "swot", label: "SWOT Generator", icon: "🎯", color: "#4caf50" },
    { id: "marketmap", label: "Market Map", icon: "🗺️", color: "#9c27b0" },
    { id: "ma", label: "M&A Tracker", icon: "💼", color: "#ef5350" },
    { id: "earnings", label: "Earnings Transcripts", icon: "📊", color: "#2196f3" },
    { id: "regulatory", label: "Regulatory Tracker", icon: "⚖️", color: "#ff8c00" },
    { id: "investors", label: "Investor Intelligence", icon: "💰", color: "#7b1fa2" },
    { id: "sov", label: "Share of Voice", icon: "📣", color: "#00838f" },
    { id: "hiring", label: "Hiring Intelligence", icon: "👥", color: "#1565c0" },
    { id: "notes", label: "Notes & Annotations", icon: "📝", color: "#2196f3" },
  ];

  if (!mounted) return (
    <div style={{ minHeight: "100vh", background: "#080810", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#ff8c00", fontFamily: "Georgia", fontSize: "13px", letterSpacing: "0.2em" }}>LOADING...</div>
    </div>
  );

  const active = sections.find(s => s.id === activeSection);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        button { font-family: Georgia, serif; cursor: pointer; }
        input, textarea, select { outline: none; }
        table { border-collapse: collapse; width: 100%; }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <header style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ fontSize: "10px", color: T.accent, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "3px" }}>◆ Intelligence Hub</div>
            <h1 style={{ fontSize: "clamp(16px,3.5vw,24px)", fontWeight: "normal", color: T.text, marginBottom: "2px" }}>Competitive Intelligence Suite</h1>
            <p style={{ fontSize: "11px", color: T.muted, fontStyle: "italic" }}>SWOT · Market Maps · M&A · Earnings · Regulatory · Investors · Brand · Hiring · Notes</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, padding: "6px 10px", borderRadius: "4px", fontSize: "14px" }}>{theme === "dark" ? "☀️" : "🌙"}</button>
            <a href="/financials" style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, padding: "6px 10px", borderRadius: "4px", fontSize: "11px", textDecoration: "none" }}>📊 Fin</a>
            <a href="/kpi" style={{ background: "#4caf50", color: "#000", padding: "6px 10px", borderRadius: "4px", fontSize: "11px", textDecoration: "none", fontWeight: "bold" }}>📈 KPIs</a>
            <a href="/alerts" style={{ background: "#ef5350", color: "#fff", padding: "6px 10px", borderRadius: "4px", fontSize: "11px", textDecoration: "none", fontWeight: "bold" }}>🔔 Alerts</a>
            <a href="/scenario" style={{ background: "#1565c0", color: "#fff", padding: "6px 10px", borderRadius: "4px", fontSize: "11px", textDecoration: "none", fontWeight: "bold" }}>🎯 Scenarios</a>
            <a href="/" style={{ background: T.accent, color: "#000", padding: "7px 14px", borderRadius: "4px", fontSize: "11px", textDecoration: "none", fontWeight: "bold" }}>← News</a>
          </div>
        </div>
      </header>

      <div style={{ display: "flex", minHeight: "calc(100vh - 80px)" }}>
        {/* Sidebar */}
        <div style={{ width: "200px", flexShrink: 0, background: T.surface, borderRight: `1px solid ${T.border}`, padding: "12px 0" }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
              display: "flex", alignItems: "center", gap: "8px", width: "100%",
              background: activeSection === s.id ? s.color + "15" : "none",
              color: activeSection === s.id ? s.color : T.muted,
              border: "none", borderLeft: activeSection === s.id ? `3px solid ${s.color}` : "3px solid transparent",
              padding: "10px 14px", fontSize: "11px", textAlign: "left", transition: "all .2s",
            }}>
              <span style={{ fontSize: "14px" }}>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: "18px", overflowY: "auto" }}>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "10px", color: active?.color, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "4px" }}>{active?.icon} {active?.label}</div>
            <div style={{ width: "40px", height: "2px", background: active?.color, borderRadius: "1px" }} />
          </div>

          {activeSection === "swot" && <SWOTGenerator T={T} />}
          {activeSection === "marketmap" && <MarketMap T={T} />}
          {activeSection === "ma" && <MATracker T={T} />}
          {activeSection === "earnings" && <EarningsTranscripts T={T} />}
          {activeSection === "regulatory" && <RegulatoryTracker T={T} />}
          {activeSection === "investors" && <InvestorIntelligence T={T} />}
          {activeSection === "sov" && <ShareOfVoice T={T} />}
          {activeSection === "hiring" && <HiringIntelligence T={T} />}
          {activeSection === "notes" && <Notes T={T} />}
        </div>
      </div>
    </div>
  );
}
