import { useState, useEffect, useRef, useCallback } from "react";

// ── Constants ────────────────────────────────────────────────────────────────

const METRICS = [
  { id: "gmv",             label: "GMV & Revenue",       icon: "💰" },
  { id: "cac",             label: "CAC",                 icon: "🎯" },
  { id: "ltv",             label: "LTV",                 icon: "♾️" },
  { id: "contribution",    label: "Contribution Margin", icon: "📊" },
  { id: "burn",            label: "Burn Rate & Runway",  icon: "🔥" },
  { id: "order_economics", label: "Order Economics",     icon: "🧾" },
  { id: "take_rate",       label: "Take Rate %",         icon: "🎰" },
];

const PHARMACY_COMPANIES = [
  { name: "Apollo 247",      region: "India",   flag: "🇮🇳", color: "#0056a3", currency: "INR", symbol: "₹" },
  { name: "Practo",          region: "India",   flag: "🇮🇳", color: "#2d9cdb", currency: "INR", symbol: "₹" },
  { name: "Netmeds",         region: "India",   flag: "🇮🇳", color: "#e91e63", currency: "INR", symbol: "₹" },
  { name: "Medlife",         region: "India",   flag: "🇮🇳", color: "#ff5722", currency: "INR", symbol: "₹" },
  { name: "PharmEasy",       region: "India",   flag: "🇮🇳", color: "#6c3bbf", currency: "INR", symbol: "₹" },
  { name: "Medkart",         region: "India",   flag: "🇮🇳", color: "#00897b", currency: "INR", symbol: "₹" },
  { name: "1mg (pre-TATA)",  region: "India",   flag: "🇮🇳", color: "#e53935", currency: "INR", symbol: "₹" },
  { name: "CVS Health",      region: "USA",     flag: "🇺🇸", color: "#cc0000", currency: "USD", symbol: "$" },
  { name: "Walgreens",       region: "USA",     flag: "🇺🇸", color: "#e31837", currency: "USD", symbol: "$" },
  { name: "Amazon Pharmacy", region: "USA",     flag: "🇺🇸", color: "#ff9900", currency: "USD", symbol: "$" },
  { name: "Capsule",         region: "USA",     flag: "🇺🇸", color: "#5c6bc0", currency: "USD", symbol: "$" },
  { name: "Hims & Hers",     region: "USA",     flag: "🇺🇸", color: "#00bcd4", currency: "USD", symbol: "$" },
  { name: "GoodRx",          region: "USA",     flag: "🇺🇸", color: "#1976d2", currency: "USD", symbol: "$" },
  { name: "Alto Pharmacy",   region: "USA",     flag: "🇺🇸", color: "#388e3c", currency: "USD", symbol: "$" },
  { name: "Boots UK",        region: "Europe",  flag: "🇬🇧", color: "#003087", currency: "GBP", symbol: "£" },
  { name: "DocMorris",       region: "Europe",  flag: "🇩🇪", color: "#00a651", currency: "EUR", symbol: "€" },
  { name: "Zur Rose",        region: "Europe",  flag: "🇨🇭", color: "#e53935", currency: "CHF", symbol: "Fr" },
  { name: "Ping An Health",  region: "Asia",    flag: "🇨🇳", color: "#f5a623", currency: "CNY", symbol: "¥" },
  { name: "Guardian Health", region: "Asia",    flag: "🇸🇬", color: "#0f9d58", currency: "SGD", symbol: "S$" },
  { name: "Watsons",         region: "Asia",    flag: "🌏",  color: "#7b1fa2", currency: "HKD", symbol: "HK$" },
  { name: "Halodoc",         region: "Asia",    flag: "🇮🇩", color: "#43a047", currency: "IDR", symbol: "Rp" },
];

const DIAGNOSTIC_COMPANIES = [
  { name: "Thyrocare",        region: "India",     flag: "🇮🇳", color: "#1565c0", currency: "INR", symbol: "₹" },
  { name: "Dr Lal PathLabs", region: "India",     flag: "🇮🇳", color: "#c62828", currency: "INR", symbol: "₹" },
  { name: "Metropolis",       region: "India",     flag: "🇮🇳", color: "#6a1b9a", currency: "INR", symbol: "₹" },
  { name: "SRL Diagnostics",  region: "India",     flag: "🇮🇳", color: "#00838f", currency: "INR", symbol: "₹" },
  { name: "Redcliffe Labs",   region: "India",     flag: "🇮🇳", color: "#ad1457", currency: "INR", symbol: "₹" },
  { name: "Healthians",       region: "India",     flag: "🇮🇳", color: "#2e7d32", currency: "INR", symbol: "₹" },
  { name: "Quest Diagnostics",region: "USA",       flag: "🇺🇸", color: "#1976d2", currency: "USD", symbol: "$" },
  { name: "LabCorp",          region: "USA",       flag: "🇺🇸", color: "#0d47a1", currency: "USD", symbol: "$" },
  { name: "Sonic Healthcare", region: "Australia", flag: "🇦🇺", color: "#00838f", currency: "AUD", symbol: "A$" },
  { name: "Eurofins",         region: "Europe",    flag: "🇪🇺", color: "#283593", currency: "EUR", symbol: "€" },
  { name: "Synlab",           region: "Europe",    flag: "🇩🇪", color: "#00695c", currency: "EUR", symbol: "€" },
  { name: "Medi-Lab",         region: "Asia",      flag: "🌏",  color: "#4527a0", currency: "USD", symbol: "$" },
];

const TATA_1MG_BENCHMARK = {
  pharmacy: {
    gmv: "₹8,500 Cr", revenue: "₹1,820 Cr", cac: "₹900–1,200", ltv: "₹4,500–6,000",
    ltv_cac: "4.5x", contribution: "13–15%", burn: "₹80–120 Cr/mo", take_rate: "18–22%",
    order_margin: "₹40", growth: "35–40%", valuation: "₹12,000–15,000 Cr",
  },
  diagnostics: {
    gmv: "₹1,200 Cr", revenue: "₹1,200 Cr", cac: "₹600–900", ltv: "₹3,500–5,000",
    ltv_cac: "5.2x", contribution: "22–26%", burn: "Profitable", take_rate: "N/A",
    order_margin: "₹160", growth: "28–32%", valuation: "₹8,000–10,000 Cr",
  },
};

const FISCAL_YEARS = ["FY20", "FY21", "FY22", "FY23", "FY24", "FY25E"];
const AUTO_REFRESH_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

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

async function callClaude(prompt, system) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: system || "You are a senior healthcare financial analyst. Return only raw JSON. No markdown fences, no preamble, no explanation.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content.map(b => b.text || "").join("");
}

// ── Sparkline SVG component ───────────────────────────────────────────────────
function Sparkline({ data, color, width = 80, height = 30 }) {
  if (!data || data.length < 2) return <span style={{ color: "#444", fontSize: "10px" }}>no data</span>;
  const nums = data.map(d => parseFloat(String(d).replace(/[^0-9.-]/g, "")) || 0);
  const min = Math.min(...nums), max = Math.max(...nums);
  const range = max - min || 1;
  const pts = nums.map((n, i) => {
    const x = (i / (nums.length - 1)) * width;
    const y = height - ((n - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  const trend = nums[nums.length - 1] >= nums[0];
  const lineColor = color || (trend ? "#4caf50" : "#ef5350");
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={pts.split(" ").pop().split(",")[0]} cy={pts.split(" ").pop().split(",")[1]} r="2.5" fill={lineColor} />
    </svg>
  );
}

// ── Trend Bar Chart ───────────────────────────────────────────────────────────
function TrendChart({ trendData, company, metric, theme }) {
  if (!trendData) return null;
  const years = trendData.map(d => d.year);
  const values = trendData.map(d => parseFloat(String(d[metric] || "0").replace(/[^0-9.-]/g, "")) || 0);
  const max = Math.max(...values) || 1;
  const T = theme === "dark" ? { bg: "#0a0a14", text: "#ddd5c5", muted: "#444", border: "#151528" }
    : { bg: "#f5f3ee", text: "#1a1510", muted: "#aaa", border: "#e0dbd0" };

  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ fontSize: "10px", color: company.color, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>
        📈 {metric.toUpperCase()} Trend — {company.name}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "80px" }}>
        {years.map((yr, i) => {
          const pct = max > 0 ? (values[i] / max) * 100 : 0;
          const isLatest = i === years.length - 1;
          const isUp = i > 0 && values[i] >= values[i - 1];
          const barColor = isLatest ? company.color : isUp ? "#4caf5088" : "#ef535088";
          return (
            <div key={yr} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{ fontSize: "9px", color: company.color, fontWeight: isLatest ? "bold" : "normal" }}>
                {trendData[i][metric] || "—"}
              </div>
              <div style={{ width: "100%", background: barColor, height: `${Math.max(pct, 4)}%`, borderRadius: "2px 2px 0 0", minHeight: "4px", transition: "height 0.5s ease" }} />
              <div style={{ fontSize: "9px", color: T.muted, whiteSpace: "nowrap" }}>{yr}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Drill Down Panel ──────────────────────────────────────────────────────────
function DrillDown({ item, label, company, theme, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const T = theme === "dark" ? { bg: "#080810", surface: "#0c0c18", border: "#151528", text: "#ddd5c5", muted: "#444" }
    : { bg: "#f5f3ee", surface: "#fff", border: "#e0dbd0", text: "#1a1510", muted: "#888" };

  useEffect(() => {
    async function fetch() {
      try {
        const text = await callClaude(
          `For ${company.name} (${company.region}), provide a complete line-item breakdown of their "${label}" metric.

Return JSON:
{
  "metric": "${label}",
  "company": "${company.name}",
  "headline_value_orig": "value in ${company.currency}",
  "headline_value_inr": "value in INR",
  "description": "2 sentence explanation of what this metric means for this company",
  "line_items": [
    {
      "name": "line item name",
      "value_orig": "value in ${company.currency}",
      "value_inr": "value in INR",
      "pct_of_total": "% e.g. 34%",
      "yoy_change": "e.g. +12% or -5%",
      "direction": "up|down|flat",
      "note": "1 sentence context or explanation",
      "sub_items": [
        { "name": "sub item", "value_orig": "", "value_inr": "", "note": "" }
      ]
    }
  ],
  "benchmarks": {
    "industry_avg": "what is the industry average for this metric",
    "best_in_class": "who is best in class and their value",
    "tata_1mg_comparison": "how does this compare to TATA 1MG"
  },
  "trend": "improving|declining|stable",
  "trend_reason": "1 sentence why",
  "action_for_1mg": "1 specific actionable insight for TATA 1MG based on this data"
}
Use FX: USD=₹84, GBP=₹107, EUR=₹91, CNY=₹11.5, SGD=₹62, AUD=₹55. Return ONLY JSON.`,
          "You are a healthcare financial analyst. Return only raw JSON. Be specific with numbers."
        );
        const parsed = parseJSON(text);
        if (parsed) setDetail(parsed);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    fetch();
  }, [label, company.name]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 2000, overflowY: "auto", padding: "16px" }}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: `4px solid ${company.color}`, borderRadius: "6px", maxWidth: "680px", margin: "0 auto", padding: "22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "10px", color: company.color, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "3px" }}>🔍 Line-Item Drill Down</div>
            <h3 style={{ fontSize: "18px", fontWeight: "normal", color: T.text }}>{company.flag} {company.name} — {label}</h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, padding: "5px 10px", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}>✕</button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: T.muted, fontSize: "13px" }}>
            <div style={{ fontSize: "24px", marginBottom: "10px", animation: "pulse 1.2s infinite" }}>🔍</div>
            Fetching line-item breakdown…
          </div>
        ) : detail ? (
          <>
            {/* Headline */}
            <div style={{ background: company.color + "15", border: `1px solid ${company.color}33`, borderRadius: "4px", padding: "12px 16px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <div style={{ fontSize: "22px", color: company.color, fontWeight: "bold" }}>{detail.headline_value_orig}</div>
                  {detail.headline_value_inr !== detail.headline_value_orig && (
                    <div style={{ fontSize: "13px", color: T.muted }}>≈ {detail.headline_value_inr} (INR)</div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: detail.trend === "improving" ? "#4caf50" : detail.trend === "declining" ? "#ef5350" : T.muted }}>
                    {detail.trend === "improving" ? "▲ Improving" : detail.trend === "declining" ? "▼ Declining" : "● Stable"}
                  </div>
                  <div style={{ fontSize: "10px", color: T.muted, marginTop: "2px" }}>{detail.trend_reason}</div>
                </div>
              </div>
              <p style={{ fontSize: "12px", color: T.muted, marginTop: "8px", lineHeight: 1.6, fontStyle: "italic" }}>{detail.description}</p>
            </div>

            {/* Line items */}
            {detail.line_items && detail.line_items.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "10px", color: T.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>Line Items</div>
                {detail.line_items.map((li, i) => (
                  <div key={i} style={{ border: `1px solid ${T.border}`, borderRadius: "4px", marginBottom: "8px", overflow: "hidden" }}>
                    {/* Main line item */}
                    <div style={{ padding: "10px 14px", background: T.bg, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "6px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", color: T.text, fontWeight: "bold", marginBottom: "2px" }}>{li.name}</div>
                        <div style={{ fontSize: "11px", color: T.muted, fontStyle: "italic" }}>{li.note}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "14px", color: company.color, fontWeight: "bold" }}>{li.value_orig}</div>
                        {li.value_inr && li.value_inr !== li.value_orig && (
                          <div style={{ fontSize: "10px", color: T.muted }}>≈ {li.value_inr}</div>
                        )}
                        <div style={{ display: "flex", gap: "8px", marginTop: "2px", justifyContent: "flex-end" }}>
                          {li.pct_of_total && <span style={{ fontSize: "10px", color: T.muted }}>{li.pct_of_total} of total</span>}
                          {li.yoy_change && (
                            <span style={{ fontSize: "10px", color: li.direction === "up" ? "#4caf50" : li.direction === "down" ? "#ef5350" : T.muted }}>
                              {li.yoy_change} YoY
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Sub items */}
                    {li.sub_items && li.sub_items.length > 0 && (
                      <div style={{ borderTop: `1px solid ${T.border}` }}>
                        {li.sub_items.map((si, j) => (
                          <div key={j} style={{ padding: "7px 14px 7px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: j < li.sub_items.length - 1 ? `1px solid ${T.border}` : "none", background: T.surface }}>
                            <div>
                              <div style={{ fontSize: "11px", color: T.text }}>↳ {si.name}</div>
                              {si.note && <div style={{ fontSize: "10px", color: T.muted, fontStyle: "italic" }}>{si.note}</div>}
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: "12px", color: T.text }}>{si.value_orig}</div>
                              {si.value_inr && si.value_inr !== si.value_orig && (
                                <div style={{ fontSize: "10px", color: T.muted }}>≈ {si.value_inr}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Benchmarks */}
            {detail.benchmarks && (
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "12px 14px", marginBottom: "12px" }}>
                <div style={{ fontSize: "10px", color: T.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>Benchmarks</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: T.muted }}>Industry Average</span>
                    <span style={{ color: T.text }}>{detail.benchmarks.industry_avg}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: T.muted }}>Best in Class</span>
                    <span style={{ color: "#4caf50" }}>{detail.benchmarks.best_in_class}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: T.muted }}>vs TATA 1MG</span>
                    <span style={{ color: "#ff8c00" }}>{detail.benchmarks.tata_1mg_comparison}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action for 1MG */}
            {detail.action_for_1mg && (
              <div style={{ background: "#ff8c0015", border: "1px solid #ff8c0033", borderLeft: "3px solid #ff8c00", borderRadius: "4px", padding: "12px 14px" }}>
                <div style={{ fontSize: "10px", color: "#ff8c00", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>💡 Action for TATA 1MG</div>
                <p style={{ fontSize: "12px", color: T.text, lineHeight: 1.6 }}>{detail.action_for_1mg}</p>
              </div>
            )}
          </>
        ) : (
          <p style={{ color: T.muted, fontSize: "13px" }}>Could not load data. Please close and try again.</p>
        )}
      </div>
    </div>
  );
}

// ── Company Detail Modal ──────────────────────────────────────────────────────
function CompanyModal({ company, sector, theme, onClose }) {
  const [detail, setDetail] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [drillItem, setDrillItem] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [lastUpdated, setLastUpdated] = useState(null);

  const T = theme === "dark"
    ? { bg: "#080810", surface: "#0c0c18", border: "#151528", text: "#ddd5c5", muted: "#444" }
    : { bg: "#f5f3ee", surface: "#fff", border: "#e0dbd0", text: "#1a1510", muted: "#888" };

  useEffect(() => {
    fetchDetail();
    fetchTrend();
  }, [company.name]);

  // Auto-refresh every 6 hours
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDetail();
      fetchTrend();
    }, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [company.name]);

  async function fetchDetail() {
    setLoading(true);
    try {
      const text = await callClaude(
        `Deep dive for ${company.name} (${company.region}, ${sector}). Currency: ${company.currency}.

Return JSON:
{
  "overview": "2 sentences",
  "business_model": "2 sentences on how they make money",
  "status": "Listed|Private|Startup",
  "founded": "year",
  "employees": "approx",
  "last_funding": "e.g. Series D $200M or Listed",
  "latest_news": "most recent significant development",
  "unit_economics": {
    "cac_orig": "", "cac_inr": "",
    "ltv_orig": "", "ltv_inr": "",
    "ltv_cac": "",
    "avg_order_value_orig": "", "avg_order_value_inr": "",
    "orders_per_customer_year": "",
    "contribution_margin": "",
    "gross_margin": "",
    "ebitda_margin": "",
    "take_rate": ""
  },
  "per_order_pnl": {
    "avg_selling_price_orig": "", "avg_selling_price_inr": "",
    "cogs_orig": "", "cogs_inr": "",
    "gross_profit_orig": "", "gross_profit_inr": "",
    "delivery_cost_orig": "", "delivery_cost_inr": "",
    "payment_cost_orig": "", "payment_cost_inr": "",
    "marketing_alloc_orig": "", "marketing_alloc_inr": "",
    "net_per_order_orig": "", "net_per_order_inr": ""
  },
  "revenue_breakdown": [
    { "segment": "segment name", "value_orig": "", "value_inr": "", "pct": "%" }
  ],
  "cost_breakdown": [
    { "item": "cost item", "value_orig": "", "value_inr": "", "pct": "%" }
  ],
  "strengths": ["s1","s2","s3"],
  "weaknesses": ["w1","w2"],
  "strategic_moves": ["m1","m2"],
  "threat_to_1mg": "high|medium|low",
  "threat_reason": "1 sentence"
}
FX: USD=84, GBP=107, EUR=91, CNY=11.5, SGD=62, AUD=55. Return ONLY JSON.`
      );
      const parsed = parseJSON(text);
      if (parsed) { setDetail(parsed); setLastUpdated(new Date()); }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function fetchTrend() {
    setTrendLoading(true);
    try {
      const text = await callClaude(
        `Multi-year financial trend for ${company.name} (${company.region}, ${sector}). Currency: ${company.currency}.

Return a JSON array with one item per fiscal year from FY20 to FY25E:
[{
  "year": "FY20",
  "revenue_orig": "", "revenue_inr": "",
  "gmv_orig": "", "gmv_inr": "",
  "gross_profit_orig": "", "gross_profit_inr": "",
  "ebitda_orig": "", "ebitda_inr": "",
  "net_profit_orig": "", "net_profit_inr": "",
  "cac_orig": "", "cac_inr": "",
  "ltv_orig": "", "ltv_inr": "",
  "contribution_margin": "",
  "yoy_growth": "",
  "orders": "",
  "customers": "",
  "market_cap_orig": "", "market_cap_inr": "",
  "key_event": "most important thing that happened this year"
}]
Use estimates for future years. FX: USD=84, GBP=107, EUR=91, CNY=11.5, SGD=62, AUD=55. Return ONLY the JSON array.`
      );
      const parsed = parseJSON(text);
      if (Array.isArray(parsed)) setTrendData(parsed);
    } catch (e) { console.error(e); }
    setTrendLoading(false);
  }

  const tabs = ["overview", "trends", "unit economics", "per order", "breakdown"];

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 1000, overflowY: "auto", padding: "16px" }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: `4px solid ${company.color}`, borderRadius: "6px", maxWidth: "800px", margin: "0 auto", padding: "22px" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "10px", color: company.color, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "3px" }}>Deep Dive · {sector}</div>
              <h2 style={{ fontSize: "20px", fontWeight: "normal", color: T.text }}>{company.flag} {company.name}</h2>
              <div style={{ fontSize: "11px", color: T.muted }}>{company.region} · {company.currency} → tap any metric to drill down</div>
              {lastUpdated && <div style={{ fontSize: "10px", color: T.muted, marginTop: "3px" }}>Last updated: {lastUpdated.toLocaleTimeString()} · Auto-refreshes every 6h</div>}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={fetchDetail} style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, padding: "5px 10px", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}>↻ Refresh</button>
              <button onClick={onClose} style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, padding: "5px 10px", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}>✕</button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "0", borderBottom: `1px solid ${T.border}`, marginBottom: "18px", overflowX: "auto" }}>
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "9px 14px", fontSize: "11px", whiteSpace: "nowrap",
                color: activeTab === tab ? company.color : T.muted,
                borderBottom: activeTab === tab ? `2px solid ${company.color}` : "2px solid transparent",
                textTransform: "capitalize", letterSpacing: "0.05em",
              }}>{tab}</button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: T.muted }}>
              <div style={{ fontSize: "24px", animation: "pulse 1.2s infinite", marginBottom: "10px" }}>📊</div>
              Fetching deep financial data…
            </div>
          ) : detail ? (
            <>
              {/* OVERVIEW TAB */}
              {activeTab === "overview" && (
                <div>
                  <p style={{ fontSize: "13px", lineHeight: 1.7, color: T.text, marginBottom: "6px" }}>{detail.overview}</p>
                  <p style={{ fontSize: "12px", lineHeight: 1.6, color: T.muted, fontStyle: "italic", marginBottom: "16px" }}>{detail.business_model}</p>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: "8px", marginBottom: "16px" }}>
                    {[["Status", detail.status], ["Founded", detail.founded], ["Employees", detail.employees], ["Last Funding", detail.last_funding]].map(([k, v]) => (
                      <div key={k} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "10px" }}>
                        <div style={{ fontSize: "9px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{k}</div>
                        <div style={{ fontSize: "12px", color: T.text, fontWeight: "bold" }}>{v || "—"}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "12px" }}>
                      <div style={{ fontSize: "10px", color: "#4caf50", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>✅ Strengths</div>
                      {detail.strengths?.map((s, i) => <div key={i} style={{ fontSize: "11px", color: T.text, marginBottom: "4px", paddingLeft: "8px", borderLeft: "2px solid #4caf50" }}>{s}</div>)}
                    </div>
                    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "12px" }}>
                      <div style={{ fontSize: "10px", color: "#ef5350", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>⚠️ Weaknesses</div>
                      {detail.weaknesses?.map((w, i) => <div key={i} style={{ fontSize: "11px", color: T.text, marginBottom: "4px", paddingLeft: "8px", borderLeft: "2px solid #ef5350" }}>{w}</div>)}
                    </div>
                  </div>

                  <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "12px", marginBottom: "10px" }}>
                    <div style={{ fontSize: "10px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Threat to TATA 1MG</div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <span style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", color: detail.threat_to_1mg === "high" ? "#ef5350" : detail.threat_to_1mg === "medium" ? "#ff8c00" : "#4caf50" }}>{detail.threat_to_1mg}</span>
                      <span style={{ fontSize: "12px", color: T.muted, fontStyle: "italic" }}>{detail.threat_reason}</span>
                    </div>
                  </div>

                  {detail.latest_news && (
                    <div style={{ background: company.color + "10", border: `1px solid ${company.color}33`, borderRadius: "4px", padding: "12px" }}>
                      <div style={{ fontSize: "10px", color: company.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Latest Development</div>
                      <div style={{ fontSize: "12px", color: T.text }}>{detail.latest_news}</div>
                    </div>
                  )}
                </div>
              )}

              {/* TRENDS TAB */}
              {activeTab === "trends" && (
                <div>
                  {trendLoading ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: T.muted, animation: "pulse 1.2s infinite" }}>Loading multi-year trend data…</div>
                  ) : trendData ? (
                    <>
                      {/* Trend charts */}
                      {["revenue_inr", "gmv_inr", "cac_inr", "contribution_margin", "yoy_growth"].map(metric => (
                        <TrendChart key={metric} trendData={trendData} company={company} metric={metric} theme={theme} />
                      ))}

                      {/* Year-by-year table */}
                      <div style={{ fontSize: "10px", color: T.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>📅 Full Year-by-Year Data</div>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "11px" }}>
                          <thead>
                            <tr style={{ background: T.bg }}>
                              {["Year", "Revenue", "INR", "GMV", "INR", "EBITDA", "INR", "CAC", "INR", "Contrib%", "Growth", "Key Event"].map((h, i) => (
                                <th key={i} style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, fontSize: "9px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {trendData.map((yr, i) => {
                              const isLatest = i === trendData.length - 1;
                              const growth = parseFloat(yr.yoy_growth);
                              return (
                                <tr key={yr.year} style={{ background: isLatest ? company.color + "10" : "transparent" }}>
                                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: company.color, fontWeight: "bold" }}>{yr.year}{isLatest ? " ★" : ""}</td>
                                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}` }}>{yr.revenue_orig || "—"}</td>
                                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: T.muted }}>{yr.revenue_inr || "—"}</td>
                                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}` }}>{yr.gmv_orig || "—"}</td>
                                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: T.muted }}>{yr.gmv_inr || "—"}</td>
                                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: yr.ebitda_orig?.includes("-") ? "#ef5350" : "#4caf50" }}>{yr.ebitda_orig || "—"}</td>
                                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: T.muted }}>{yr.ebitda_inr || "—"}</td>
                                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}` }}>{yr.cac_orig || "—"}</td>
                                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: T.muted }}>{yr.cac_inr || "—"}</td>
                                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}` }}>{yr.contribution_margin || "—"}</td>
                                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: growth > 0 ? "#4caf50" : "#ef5350" }}>{yr.yoy_growth || "—"}</td>
                                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: T.muted, fontSize: "10px", maxWidth: "140px" }}>{yr.key_event || "—"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <p style={{ color: T.muted, fontSize: "13px" }}>Could not load trend data.</p>
                  )}
                </div>
              )}

              {/* UNIT ECONOMICS TAB */}
              {activeTab === "unit economics" && detail.unit_economics && (
                <div>
                  <div style={{ fontSize: "11px", color: T.muted, marginBottom: "14px" }}>Tap any metric card to drill down into line-item details.</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "8px" }}>
                    {[
                      ["CAC", detail.unit_economics.cac_orig, detail.unit_economics.cac_inr],
                      ["LTV", detail.unit_economics.ltv_orig, detail.unit_economics.ltv_inr],
                      ["LTV:CAC Ratio", detail.unit_economics.ltv_cac, null],
                      ["Avg Order Value", detail.unit_economics.avg_order_value_orig, detail.unit_economics.avg_order_value_inr],
                      ["Orders/Customer/Yr", detail.unit_economics.orders_per_customer_year, null],
                      ["Contribution Margin", detail.unit_economics.contribution_margin, null],
                      ["Gross Margin", detail.unit_economics.gross_margin, null],
                      ["EBITDA Margin", detail.unit_economics.ebitda_margin, null],
                      ["Take Rate", detail.unit_economics.take_rate, null],
                    ].map(([label, orig, inr], i) => (
                      <div key={i} onClick={() => setDrillItem(label)}
                        style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "10px", cursor: "pointer", transition: "border-color .2s" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = company.color}
                        onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                        <div style={{ fontSize: "9px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{label}</div>
                        <div style={{ fontSize: "15px", color: T.text, fontWeight: "bold" }}>{orig || "—"}</div>
                        {inr && inr !== orig && <div style={{ fontSize: "10px", color: T.muted }}>≈ {inr}</div>}
                        <div style={{ fontSize: "9px", color: company.color, marginTop: "5px" }}>🔍 Drill down →</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PER ORDER TAB */}
              {activeTab === "per order" && detail.per_order_pnl && (
                <div>
                  <div style={{ fontSize: "11px", color: T.muted, marginBottom: "14px" }}>Tap any line item to drill down into sub-components.</div>
                  <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "12px" }}>
                    {[
                      ["Avg Selling Price", detail.per_order_pnl.avg_selling_price_orig, detail.per_order_pnl.avg_selling_price_inr, false],
                      ["COGS", detail.per_order_pnl.cogs_orig, detail.per_order_pnl.cogs_inr, true],
                      ["Gross Profit", detail.per_order_pnl.gross_profit_orig, detail.per_order_pnl.gross_profit_inr, false],
                      ["Delivery Cost", detail.per_order_pnl.delivery_cost_orig, detail.per_order_pnl.delivery_cost_inr, true],
                      ["Payment Cost", detail.per_order_pnl.payment_cost_orig, detail.per_order_pnl.payment_cost_inr, true],
                      ["Marketing Allocation", detail.per_order_pnl.marketing_alloc_orig, detail.per_order_pnl.marketing_alloc_inr, true],
                      ["Net Per Order", detail.per_order_pnl.net_per_order_orig, detail.per_order_pnl.net_per_order_inr, false],
                    ].map(([label, orig, inr, isCost], i, arr) => {
                      const isLast = i === arr.length - 1;
                      const valColor = isLast ? (orig?.includes("-") ? "#ef5350" : "#4caf50") : isCost ? "#ef5350" : T.text;
                      return (
                        <div key={i} onClick={() => setDrillItem(label)}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 6px", borderBottom: isLast ? "none" : `1px solid ${T.border}`, borderTop: isLast ? `2px solid ${T.border}` : "none", marginTop: isLast ? "4px" : "0", cursor: "pointer", borderRadius: "3px" }}
                          onMouseEnter={e => e.currentTarget.style.background = company.color + "10"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <div>
                            <span style={{ fontSize: "12px", color: T.muted }}>{label}</span>
                            <span style={{ fontSize: "10px", color: company.color, marginLeft: "8px" }}>🔍</span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "13px", fontWeight: isLast ? "bold" : "normal", color: valColor }}>{orig || "—"}</div>
                            {inr && inr !== orig && <div style={{ fontSize: "10px", color: T.muted }}>≈ {inr}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BREAKDOWN TAB */}
              {activeTab === "breakdown" && (
                <div>
                  {detail.revenue_breakdown && (
                    <div style={{ marginBottom: "20px" }}>
                      <div style={{ fontSize: "10px", color: T.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>Revenue Breakdown by Segment</div>
                      {detail.revenue_breakdown.map((seg, i) => {
                        const pct = parseFloat(seg.pct) || 0;
                        return (
                          <div key={i} onClick={() => setDrillItem(seg.segment)}
                            style={{ marginBottom: "10px", cursor: "pointer", padding: "6px", borderRadius: "4px" }}
                            onMouseEnter={e => e.currentTarget.style.background = company.color + "10"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                              <span style={{ fontSize: "12px", color: T.text }}>{seg.segment} <span style={{ color: company.color, fontSize: "10px" }}>🔍</span></span>
                              <div style={{ textAlign: "right" }}>
                                <span style={{ fontSize: "12px", color: T.text }}>{seg.value_orig}</span>
                                {seg.value_inr && seg.value_inr !== seg.value_orig && <span style={{ fontSize: "10px", color: T.muted, marginLeft: "6px" }}>≈ {seg.value_inr}</span>}
                                <span style={{ fontSize: "11px", color: company.color, marginLeft: "8px" }}>{seg.pct}</span>
                              </div>
                            </div>
                            <div style={{ background: T.border, borderRadius: "2px", height: "5px" }}>
                              <div style={{ background: company.color, width: `${pct}%`, height: "100%", borderRadius: "2px", transition: "width 0.5s ease" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {detail.cost_breakdown && (
                    <div>
                      <div style={{ fontSize: "10px", color: T.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>Cost Breakdown</div>
                      {detail.cost_breakdown.map((cost, i) => {
                        const pct = parseFloat(cost.pct) || 0;
                        return (
                          <div key={i} onClick={() => setDrillItem(cost.item)}
                            style={{ marginBottom: "10px", cursor: "pointer", padding: "6px", borderRadius: "4px" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#ef535010"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                              <span style={{ fontSize: "12px", color: T.text }}>{cost.item} <span style={{ color: company.color, fontSize: "10px" }}>🔍</span></span>
                              <div style={{ textAlign: "right" }}>
                                <span style={{ fontSize: "12px", color: "#ef5350" }}>{cost.value_orig}</span>
                                {cost.value_inr && cost.value_inr !== cost.value_orig && <span style={{ fontSize: "10px", color: T.muted, marginLeft: "6px" }}>≈ {cost.value_inr}</span>}
                                <span style={{ fontSize: "11px", color: "#ef5350", marginLeft: "8px" }}>{cost.pct}</span>
                              </div>
                            </div>
                            <div style={{ background: T.border, borderRadius: "2px", height: "5px" }}>
                              <div style={{ background: "#ef5350", width: `${pct}%`, height: "100%", borderRadius: "2px", transition: "width 0.5s ease" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* Drill down panel */}
      {drillItem && (
        <DrillDown item={drillItem} label={drillItem} company={company} theme={theme} onClose={() => setDrillItem(null)} />
      )}
    </>
  );
}


// ── Search & Add Company ──────────────────────────────────────────────────────
const CURRENCY_MAP = {
  "India": "INR", "USA": "USD", "UK": "GBP", "Europe": "EUR",
  "Germany": "EUR", "France": "EUR", "China": "CNY", "Japan": "JPY",
  "Singapore": "SGD", "Australia": "AUD", "Canada": "CAD", "Brazil": "BRL",
  "South Korea": "KRW", "Switzerland": "CHF", "Netherlands": "EUR",
  "Sweden": "SEK", "Indonesia": "IDR", "Malaysia": "MYR", "Thailand": "THB",
};
const FLAG_MAP = {
  "India": "🇮🇳", "USA": "🇺🇸", "UK": "🇬🇧", "Germany": "🇩🇪", "France": "🇫🇷",
  "China": "🇨🇳", "Japan": "🇯🇵", "Singapore": "🇸🇬", "Australia": "🇦🇺",
  "Canada": "🇨🇦", "Brazil": "🇧🇷", "South Korea": "🇰🇷", "Switzerland": "🇨🇭",
  "Netherlands": "🇳🇱", "Sweden": "🇸🇪", "Indonesia": "🇮🇩", "Malaysia": "🇲🇾",
  "Thailand": "🇹🇭", "Europe": "🇪🇺",
};
const COMPANY_COLORS = ["#e53935","#1976d2","#388e3c","#7b1fa2","#f57c00","#0288d1","#c62828","#2e7d32","#6a1b9a","#00838f","#ad1457","#1565c0"];

function SearchAddCompany({ theme, onAdd, existingNames }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [addingSector, setAddingSector] = useState("pharmacy");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const T = theme === "dark"
    ? { bg: "#080810", surface: "#0c0c18", border: "#151528", text: "#ddd5c5", muted: "#444", accent: "#ff8c00" }
    : { bg: "#f5f3ee", surface: "#fff", border: "#e0dbd0", text: "#1a1510", muted: "#888", accent: "#c47000" };

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true); setResults(null); setPreview(null); setError(""); setSuccess("");
    try {
      const text = await callClaude(
        `Search for healthcare, pharmacy, or diagnostic companies matching: "${query}".
Find companies from any country — India, USA, Europe, Asia, etc.
Return a JSON array of up to 8 matching companies:
[{
  "name": "company name",
  "region": "country or region e.g. India, USA, Germany, Singapore",
  "sector": "pharmacy|diagnostics|health-tech",
  "description": "1 sentence what they do",
  "status": "Listed|Private|Startup",
  "currency": "local currency code e.g. INR, USD, GBP",
  "revenue_approx": "approximate annual revenue e.g. $2B or ₹500 Cr",
  "founded": "year",
  "known_for": "1 key thing they are known for"
}]
Return ONLY the JSON array.`,
        "You are a global healthcare industry expert. Return only raw JSON array. No markdown."
      );
      const parsed = parseJSON(text);
      if (Array.isArray(parsed) && parsed.length > 0) setResults(parsed);
      else setError("No companies found. Try a different search term.");
    } catch (e) { setError("Search failed. Please try again."); }
    setSearching(false);
  }

  async function handlePreview(company) {
    setPreview(null); setPreviewLoading(true); setSuccess("");
    try {
      const text = await callClaude(
        `Quick financial snapshot for ${company.name} (${company.region}).
Return JSON:
{
  "name": "${company.name}",
  "region": "${company.region}",
  "currency": "${company.currency || "USD"}",
  "status": "${company.status || "Private"}",
  "sector": "${company.sector}",
  "gmv_orig": "latest GMV or N/A",
  "gmv_inr": "in INR Cr",
  "revenue_orig": "latest revenue",
  "revenue_inr": "in INR Cr",
  "cac_orig": "CAC estimate",
  "cac_inr": "in INR",
  "ltv_orig": "LTV estimate",
  "ltv_inr": "in INR",
  "ltv_cac": "ratio",
  "contribution_margin": "%",
  "burn_orig": "monthly burn or Profitable",
  "burn_inr": "in INR Cr",
  "runway": "months or Profitable",
  "take_rate": "% or N/A",
  "order_margin_orig": "per order margin",
  "order_margin_inr": "in INR",
  "yoy_growth": "%",
  "valuation_orig": "latest valuation",
  "valuation_inr": "in INR Cr",
  "key_metric": "one standout metric",
  "vs_1mg": "1 sentence comparison vs TATA 1MG",
  "threat": "high|medium|low",
  "revenue_sparkline": [num,num,num,num,num,num],
  "description": "2 sentence overview"
}
FX: USD=84, GBP=107, EUR=91, CNY=11.5, SGD=62, AUD=55. Return ONLY JSON.`,
        "You are a healthcare financial analyst. Return only raw JSON."
      );
      const parsed = parseJSON(text);
      if (parsed) setPreview({ ...parsed, ...company });
    } catch (e) { setError("Could not load preview."); }
    setPreviewLoading(false);
  }

  function handleAdd() {
    if (!preview) return;
    const currency = preview.currency || CURRENCY_MAP[preview.region] || "USD";
    const flag = FLAG_MAP[preview.region] || "🌐";
    const colorIdx = Math.floor(Math.random() * COMPANY_COLORS.length);
    const newCompany = {
      name: preview.name,
      region: preview.region,
      flag,
      color: COMPANY_COLORS[colorIdx],
      currency,
      symbol: currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "GBP" ? "£" : currency === "EUR" ? "€" : currency,
      custom: true,
    };
    onAdd(newCompany, addingSector, preview);
    setSuccess(`✅ ${preview.name} added to ${addingSector}!`);
    setPreview(null); setResults(null); setQuery("");
  }

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: "3px solid #2196f3", borderRadius: "4px", padding: "16px 18px", marginBottom: "14px" }}>
      <div style={{ fontSize: "10px", color: "#2196f3", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "12px" }}>🔍 Search & Add Company — India or Worldwide</div>

      {/* Search bar */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <input
          type="text"
          placeholder="e.g. MediBuddy, Ro Health, Zur Rose, Henry Schein, DHL Health..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "10px 14px", color: T.text, fontSize: "13px", fontFamily: "Georgia, serif", outline: "none" }}
        />
        <button onClick={handleSearch} disabled={searching || !query.trim()} style={{
          background: searching || !query.trim() ? T.border : "#2196f3",
          color: searching || !query.trim() ? T.muted : "#fff",
          border: "none", borderRadius: "4px", padding: "10px 18px",
          fontSize: "12px", fontWeight: "bold", letterSpacing: "0.08em", textTransform: "uppercase",
        }}>
          {searching ? "Searching…" : "Search"}
        </button>
      </div>

      {error && <p style={{ color: "#ef5350", fontSize: "12px", marginBottom: "10px" }}>{error}</p>}
      {success && <p style={{ color: "#4caf50", fontSize: "12px", marginBottom: "10px" }}>{success}</p>}

      {/* Search results */}
      {results && (
        <div style={{ marginBottom: "14px" }}>
          <div style={{ fontSize: "11px", color: T.muted, marginBottom: "8px" }}>{results.length} companies found — tap to preview financials:</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "8px" }}>
            {results.map((r, i) => {
              const alreadyAdded = existingNames.includes(r.name);
              return (
                <div key={i} onClick={() => !alreadyAdded && handlePreview(r)}
                  style={{ background: T.bg, border: `1px solid ${preview?.name === r.name ? "#2196f3" : T.border}`, borderRadius: "4px", padding: "11px", cursor: alreadyAdded ? "not-allowed" : "pointer", opacity: alreadyAdded ? 0.5 : 1, transition: "border-color .2s" }}
                  onMouseEnter={e => { if (!alreadyAdded) e.currentTarget.style.borderColor = "#2196f3"; }}
                  onMouseLeave={e => { if (preview?.name !== r.name) e.currentTarget.style.borderColor = T.border; }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                    <div style={{ fontSize: "13px", color: T.text, fontWeight: "bold" }}>{FLAG_MAP[r.region] || "🌐"} {r.name}</div>
                    <span style={{ fontSize: "9px", padding: "1px 6px", border: `1px solid ${T.border}`, borderRadius: "10px", color: T.muted }}>{r.status}</span>
                  </div>
                  <div style={{ fontSize: "10px", color: T.muted, marginBottom: "4px" }}>{r.region} · {r.sector} · {r.currency}</div>
                  <div style={{ fontSize: "11px", color: T.muted, fontStyle: "italic", marginBottom: "4px" }}>{r.description}</div>
                  <div style={{ fontSize: "10px", color: "#2196f3" }}>{r.revenue_approx}</div>
                  {alreadyAdded && <div style={{ fontSize: "9px", color: "#4caf50", marginTop: "4px" }}>✓ Already in tracker</div>}
                  {!alreadyAdded && <div style={{ fontSize: "9px", color: "#2196f3", marginTop: "4px" }}>Tap to preview →</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Preview panel */}
      {previewLoading && (
        <div style={{ textAlign: "center", padding: "20px", color: T.muted, fontSize: "13px", animation: "pulse 1.2s infinite" }}>Loading financial preview…</div>
      )}

      {preview && !previewLoading && (
        <div style={{ background: T.bg, border: `1px solid #2196f3`, borderRadius: "4px", padding: "16px", marginTop: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "14px", color: T.text, fontWeight: "bold", marginBottom: "2px" }}>{FLAG_MAP[preview.region] || "🌐"} {preview.name}</div>
              <div style={{ fontSize: "11px", color: T.muted }}>{preview.region} · {preview.currency} · {preview.status}</div>
              <div style={{ fontSize: "12px", color: T.muted, fontStyle: "italic", marginTop: "4px" }}>{preview.description}</div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {/* Sector selector */}
              <select value={addingSector} onChange={e => setAddingSector(e.target.value)}
                style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "6px 10px", borderRadius: "4px", fontSize: "12px", fontFamily: "Georgia, serif" }}>
                <option value="pharmacy">💊 Pharmacy</option>
                <option value="diagnostics">🔬 Diagnostics</option>
              </select>
              <button onClick={handleAdd} style={{
                background: "#2196f3", color: "#fff", border: "none", borderRadius: "4px",
                padding: "8px 16px", fontSize: "12px", fontWeight: "bold", letterSpacing: "0.08em",
              }}>+ Add to Tracker</button>
            </div>
          </div>

          {/* Key financials grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: "8px", marginBottom: "10px" }}>
            {[
              ["GMV", preview.gmv_orig, preview.gmv_inr],
              ["Revenue", preview.revenue_orig, preview.revenue_inr],
              ["CAC", preview.cac_orig, preview.cac_inr],
              ["LTV", preview.ltv_orig, preview.ltv_inr],
              ["LTV:CAC", preview.ltv_cac, null],
              ["Contribution", preview.contribution_margin, null],
              ["Burn", preview.burn_orig, preview.burn_inr],
              ["Growth YoY", preview.yoy_growth, null],
              ["Valuation", preview.valuation_orig, preview.valuation_inr],
            ].map(([label, orig, inr], i) => (
              <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "8px 10px" }}>
                <div style={{ fontSize: "9px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>{label}</div>
                <div style={{ fontSize: "13px", color: "#2196f3", fontWeight: "bold" }}>{orig || "—"}</div>
                {inr && inr !== orig && <div style={{ fontSize: "9px", color: T.muted }}>≈ {inr}</div>}
              </div>
            ))}
          </div>

          <div style={{ fontSize: "12px", color: T.muted, fontStyle: "italic" }}>vs TATA 1MG: {preview.vs_1mg}</div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Financials() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [sector, setSector] = useState("pharmacy");
  const [activeRegion, setActiveRegion] = useState("All");
  const [activeMetric, setActiveMetric] = useState("gmv");
  const [pharmaData, setPharmaData] = useState(null);
  const [diagData, setDiagData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [aiInsight, setAiInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [nextRefresh, setNextRefresh] = useState(null);
  const [countdown, setCountdown] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [customPharma, setCustomPharma] = useState([]);
  const [customDiag, setCustomDiag] = useState([]);
  const [customDataPharma, setCustomDataPharma] = useState({});
  const [customDataDiag, setCustomDataDiag] = useState({});

  const T = theme === "dark"
    ? { bg: "#080810", surface: "#0c0c18", border: "#151528", text: "#ddd5c5", muted: "#444", accent: "#ff8c00" }
    : { bg: "#f5f3ee", surface: "#ffffff", border: "#e0dbd0", text: "#1a1510", muted: "#888", accent: "#c47000" };

  const baseCompanies = sector === "pharmacy" ? PHARMACY_COMPANIES : DIAGNOSTIC_COMPANIES;
  const customCompanies = sector === "pharmacy" ? customPharma : customDiag;
  const companies = [...baseCompanies, ...customCompanies];
  const customDataCurrent = sector === "pharmacy" ? customDataPharma : customDataDiag;
  const baseFinancialData = sector === "pharmacy" ? pharmaData : diagData;
  const financialData = baseFinancialData
    ? [...baseFinancialData, ...Object.values(customDataCurrent)]
    : Object.keys(customDataCurrent).length > 0 ? Object.values(customDataCurrent) : null;
  const benchmark = TATA_1MG_BENCHMARK[sector];
  const regions = ["All", ...Array.from(new Set(companies.map(c => c.region)))];
  const filtered = activeRegion === "All" ? companies : companies.filter(c => c.region === activeRegion);
  const allCompanyNames = companies.map(c => c.name);

  function handleAddCompany(newCompany, addSector, financialPreview) {
    if (addSector === "pharmacy") {
      const updated = [...customPharma.filter(c => c.name !== newCompany.name), newCompany];
      setCustomPharma(updated);
      try { localStorage.setItem("mb_custom_pharma", JSON.stringify(updated)); } catch {}
      if (financialPreview) {
        const updatedData = { ...customDataPharma, [newCompany.name]: { ...financialPreview, company: newCompany.name } };
        setCustomDataPharma(updatedData);
        try { localStorage.setItem("mb_custom_data_pharma", JSON.stringify(updatedData)); } catch {}
      }
    } else {
      const updated = [...customDiag.filter(c => c.name !== newCompany.name), newCompany];
      setCustomDiag(updated);
      try { localStorage.setItem("mb_custom_diag", JSON.stringify(updated)); } catch {}
      if (financialPreview) {
        const updatedData = { ...customDataDiag, [newCompany.name]: { ...financialPreview, company: newCompany.name } };
        setCustomDataDiag(updatedData);
        try { localStorage.setItem("mb_custom_data_diag", JSON.stringify(updatedData)); } catch {}
      }
    }
    setShowSearch(false);
  }

  function handleRemoveCompany(name) {
    if (sector === "pharmacy") {
      const updated = customPharma.filter(c => c.name !== name);
      setCustomPharma(updated);
      try { localStorage.setItem("mb_custom_pharma", JSON.stringify(updated)); } catch {}
      const { [name]: _, ...rest } = customDataPharma;
      setCustomDataPharma(rest);
      try { localStorage.setItem("mb_custom_data_pharma", JSON.stringify(rest)); } catch {}
    } else {
      const updated = customDiag.filter(c => c.name !== name);
      setCustomDiag(updated);
      try { localStorage.setItem("mb_custom_diag", JSON.stringify(updated)); } catch {}
      const { [name]: _, ...rest } = customDataDiag;
      setCustomDataDiag(rest);
      try { localStorage.setItem("mb_custom_data_diag", JSON.stringify(rest)); } catch {}
    }
  }

  useEffect(() => {
    setMounted(true);
    try {
      const t = localStorage.getItem("mb_theme"); if (t) setTheme(t);
      const cp = localStorage.getItem("mb_custom_pharma"); if (cp) setCustomPharma(JSON.parse(cp));
      const cd = localStorage.getItem("mb_custom_diag");  if (cd) setCustomDiag(JSON.parse(cd));
      const cdp = localStorage.getItem("mb_custom_data_pharma"); if (cdp) setCustomDataPharma(JSON.parse(cdp));
      const cdd = localStorage.getItem("mb_custom_data_diag");  if (cdd) setCustomDataDiag(JSON.parse(cdd));
    } catch {}
  }, []);

  useEffect(() => { if (mounted && !financialData) fetchFinancials(); }, [mounted, sector]);

  // Auto-refresh every 6 hours
  useEffect(() => {
    if (!mounted) return;
    const next = new Date(Date.now() + AUTO_REFRESH_INTERVAL);
    setNextRefresh(next);
    const interval = setInterval(() => { fetchFinancials(); }, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [mounted, sector]);

  // Countdown timer
  useEffect(() => {
    if (!nextRefresh) return;
    const timer = setInterval(() => {
      const diff = nextRefresh - Date.now();
      if (diff <= 0) { setCountdown("Refreshing..."); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, [nextRefresh]);

  async function fetchFinancials() {
    setLoading(true);
    const list = companies.map(c => `${c.name} (${c.region}, ${c.currency})`).join(", ");
    try {
      const text = await callClaude(
        `Latest financial data for these ${sector} companies: ${list}.

Return a JSON array, one item per company:
{
  "company": "name", "region": "", "currency": "", "status": "Listed|Private|Startup",
  "gmv_orig": "", "gmv_inr": "",
  "revenue_orig": "", "revenue_inr": "",
  "cac_orig": "", "cac_inr": "",
  "ltv_orig": "", "ltv_inr": "",
  "ltv_cac": "",
  "contribution_margin": "",
  "burn_orig": "", "burn_inr": "",
  "runway": "",
  "take_rate": "",
  "order_margin_orig": "", "order_margin_inr": "",
  "yoy_growth": "",
  "gross_margin": "",
  "ebitda_margin": "",
  "valuation_orig": "", "valuation_inr": "",
  "key_metric": "one standout metric",
  "vs_1mg": "1 sentence vs TATA 1MG",
  "threat": "high|medium|low",
  "revenue_sparkline": [num, num, num, num, num, num]
}
FX: USD=84, GBP=107, EUR=91, CNY=11.5, SGD=62, AUD=55, HKD=11, CHF=95. Return ONLY JSON array.`
      );
      const parsed = parseJSON(text);
      if (Array.isArray(parsed)) {
        if (sector === "pharmacy") setPharmaData(parsed);
        else setDiagData(parsed);
        setLastRefresh(new Date());
        setNextRefresh(new Date(Date.now() + AUTO_REFRESH_INTERVAL));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function generateInsight() {
    setInsightLoading(true); setAiInsight("");
    try {
      const text = await callClaude(
        `Strategic advisory to TATA 1MG CFO on the ${sector} competitive financial landscape. Write 4 sentences: (1) where TATA 1MG's unit economics stand vs global peers, (2) biggest financial threat, (3) one unit economics lever to pull in next 6 months, (4) one global benchmark to aspire to.`,
        "You are a senior healthcare strategist. Write crisp analytical prose. No bullet points."
      );
      setAiInsight(text);
    } catch { setAiInsight("Could not generate insight. Retry."); }
    setInsightLoading(false);
  }

  async function exportToCSV() {
    if (!financialData) return;
    try {
      const rows = filtered.map(comp => {
        const d = financialData.find(f => f.company === comp.name) || {};
        return {
          Company: comp.name, Region: comp.region, Currency: comp.currency,
          Status: d.status || "-", "GMV (Orig)": d.gmv_orig || "-", "GMV INR Cr": d.gmv_inr || "-",
          "Revenue (Orig)": d.revenue_orig || "-", "Revenue INR Cr": d.revenue_inr || "-",
          "CAC (Orig)": d.cac_orig || "-", "CAC INR": d.cac_inr || "-",
          "LTV (Orig)": d.ltv_orig || "-", "LTV INR": d.ltv_inr || "-",
          "LTV:CAC": d.ltv_cac || "-", "Contribution Margin": d.contribution_margin || "-",
          "Burn (Orig)": d.burn_orig || "-", "Burn INR Cr/mo": d.burn_inr || "-",
          Runway: d.runway || "-", "Take Rate": d.take_rate || "-",
          "Order Margin (Orig)": d.order_margin_orig || "-", "Order Margin INR": d.order_margin_inr || "-",
          "YoY Growth": d.yoy_growth || "-", "Valuation (Orig)": d.valuation_orig || "-",
          "Valuation INR Cr": d.valuation_inr || "-", "vs TATA 1MG": d.vs_1mg || "-",
        };
      });
      const res = await fetch("/api/export", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "csv", data: rows, title: "competitor-financials-" + sector }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = "1mg-competitor-financials-" + sector + ".csv"; a.click();
    } catch (e) { console.error(e); }
  }

  async function exportToPDF() {
    if (!financialData) return;
    try {
      const rows = filtered.map(comp => {
        const d = financialData.find(f => f.company === comp.name) || {};
        return { company: comp.name, region: comp.region, gmv_inr: d.gmv_inr, cac_inr: d.cac_inr, ltv_inr: d.ltv_inr, ltv_cac: d.ltv_cac, contribution_margin: d.contribution_margin, yoy_growth: d.yoy_growth, valuation_inr: d.valuation_inr };
      });
      const res = await fetch("/api/export", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "html-pdf", data: { companies: rows, summary: aiInsight || "TATA 1MG Competitive Financial Intelligence" }, title: "1MG Competitor Report - " + new Date().toLocaleDateString() }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (e) { console.error(e); }
  }

  const METRIC_FIELDS = {
    gmv:             { orig: "gmv_orig",           inr: "gmv_inr" },
    cac:             { orig: "cac_orig",            inr: "cac_inr" },
    ltv:             { orig: "ltv_orig",            inr: "ltv_inr" },
    contribution:    { orig: "contribution_margin", inr: "contribution_margin" },
    burn:            { orig: "burn_orig",           inr: "burn_inr" },
    order_economics: { orig: "order_margin_orig",   inr: "order_margin_inr" },
    take_rate:       { orig: "take_rate",           inr: "take_rate" },
  };

  if (!mounted) return (
    <div style={{ minHeight: "100vh", background: "#080810", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#ff8c00", fontFamily: "Georgia", fontSize: "13px", letterSpacing: "0.2em" }}>LOADING...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        table { border-collapse: collapse; width: 100%; }
        th { font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; color: ${T.muted}; font-weight: normal; padding: 9px 11px; border-bottom: 1px solid ${T.border}; white-space: nowrap; }
        td { padding: 8px 11px; border-bottom: 1px solid ${T.border}; font-size: 11px; }
        tr:hover td { background: ${T.border}44; }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 2px; }
        button { font-family: Georgia, serif; cursor: pointer; }
      `}</style>

      {/* Header */}
      <header style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "16px 18px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ fontSize: "10px", color: T.accent, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "3px" }}>◆ Competitive Financial Intelligence</div>
            <h1 style={{ fontSize: "clamp(16px,3.5vw,24px)", fontWeight: "normal", color: T.text, marginBottom: "2px" }}>Global Competitor Financials</h1>
            <p style={{ fontSize: "11px", color: T.muted, fontStyle: "italic" }}>
              {companies.length} companies · Original currency + INR · Tap any company for trends & drill-down
            </p>
            {lastRefresh && (
              <div style={{ fontSize: "10px", color: T.muted, marginTop: "3px" }}>
                Last updated: {lastRefresh.toLocaleTimeString()} ·
                <span style={{ color: T.accent }}> Auto-refresh in {countdown}</span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => setShowSearch(s => !s)} style={{ background: showSearch ? "#2196f3" : "none", color: showSearch ? "#fff" : T.muted, border: `1px solid ${showSearch ? "#2196f3" : T.border}`, padding: "6px 12px", borderRadius: "4px", fontSize: "11px" }}>
              {showSearch ? "✕ Close Search" : "＋ Add Company"}
            </button>
            <button onClick={exportToCSV} disabled={!financialData} style={{ background: financialData ? "#4caf50" : T.border, color: financialData ? "#000" : T.muted, border: "none", borderRadius: "4px", padding: "6px 12px", fontSize: "11px", fontWeight: "bold" }}>⬇ Excel</button>
            <button onClick={exportToPDF} disabled={!financialData} style={{ background: financialData ? "#ef5350" : T.border, color: financialData ? "#fff" : T.muted, border: "none", borderRadius: "4px", padding: "6px 12px", fontSize: "11px", fontWeight: "bold" }}>⬇ PDF</button>
            <button onClick={fetchFinancials} style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, padding: "6px 12px", borderRadius: "4px", fontSize: "11px" }}>↻ Refresh Now</button>
            <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, padding: "6px 10px", borderRadius: "4px", fontSize: "14px" }}>{theme === "dark" ? "☀️" : "🌙"}</button>
            <a href="/intelligence" style={{ background: "#9c27b0", color: "#fff", padding: "7px 12px", borderRadius: "4px", fontSize: "11px", textDecoration: "none", fontWeight: "bold" }}>🧠 Intelligence</a>
            <a href="/" style={{ background: T.accent, color: "#000", padding: "7px 14px", borderRadius: "4px", fontSize: "11px", textDecoration: "none", fontWeight: "bold" }}>← News</a>
          </div>
        </div>

        {/* Sector toggle */}
        <div style={{ display: "flex", marginTop: "12px", border: `1px solid ${T.border}`, borderRadius: "4px", overflow: "hidden", width: "fit-content" }}>
          {[["pharmacy", "💊 Pharmacy & Health-tech", PHARMACY_COMPANIES.length], ["diagnostics", "🔬 Diagnostics", DIAGNOSTIC_COMPANIES.length]].map(([s, l, count]) => (
            <button key={s} onClick={() => { setSector(s); setActiveRegion("All"); setAiInsight(""); }}
              style={{ padding: "8px 16px", background: sector === s ? T.accent : "none", color: sector === s ? "#000" : T.muted, border: "none", fontSize: "12px", fontWeight: sector === s ? "bold" : "normal" }}>
              {l} <span style={{ fontSize: "10px", opacity: 0.7 }}>({count})</span>
            </button>
          ))}
        </div>
      </header>

      <main style={{ padding: "14px", maxWidth: "1200px", margin: "0 auto" }}>

        {/* TATA 1MG benchmark */}
        <div style={{ background: T.accent + "12", border: `1px solid ${T.accent}33`, borderLeft: `3px solid ${T.accent}`, borderRadius: "4px", padding: "12px 16px", marginBottom: "14px" }}>
          <div style={{ fontSize: "10px", color: T.accent, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>🔵 TATA 1MG Baseline ({sector === "pharmacy" ? "Pharmacy" : "Diagnostics"})</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "18px" }}>
            {Object.entries(benchmark).map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: "9px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>{k.replace(/_/g, " ")}</div>
                <div style={{ fontSize: "13px", color: T.accent, fontWeight: "bold" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Search & Add Company */}
        {showSearch && (
          <SearchAddCompany
            theme={theme}
            onAdd={handleAddCompany}
            existingNames={allCompanyNames}
          />
        )}

        {/* Custom companies summary */}
        {customCompanies.length > 0 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px", padding: "10px 14px", background: "#2196f310", border: "1px solid #2196f333", borderRadius: "4px" }}>
            <span style={{ fontSize: "10px", color: "#2196f3", textTransform: "uppercase", letterSpacing: "0.1em", alignSelf: "center" }}>Custom:</span>
            {customCompanies.map(c => (
              <span key={c.name} style={{ fontSize: "11px", padding: "3px 10px", background: c.color + "22", border: `1px solid ${c.color}55`, borderRadius: "20px", color: c.color, display: "flex", gap: "6px", alignItems: "center" }}>
                {c.flag} {c.name}
                <button onClick={() => handleRemoveCompany(c.name)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef5350", fontSize: "10px", padding: 0, lineHeight: 1 }}>✕</button>
              </span>
            ))}
          </div>
        )}

        {/* AI Insight */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: "3px solid #9c27b0", borderRadius: "4px", padding: "13px 16px", marginBottom: "14px" }}>
          <div style={{ fontSize: "10px", color: "#9c27b0", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px" }}>◆ AI Strategic Insight</div>
          {insightLoading
            ? <p style={{ color: T.muted, fontStyle: "italic", fontSize: "13px", animation: "pulse 1.5s infinite" }}>Generating analysis…</p>
            : aiInsight
            ? <p style={{ lineHeight: 1.78, color: T.text, fontSize: "13px" }}>{aiInsight}</p>
            : <p style={{ color: T.muted, fontStyle: "italic", fontSize: "13px" }}>Get an AI-powered CFO briefing on the competitive landscape.</p>
          }
          <button onClick={generateInsight} disabled={insightLoading}
            style={{ marginTop: "10px", padding: "7px 16px", background: insightLoading ? "none" : "#9c27b0", color: insightLoading ? T.muted : "#fff", border: `1px solid ${insightLoading ? T.border : "#9c27b0"}`, borderRadius: "3px", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {insightLoading ? "Thinking…" : "Generate Insight"}
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
          {regions.map(r => (
            <button key={r} onClick={() => setActiveRegion(r)} style={{ background: activeRegion === r ? T.accent : "none", color: activeRegion === r ? "#000" : T.muted, border: `1px solid ${activeRegion === r ? T.accent : T.border}`, padding: "5px 12px", borderRadius: "20px", fontSize: "11px" }}>
              {r === "India" ? "🇮🇳" : r === "USA" ? "🇺🇸" : r === "Europe" ? "🇪🇺" : r === "Asia" ? "🌏" : r === "Australia" ? "🇦🇺" : "🌐"} {r}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "6px", marginBottom: "14px", overflowX: "auto", paddingBottom: "4px" }}>
          {METRICS.map(m => (
            <button key={m.id} onClick={() => setActiveMetric(m.id)} style={{ background: activeMetric === m.id ? T.accent + "22" : "none", color: activeMetric === m.id ? T.accent : T.muted, border: `1px solid ${activeMetric === m.id ? T.accent : T.border}`, padding: "5px 11px", borderRadius: "4px", fontSize: "11px", whiteSpace: "nowrap", flexShrink: 0 }}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {/* Company cards */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: "28px", animation: "pulse 1.1s infinite", marginBottom: "12px" }}>📊</div>
            <div style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: T.muted }}>Fetching data for {companies.length} companies…</div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "10px", marginBottom: "20px" }}>
              {filtered.map((comp, i) => {
                const d = financialData?.find(f => f.company === comp.name);
                const fields = METRIC_FIELDS[activeMetric];
                const origVal = d?.[fields.orig] || "—";
                const inrVal = fields.orig !== fields.inr ? d?.[fields.inr] : null;
                const sparkData = d?.revenue_sparkline;
                const threatColor = d?.threat === "high" ? "#ef5350" : d?.threat === "medium" ? "#ff8c00" : "#4caf50";
                return (
                  <div key={i} onClick={() => setSelectedCompany(comp)}
                    style={{ background: T.surface, border: `1px solid ${selectedCompany?.name === comp.name ? comp.color : T.border}`, borderTop: `3px solid ${comp.color}`, borderRadius: "4px", padding: "13px", animation: `fadeUp 0.3s ease ${i * 0.03}s both`, cursor: "pointer", transition: "border-color .2s, transform .2s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = comp.color; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = selectedCompany?.name === comp.name ? comp.color : T.border; e.currentTarget.style.transform = "translateY(0)"; }}>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div>
                        <div style={{ fontSize: "13px", color: T.text, fontWeight: "bold" }}>{comp.flag} {comp.name}</div>
                        <div style={{ fontSize: "9px", color: T.muted, marginTop: "2px" }}>{comp.region} · {comp.currency}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
                        <span style={{ fontSize: "8px", padding: "1px 6px", border: `1px solid ${comp.color}44`, borderRadius: "10px", color: comp.color }}>{d?.status || "—"}</span>
                        {d?.threat && <span style={{ fontSize: "8px", color: threatColor }}>● {d.threat}</span>}
                      </div>
                    </div>

                    {/* Active metric value */}
                    <div style={{ marginBottom: "8px" }}>
                      <div style={{ fontSize: "9px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{METRICS.find(m => m.id === activeMetric)?.label}</div>
                      <div style={{ fontSize: "16px", color: comp.color, fontWeight: "bold" }}>{origVal}</div>
                      {inrVal && inrVal !== origVal && <div style={{ fontSize: "10px", color: T.muted }}>≈ {inrVal} (INR)</div>}
                    </div>

                    {/* Sparkline */}
                    {sparkData && (
                      <div style={{ marginBottom: "8px" }}>
                        <div style={{ fontSize: "9px", color: T.muted, marginBottom: "3px" }}>Revenue trend (FY20→FY25E)</div>
                        <Sparkline data={sparkData} color={comp.color} width={100} height={28} />
                      </div>
                    )}

                    {/* Quick stats */}
                    {d && (
                      <div style={{ display: "flex", gap: "8px", fontSize: "10px", color: T.muted, paddingTop: "8px", borderTop: `1px solid ${T.border}`, flexWrap: "wrap" }}>
                        <span>LTV:CAC <b style={{ color: T.text }}>{d.ltv_cac || "—"}</b></span>
                        <span>↑ <b style={{ color: "#4caf50" }}>{d.yoy_growth || "—"}</b></span>
                        <span>CM <b style={{ color: T.text }}>{d.contribution_margin || "—"}</b></span>
                      </div>
                    )}
                    {d?.vs_1mg && <div style={{ fontSize: "10px", color: T.muted, marginTop: "6px", fontStyle: "italic" }}>{d.vs_1mg}</div>}
                    <div style={{ fontSize: "9px", color: comp.color, marginTop: "6px", opacity: 0.7 }}>📊 Tap for trends & drill-down →</div>
                  </div>
                );
              })}
            </div>

            {/* Full comparison table */}
            {financialData && (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "4px", overflowX: "auto", marginBottom: "20px" }}>
                <div style={{ padding: "11px 14px", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: "10px", color: T.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>◆ Full Comparison — Original + INR · Click any row for deep dive</div>
                </div>
                <table>
                  <thead>
                    <tr style={{ background: T.bg }}>
                      <th>Company</th>
                      <th>GMV</th><th>GMV ₹Cr</th>
                      <th>CAC</th><th>CAC ₹</th>
                      <th>LTV</th><th>LTV ₹</th>
                      <th>LTV:CAC</th>
                      <th>Contrib%</th>
                      <th>Burn</th>
                      <th>Take Rate</th>
                      <th>Order Margin ₹</th>
                      <th>Growth</th>
                      <th>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ background: T.accent + "10" }}>
                      <td style={{ color: T.accent, fontWeight: "bold", whiteSpace: "nowrap" }}>🔵 TATA 1MG</td>
                      <td style={{ color: T.accent }}>{benchmark.gmv}</td>
                      <td style={{ color: T.accent }}>{benchmark.gmv}</td>
                      <td style={{ color: T.accent }}>{benchmark.cac}</td>
                      <td style={{ color: T.accent }}>{benchmark.cac}</td>
                      <td style={{ color: T.accent }}>{benchmark.ltv}</td>
                      <td style={{ color: T.accent }}>{benchmark.ltv}</td>
                      <td style={{ color: T.accent }}>{benchmark.ltv_cac}</td>
                      <td style={{ color: T.accent }}>{benchmark.contribution}</td>
                      <td style={{ color: T.accent }}>{benchmark.burn}</td>
                      <td style={{ color: T.accent }}>{benchmark.take_rate}</td>
                      <td style={{ color: "#4caf50" }}>{benchmark.order_margin}</td>
                      <td style={{ color: "#4caf50" }}>{benchmark.growth}</td>
                      <td>—</td>
                    </tr>
                    {filtered.map((comp, i) => {
                      const d = financialData.find(f => f.company === comp.name);
                      const ltvcac = parseFloat(d?.ltv_cac);
                      const ltvcacColor = ltvcac > 4 ? "#4caf50" : ltvcac > 2 ? "#ff8c00" : "#ef5350";
                      const growthColor = parseFloat(d?.yoy_growth) > 25 ? "#4caf50" : T.text;
                      return (
                        <tr key={i} onClick={() => setSelectedCompany(comp)} style={{ cursor: "pointer" }}>
                          <td style={{ color: comp.color, fontWeight: "bold", whiteSpace: "nowrap" }}>{comp.flag} {comp.name}</td>
                          <td>{d?.gmv_orig || "—"}</td>
                          <td style={{ color: T.muted }}>{d?.gmv_inr || "—"}</td>
                          <td>{d?.cac_orig || "—"}</td>
                          <td style={{ color: T.muted }}>{d?.cac_inr || "—"}</td>
                          <td>{d?.ltv_orig || "—"}</td>
                          <td style={{ color: T.muted }}>{d?.ltv_inr || "—"}</td>
                          <td style={{ color: ltvcacColor, fontWeight: "bold" }}>{d?.ltv_cac || "—"}</td>
                          <td>{d?.contribution_margin || "—"}</td>
                          <td>{d?.burn_orig || "—"}</td>
                          <td>{d?.take_rate || "—"}</td>
                          <td style={{ color: d?.order_margin_inr?.includes("-") ? "#ef5350" : "#4caf50" }}>{d?.order_margin_inr || "—"}</td>
                          <td style={{ color: growthColor }}>{d?.yoy_growth || "—"}</td>
                          <td>{d?.revenue_sparkline ? <Sparkline data={d.revenue_sparkline} color={comp.color} width={60} height={20} /> : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {/* Company detail modal */}
      {selectedCompany && (
        <CompanyModal
          company={selectedCompany}
          sector={sector}
          theme={theme}
          onClose={() => setSelectedCompany(null)}
        />
      )}
    </div>
  );
}
