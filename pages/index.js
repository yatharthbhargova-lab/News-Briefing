import { useState, useEffect, useRef, useCallback } from "react";

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "markets", label: "Markets", emoji: "📈" },
  { id: "pharma", label: "Pharma & Health", emoji: "💊" },
  { id: "tech", label: "Tech", emoji: "🚀" },
  { id: "macro", label: "Economy", emoji: "🏛️" },
  { id: "tata", label: "TATA Group", emoji: "🔵" },
  { id: "us", label: "USA", emoji: "🇺🇸" },
  { id: "europe", label: "Europe", emoji: "🇪🇺" },
  { id: "asia", label: "Asia", emoji: "🌏" },
  { id: "global", label: "Global", emoji: "🌐" },
];

const QUERIES = {
  markets: "Indian stock market news today: SENSEX, NIFTY, top gainers losers, FII activity, RBI. Companies: Reliance, HDFC, Infosys, TCS, Wipro, Bajaj Finance.",
  pharma: "Indian and global pharma healthcare news: TATA 1MG, Sun Pharma, Dr Reddys, Cipla, Apollo Hospitals, Pfizer, Abbott. Drug approvals, earnings, partnerships.",
  tech: "Indian and global tech startup news: Zomato, Swiggy, Zepto, Meesho, CRED, Razorpay, Paytm, Google India, Microsoft India, Amazon India. Funding, AI, layoffs.",
  macro: "Indian economy news: RBI rate decision, CPI inflation, IIP data, rupee vs dollar, government spending, trade deficit, GST collections, IMF India forecast.",
  tata: "TATA Group news: TCS results and deals, Tata Motors EV and JLR, Tata Steel output, TATA 1MG GMV and pharmacy growth, Air India routes, Tata Consumer revenue, Tata Capital AUM.",
  us: "US business news: S&P 500, Dow Jones, NASDAQ, Federal Reserve policy, US inflation, earnings from Apple Microsoft Google Meta Amazon Tesla, jobs data, Treasury yields.",
  europe: "European business news: FTSE 100, DAX, CAC 40, ECB rate decisions, UK inflation, Bank of England, Germany GDP, LVMH Volkswagen Shell BP HSBC Nestle.",
  asia: "Asian business news: Nikkei 225, Hang Seng, Shanghai Composite, Bank of Japan, China GDP and PMI, South Korea exports, Samsung Toyota Sony Alibaba Tencent.",
  global: "Global macro and commodities news: Brent crude, gold price, US dollar index, OPEC decisions, World Bank IMF forecasts, geopolitical trade impacts.",
};

const SOURCE_BY_CAT = {
  markets: ["Economic Times", "Business Standard", "Mint", "Financial Express", "NDTV Profit"],
  pharma: ["Economic Times", "Business Standard", "Reuters", "Bloomberg", "Mint"],
  tech: ["Economic Times", "TechCrunch", "Bloomberg", "Mint", "Business Standard"],
  macro: ["Economic Times", "Reuters", "Bloomberg", "Financial Times", "Business Standard"],
  tata: ["Economic Times", "Business Standard", "Mint", "Financial Express", "NDTV Profit"],
  us: ["Wall Street Journal", "Bloomberg", "CNBC", "Reuters", "Forbes"],
  europe: ["Financial Times", "Reuters", "The Economist", "Bloomberg", "Guardian Business"],
  asia: ["Nikkei Asia", "South China Morning Post", "Bloomberg", "Reuters", "Business Times"],
  global: ["Reuters", "Bloomberg", "Financial Times", "Associated Press", "The Economist"],
};

const REGION_FLAG = { India: "🇮🇳", USA: "🇺🇸", Europe: "🇪🇺", Asia: "🌏", Global: "🌐" };

const DEFAULT_WATCHLIST = ["Reliance", "TCS", "HDFC Bank", "Infosys", "TATA 1MG"];
const DEFAULT_COMPETITORS = ["PharmEasy", "Practo", "Apollo 247", "Netmeds", "1MG"];
const DEFAULT_CURRENCIES = ["USD/INR", "EUR/INR", "GBP/INR", "JPY/INR", "GOLD", "CRUDE OIL"];

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

async function callClaude(prompt, system = "") {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: system || "You are a senior global financial journalist. Return only raw JSON. No markdown fences, no preamble, no explanation.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content[0].text;
}

function useLocalStorage(key, def) {
  const [val, setVal] = useState(def);
  useEffect(() => {
    try { const s = localStorage.getItem(key); if (s) setVal(JSON.parse(s)); } catch {}
  }, [key]);
  const set = useCallback((v) => {
    const next = typeof v === "function" ? v(val) : v;
    setVal(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  }, [key, val]);
  return [val, set];
}

// ── Sub-components ───────────────────────────────────────────────────────────

function NewsCard({ item, bookmarks, toggleBookmark, onShare, onRead, theme }) {
  const color = item.impact === "positive" ? "#4caf50" : item.impact === "negative" ? "#ef5350" : "#ff8c00";
  const icon = item.impact === "positive" ? "▲" : item.impact === "negative" ? "▼" : "●";
  const isBookmarked = bookmarks.some(b => b.headline === item.headline);
  const bg = theme === "light" ? "#f5f3ee" : "#0c0c16";
  const border = theme === "light" ? "#e0dbd0" : "#151525";
  const headlineColor = theme === "light" ? "#2a2520" : "#ccc4b4";
  const summaryColor = theme === "light" ? "#666" : "#383838";

  return (
    <div className="card" style={{ background: bg, border: `1px solid ${border}`, borderRadius: "4px", padding: "14px", position: "relative", overflow: "hidden", animation: "fadeUp 0.35s ease both" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: color, opacity: 0.7 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
          {item.region && <span style={{ fontSize: "10px" }}>{REGION_FLAG[item.region] || "🌐"}</span>}
          <span style={{ fontSize: "9px", color: theme === "light" ? "#aaa" : "#2e2e2e", letterSpacing: "0.05em", textTransform: "uppercase" }}>{item.source}</span>
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {item.tag && <span style={{ fontSize: "8px", padding: "1px 5px", border: `1px solid ${color}44`, borderRadius: "10px", color }}>{item.tag}</span>}
          <span style={{ fontSize: "9px", color: theme === "light" ? "#bbb" : "#252525" }}>{item.time}</span>
          <span style={{ fontSize: "10px", color, fontWeight: "bold" }}>{icon}</span>
        </div>
      </div>
      <h3 style={{ fontSize: "14px", fontWeight: "normal", lineHeight: 1.4, color: headlineColor, marginBottom: "7px" }}>{item.headline}</h3>
      <p style={{ fontSize: "11px", lineHeight: 1.65, color: summaryColor, fontStyle: "italic", marginBottom: "10px" }}>{item.summary}</p>
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={() => toggleBookmark(item)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", padding: "2px" }} title={isBookmarked ? "Remove bookmark" : "Bookmark"}>
          {isBookmarked ? "🔖" : "📌"}
        </button>
        <button onClick={() => onShare(item)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", padding: "2px" }} title="Share">📤</button>
        <button onClick={() => onRead(item)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", padding: "2px" }} title="Read aloud">🔊</button>
      </div>
    </div>
  );
}

function SentimentBar({ news }) {
  if (!news || news.length === 0) return null;
  const pos = news.filter(n => n.impact === "positive").length;
  const neg = news.filter(n => n.impact === "negative").length;
  const neu = news.filter(n => n.impact === "neutral").length;
  const total = news.length;
  const overall = pos > neg ? "Bullish 📈" : neg > pos ? "Bearish 📉" : "Neutral ➡️";
  const overallColor = pos > neg ? "#4caf50" : neg > pos ? "#ef5350" : "#ff8c00";

  return (
    <div style={{ marginBottom: "16px", background: "#0b0b16", border: "1px solid #181828", borderRadius: "4px", padding: "12px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ fontSize: "10px", color: "#ff8c00", letterSpacing: "0.15em", textTransform: "uppercase" }}>◆ Sentiment Score</span>
        <span style={{ fontSize: "12px", color: overallColor, fontWeight: "bold" }}>{overall}</span>
      </div>
      <div style={{ display: "flex", gap: "2px", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ width: `${(pos / total) * 100}%`, background: "#4caf50" }} />
        <div style={{ width: `${(neu / total) * 100}%`, background: "#ff8c00" }} />
        <div style={{ width: `${(neg / total) * 100}%`, background: "#ef5350" }} />
      </div>
      <div style={{ display: "flex", gap: "16px", marginTop: "6px" }}>
        <span style={{ fontSize: "10px", color: "#4caf50" }}>▲ {pos} Positive</span>
        <span style={{ fontSize: "10px", color: "#ff8c00" }}>● {neu} Neutral</span>
        <span style={{ fontSize: "10px", color: "#ef5350" }}>▼ {neg} Negative</span>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useLocalStorage("mb_theme", "dark");
  const [activeTab, setActiveTab] = useState("markets");
  const [activeView, setActiveView] = useState("news"); // news | bookmarks | watchlist | competitors | currencies | weekly
  const [newsCache, setNewsCache] = useState({});
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [bookmarks, setBookmarks] = useLocalStorage("mb_bookmarks", []);
  const [watchlist, setWatchlist] = useLocalStorage("mb_watchlist", DEFAULT_WATCHLIST);
  const [watchlistData, setWatchlistData] = useState(null);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [competitors, setCompetitors] = useLocalStorage("mb_competitors", DEFAULT_COMPETITORS);
  const [competitorData, setCompetitorData] = useState(null);
  const [competitorLoading, setCompetitorLoading] = useState(false);
  const [currencies, setCurrencies] = useLocalStorage("mb_currencies", DEFAULT_CURRENCIES);
  const [currencyData, setCurrencyData] = useState(null);
  const [currencyLoading, setCurrencyLoading] = useState(false);
  const [weeklyData, setWeeklyData] = useState(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [ticker, setTicker] = useState(["SENSEX: —", "NIFTY: —", "S&P 500: —", "NASDAQ: —", "FTSE: —", "USD/INR: —", "GOLD: —", "CRUDE: —"]);
  const [greeting, setGreeting] = useState("Good morning");
  const [dateStr, setDateStr] = useState("");
  const [emailModal, setEmailModal] = useState(false);
  const [emailAddr, setEmailAddr] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");
  const [newWatchItem, setNewWatchItem] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const searchRef = useRef(null);

  // Theme colors
  const T = theme === "light" ? {
    bg: "#f8f5f0", surface: "#ffffff", border: "#e5e0d8", text: "#2a2520",
    muted: "#888", accent: "#c47000", ticker: "#8a1a00", tickerBg: "#fff8f0",
    tabActive: "#c47000", tabInactive: "#ccc", headerBg: "#fff8f0",
  } : {
    bg: "#080810", surface: "#0c0c16", border: "#151525", text: "#ddd5c5",
    muted: "#444", accent: "#ff8c00", ticker: "#ff8c00", tickerBg: "#0e0800",
    tabActive: "#ff8c00", tabInactive: "#333", headerBg: "#080810",
  };

  useEffect(() => {
    setMounted(true);
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    setDateStr(new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
    fetchTicker();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setSummary(""); setError("");
    if (!newsCache[activeTab]) fetchNews(activeTab);
  }, [activeTab, mounted]);

  useEffect(() => {
    if (activeView === "watchlist" && !watchlistData) fetchWatchlist();
    if (activeView === "competitors" && !competitorData) fetchCompetitors();
    if (activeView === "currencies" && !currencyData) fetchCurrencies();
    if (activeView === "weekly" && !weeklyData) fetchWeekly();
  }, [activeView]);

  // ── Fetch functions ─────────────────────────────────────────────────────

  async function fetchTicker() {
    try {
      const text = await callClaude(`Return a JSON array of 8 global market ticker strings with current approximate values. Include: SENSEX, NIFTY, S&P 500, NASDAQ, FTSE 100, USD/INR, GOLD, CRUDE OIL. Format like: ["SENSEX: 82,450 ▲0.4%","NIFTY: 25,020 ▲0.3%","S&P 500: 5,650 ▲0.5%","NASDAQ: 18,200 ▲0.7%","FTSE 100: 8,320 ▼0.1%","USD/INR: ₹83.52","GOLD: $2,340/oz","CRUDE: $78.4/bbl"]. Return ONLY the JSON array.`);
      const parsed = parseJSON(text);
      if (Array.isArray(parsed)) setTicker(parsed);
    } catch {}
  }

  async function fetchNews(categoryId) {
    setLoading(true); setError("");
    const sources = SOURCE_BY_CAT[categoryId];
    try {
      const text = await callClaude(`Topic: ${QUERIES[categoryId]}\n\nReturn a JSON array of exactly 6 news items. Each item:\n{"headline":"max 10 words","summary":"2 sentences with specific names and numbers","source":"one of: ${sources.join(", ")}","time":"e.g. 2h ago","impact":"positive|negative|neutral","tag":"1-2 words","region":"India|USA|Europe|Asia|Global"}\n\nReturn ONLY the JSON array starting with [ and ending with ].`);
      const parsed = parseJSON(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setNewsCache(prev => ({ ...prev, [categoryId]: parsed }));
      } else throw new Error("Parse failed");
    } catch (e) { setError("Failed to load headlines. Please retry."); }
    setLoading(false);
  }

  async function fetchSummary() {
    const items = newsCache[activeTab];
    if (!items) return;
    setSummaryLoading(true); setSummary("");
    try {
      const text = await callClaude(
        `Headlines: ${items.map(n => n.headline).join(" | ")}\n\nWrite a 3-sentence executive briefing for the CFO of TATA 1MG. Be analytical and strategic. What does this mean for business decisions today?`,
        "You are a senior financial analyst. Write crisp flowing prose. No bullet points."
      );
      setSummary(text);
    } catch { setSummary("Could not generate summary. Please retry."); }
    setSummaryLoading(false);
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearchLoading(true); setSearchResults(null);
    try {
      const text = await callClaude(`Search query: "${searchQuery}"\n\nReturn a JSON array of 4 relevant business news items about this topic. Each item:\n{"headline":"max 10 words","summary":"2 sentences","source":"major publication","time":"recent","impact":"positive|negative|neutral","tag":"1-2 words","region":"India|USA|Europe|Asia|Global"}\n\nReturn ONLY the JSON array.`);
      const parsed = parseJSON(text);
      if (Array.isArray(parsed)) setSearchResults(parsed);
    } catch { setSearchResults([]); }
    setSearchLoading(false);
  }

  async function fetchWatchlist() {
    setWatchlistLoading(true);
    try {
      const text = await callClaude(`Give me latest news and approximate stock data for these companies: ${watchlist.join(", ")}.\n\nReturn a JSON array, one item per company:\n{"company":"name","price":"e.g. ₹2,450","change":"e.g. +1.2%","changeDir":"up|down|flat","headline":"latest news headline max 8 words","summary":"1 sentence","sentiment":"positive|negative|neutral"}\n\nReturn ONLY the JSON array.`);
      const parsed = parseJSON(text);
      if (Array.isArray(parsed)) setWatchlistData(parsed);
    } catch { setWatchlistData([]); }
    setWatchlistLoading(false);
  }

  async function fetchCompetitors() {
    setCompetitorLoading(true);
    try {
      const text = await callClaude(`Competitive intelligence for TATA 1MG vs these competitors: ${competitors.join(", ")}.\n\nReturn a JSON array, one item per competitor:\n{"company":"name","latestNews":"headline max 8 words","summary":"1 sentence about recent activity","threat":"high|medium|low","movement":"gaining|losing|stable","funding":"recent funding if any or N/A"}\n\nReturn ONLY the JSON array.`);
      const parsed = parseJSON(text);
      if (Array.isArray(parsed)) setCompetitorData(parsed);
    } catch { setCompetitorData([]); }
    setCompetitorLoading(false);
  }

  async function fetchCurrencies() {
    setCurrencyLoading(true);
    try {
      const text = await callClaude(`Give me current approximate values and trend for: ${currencies.join(", ")}.\n\nReturn a JSON array:\n{"pair":"e.g. USD/INR","value":"e.g. ₹83.52","change":"e.g. +0.12","changeDir":"up|down|flat","trend":"brief 1 sentence outlook"}\n\nReturn ONLY the JSON array.`);
      const parsed = parseJSON(text);
      if (Array.isArray(parsed)) setCurrencyData(parsed);
    } catch { setCurrencyData([]); }
    setCurrencyLoading(false);
  }

  async function fetchWeekly() {
    setWeeklyLoading(true);
    try {
      const text = await callClaude(
        `Write a comprehensive weekly business briefing covering this week's top developments across: Indian markets, global economy, pharma/healthcare, technology, and TATA Group. Write 5 paragraphs, one per section, each 3-4 sentences. Be specific with numbers and company names. Format as JSON: {"markets":"paragraph","global":"paragraph","pharma":"paragraph","tech":"paragraph","tata":"paragraph","outlook":"1 sentence forward looking statement"}. Return ONLY the JSON object.`,
        "You are a senior financial analyst writing a weekly executive briefing. Be specific, analytical, and insightful."
      );
      const parsed = parseJSON(text);
      if (parsed && typeof parsed === "object") setWeeklyData(parsed);
    } catch { setWeeklyData(null); }
    setWeeklyLoading(false);
  }

  function toggleBookmark(item) {
    setBookmarks(prev => {
      const exists = prev.some(b => b.headline === item.headline);
      return exists ? prev.filter(b => b.headline !== item.headline) : [...prev, { ...item, savedAt: new Date().toISOString() }];
    });
  }

  function onShare(item) {
    const text = `${item.headline}\n\n${item.summary}\n\nSource: ${item.source}`;
    if (navigator.share) {
      navigator.share({ title: item.headline, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => alert("Copied to clipboard!")).catch(() => {});
    }
  }

  function onRead(item) {
    if (!window.speechSynthesis) return alert("Voice not supported in this browser.");
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const utterance = new SpeechSynthesisUtterance(`${item.headline}. ${item.summary}`);
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  async function sendEmailDigest() {
    if (!emailAddr) return;
    setEmailSending(true); setEmailStatus("");
    const items = newsCache[activeTab] || [];
    const html = `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#ddd5c5;padding:32px;">
        <div style="color:#ff8c00;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:8px;">${dateStr}</div>
        <h1 style="color:#f0ebe0;font-size:28px;font-weight:normal;margin-bottom:4px;">${greeting}, Yatharth.</h1>
        <p style="color:#666;font-style:italic;margin-bottom:24px;">Your executive morning briefing.</p>
        ${summary ? `<div style="background:#0f0f1a;border-left:3px solid #ff8c00;padding:16px;margin-bottom:24px;"><p style="color:#a09880;line-height:1.7;">${summary}</p></div>` : ""}
        <h2 style="color:#ff8c00;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:16px;">Top Headlines</h2>
        ${items.map(item => `
          <div style="border:1px solid #1e1e2e;border-radius:4px;padding:14px;margin-bottom:10px;">
            <div style="font-size:10px;color:#555;margin-bottom:6px;">${item.source} · ${item.time}</div>
            <div style="font-size:15px;color:#ccc4b4;margin-bottom:6px;">${item.headline}</div>
            <div style="font-size:12px;color:#555;font-style:italic;">${item.summary}</div>
          </div>
        `).join("")}
        <p style="color:#333;font-size:11px;margin-top:24px;text-align:center;">Morning Briefing by TATA 1MG CFO Dashboard</p>
      </div>
    `;
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: emailAddr, subject: `Morning Briefing — ${dateStr}`, html }),
      });
      const data = await res.json();
      if (data.success) setEmailStatus("✅ Sent successfully!");
      else setEmailStatus(`❌ ${data.error}`);
    } catch { setEmailStatus("❌ Failed to send. Check email config."); }
    setEmailSending(false);
  }

  const currentNews = newsCache[activeTab] || [];

  if (!mounted) return (
    <div style={{ minHeight: "100vh", background: "#080810", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#ff8c00", fontFamily: "Georgia, serif", fontSize: "13px", letterSpacing: "0.2em" }}>LOADING...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "Georgia, 'Times New Roman', serif", transition: "background 0.3s, color 0.3s" }}>
      <style>{`
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .card { transition: border-color .2s, transform .2s; }
        .card:hover { transform: translateY(-2px); }
        input { outline: none; }
        button { font-family: Georgia, serif; }
        ::-webkit-scrollbar { height: 3px; width: 3px; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 2px; }
      `}</style>

      {/* Ticker */}
      <div style={{ background: T.tickerBg, borderBottom: `1px solid ${T.border}`, padding: "7px 0", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: "52px", animation: "ticker 40s linear infinite", whiteSpace: "nowrap" }}>
          {[...ticker, ...ticker].map((t, i) => (
            <span key={i} style={{ fontSize: "11px", color: T.ticker, fontFamily: "monospace", fontWeight: "bold", letterSpacing: "0.05em" }}>◆ {t}</span>
          ))}
        </div>
      </div>

      {/* Header */}
      <header style={{ padding: "20px 18px 16px", borderBottom: `1px solid ${T.border}`, background: T.headerBg }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "0.22em", color: T.accent, textTransform: "uppercase", marginBottom: "4px" }}>{dateStr}</div>
            <h1 style={{ fontSize: "clamp(20px,5vw,36px)", fontWeight: "normal", lineHeight: 1.1, letterSpacing: "-0.02em", color: T.text, marginBottom: "2px" }}>
              {greeting}, Yatharth.
            </h1>
            <p style={{ color: T.muted, fontSize: "12px", fontStyle: "italic" }}>Your global executive morning briefing.</p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, padding: "6px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }} title="Toggle theme">
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <button onClick={() => setEmailModal(true)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, padding: "6px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }} title="Email digest">
              📧
            </button>
            <a href="/financials" style={{ background: T.accent, color: "#000", padding: "6px 12px", borderRadius: "4px", fontSize: "11px", textDecoration: "none", fontWeight: "bold", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
              📊 Financials
            </a>
          </div>
        </div>

        {/* Search bar */}
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search any company, topic, or sector..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            style={{
              flex: 1, background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: "4px", padding: "10px 14px", color: T.text,
              fontSize: "13px", fontFamily: "Georgia, serif",
            }}
          />
          <button onClick={handleSearch} disabled={searchLoading} style={{
            background: T.accent, color: "#000", border: "none", borderRadius: "4px",
            padding: "10px 16px", cursor: "pointer", fontSize: "13px", fontWeight: "bold",
          }}>
            {searchLoading ? "..." : "Search"}
          </button>
          {searchResults && (
            <button onClick={() => { setSearchResults(null); setSearchQuery(""); }} style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, borderRadius: "4px", padding: "10px 12px", cursor: "pointer", fontSize: "12px" }}>✕</button>
          )}
        </div>
      </header>

      {/* View tabs */}
      <div style={{ display: "flex", overflowX: "auto", borderBottom: `1px solid ${T.border}`, background: T.headerBg, scrollbarWidth: "none" }}>
        {[
          { id: "news", label: "📰 News" },
          { id: "bookmarks", label: `🔖 Saved (${bookmarks.length})` },
          { id: "watchlist", label: "📊 Watchlist" },
          { id: "competitors", label: "⚔️ Competitors" },
          { id: "currencies", label: "💱 Currencies" },
          { id: "weekly", label: "📅 Weekly" },
        ].map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "11px 14px",
            fontSize: "12px", whiteSpace: "nowrap", flexShrink: 0,
            color: activeView === v.id ? T.accent : T.tabInactive,
            borderBottom: activeView === v.id ? `2px solid ${T.accent}` : "2px solid transparent",
          }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Category tabs (only in news view) */}
      {activeView === "news" && !searchResults && (
        <div style={{ display: "flex", overflowX: "auto", borderBottom: `1px solid ${T.border}`, scrollbarWidth: "none" }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveTab(cat.id)} style={{
              background: "none", border: "none", cursor: "pointer", padding: "10px 13px",
              fontSize: "11px", whiteSpace: "nowrap", flexShrink: 0,
              color: activeTab === cat.id ? T.accent : T.tabInactive,
              borderBottom: activeTab === cat.id ? `2px solid ${T.accent}` : "2px solid transparent",
            }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      )}

      <main style={{ padding: "16px", maxWidth: "960px", margin: "0 auto" }}>

        {/* ── SEARCH RESULTS ── */}
        {searchResults && (
          <div>
            <div style={{ fontSize: "12px", color: T.muted, marginBottom: "14px" }}>
              {searchResults.length > 0 ? `${searchResults.length} results for "${searchQuery}"` : `No results found for "${searchQuery}"`}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "10px" }}>
              {searchResults.map((item, i) => <NewsCard key={i} item={item} bookmarks={bookmarks} toggleBookmark={toggleBookmark} onShare={onShare} onRead={onRead} theme={theme} />)}
            </div>
          </div>
        )}

        {/* ── NEWS VIEW ── */}
        {!searchResults && activeView === "news" && (
          <>
            <SentimentBar news={currentNews} />

            {/* AI Summary */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.accent}`, borderRadius: "4px", padding: "16px 18px", marginBottom: "16px" }}>
              <div style={{ fontSize: "10px", color: T.accent, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "10px" }}>◆ AI Executive Summary</div>
              {summaryLoading
                ? <p style={{ color: T.muted, fontStyle: "italic", fontSize: "13px", animation: "pulse 1.5s infinite" }}>Analysing headlines…</p>
                : summary
                ? <p style={{ lineHeight: 1.78, color: T.muted, fontSize: "13px" }}>{summary}</p>
                : <p style={{ color: T.muted, fontStyle: "italic", fontSize: "13px", opacity: 0.5 }}>Load headlines first, then tap for your CFO-level briefing.</p>
              }
              <button onClick={fetchSummary} disabled={summaryLoading || loading || !currentNews.length} style={{
                marginTop: "14px", width: "100%", padding: "11px",
                background: (summaryLoading || loading || !currentNews.length) ? T.surface : T.accent,
                color: (summaryLoading || loading || !currentNews.length) ? T.muted : "#000",
                border: `1px solid ${T.border}`, borderRadius: "3px",
                cursor: (summaryLoading || loading || !currentNews.length) ? "not-allowed" : "pointer",
                fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: "bold",
              }}>
                {summaryLoading ? "Thinking…" : "Summarise for me"}
              </button>
            </div>

            {/* News grid */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: "28px", animation: "pulse 1.1s infinite", marginBottom: "12px" }}>📡</div>
                <div style={{ fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: T.muted }}>Fetching global headlines…</div>
              </div>
            ) : error ? (
              <div style={{ textAlign: "center", padding: "50px 0" }}>
                <p style={{ color: "#ef5350", marginBottom: "14px", fontSize: "13px" }}>{error}</p>
                <button onClick={() => fetchNews(activeTab)} style={{ background: "none", border: `1px solid ${T.accent}`, color: T.accent, padding: "8px 22px", borderRadius: "3px", cursor: "pointer", fontSize: "12px" }}>Retry</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "10px" }}>
                {currentNews.map((item, i) => <NewsCard key={i} item={item} bookmarks={bookmarks} toggleBookmark={toggleBookmark} onShare={onShare} onRead={onRead} theme={theme} />)}
              </div>
            )}

            {!loading && currentNews.length > 0 && (
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <button onClick={() => { setNewsCache(p => { const n = { ...p }; delete n[activeTab]; return n; }); setSummary(""); fetchNews(activeTab); }}
                  style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, padding: "9px 24px", borderRadius: "3px", cursor: "pointer", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  ↻ Refresh
                </button>
              </div>
            )}
          </>
        )}

        {/* ── BOOKMARKS VIEW ── */}
        {activeView === "bookmarks" && (
          <div>
            <div style={{ fontSize: "12px", color: T.muted, marginBottom: "14px" }}>
              {bookmarks.length === 0 ? "No saved articles yet. Tap 📌 on any headline to save it." : `${bookmarks.length} saved articles`}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "10px" }}>
              {bookmarks.map((item, i) => <NewsCard key={i} item={item} bookmarks={bookmarks} toggleBookmark={toggleBookmark} onShare={onShare} onRead={onRead} theme={theme} />)}
            </div>
            {bookmarks.length > 0 && (
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <button onClick={() => setBookmarks([])} style={{ background: "none", border: `1px solid #ef5350`, color: "#ef5350", padding: "9px 24px", borderRadius: "3px", cursor: "pointer", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Clear All
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── WATCHLIST VIEW ── */}
        {activeView === "watchlist" && (
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <input
                type="text" placeholder="Add company e.g. Wipro"
                value={newWatchItem}
                onChange={e => setNewWatchItem(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && newWatchItem.trim()) { setWatchlist(p => [...p, newWatchItem.trim()]); setNewWatchItem(""); setWatchlistData(null); } }}
                style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "9px 12px", color: T.text, fontSize: "13px" }}
              />
              <button onClick={() => { if (newWatchItem.trim()) { setWatchlist(p => [...p, newWatchItem.trim()]); setNewWatchItem(""); setWatchlistData(null); } }}
                style={{ background: T.accent, color: "#000", border: "none", borderRadius: "4px", padding: "9px 16px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>+ Add</button>
              <button onClick={() => { setWatchlistData(null); fetchWatchlist(); }}
                style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, borderRadius: "4px", padding: "9px 12px", cursor: "pointer", fontSize: "12px" }}>↻</button>
            </div>

            {watchlistLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0", animation: "pulse 1.2s infinite", color: T.muted }}>📊 Loading watchlist data…</div>
            ) : watchlistData ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "10px" }}>
                {watchlistData.map((item, i) => {
                  const changeColor = item.changeDir === "up" ? "#4caf50" : item.changeDir === "down" ? "#ef5350" : T.muted;
                  return (
                    <div key={i} className="card" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: "bold", color: T.text }}>{item.company}</div>
                          <div style={{ fontSize: "18px", color: T.text, marginTop: "2px" }}>{item.price}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "14px", color: changeColor, fontWeight: "bold" }}>{item.change}</div>
                          <button onClick={() => setWatchlist(p => p.filter(w => w !== item.company))} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: "10px", marginTop: "4px" }}>Remove</button>
                        </div>
                      </div>
                      <div style={{ fontSize: "12px", color: T.text, marginBottom: "4px" }}>{item.headline}</div>
                      <div style={{ fontSize: "11px", color: T.muted, fontStyle: "italic" }}>{item.summary}</div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}

        {/* ── COMPETITORS VIEW ── */}
        {activeView === "competitors" && (
          <div>
            <div style={{ fontSize: "12px", color: T.muted, marginBottom: "14px" }}>Tracking vs TATA 1MG</div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              {competitors.map(c => (
                <span key={c} style={{ fontSize: "11px", padding: "4px 10px", border: `1px solid ${T.border}`, borderRadius: "20px", color: T.muted, display: "flex", gap: "6px", alignItems: "center" }}>
                  {c}
                  <button onClick={() => setCompetitors(p => p.filter(x => x !== c))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef5350", fontSize: "10px", padding: 0 }}>✕</button>
                </span>
              ))}
              <button onClick={() => { setCompetitorData(null); fetchCompetitors(); }} style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, borderRadius: "20px", padding: "4px 12px", cursor: "pointer", fontSize: "11px" }}>↻ Refresh</button>
            </div>

            {competitorLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0", animation: "pulse 1.2s infinite", color: T.muted }}>⚔️ Gathering competitive intelligence…</div>
            ) : competitorData ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "10px" }}>
                {competitorData.map((item, i) => {
                  const threatColor = item.threat === "high" ? "#ef5350" : item.threat === "medium" ? "#ff8c00" : "#4caf50";
                  const movColor = item.movement === "gaining" ? "#ef5350" : item.movement === "losing" ? "#4caf50" : T.muted;
                  return (
                    <div key={i} className="card" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div style={{ fontSize: "14px", fontWeight: "bold", color: T.text }}>{item.company}</div>
                        <span style={{ fontSize: "10px", padding: "2px 8px", border: `1px solid ${threatColor}44`, borderRadius: "10px", color: threatColor }}>
                          {item.threat} threat
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: T.text, marginBottom: "4px" }}>{item.latestNews}</div>
                      <div style={{ fontSize: "11px", color: T.muted, fontStyle: "italic", marginBottom: "8px" }}>{item.summary}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
                        <span style={{ color: movColor }}>● {item.movement}</span>
                        {item.funding && item.funding !== "N/A" && <span style={{ color: T.muted }}>💰 {item.funding}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}

        {/* ── CURRENCIES VIEW ── */}
        {activeView === "currencies" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ fontSize: "12px", color: T.muted }}>Currency & Commodity Watchlist</div>
              <button onClick={() => { setCurrencyData(null); fetchCurrencies(); }} style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, borderRadius: "4px", padding: "6px 12px", cursor: "pointer", fontSize: "11px" }}>↻ Refresh</button>
            </div>

            {currencyLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0", animation: "pulse 1.2s infinite", color: T.muted }}>💱 Loading currency data…</div>
            ) : currencyData ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "10px" }}>
                {currencyData.map((item, i) => {
                  const changeColor = item.changeDir === "up" ? "#4caf50" : item.changeDir === "down" ? "#ef5350" : T.muted;
                  const changeIcon = item.changeDir === "up" ? "▲" : item.changeDir === "down" ? "▼" : "●";
                  return (
                    <div key={i} className="card" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "14px" }}>
                      <div style={{ fontSize: "11px", color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>{item.pair}</div>
                      <div style={{ fontSize: "22px", color: T.text, marginBottom: "4px" }}>{item.value}</div>
                      <div style={{ fontSize: "13px", color: changeColor, marginBottom: "8px", fontWeight: "bold" }}>{changeIcon} {item.change}</div>
                      <div style={{ fontSize: "11px", color: T.muted, fontStyle: "italic", lineHeight: 1.5 }}>{item.trend}</div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}

        {/* ── WEEKLY SUMMARY VIEW ── */}
        {activeView === "weekly" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "10px", color: T.accent, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "4px" }}>◆ Weekly Executive Summary</div>
                <div style={{ fontSize: "12px", color: T.muted }}>AI-generated review of this week's top business developments</div>
              </div>
              <button onClick={() => { setWeeklyData(null); fetchWeekly(); }} style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, borderRadius: "4px", padding: "8px 14px", cursor: "pointer", fontSize: "11px" }}>↻ Regenerate</button>
            </div>

            {weeklyLoading ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: "28px", animation: "pulse 1.1s infinite", marginBottom: "12px" }}>📅</div>
                <div style={{ fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: T.muted }}>Compiling weekly briefing…</div>
              </div>
            ) : weeklyData ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { key: "markets", label: "📈 Indian Markets", color: "#4caf50" },
                  { key: "global", label: "🌐 Global Economy", color: "#2196f3" },
                  { key: "pharma", label: "💊 Pharma & Health", color: "#9c27b0" },
                  { key: "tech", label: "🚀 Technology", color: "#ff5722" },
                  { key: "tata", label: "🔵 TATA Group", color: "#0078d4" },
                ].map(section => weeklyData[section.key] && (
                  <div key={section.key} style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${section.color}`, borderRadius: "4px", padding: "16px 18px" }}>
                    <div style={{ fontSize: "11px", color: section.color, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>{section.label}</div>
                    <p style={{ fontSize: "13px", lineHeight: 1.75, color: T.text }}>{weeklyData[section.key]}</p>
                  </div>
                ))}
                {weeklyData.outlook && (
                  <div style={{ background: T.accent + "18", border: `1px solid ${T.accent}44`, borderRadius: "4px", padding: "14px 18px", textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: T.accent, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "6px" }}>Week Ahead Outlook</div>
                    <p style={{ fontSize: "13px", color: T.text, fontStyle: "italic" }}>{weeklyData.outlook}</p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "50px 0", color: T.muted }}>
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>📅</div>
                <p style={{ fontSize: "13px" }}>Tap "Regenerate" to generate this week's summary</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Email Modal */}
      {emailModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "6px", padding: "24px", width: "100%", maxWidth: "380px" }}>
            <div style={{ fontSize: "10px", color: T.accent, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "12px" }}>◆ Email Digest</div>
            <p style={{ fontSize: "13px", color: T.muted, marginBottom: "16px", lineHeight: 1.6 }}>
              Send today's {CATEGORIES.find(c => c.id === activeTab)?.label} briefing to your inbox.
            </p>
            <input
              type="email" placeholder="your@email.com"
              value={emailAddr}
              onChange={e => setEmailAddr(e.target.value)}
              style={{ width: "100%", background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "10px 12px", color: T.text, fontSize: "13px", marginBottom: "12px" }}
            />
            {emailStatus && <p style={{ fontSize: "12px", color: emailStatus.startsWith("✅") ? "#4caf50" : "#ef5350", marginBottom: "10px" }}>{emailStatus}</p>}
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={sendEmailDigest} disabled={emailSending || !emailAddr} style={{
                flex: 1, padding: "11px", background: emailSending || !emailAddr ? T.border : T.accent,
                color: emailSending || !emailAddr ? T.muted : "#000",
                border: "none", borderRadius: "4px", cursor: emailSending || !emailAddr ? "not-allowed" : "pointer",
                fontSize: "12px", fontWeight: "bold", letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                {emailSending ? "Sending…" : "Send Now"}
              </button>
              <button onClick={() => { setEmailModal(false); setEmailStatus(""); }} style={{ padding: "11px 16px", background: "none", border: `1px solid ${T.border}`, color: T.muted, borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Cancel</button>
            </div>
            <p style={{ fontSize: "10px", color: T.muted, marginTop: "12px", lineHeight: 1.5 }}>
              Note: Add GMAIL_USER and GMAIL_APP_PASSWORD to your Vercel environment variables to enable email sending.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
