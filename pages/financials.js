import { useState, useEffect } from "react";

const PHARMACY_COMPANIES = [
  // India
  { name: "Apollo 247",     region: "India",  flag: "🇮🇳", color: "#0056a3", currency: "INR", symbol: "₹" },
  { name: "Practo",         region: "India",  flag: "🇮🇳", color: "#2d9cdb", currency: "INR", symbol: "₹" },
  { name: "Netmeds",        region: "India",  flag: "🇮🇳", color: "#e91e63", currency: "INR", symbol: "₹" },
  { name: "Medlife",        region: "India",  flag: "🇮🇳", color: "#ff5722", currency: "INR", symbol: "₹" },
  { name: "PharmEasy",      region: "India",  flag: "🇮🇳", color: "#6c3bbf", currency: "INR", symbol: "₹" },
  { name: "Medkart",        region: "India",  flag: "🇮🇳", color: "#00897b", currency: "INR", symbol: "₹" },
  { name: "1mg (pre-TATA)", region: "India",  flag: "🇮🇳", color: "#e53935", currency: "INR", symbol: "₹" },
  // USA
  { name: "CVS Health",     region: "USA",    flag: "🇺🇸", color: "#cc0000", currency: "USD", symbol: "$" },
  { name: "Walgreens",      region: "USA",    flag: "🇺🇸", color: "#e31837", currency: "USD", symbol: "$" },
  { name: "Amazon Pharmacy",region: "USA",    flag: "🇺🇸", color: "#ff9900", currency: "USD", symbol: "$" },
  { name: "Capsule",        region: "USA",    flag: "🇺🇸", color: "#5c6bc0", currency: "USD", symbol: "$" },
  { name: "Hims & Hers",    region: "USA",    flag: "🇺🇸", color: "#00bcd4", currency: "USD", symbol: "$" },
  { name: "GoodRx",         region: "USA",    flag: "🇺🇸", color: "#1976d2", currency: "USD", symbol: "$" },
  { name: "Alto Pharmacy",  region: "USA",    flag: "🇺🇸", color: "#388e3c", currency: "USD", symbol: "$" },
  // Europe
  { name: "Boots UK",       region: "Europe", flag: "🇬🇧", color: "#003087", currency: "GBP", symbol: "£" },
  { name: "DocMorris",      region: "Europe", flag: "🇩🇪", color: "#00a651", currency: "EUR", symbol: "€" },
  { name: "Zur Rose",       region: "Europe", flag: "🇨🇭", color: "#e53935", currency: "CHF", symbol: "Fr" },
  // Asia
  { name: "Ping An Health", region: "Asia",   flag: "🇨🇳", color: "#f5a623", currency: "CNY", symbol: "¥" },
  { name: "Guardian Health",region: "Asia",   flag: "🇸🇬", color: "#0f9d58", currency: "SGD", symbol: "S$" },
  { name: "Watsons",        region: "Asia",   flag: "🌏", color: "#7b1fa2", currency: "HKD", symbol: "HK$" },
  { name: "Halodoc",        region: "Asia",   flag: "🇮🇩", color: "#43a047", currency: "IDR", symbol: "Rp" },
];

const DIAGNOSTIC_COMPANIES = [
  // India
  { name: "Thyrocare",         region: "India",     flag: "🇮🇳", color: "#1565c0", currency: "INR", symbol: "₹" },
  { name: "Dr Lal PathLabs",   region: "India",     flag: "🇮🇳", color: "#c62828", currency: "INR", symbol: "₹" },
  { name: "Metropolis",        region: "India",     flag: "🇮🇳", color: "#6a1b9a", currency: "INR", symbol: "₹" },
  { name: "SRL Diagnostics",   region: "India",     flag: "🇮🇳", color: "#00838f", currency: "INR", symbol: "₹" },
  { name: "Redcliffe Labs",     region: "India",     flag: "🇮🇳", color: "#ad1457", currency: "INR", symbol: "₹" },
  { name: "Healthians",         region: "India",     flag: "🇮🇳", color: "#2e7d32", currency: "INR", symbol: "₹" },
  // USA
  { name: "Quest Diagnostics", region: "USA",       flag: "🇺🇸", color: "#1976d2", currency: "USD", symbol: "$" },
  { name: "LabCorp",           region: "USA",       flag: "🇺🇸", color: "#0d47a1", currency: "USD", symbol: "$" },
  // Global
  { name: "Sonic Healthcare",  region: "Australia", flag: "🇦🇺", color: "#00838f", currency: "AUD", symbol: "A$" },
  { name: "Eurofins",          region: "Europe",    flag: "🇪🇺", color: "#283593", currency: "EUR", symbol: "€" },
  { name: "Synlab",            region: "Europe",    flag: "🇩🇪", color: "#00695c", currency: "EUR", symbol: "€" },
  { name: "Medi-Lab",          region: "Asia",      flag: "🌏", color: "#4527a0", currency: "USD", symbol: "$" },
];

const TATA_1MG_BENCHMARK = {
  pharmacy: {
    gmv: { orig: "₹8,500 Cr", inr: "₹8,500 Cr" },
    revenue: { orig: "₹1,820 Cr", inr: "₹1,820 Cr" },
    cac: { orig: "₹900–1,200", inr: "₹900–1,200" },
    ltv: { orig: "₹4,500–6,000", inr: "₹4,500–6,000" },
    ltv_cac: "4.5x",
    contribution: "13–15%",
    burn: "₹80–120 Cr/month",
    runway: "24+ months",
    take_rate: "18–22%",
    order_rev: "₹420", order_cost: "₹380", order_margin: "₹40",
    growth: "35–40%",
    valuation: "₹12,000–15,000 Cr",
  },
  diagnostics: {
    gmv: { orig: "₹1,200 Cr", inr: "₹1,200 Cr" },
    revenue: { orig: "₹1,200 Cr", inr: "₹1,200 Cr" },
    cac: { orig: "₹600–900", inr: "₹600–900" },
    ltv: { orig: "₹3,500–5,000", inr: "₹3,500–5,000" },
    ltv_cac: "5.2x",
    contribution: "22–26%",
    burn: "Profitable",
    runway: "Profitable",
    take_rate: "N/A",
    order_rev: "₹680", order_cost: "₹520", order_margin: "₹160",
    growth: "28–32%",
    valuation: "₹8,000–10,000 Cr",
  },
};

const FX = { USD: 84, GBP: 107, EUR: 91, CNY: 11.5, SGD: 62, HKD: 11, AUD: 55, CHF: 95, IDR: 0.0052 };

function toINR(value, currency) {
  if (currency === "INR") return value;
  return (value * (FX[currency] || 1)).toFixed(0);
}

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
      system: system || "You are a senior healthcare financial analyst. Return only raw JSON. No markdown fences, no preamble.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content[0].text;
}

export default function Financials() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [sector, setSector] = useState("pharmacy"); // pharmacy | diagnostics
  const [activeRegion, setActiveRegion] = useState("All");
  const [activeMetric, setActiveMetric] = useState("gmv");
  const [pharmaData, setPharmaData] = useState(null);
  const [diagData, setDiagData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyDetail, setCompanyDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [ueData, setUeData] = useState(null);
  const [ueLoading, setUeLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

  const T = theme === "dark" ? {
    bg: "#080810", surface: "#0c0c18", border: "#151528", text: "#ddd5c5",
    muted: "#444", accent: "#ff8c00", sub: "#0a0a14",
  } : {
    bg: "#f5f3ee", surface: "#ffffff", border: "#e0dbd0", text: "#1a1510",
    muted: "#888", accent: "#c47000", sub: "#faf8f3",
  };

  const companies = sector === "pharmacy" ? PHARMACY_COMPANIES : DIAGNOSTIC_COMPANIES;
  const financialData = sector === "pharmacy" ? pharmaData : diagData;
  const benchmark = TATA_1MG_BENCHMARK[sector];

  const regions = ["All", ...Array.from(new Set(companies.map(c => c.region)))];
  const filtered = activeRegion === "All" ? companies : companies.filter(c => c.region === activeRegion);

  useEffect(() => { setMounted(true); try { const t = localStorage.getItem("mb_theme"); if (t) setTheme(t); } catch {} }, []);
  useEffect(() => { if (mounted && !financialData) fetchFinancials(); }, [mounted, sector]);

  async function fetchFinancials() {
    setLoading(true);
    const list = companies.map(c => `${c.name} (${c.region}, ${c.currency})`).join(", ");
    const isMed = sector === "diagnostics";
    try {
      const text = await callClaude(
        `Provide latest financial data for these ${isMed ? "diagnostic" : "pharmacy/health-tech"} companies: ${list}.

For EACH company return one JSON array item with ALL these fields:
{
  "company": "exact name",
  "region": "region",
  "currency": "local currency code",
  "status": "Listed|Private|Startup",
  "founded": "year",
  "employees": "approx number",
  "last_funding": "e.g. Series D $200M or Listed or N/A",
  "gmv_orig": "GMV in local currency with unit e.g. $150B or ₹8500 Cr",
  "gmv_inr": "converted to INR Cr",
  "revenue_orig": "revenue in local currency with unit",
  "revenue_inr": "converted to INR Cr",
  "cac_orig": "CAC in local currency e.g. $45 or ₹900",
  "cac_inr": "CAC in INR",
  "ltv_orig": "LTV in local currency",
  "ltv_inr": "LTV in INR",
  "ltv_cac": "ratio e.g. 4.2x",
  "contribution_margin": "% e.g. 14%",
  "burn_orig": "monthly burn in local currency or Profitable",
  "burn_inr": "monthly burn in INR Cr or Profitable",
  "runway": "months or Profitable",
  "take_rate": "% or N/A",
  "order_rev_orig": "avg revenue per order in local currency",
  "order_rev_inr": "in INR",
  "order_cost_orig": "avg cost per order in local currency",
  "order_cost_inr": "in INR",
  "order_margin_orig": "avg margin per order in local currency",
  "order_margin_inr": "in INR",
  "yoy_growth": "% e.g. 35%",
  "gross_margin": "% e.g. 40%",
  "ebitda_margin": "% or negative e.g. -12%",
  "valuation_orig": "in local currency",
  "valuation_inr": "in INR Cr",
  "market_cap_usd": "if listed, in USD billion",
  "key_metric": "one standout metric that defines this company",
  "vs_1mg": "1 sentence comparison vs TATA 1MG",
  "threat": "high|medium|low"
}

Use FX rates: USD=₹84, GBP=₹107, EUR=₹91, CNY=₹11.5, SGD=₹62, AUD=₹55, CHF=₹95.
Use publicly known data, analyst estimates, or news. Return ONLY a JSON array.`
      );
      const parsed = parseJSON(text);
      if (Array.isArray(parsed)) {
        if (sector === "pharmacy") setPharmaData(parsed);
        else setDiagData(parsed);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function fetchUnitEconomics() {
    setUeLoading(true); setUeData(null);
    const list = companies.map(c => c.name).join(", ");
    try {
      const text = await callClaude(
        `Compare unit economics for ${sector} companies: ${list} vs TATA 1MG.

Return JSON:
{
  "summary": "3 sentence overview of unit economics landscape",
  "best_ltv_cac": "company with best ratio and value",
  "lowest_cac": "most efficient acquirer",
  "highest_contribution": "best contribution margin",
  "tata_1mg_vs_peers": "2 sentences on TATA 1MG position",
  "global_benchmarks": {
    "india_cac_range": "e.g. ₹600–1,200",
    "usa_cac_range": "e.g. $30–80 (₹2,520–6,720)",
    "europe_cac_range": "e.g. €20–50 (₹1,820–4,550)",
    "india_ltv_cac": "typical range",
    "global_ltv_cac": "typical range",
    "india_contribution": "typical range",
    "global_contribution": "typical range",
    "india_take_rate": "typical range",
    "global_take_rate": "typical range"
  },
  "regional_comparison": [
    {"metric": "CAC", "india": "₹900 avg", "usa": "$45 / ₹3,780", "europe": "€30 / ₹2,730", "asia": "equiv ₹1,200"},
    {"metric": "LTV", "india": "₹5,000 avg", "usa": "$280 / ₹23,520", "europe": "€200 / ₹18,200", "asia": "equiv ₹8,000"},
    {"metric": "LTV:CAC", "india": "4.5x", "usa": "6.2x", "europe": "5.8x", "asia": "5.1x"},
    {"metric": "Contribution Margin", "india": "13%", "usa": "22%", "europe": "19%", "asia": "16%"},
    {"metric": "Take Rate", "india": "18%", "usa": "25%", "europe": "22%", "asia": "20%"},
    {"metric": "Burn/Revenue", "india": "45%", "usa": "8% or profitable", "europe": "12%", "asia": "20%"}
  ],
  "recommendations": ["specific recommendation 1 for TATA 1MG", "recommendation 2", "recommendation 3"],
  "risk_flags": ["risk flag 1", "risk flag 2"],
  "opportunities": ["opportunity 1 from benchmarking", "opportunity 2"]
}
Return ONLY the JSON object.`
      );
      const parsed = parseJSON(text);
      if (parsed) setUeData(parsed);
    } catch (e) { console.error(e); }
    setUeLoading(false);
  }

  async function fetchCompanyDetail(company) {
    setSelectedCompany(company);
    setCompanyDetail(null);
    setDetailLoading(true);
    try {
      const text = await callClaude(
        `Deep dive financial analysis for ${company.name} (${company.region}, ${sector}).

Return JSON:
{
  "overview": "2 sentence company overview",
  "business_model": "how they make money in 2 sentences",
  "fy_financials": [
    {"year":"FY22","revenue_orig":"","revenue_inr":"","profit_loss_orig":"","profit_loss_inr":"","growth":""},
    {"year":"FY23","revenue_orig":"","revenue_inr":"","profit_loss_orig":"","profit_loss_inr":"","growth":""},
    {"year":"FY24","revenue_orig":"","revenue_inr":"","profit_loss_orig":"","profit_loss_inr":"","growth":""}
  ],
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
  "strengths": ["s1","s2","s3"],
  "weaknesses": ["w1","w2"],
  "strategic_moves": ["move1","move2"],
  "threat_to_1mg": "high|medium|low",
  "threat_reason": "1 sentence",
  "latest_news": "most recent significant development"
}
Use FX: USD=₹84, GBP=₹107, EUR=₹91, CNY=₹11.5, SGD=₹62, AUD=₹55. Return ONLY JSON.`
      );
      const parsed = parseJSON(text);
      if (parsed) setCompanyDetail(parsed);
    } catch (e) { console.error(e); }
    setDetailLoading(false);
  }

  async function generateInsight() {
    setInsightLoading(true); setAiInsight("");
    try {
      const text = await callClaude(
        `As strategic advisor to TATA 1MG CFO, write a 4-sentence insight on the global ${sector} competitive landscape: (1) where TATA 1MG's unit economics stand vs global peers, (2) biggest financial threat, (3) one unit economics lever to pull in next 6 months, (4) one global benchmark to aspire to. Be specific and actionable.`,
        "You are a senior healthcare strategist. Write crisp analytical prose. No bullet points."
      );
      setAiInsight(text);
    } catch { setAiInsight("Could not generate insight. Retry."); }
    setInsightLoading(false);
  }

  const getVal = (companyName, field) => {
    const d = financialData?.find(f => f.company === companyName);
    if (!d) return "—";
    return d[field] || "—";
  };

  const METRIC_FIELDS = {
    gmv:             { orig: "gmv_orig",          inr: "gmv_inr" },
    cac:             { orig: "cac_orig",           inr: "cac_inr" },
    ltv:             { orig: "ltv_orig",           inr: "ltv_inr" },
    contribution:    { orig: "contribution_margin",inr: "contribution_margin" },
    burn:            { orig: "burn_orig",          inr: "burn_inr" },
    order_economics: { orig: "order_margin_orig",  inr: "order_margin_inr" },
    take_rate:       { orig: "take_rate",          inr: "take_rate" },
  };

  if (!mounted) return <div style={{ minHeight: "100vh", background: "#080810", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: "#ff8c00", fontFamily: "Georgia", fontSize: "13px", letterSpacing: "0.2em" }}>LOADING...</div></div>;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .card { transition: border-color .2s, transform .2s; cursor: pointer; }
        .card:hover { transform: translateY(-2px); border-color: #333 !important; }
        table { border-collapse: collapse; width: 100%; }
        th { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: ${T.muted}; font-weight: normal; padding: 10px 12px; border-bottom: 1px solid ${T.border}; white-space: nowrap; }
        td { padding: 9px 12px; border-bottom: 1px solid ${T.border}; font-size: 12px; }
        tr:hover td { background: ${T.border}33; }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 2px; }
        button, a { font-family: Georgia, serif; }
        input { outline: none; font-family: Georgia, serif; }
      `}</style>

      {/* Header */}
      <header style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "18px 18px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ fontSize: "10px", color: T.accent, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "4px" }}>◆ Competitive Financial Intelligence</div>
            <h1 style={{ fontSize: "clamp(16px,3.5vw,26px)", fontWeight: "normal", color: T.text, marginBottom: "2px" }}>Global Competitor Financials</h1>
            <p style={{ fontSize: "11px", color: T.muted, fontStyle: "italic" }}>Unit economics benchmarking — Original currency + INR equivalent · vs TATA 1MG</p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => { if (sector === "pharmacy") setPharmaData(null); else setDiagData(null); fetchFinancials(); }}
              style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, padding: "6px 12px", borderRadius: "4px", fontSize: "11px" }}>↻ Refresh</button>
            <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
              style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, padding: "6px 10px", borderRadius: "4px", fontSize: "14px" }}>{theme === "dark" ? "☀️" : "🌙"}</button>
            <a href="/" style={{ background: T.accent, color: "#000", padding: "7px 14px", borderRadius: "4px", fontSize: "11px", textDecoration: "none", fontWeight: "bold" }}>← News</a>
          </div>
        </div>

        {/* Sector toggle */}
        <div style={{ display: "flex", gap: "0", marginTop: "14px", border: `1px solid ${T.border}`, borderRadius: "4px", overflow: "hidden", width: "fit-content" }}>
          {[["pharmacy", "💊 Pharmacy & Health-tech"], ["diagnostics", "🔬 Diagnostics"]].map(([s, l]) => (
            <button key={s} onClick={() => { setSector(s); setActiveRegion("All"); setUeData(null); setAiInsight(""); }}
              style={{ padding: "8px 18px", background: sector === s ? T.accent : "none", color: sector === s ? "#000" : T.muted, border: "none", fontSize: "12px", fontWeight: sector === s ? "bold" : "normal" }}>
              {l}
            </button>
          ))}
        </div>
      </header>

      <main style={{ padding: "14px", maxWidth: "1200px", margin: "0 auto" }}>

        {/* TATA 1MG benchmark strip */}
        <div style={{ background: T.accent + "12", border: `1px solid ${T.accent}33`, borderLeft: `3px solid ${T.accent}`, borderRadius: "4px", padding: "12px 16px", marginBottom: "14px" }}>
          <div style={{ fontSize: "10px", color: T.accent, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>🔵 TATA 1MG — Your Baseline ({sector === "pharmacy" ? "Pharmacy" : "Diagnostics"})</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
            {[
              ["GMV", benchmark.gmv.orig],
              ["Revenue", benchmark.revenue.orig],
              ["CAC", benchmark.cac.orig],
              ["LTV", benchmark.ltv.orig],
              ["LTV:CAC", benchmark.ltv_cac],
              ["Contribution", benchmark.contribution],
              ["Burn", benchmark.burn],
              ["Take Rate", benchmark.take_rate],
              ["Avg Order Rev", benchmark.order_rev],
              ["Avg Order Cost", benchmark.order_cost],
              ["Avg Order Margin", benchmark.order_margin],
              ["YoY Growth", benchmark.growth],
              ["Valuation", benchmark.valuation],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: "9px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>{k}</div>
                <div style={{ fontSize: "13px", color: T.accent, fontWeight: "bold" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insight */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: "3px solid #9c27b0", borderRadius: "4px", padding: "14px 16px", marginBottom: "14px" }}>
          <div style={{ fontSize: "10px", color: "#9c27b0", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px" }}>◆ AI Strategic Insight</div>
          {insightLoading
            ? <p style={{ color: T.muted, fontStyle: "italic", fontSize: "13px", animation: "pulse 1.5s infinite" }}>Generating strategic analysis…</p>
            : aiInsight
            ? <p style={{ lineHeight: 1.78, color: T.text, fontSize: "13px" }}>{aiInsight}</p>
            : <p style={{ color: T.muted, fontStyle: "italic", fontSize: "13px" }}>Get an AI-powered CFO briefing on the competitive landscape.</p>
          }
          <button onClick={generateInsight} disabled={insightLoading}
            style={{ marginTop: "10px", padding: "8px 18px", background: insightLoading ? "none" : "#9c27b0", color: insightLoading ? T.muted : "#fff", border: `1px solid ${insightLoading ? T.border : "#9c27b0"}`, borderRadius: "3px", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {insightLoading ? "Thinking…" : "Generate Insight"}
          </button>
        </div>

        {/* Region + Metric filters */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
          {regions.map(r => (
            <button key={r} onClick={() => setActiveRegion(r)} style={{
              background: activeRegion === r ? T.accent : "none",
              color: activeRegion === r ? "#000" : T.muted,
              border: `1px solid ${activeRegion === r ? T.accent : T.border}`,
              padding: "5px 12px", borderRadius: "20px", fontSize: "11px",
            }}>{r}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "6px", marginBottom: "14px", overflowX: "auto", paddingBottom: "4px" }}>
          {METRICS.map(m => (
            <button key={m.id} onClick={() => setActiveMetric(m.id)} style={{
              background: activeMetric === m.id ? T.accent + "22" : "none",
              color: activeMetric === m.id ? T.accent : T.muted,
              border: `1px solid ${activeMetric === m.id ? T.accent : T.border}`,
              padding: "5px 12px", borderRadius: "4px", fontSize: "11px", whiteSpace: "nowrap", flexShrink: 0,
            }}>{m.icon} {m.label}</button>
          ))}
        </div>

        {/* Company cards */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: "28px", animation: "pulse 1.1s infinite", marginBottom: "12px" }}>📊</div>
            <div style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: T.muted }}>Fetching financial data for {companies.length} companies…</div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: "10px", marginBottom: "20px" }}>
              {filtered.map((comp, i) => {
                const d = financialData?.find(f => f.company === comp.name);
                const fields = METRIC_FIELDS[activeMetric];
                const origVal = d?.[fields.orig] || "—";
                const inrVal = fields.orig === fields.inr ? null : d?.[fields.inr];
                const threatColor = d?.threat === "high" ? "#ef5350" : d?.threat === "medium" ? "#ff8c00" : "#4caf50";
                return (
                  <div key={i} className="card" onClick={() => fetchCompanyDetail(comp)}
                    style={{ background: T.surface, border: `1px solid ${selectedCompany?.name === comp.name ? comp.color : T.border}`, borderTop: `3px solid ${comp.color}`, borderRadius: "4px", padding: "13px", animation: `fadeUp 0.3s ease ${i * 0.03}s both` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div>
                        <div style={{ fontSize: "13px", color: T.text, fontWeight: "bold" }}>{comp.flag} {comp.name}</div>
                        <div style={{ fontSize: "9px", color: T.muted, marginTop: "2px" }}>{comp.region} · {comp.currency}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
                        <span style={{ fontSize: "8px", padding: "1px 6px", border: `1px solid ${comp.color}44`, borderRadius: "10px", color: comp.color }}>{d?.status || "—"}</span>
                        {d?.threat && <span style={{ fontSize: "8px", color: threatColor }}>● {d.threat} threat</span>}
                      </div>
                    </div>

                    {/* Metric value — original + INR */}
                    <div style={{ marginBottom: "8px" }}>
                      <div style={{ fontSize: "9px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>
                        {METRICS.find(m => m.id === activeMetric)?.label}
                      </div>
                      <div style={{ fontSize: "16px", color: comp.color, fontWeight: "bold" }}>{origVal}</div>
                      {inrVal && inrVal !== origVal && (
                        <div style={{ fontSize: "11px", color: T.muted }}>≈ ₹{inrVal} Cr (INR)</div>
                      )}
                    </div>

                    {/* Quick stats row */}
                    {d && (
                      <div style={{ display: "flex", gap: "10px", fontSize: "10px", color: T.muted, paddingTop: "8px", borderTop: `1px solid ${T.border}`, flexWrap: "wrap" }}>
                        <span>LTV:CAC <b style={{ color: T.text }}>{d.ltv_cac || "—"}</b></span>
                        <span>Growth <b style={{ color: "#4caf50" }}>{d.yoy_growth || "—"}</b></span>
                        <span>CM <b style={{ color: T.text }}>{d.contribution_margin || "—"}</b></span>
                      </div>
                    )}
                    {d?.key_metric && <div style={{ fontSize: "10px", color: T.muted, marginTop: "6px", fontStyle: "italic" }}>{d.key_metric}</div>}
                    {d?.vs_1mg && <div style={{ fontSize: "10px", color: T.muted, marginTop: "4px", paddingTop: "6px", borderTop: `1px solid ${T.border}` }}>{d.vs_1mg}</div>}
                    <div style={{ fontSize: "10px", color: T.muted, marginTop: "6px", textAlign: "right", opacity: 0.5 }}>Tap for deep dive →</div>
                  </div>
                );
              })}
            </div>

            {/* Full comparison table */}
            {financialData && (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "4px", marginBottom: "20px", overflowX: "auto" }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: "10px", color: T.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>◆ Full Comparison Table — Original Currency + INR Equivalent</div>
                </div>
                <table>
                  <thead>
                    <tr style={{ background: T.bg }}>
                      <th>Company</th>
                      <th>GMV (Orig)</th><th>GMV (₹Cr)</th>
                      <th>CAC (Orig)</th><th>CAC (₹)</th>
                      <th>LTV (Orig)</th><th>LTV (₹)</th>
                      <th>LTV:CAC</th>
                      <th>Contribution</th>
                      <th>Burn (Orig)</th><th>Burn (₹Cr/mo)</th>
                      <th>Runway</th>
                      <th>Take Rate</th>
                      <th>Order Margin (₹)</th>
                      <th>Growth</th>
                      <th>Valuation (₹Cr)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* TATA 1MG row */}
                    <tr style={{ background: T.accent + "10" }}>
                      <td style={{ color: T.accent, fontWeight: "bold", whiteSpace: "nowrap" }}>🔵 TATA 1MG (You)</td>
                      <td style={{ color: T.accent }}>{benchmark.gmv.orig}</td>
                      <td style={{ color: T.accent }}>{benchmark.gmv.inr}</td>
                      <td style={{ color: T.accent }}>{benchmark.cac.orig}</td>
                      <td style={{ color: T.accent }}>{benchmark.cac.inr}</td>
                      <td style={{ color: T.accent }}>{benchmark.ltv.orig}</td>
                      <td style={{ color: T.accent }}>{benchmark.ltv.inr}</td>
                      <td style={{ color: T.accent }}>{benchmark.ltv_cac}</td>
                      <td style={{ color: T.accent }}>{benchmark.contribution}</td>
                      <td style={{ color: T.accent }}>{benchmark.burn}</td>
                      <td style={{ color: T.accent }}>{benchmark.burn}</td>
                      <td style={{ color: T.accent }}>{benchmark.runway}</td>
                      <td style={{ color: T.accent }}>{benchmark.take_rate}</td>
                      <td style={{ color: "#4caf50" }}>{benchmark.order_margin}</td>
                      <td style={{ color: "#4caf50" }}>{benchmark.growth}</td>
                      <td style={{ color: T.accent }}>{benchmark.valuation}</td>
                    </tr>
                    {filtered.map((comp, i) => {
                      const d = financialData.find(f => f.company === comp.name);
                      const ltv_cac_num = parseFloat(d?.ltv_cac);
                      const ltv_cac_color = ltv_cac_num > 4 ? "#4caf50" : ltv_cac_num > 2 ? "#ff8c00" : "#ef5350";
                      const growth_color = parseFloat(d?.yoy_growth) > 30 ? "#4caf50" : T.text;
                      return (
                        <tr key={i} onClick={() => fetchCompanyDetail(comp)} style={{ cursor: "pointer" }}>
                          <td style={{ color: comp.color, fontWeight: "bold", whiteSpace: "nowrap" }}>{comp.flag} {comp.name}</td>
                          <td>{d?.gmv_orig || "—"}</td>
                          <td style={{ color: T.muted }}>{d?.gmv_inr || "—"}</td>
                          <td>{d?.cac_orig || "—"}</td>
                          <td style={{ color: T.muted }}>{d?.cac_inr || "—"}</td>
                          <td>{d?.ltv_orig || "—"}</td>
                          <td style={{ color: T.muted }}>{d?.ltv_inr || "—"}</td>
                          <td style={{ color: ltv_cac_color, fontWeight: "bold" }}>{d?.ltv_cac || "—"}</td>
                          <td>{d?.contribution_margin || "—"}</td>
                          <td>{d?.burn_orig || "—"}</td>
                          <td style={{ color: T.muted }}>{d?.burn_inr || "—"}</td>
                          <td>{d?.runway || "—"}</td>
                          <td>{d?.take_rate || "—"}</td>
                          <td style={{ color: d?.order_margin_inr?.includes("-") ? "#ef5350" : "#4caf50" }}>{d?.order_margin_inr || "—"}</td>
                          <td style={{ color: growth_color }}>{d?.yoy_growth || "—"}</td>
                          <td>{d?.valuation_inr || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Unit Economics Benchmarking */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "4px", marginBottom: "20px" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "10px", color: T.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>◆ Unit Economics — India vs USA vs Europe vs Asia</div>
            <button onClick={fetchUnitEconomics} disabled={ueLoading}
              style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, padding: "5px 12px", borderRadius: "4px", fontSize: "11px" }}>
              {ueLoading ? "Loading…" : ueData ? "↻ Refresh" : "Load Analysis"}
            </button>
          </div>
          <div style={{ padding: "14px 16px" }}>
            {ueLoading ? (
              <div style={{ textAlign: "center", padding: "30px 0", animation: "pulse 1.2s infinite", color: T.muted, fontSize: "13px" }}>Analysing unit economics across regions…</div>
            ) : ueData ? (
              <>
                <p style={{ fontSize: "13px", lineHeight: 1.75, color: T.text, marginBottom: "14px" }}>{ueData.summary}</p>

                {/* Regional comparison table */}
                {ueData.regional_comparison && (
                  <div style={{ overflowX: "auto", marginBottom: "16px" }}>
                    <table>
                      <thead>
                        <tr style={{ background: T.bg }}>
                          <th>Metric</th>
                          <th>🇮🇳 India</th>
                          <th>🇺🇸 USA (+ INR eq.)</th>
                          <th>🇪🇺 Europe (+ INR eq.)</th>
                          <th>🌏 Asia (+ INR eq.)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ueData.regional_comparison.map((row, i) => (
                          <tr key={i}>
                            <td style={{ color: T.accent, fontWeight: "bold" }}>{row.metric}</td>
                            <td style={{ color: "#4caf50" }}>{row.india}</td>
                            <td>{row.usa}</td>
                            <td>{row.europe}</td>
                            <td>{row.asia}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Insights grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "10px" }}>
                  <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "12px" }}>
                    <div style={{ fontSize: "10px", color: "#4caf50", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>🏆 Leaders</div>
                    <div style={{ fontSize: "11px", color: T.text, marginBottom: "5px" }}>Best LTV:CAC: <b>{ueData.best_ltv_cac}</b></div>
                    <div style={{ fontSize: "11px", color: T.text, marginBottom: "5px" }}>Lowest CAC: <b>{ueData.lowest_cac}</b></div>
                    <div style={{ fontSize: "11px", color: T.text }}>Best Contribution: <b>{ueData.highest_contribution}</b></div>
                  </div>
                  <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "12px" }}>
                    <div style={{ fontSize: "10px", color: T.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>🔵 TATA 1MG vs Peers</div>
                    <p style={{ fontSize: "11px", color: T.text, lineHeight: 1.6 }}>{ueData.tata_1mg_vs_peers}</p>
                  </div>
                  <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "12px" }}>
                    <div style={{ fontSize: "10px", color: "#2196f3", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>💡 Recommendations</div>
                    {ueData.recommendations?.map((r, i) => (
                      <div key={i} style={{ fontSize: "11px", color: T.text, marginBottom: "5px", paddingLeft: "8px", borderLeft: `2px solid ${T.accent}` }}>{r}</div>
                    ))}
                  </div>
                  <div style={{ background: "#ef535010", border: "1px solid #ef535033", borderRadius: "4px", padding: "12px" }}>
                    <div style={{ fontSize: "10px", color: "#ef5350", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>⚠️ Risk Flags</div>
                    {ueData.risk_flags?.map((r, i) => (
                      <div key={i} style={{ fontSize: "11px", color: T.text, marginBottom: "5px", paddingLeft: "8px", borderLeft: "2px solid #ef5350" }}>{r}</div>
                    ))}
                  </div>
                  <div style={{ background: "#4caf5010", border: "1px solid #4caf5033", borderRadius: "4px", padding: "12px" }}>
                    <div style={{ fontSize: "10px", color: "#4caf50", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>🚀 Opportunities</div>
                    {ueData.opportunities?.map((o, i) => (
                      <div key={i} style={{ fontSize: "11px", color: T.text, marginBottom: "5px", paddingLeft: "8px", borderLeft: "2px solid #4caf50" }}>{o}</div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p style={{ color: T.muted, fontStyle: "italic", fontSize: "13px" }}>Tap "Load Analysis" to benchmark unit economics across all regions.</p>
            )}
          </div>
        </div>
      </main>

      {/* Company Deep Dive Modal */}
      {selectedCompany && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 1000, overflowY: "auto", padding: "16px" }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: `4px solid ${selectedCompany.color}`, borderRadius: "6px", maxWidth: "720px", margin: "0 auto", padding: "22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
              <div>
                <div style={{ fontSize: "10px", color: selectedCompany.color, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "3px" }}>Deep Dive · {sector}</div>
                <h2 style={{ fontSize: "20px", fontWeight: "normal", color: T.text }}>{selectedCompany.flag} {selectedCompany.name}</h2>
                <div style={{ fontSize: "11px", color: T.muted }}>{selectedCompany.region} · {selectedCompany.currency} → INR shown side by side</div>
              </div>
              <button onClick={() => { setSelectedCompany(null); setCompanyDetail(null); }}
                style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, padding: "6px 12px", borderRadius: "4px", fontSize: "12px" }}>✕ Close</button>
            </div>

            {detailLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0", animation: "pulse 1.2s infinite", color: T.muted }}>Fetching deep financial data…</div>
            ) : companyDetail ? (
              <>
                <p style={{ fontSize: "13px", lineHeight: 1.7, color: T.text, marginBottom: "6px" }}>{companyDetail.overview}</p>
                <p style={{ fontSize: "12px", lineHeight: 1.6, color: T.muted, fontStyle: "italic", marginBottom: "18px" }}>{companyDetail.business_model}</p>

                {/* FY financials */}
                {companyDetail.fy_financials && (
                  <div style={{ marginBottom: "18px" }}>
                    <div style={{ fontSize: "10px", color: T.accent, letterSpacing: "0.13em", textTransform: "uppercase", marginBottom: "8px" }}>📅 Year-on-Year Financials</div>
                    <div style={{ overflowX: "auto" }}>
                      <table>
                        <thead><tr style={{ background: T.bg }}>
                          <th>Year</th><th>Revenue (Orig)</th><th>Revenue (₹Cr)</th><th>P&L (Orig)</th><th>P&L (₹Cr)</th><th>Growth</th>
                        </tr></thead>
                        <tbody>
                          {companyDetail.fy_financials.map((y, i) => (
                            <tr key={i}>
                              <td style={{ color: T.accent }}>{y.year}</td>
                              <td>{y.revenue_orig}</td>
                              <td style={{ color: T.muted }}>{y.revenue_inr}</td>
                              <td style={{ color: y.profit_loss_orig?.includes("-") || y.profit_loss_orig?.toLowerCase().includes("loss") ? "#ef5350" : "#4caf50" }}>{y.profit_loss_orig}</td>
                              <td style={{ color: T.muted }}>{y.profit_loss_inr}</td>
                              <td style={{ color: "#4caf50" }}>{y.growth}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Unit economics grid */}
                {companyDetail.unit_economics && (
                  <div style={{ marginBottom: "18px" }}>
                    <div style={{ fontSize: "10px", color: T.accent, letterSpacing: "0.13em", textTransform: "uppercase", marginBottom: "8px" }}>📐 Unit Economics (Original + INR)</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "8px" }}>
                      {[
                        ["CAC", companyDetail.unit_economics.cac_orig, companyDetail.unit_economics.cac_inr],
                        ["LTV", companyDetail.unit_economics.ltv_orig, companyDetail.unit_economics.ltv_inr],
                        ["LTV:CAC", companyDetail.unit_economics.ltv_cac, null],
                        ["Avg Order Value", companyDetail.unit_economics.avg_order_value_orig, companyDetail.unit_economics.avg_order_value_inr],
                        ["Orders/Customer/Yr", companyDetail.unit_economics.orders_per_customer_year, null],
                        ["Contribution Margin", companyDetail.unit_economics.contribution_margin, null],
                        ["Gross Margin", companyDetail.unit_economics.gross_margin, null],
                        ["EBITDA Margin", companyDetail.unit_economics.ebitda_margin, null],
                        ["Take Rate", companyDetail.unit_economics.take_rate, null],
                      ].map(([label, orig, inr], i) => (
                        <div key={i} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "10px" }}>
                          <div style={{ fontSize: "9px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{label}</div>
                          <div style={{ fontSize: "14px", color: T.text, fontWeight: "bold" }}>{orig || "—"}</div>
                          {inr && inr !== orig && <div style={{ fontSize: "10px", color: T.muted }}>≈ {inr} INR</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Per order P&L */}
                {companyDetail.per_order_pnl && (
                  <div style={{ marginBottom: "18px" }}>
                    <div style={{ fontSize: "10px", color: T.accent, letterSpacing: "0.13em", textTransform: "uppercase", marginBottom: "8px" }}>🧾 Per Order P&L — Original + INR</div>
                    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "12px" }}>
                      {[
                        ["Avg Selling Price", companyDetail.per_order_pnl.avg_selling_price_orig, companyDetail.per_order_pnl.avg_selling_price_inr, false],
                        ["COGS", companyDetail.per_order_pnl.cogs_orig, companyDetail.per_order_pnl.cogs_inr, true],
                        ["Gross Profit", companyDetail.per_order_pnl.gross_profit_orig, companyDetail.per_order_pnl.gross_profit_inr, false],
                        ["Delivery Cost", companyDetail.per_order_pnl.delivery_cost_orig, companyDetail.per_order_pnl.delivery_cost_inr, true],
                        ["Payment Cost", companyDetail.per_order_pnl.payment_cost_orig, companyDetail.per_order_pnl.payment_cost_inr, true],
                        ["Marketing Alloc", companyDetail.per_order_pnl.marketing_alloc_orig, companyDetail.per_order_pnl.marketing_alloc_inr, true],
                        ["Net Per Order", companyDetail.per_order_pnl.net_per_order_orig, companyDetail.per_order_pnl.net_per_order_inr, false],
                      ].map(([label, orig, inr, isCost], i, arr) => {
                        const isLast = i === arr.length - 1;
                        const valColor = isLast ? (orig?.includes("-") ? "#ef5350" : "#4caf50") : isCost ? "#ef5350" : T.text;
                        return (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: isLast ? "none" : `1px solid ${T.border}`, borderTop: isLast ? `2px solid ${T.border}` : "none", marginTop: isLast ? "4px" : "0" }}>
                            <span style={{ fontSize: "12px", color: T.muted }}>{label}</span>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: "12px", fontWeight: isLast ? "bold" : "normal", color: valColor }}>{orig || "—"}</div>
                              {inr && inr !== orig && <div style={{ fontSize: "10px", color: T.muted }}>≈ {inr}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Strengths / Weaknesses */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                  <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "12px" }}>
                    <div style={{ fontSize: "10px", color: "#4caf50", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>✅ Strengths</div>
                    {companyDetail.strengths?.map((s, i) => <div key={i} style={{ fontSize: "11px", color: T.text, marginBottom: "4px", paddingLeft: "8px", borderLeft: "2px solid #4caf50" }}>{s}</div>)}
                  </div>
                  <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "12px" }}>
                    <div style={{ fontSize: "10px", color: "#ef5350", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>⚠️ Weaknesses</div>
                    {companyDetail.weaknesses?.map((w, i) => <div key={i} style={{ fontSize: "11px", color: T.text, marginBottom: "4px", paddingLeft: "8px", borderLeft: "2px solid #ef5350" }}>{w}</div>)}
                  </div>
                </div>

                {/* Threat + latest */}
                <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "12px", marginBottom: "10px" }}>
                  <div style={{ fontSize: "10px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Threat to TATA 1MG</div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", color: companyDetail.threat_to_1mg === "high" ? "#ef5350" : companyDetail.threat_to_1mg === "medium" ? "#ff8c00" : "#4caf50" }}>{companyDetail.threat_to_1mg}</span>
                    <span style={{ fontSize: "12px", color: T.muted, fontStyle: "italic" }}>{companyDetail.threat_reason}</span>
                  </div>
                </div>

                {companyDetail.latest_news && (
                  <div style={{ background: T.accent + "10", border: `1px solid ${T.accent}33`, borderRadius: "4px", padding: "12px" }}>
                    <div style={{ fontSize: "10px", color: T.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Latest Development</div>
                    <div style={{ fontSize: "12px", color: T.text }}>{companyDetail.latest_news}</div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
