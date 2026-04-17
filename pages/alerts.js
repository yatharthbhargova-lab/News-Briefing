import { useState, useEffect } from "react";

const PRESET_ALERTS = [
  { id: "pharmeasy", keyword: "PharmEasy", category: "Competitor", email: true, priority: "high" },
  { id: "apollo247", keyword: "Apollo 247", category: "Competitor", email: true, priority: "high" },
  { id: "practo", keyword: "Practo", category: "Competitor", email: true, priority: "medium" },
  { id: "cdsco", keyword: "CDSCO", category: "Regulatory", email: true, priority: "high" },
  { id: "irdai", keyword: "IRDAI health insurance", category: "Regulatory", email: true, priority: "high" },
  { id: "rbi_rate", keyword: "RBI interest rate", category: "Macro", email: false, priority: "medium" },
  { id: "drug_pricing", keyword: "drug price control order", category: "Regulatory", email: true, priority: "high" },
  { id: "tata_1mg", keyword: "TATA 1MG", category: "Own Brand", email: false, priority: "medium" },
  { id: "online_pharmacy", keyword: "online pharmacy regulation India", category: "Industry", email: true, priority: "medium" },
  { id: "thyrocare", keyword: "Thyrocare", category: "Competitor", email: false, priority: "low" },
];

const CATEGORIES = ["All", "Competitor", "Regulatory", "Macro", "Industry", "Own Brand", "Custom"];
const PRIORITIES = ["high", "medium", "low"];
const PRIORITY_COLOR = { high: "#ef5350", medium: "#ff8c00", low: "#4caf50" };

async function callClaude(prompt, system) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: system || "You are a senior financial journalist. Return only raw JSON. No markdown.",
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
  const s = clean.indexOf("["), e = clean.lastIndexOf("]");
  if (s !== -1 && e !== -1) { try { return JSON.parse(clean.slice(s, e + 1)); } catch {} }
  return null;
}

export default function Alerts() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [alerts, setAlerts] = useState(PRESET_ALERTS);
  const [filterCat, setFilterCat] = useState("All");
  const [newKeyword, setNewKeyword] = useState("");
  const [newCategory, setNewCategory] = useState("Custom");
  const [newPriority, setNewPriority] = useState("medium");
  const [newEmail, setNewEmail] = useState(true);
  const [emailAddr, setEmailAddr] = useState("");
  const [digestTime, setDigestTime] = useState("07:00");
  const [alertResults, setAlertResults] = useState({});
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [lastScan, setLastScan] = useState(null);
  const [digestPreview, setDigestPreview] = useState(null);
  const [digestLoading, setDigestLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");
  const [activeTab, setActiveTab] = useState("alerts");

  const T = theme === "dark"
    ? { bg: "#080810", surface: "#0c0c18", border: "#151528", text: "#ddd5c5", muted: "#444", accent: "#ff8c00" }
    : { bg: "#f5f3ee", surface: "#ffffff", border: "#e0dbd0", text: "#1a1510", muted: "#888", accent: "#c47000" };

  useEffect(() => {
    setMounted(true);
    try {
      const t = localStorage.getItem("mb_theme"); if (t) setTheme(t);
      const a = localStorage.getItem("mb_alerts"); if (a) setAlerts(JSON.parse(a));
      const e = localStorage.getItem("mb_alert_email"); if (e) setEmailAddr(e);
      const r = localStorage.getItem("mb_alert_results"); if (r) setAlertResults(JSON.parse(r));
      const ls = localStorage.getItem("mb_last_scan"); if (ls) setLastScan(ls);
    } catch {}
  }, []);

  function saveAlerts(updated) {
    setAlerts(updated);
    try { localStorage.setItem("mb_alerts", JSON.stringify(updated)); } catch {}
  }

  function addAlert() {
    if (!newKeyword.trim()) return;
    const newAlert = {
      id: Date.now().toString(),
      keyword: newKeyword.trim(),
      category: newCategory,
      email: newEmail,
      priority: newPriority,
    };
    saveAlerts([...alerts, newAlert]);
    setNewKeyword("");
  }

  function removeAlert(id) { saveAlerts(alerts.filter(a => a.id !== id)); }

  function toggleEmail(id) { saveAlerts(alerts.map(a => a.id === id ? { ...a, email: !a.email } : a)); }

  async function scanAllAlerts() {
    setScanning(true); setScanProgress(0);
    const results = {};
    const highPriority = alerts.filter(a => a.priority === "high");
    const others = alerts.filter(a => a.priority !== "high");
    const ordered = [...highPriority, ...others];

    for (let i = 0; i < ordered.length; i++) {
      const alert = ordered[i];
      setScanProgress(Math.round(((i + 1) / ordered.length) * 100));
      try {
        const text = await callClaude(
          `Search the web right now for the latest news today about: "${alert.keyword}". Find any news from the last 24-48 hours.

Return a JSON array of up to 3 news items (empty array [] if no recent news found):
[{"headline":"actual headline","summary":"1 sentence","source":"publication","time":"e.g. 2h ago","impact":"positive|negative|neutral","url_hint":"domain of source e.g. economictimes.com"}]

Return ONLY the JSON array.`,
          "You are a financial news monitor. Search for real breaking news. Return only raw JSON array."
        );
        const parsed = parseJSON(text);
        results[alert.id] = Array.isArray(parsed) ? parsed : [];
      } catch { results[alert.id] = []; }
    }
    setAlertResults(results);
    const now = new Date().toLocaleString("en-IN");
    setLastScan(now);
    try {
      localStorage.setItem("mb_alert_results", JSON.stringify(results));
      localStorage.setItem("mb_last_scan", now);
    } catch {}
    setScanning(false); setScanProgress(100);
  }

  async function generateDigest() {
    setDigestLoading(true); setDigestPreview(null);
    const hits = alerts.filter(a => alertResults[a.id]?.length > 0);
    if (!hits.length) { setDigestPreview({ empty: true }); setDigestLoading(false); return; }
    try {
      const text = await callClaude(
        `You are writing a morning intelligence digest for the CFO of TATA 1MG.

Alert hits today:
${hits.map(a => `• ${a.keyword} (${a.category}): ${alertResults[a.id]?.map(r => r.headline).join("; ")}`).join("\n")}

Write a structured digest with:
1. A 2-sentence executive summary
2. For each category with hits, a brief paragraph
3. A "CFO Action Items" section with 3 bullet points

Format as JSON: {"executive_summary":"","sections":[{"category":"","content":""}],"action_items":["","",""]}
Return ONLY JSON.`,
        "You are a CFO intelligence analyst. Write in crisp analytical prose."
      );
      const parsed = parseJSON(text);
      if (parsed) setDigestPreview(parsed);
    } catch { setDigestPreview({ error: true }); }
    setDigestLoading(false);
  }

  async function sendDigestEmail() {
    if (!emailAddr || !digestPreview) return;
    setSendingEmail(true); setEmailStatus("");
    const html = `
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#ddd5c5;padding:32px;">
  <div style="color:#ff8c00;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:6px;">◆ Alert Intelligence Digest</div>
  <h1 style="color:#f0ebe0;font-size:24px;font-weight:normal;margin-bottom:4px;">Morning Intelligence Briefing</h1>
  <p style="color:#666;font-style:italic;margin-bottom:20px;">${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
  <div style="background:#0f0f1a;border-left:3px solid #ff8c00;padding:14px;margin-bottom:20px;">
    <p style="color:#a09880;line-height:1.7;">${digestPreview?.executive_summary || ""}</p>
  </div>
  ${(digestPreview?.sections || []).map(s => `
    <h2 style="color:#ff8c00;font-size:13px;text-transform:uppercase;letter-spacing:0.12em;margin:16px 0 8px;">${s.category}</h2>
    <p style="color:#ccc4b4;line-height:1.65;font-size:13px;">${s.content}</p>
  `).join("")}
  <h2 style="color:#4caf50;font-size:13px;text-transform:uppercase;letter-spacing:0.12em;margin:20px 0 8px;">✅ CFO Action Items</h2>
  ${(digestPreview?.action_items || []).map(item => `<div style="font-size:12px;color:#ccc4b4;margin-bottom:6px;padding-left:12px;border-left:2px solid #4caf50;">• ${item}</div>`).join("")}
  <p style="color:#333;font-size:11px;margin-top:24px;text-align:center;">TATA 1MG CFO Intelligence Dashboard · Confidential</p>
</div>`;
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: emailAddr, subject: `🔔 Alert Digest — ${new Date().toLocaleDateString("en-IN")}`, html }),
      });
      const data = await res.json();
      setEmailStatus(data.success ? "✅ Digest sent!" : `❌ ${data.error}`);
    } catch { setEmailStatus("❌ Failed to send."); }
    setSendingEmail(false);
  }

  const filtered = filterCat === "All" ? alerts : alerts.filter(a => a.category === filterCat);
  const totalHits = Object.values(alertResults).reduce((sum, r) => sum + r.length, 0);
  const highHits = alerts.filter(a => a.priority === "high" && alertResults[a.id]?.length > 0).length;

  if (!mounted) return <div style={{ minHeight: "100vh", background: "#080810", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: "#ff8c00", fontFamily: "Georgia", fontSize: "13px", letterSpacing: "0.2em" }}>LOADING...</div></div>;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        button { font-family: Georgia, serif; cursor: pointer; }
        input, select { outline: none; font-family: Georgia, serif; }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <header style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ fontSize: "10px", color: "#ef5350", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "3px" }}>◆ Smart Alerts</div>
            <h1 style={{ fontSize: "clamp(16px,3.5vw,24px)", fontWeight: "normal", color: T.text, marginBottom: "2px" }}>Keyword Monitor & Alerts</h1>
            <p style={{ fontSize: "11px", color: T.muted, fontStyle: "italic" }}>
              Monitor {alerts.length} keywords · {totalHits} hits today
              {lastScan && <span> · Last scan: {lastScan}</span>}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {highHits > 0 && (
              <div style={{ background: "#ef535022", border: "1px solid #ef5350", borderRadius: "4px", padding: "6px 12px", fontSize: "12px", color: "#ef5350", fontWeight: "bold" }}>
                🔴 {highHits} High Priority Alert{highHits > 1 ? "s" : ""}
              </div>
            )}
            <button onClick={scanAllAlerts} disabled={scanning} style={{ background: scanning ? T.border : "#ef5350", color: scanning ? T.muted : "#fff", border: "none", borderRadius: "4px", padding: "7px 16px", fontSize: "12px", fontWeight: "bold" }}>
              {scanning ? `Scanning… ${scanProgress}%` : "🔍 Scan Now"}
            </button>
            <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, padding: "6px 10px", borderRadius: "4px", fontSize: "14px" }}>{theme === "dark" ? "☀️" : "🌙"}</button>
            <a href="/" style={{ background: T.accent, color: "#000", padding: "7px 14px", borderRadius: "4px", fontSize: "11px", textDecoration: "none", fontWeight: "bold" }}>← News</a>
          </div>
        </div>

        {/* Progress bar when scanning */}
        {scanning && (
          <div style={{ marginTop: "12px" }}>
            <div style={{ background: T.border, borderRadius: "3px", height: "4px", overflow: "hidden" }}>
              <div style={{ background: "#ef5350", width: `${scanProgress}%`, height: "100%", transition: "width 0.3s ease" }} />
            </div>
            <div style={{ fontSize: "10px", color: T.muted, marginTop: "4px" }}>Scanning {alerts.length} keywords with live web search…</div>
          </div>
        )}
      </header>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, background: T.surface }}>
        {[["alerts", "🔔 Alert Setup"], ["results", `📊 Results (${totalHits})`], ["digest", "📧 Digest & Email"]].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "11px 16px",
            fontSize: "12px", color: activeTab === id ? "#ef5350" : T.muted,
            borderBottom: activeTab === id ? "2px solid #ef5350" : "2px solid transparent",
          }}>{label}</button>
        ))}
      </div>

      <main style={{ padding: "16px", maxWidth: "960px", margin: "0 auto" }}>

        {/* ── ALERTS TAB ── */}
        {activeTab === "alerts" && (
          <>
            {/* Add new alert */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ fontSize: "10px", color: "#ef5350", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "12px" }}>+ Add New Alert</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <input type="text" placeholder="Keyword or phrase e.g. PharmEasy funding..." value={newKeyword} onChange={e => setNewKeyword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addAlert()}
                  style={{ flex: 1, minWidth: "200px", background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "9px 12px", borderRadius: "4px", fontSize: "13px" }} />
                <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
                  style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "9px 10px", borderRadius: "4px", fontSize: "12px" }}>
                  {["Competitor", "Regulatory", "Macro", "Industry", "Own Brand", "Custom"].map(c => <option key={c}>{c}</option>)}
                </select>
                <select value={newPriority} onChange={e => setNewPriority(e.target.value)}
                  style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "9px 10px", borderRadius: "4px", fontSize: "12px" }}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
                <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: T.muted, cursor: "pointer" }}>
                  <input type="checkbox" checked={newEmail} onChange={e => setNewEmail(e.target.checked)} /> Email
                </label>
                <button onClick={addAlert} style={{ background: "#ef5350", color: "#fff", border: "none", borderRadius: "4px", padding: "9px 18px", fontSize: "12px", fontWeight: "bold" }}>Add</button>
              </div>
            </div>

            {/* Category filter */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setFilterCat(c)} style={{ background: filterCat === c ? "#ef5350" : "none", color: filterCat === c ? "#fff" : T.muted, border: `1px solid ${filterCat === c ? "#ef5350" : T.border}`, padding: "4px 12px", borderRadius: "20px", fontSize: "11px" }}>{c}</button>
              ))}
            </div>

            {/* Alert list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filtered.map(alert => {
                const hits = alertResults[alert.id] || [];
                return (
                  <div key={alert.id} style={{ background: T.surface, border: `1px solid ${hits.length > 0 ? PRIORITY_COLOR[alert.priority] + "55" : T.border}`, borderLeft: `3px solid ${PRIORITY_COLOR[alert.priority]}`, borderRadius: "4px", padding: "12px 14px", animation: "fadeUp 0.3s ease both" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "14px", color: T.text, fontWeight: "bold" }}>{alert.keyword}</span>
                        <span style={{ fontSize: "10px", padding: "2px 7px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: "10px", color: T.muted }}>{alert.category}</span>
                        <span style={{ fontSize: "10px", padding: "2px 7px", background: PRIORITY_COLOR[alert.priority] + "22", border: `1px solid ${PRIORITY_COLOR[alert.priority]}44`, borderRadius: "10px", color: PRIORITY_COLOR[alert.priority] }}>{alert.priority}</span>
                        {alert.email && <span style={{ fontSize: "10px", color: "#2196f3" }}>📧 email</span>}
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {hits.length > 0 && <span style={{ fontSize: "11px", fontWeight: "bold", color: PRIORITY_COLOR[alert.priority] }}>🔔 {hits.length} hit{hits.length > 1 ? "s" : ""}</span>}
                        <button onClick={() => toggleEmail(alert.id)} style={{ background: "none", border: `1px solid ${T.border}`, color: alert.email ? "#2196f3" : T.muted, borderRadius: "3px", padding: "3px 8px", fontSize: "10px" }}>📧</button>
                        <button onClick={() => removeAlert(alert.id)} style={{ background: "none", border: "1px solid #ef5350", color: "#ef5350", borderRadius: "3px", padding: "3px 8px", fontSize: "10px" }}>✕</button>
                      </div>
                    </div>
                    {hits.length > 0 && (
                      <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: `1px solid ${T.border}` }}>
                        {hits.map((hit, i) => (
                          <div key={i} style={{ fontSize: "12px", color: T.text, marginBottom: "4px" }}>
                            <span style={{ color: PRIORITY_COLOR[alert.priority], marginRight: "6px" }}>●</span>
                            {hit.headline}
                            <span style={{ color: T.muted, fontSize: "10px", marginLeft: "8px" }}>{hit.source} · {hit.time}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── RESULTS TAB ── */}
        {activeTab === "results" && (
          <div>
            {totalHits === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: T.muted }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔍</div>
                <p style={{ fontSize: "13px", marginBottom: "16px" }}>No results yet. Click "Scan Now" to search for today's news across all your keywords.</p>
                <button onClick={scanAllAlerts} style={{ background: "#ef5350", color: "#fff", border: "none", borderRadius: "4px", padding: "10px 24px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}>🔍 Scan Now</button>
              </div>
            ) : (
              <>
                {/* Results by priority */}
                {PRIORITIES.map(priority => {
                  const priorityAlerts = alerts.filter(a => a.priority === priority && alertResults[a.id]?.length > 0);
                  if (!priorityAlerts.length) return null;
                  return (
                    <div key={priority} style={{ marginBottom: "20px" }}>
                      <div style={{ fontSize: "10px", color: PRIORITY_COLOR[priority], letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>
                        ● {priority.toUpperCase()} PRIORITY — {priorityAlerts.length} keyword{priorityAlerts.length > 1 ? "s" : ""} with hits
                      </div>
                      {priorityAlerts.map(alert => (
                        <div key={alert.id} style={{ background: T.surface, border: `1px solid ${PRIORITY_COLOR[priority]}33`, borderLeft: `3px solid ${PRIORITY_COLOR[priority]}`, borderRadius: "4px", padding: "12px 14px", marginBottom: "8px" }}>
                          <div style={{ fontSize: "12px", color: PRIORITY_COLOR[priority], fontWeight: "bold", marginBottom: "8px" }}>{alert.keyword} <span style={{ color: T.muted, fontWeight: "normal" }}>({alert.category})</span></div>
                          {alertResults[alert.id].map((hit, i) => (
                            <div key={i} style={{ padding: "8px 0", borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
                              <div style={{ fontSize: "13px", color: T.text, marginBottom: "3px" }}>{hit.headline}</div>
                              <div style={{ fontSize: "11px", color: T.muted, marginBottom: "2px" }}>{hit.summary}</div>
                              <div style={{ display: "flex", gap: "10px", fontSize: "10px", color: T.muted }}>
                                <span>{hit.source}</span>
                                <span>{hit.time}</span>
                                <span style={{ color: hit.impact === "positive" ? "#4caf50" : hit.impact === "negative" ? "#ef5350" : "#ff8c00" }}>
                                  {hit.impact === "positive" ? "▲" : hit.impact === "negative" ? "▼" : "●"} {hit.impact}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ── DIGEST TAB ── */}
        {activeTab === "digest" && (
          <div>
            {/* Email config */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ fontSize: "10px", color: T.accent, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "12px" }}>📧 Email Configuration</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                <input type="email" placeholder="your@email.com" value={emailAddr} onChange={e => { setEmailAddr(e.target.value); try { localStorage.setItem("mb_alert_email", e.target.value); } catch {} }}
                  style={{ flex: 1, minWidth: "200px", background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "9px 12px", borderRadius: "4px", fontSize: "13px" }} />
                <input type="time" value={digestTime} onChange={e => setDigestTime(e.target.value)}
                  style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "9px 12px", borderRadius: "4px", fontSize: "13px" }} />
              </div>
              <p style={{ fontSize: "11px", color: T.muted }}>
                Note: Automated scheduling requires the GMAIL_USER and GMAIL_APP_PASSWORD environment variables in Vercel. The digest sends when you click "Send Now" below.
              </p>
            </div>

            {/* Generate digest */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: "3px solid #ff8c00", borderRadius: "4px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ fontSize: "10px", color: T.accent, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>◆ Intelligence Digest</div>
              {digestLoading ? (
                <p style={{ color: T.muted, fontStyle: "italic", fontSize: "13px", animation: "pulse 1.5s infinite" }}>Compiling digest…</p>
              ) : digestPreview && !digestPreview.empty && !digestPreview.error ? (
                <div>
                  <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderLeft: "3px solid #ff8c00", borderRadius: "3px", padding: "12px 14px", marginBottom: "12px" }}>
                    <p style={{ fontSize: "13px", color: T.text, lineHeight: 1.7 }}>{digestPreview.executive_summary}</p>
                  </div>
                  {digestPreview.sections?.map((s, i) => (
                    <div key={i} style={{ marginBottom: "12px" }}>
                      <div style={{ fontSize: "10px", color: "#2196f3", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>{s.category}</div>
                      <p style={{ fontSize: "12px", color: T.muted, lineHeight: 1.65 }}>{s.content}</p>
                    </div>
                  ))}
                  {digestPreview.action_items?.length > 0 && (
                    <div style={{ background: "#4caf5010", border: "1px solid #4caf5033", borderRadius: "4px", padding: "12px 14px" }}>
                      <div style={{ fontSize: "10px", color: "#4caf50", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>✅ CFO Action Items</div>
                      {digestPreview.action_items.map((item, i) => (
                        <div key={i} style={{ fontSize: "12px", color: T.text, marginBottom: "5px", paddingLeft: "10px", borderLeft: "2px solid #4caf50" }}>{item}</div>
                      ))}
                    </div>
                  )}
                </div>
              ) : digestPreview?.empty ? (
                <p style={{ color: T.muted, fontSize: "13px" }}>No alert hits found. Run a scan first.</p>
              ) : (
                <p style={{ color: T.muted, fontStyle: "italic", fontSize: "13px" }}>Generate a digest from today's alert results.</p>
              )}
              <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
                <button onClick={generateDigest} disabled={digestLoading || totalHits === 0} style={{ background: digestLoading || totalHits === 0 ? T.border : T.accent, color: digestLoading || totalHits === 0 ? T.muted : "#000", border: "none", borderRadius: "4px", padding: "9px 18px", fontSize: "12px", fontWeight: "bold" }}>
                  {digestLoading ? "Generating…" : "Generate Digest"}
                </button>
                {digestPreview && !digestPreview.empty && (
                  <button onClick={sendDigestEmail} disabled={sendingEmail || !emailAddr} style={{ background: sendingEmail || !emailAddr ? T.border : "#2196f3", color: sendingEmail || !emailAddr ? T.muted : "#fff", border: "none", borderRadius: "4px", padding: "9px 18px", fontSize: "12px", fontWeight: "bold" }}>
                    {sendingEmail ? "Sending…" : "📧 Send Now"}
                  </button>
                )}
              </div>
              {emailStatus && <p style={{ fontSize: "12px", color: emailStatus.startsWith("✅") ? "#4caf50" : "#ef5350", marginTop: "8px" }}>{emailStatus}</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
