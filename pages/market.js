import { useState, useEffect, useCallback } from "react";

const WATCHLIST_DEFAULTS = [
  "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS",
  "SUNPHARMA.NS", "DRREDDY.NS", "APOLLOHOSP.NS",
  "THYROCARE.NS", "METROPOLIS.NS", "TATACONSUM.NS",
];

const INDEX_SYMBOLS = [
  { symbol: "^BSESN",      label: "SENSEX",       color: "#ff8c00" },
  { symbol: "^NSEI",       label: "NIFTY 50",     color: "#2196f3" },
  { symbol: "^NSEBANK",    label: "BANK NIFTY",   color: "#9c27b0" },
  { symbol: "^CNXPHARMA",  label: "NIFTY PHARMA", color: "#4caf50" },
  { symbol: "^GSPC",       label: "S&P 500",       color: "#ef5350" },
  { symbol: "^FTSE",       label: "FTSE 100",      color: "#00838f" },
];

const FOREX_SYMBOLS = [
  { symbol: "USDINR=X",  label: "USD/INR",  color: "#ff8c00" },
  { symbol: "EURINR=X",  label: "EUR/INR",  color: "#2196f3" },
  { symbol: "GBPINR=X",  label: "GBP/INR",  color: "#4caf50" },
  { symbol: "JPYINR=X",  label: "JPY/INR",  color: "#9c27b0" },
];

const COMMODITY_SYMBOLS = [
  { symbol: "GC=F",  label: "GOLD",      color: "#ff8c00", unit: "$/oz" },
  { symbol: "SI=F",  label: "SILVER",    color: "#888",    unit: "$/oz" },
  { symbol: "CL=F",  label: "CRUDE OIL", color: "#ef5350", unit: "$/bbl" },
  { symbol: "NG=F",  label: "NAT GAS",   color: "#2196f3", unit: "$/MMBtu" },
];

function formatPrice(price, decimals = 0) {
  if (!price) return "—";
  return price.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function ChangeChip({ changePct }) {
  if (changePct === null || changePct === undefined) return null;
  const isUp = changePct >= 0;
  return (
    <span style={{
      fontSize: "11px", fontWeight: "bold", padding: "2px 7px",
      background: isUp ? "#4caf5022" : "#ef535022",
      color: isUp ? "#4caf50" : "#ef5350",
      borderRadius: "4px",
    }}>
      {isUp ? "▲" : "▼"} {Math.abs(changePct).toFixed(2)}%
    </span>
  );
}

function MarketCard({ item, color, T }) {
  if (!item) return null;
  const isUp = item.changePct >= 0;
  return (
    <div style={{ background: T.surface, border: `1px solid ${isUp ? "#4caf5033" : "#ef535033"}`, borderTop: `3px solid ${color}`, borderRadius: "4px", padding: "14px" }}>
      <div style={{ fontSize: "10px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>{item.label}</div>
      <div style={{ fontSize: "22px", fontWeight: "bold", color: T.text, marginBottom: "4px" }}>
        {item.formatted?.price || "—"}
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <ChangeChip changePct={item.changePct} />
        {item.marketState && (
          <span style={{ fontSize: "9px", color: item.marketState === "REGULAR" ? "#4caf50" : T.muted }}>
            {item.marketState === "REGULAR" ? "● LIVE" : item.marketState}
          </span>
        )}
      </div>
    </div>
  );
}

function StockRow({ item, T }) {
  if (!item) return null;
  const isUp = item.changePct >= 0;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: `1px solid ${T.border}` }}>
      <div>
        <div style={{ fontSize: "13px", color: T.text, fontWeight: "bold" }}>{item.label}</div>
        <div style={{ fontSize: "10px", color: T.muted }}>{item.symbol}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: "15px", fontWeight: "bold", color: T.text }}>{item.formatted?.price || "—"}</div>
        <ChangeChip changePct={item.changePct} />
      </div>
    </div>
  );
}

export default function MarketDashboard() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [marketStatus, setMarketStatus] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [watchlist, setWatchlist] = useState(WATCHLIST_DEFAULTS);
  const [watchlistData, setWatchlistData] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState("");

  const T = theme === "dark"
    ? { bg: "#080810", surface: "#0c0c18", border: "#151528", text: "#ddd5c5", muted: "#444", accent: "#ff8c00" }
    : { bg: "#f5f3ee", surface: "#ffffff", border: "#e0dbd0", text: "#1a1510", muted: "#888", accent: "#c47000" };

  useEffect(() => {
    setMounted(true);
    try { const t = localStorage.getItem("mb_theme"); if (t) setTheme(t); } catch {}
    try { const w = localStorage.getItem("mb_stock_watchlist"); if (w) setWatchlist(JSON.parse(w)); } catch {}
  }, []);

  useEffect(() => {
    if (mounted) { fetchMarket(); fetchWatchlist(); }
  }, [mounted]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => { fetchMarket(); fetchWatchlist(); }, 60000);
    return () => clearInterval(interval);
  }, [mounted]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => setCountdown(c => c <= 1 ? 60 : c - 1), 1000);
    return () => clearInterval(timer);
  }, []);

  async function fetchMarket() {
    setError("");
    try {
      const res = await fetch("/api/market");
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setMarketData(data.data || []);
        setMarketStatus(data.market_status);
        setLastUpdate(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        setCountdown(60);
      }
    } catch (e) {
      setError("Could not fetch live data: " + e.message);
    }
    setLoading(false);
  }

  async function fetchWatchlist() {
    setWatchlistLoading(true);
    try {
      const results = await Promise.allSettled(
        watchlist.map(async (sym) => {
          const res = await fetch(`/api/market?symbols=${sym}`);
          const data = await res.json();
          const item = data.data?.find(d => d.symbol === sym);
          return item || { symbol: sym, label: sym.replace(".NS", "").replace(".BO", ""), price: null };
        })
      );
      setWatchlistData(results.map(r => r.status === "fulfilled" ? r.value : null).filter(Boolean));
    } catch {}
    setWatchlistLoading(false);
  }

  function addToWatchlist() {
    if (!newSymbol.trim()) return;
    const sym = newSymbol.trim().toUpperCase();
    const updated = [...watchlist, sym.includes(".") ? sym : sym + ".NS"];
    setWatchlist(updated);
    try { localStorage.setItem("mb_stock_watchlist", JSON.stringify(updated)); } catch {}
    setNewSymbol("");
    fetchWatchlist();
  }

  function removeFromWatchlist(sym) {
    const updated = watchlist.filter(s => s !== sym);
    setWatchlist(updated);
    try { localStorage.setItem("mb_stock_watchlist", JSON.stringify(updated)); } catch {}
    setWatchlistData(prev => prev.filter(d => d.symbol !== sym));
  }

  const getBySymbol = (sym) => marketData.find(d => d.symbol === sym);

  const indices = INDEX_SYMBOLS.map(s => ({ ...s, ...getBySymbol(s.symbol) })).filter(d => d.price);
  const forex = FOREX_SYMBOLS.map(s => ({ ...s, ...getBySymbol(s.symbol) })).filter(d => d.price);
  const commodities = COMMODITY_SYMBOLS.map(s => ({ ...s, ...getBySymbol(s.symbol) })).filter(d => d.price);
  const healthcareStocks = marketData.filter(d => ["SUNPHARMA.NS", "DRREDDY.NS", "APOLLOHOSP.NS", "THYROCARE.NS", "METROPOLIS.NS", "TATACONSUM.NS"].includes(d.symbol) && d.price);

  if (!mounted) return <div style={{ minHeight: "100vh", background: "#080810", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: "#ff8c00", fontFamily: "Georgia", fontSize: "13px", letterSpacing: "0.2em" }}>LOADING...</div></div>;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        button { font-family: Georgia, serif; cursor: pointer; }
        input { outline: none; font-family: Georgia, serif; }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 2px; }
      `}</style>

      <header style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ fontSize: "10px", color: T.accent, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "3px" }}>◆ Live Market Data</div>
            <h1 style={{ fontSize: "clamp(16px,3.5vw,24px)", fontWeight: "normal", color: T.text, marginBottom: "2px" }}>Market Dashboard</h1>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", color: marketStatus === "OPEN" ? "#4caf50" : "#ef5350", fontWeight: "bold" }}>
                {marketStatus === "OPEN" ? "● Market OPEN" : "● Market CLOSED"}
              </span>
              {lastUpdate && <span style={{ fontSize: "11px", color: T.muted }}>Updated: {lastUpdate}</span>}
              <span style={{ fontSize: "11px", color: T.muted }}>Next refresh in {countdown}s</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={() => { fetchMarket(); fetchWatchlist(); setCountdown(60); }} style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, padding: "6px 12px", borderRadius: "4px", fontSize: "11px" }}>↻ Refresh Now</button>
            <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, padding: "6px 10px", borderRadius: "4px", fontSize: "14px" }}>{theme === "dark" ? "☀️" : "🌙"}</button>
            <a href="/" style={{ background: T.accent, color: "#000", padding: "7px 14px", borderRadius: "4px", fontSize: "11px", textDecoration: "none", fontWeight: "bold" }}>← News</a>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, background: T.surface, overflowX: "auto" }}>
        {[["overview", "📊 Overview"], ["indices", "📈 Indices"], ["forex", "💱 Forex"], ["commodities", "🪙 Commodities"], ["healthcare", "💊 Healthcare Stocks"], ["watchlist", "⭐ My Watchlist"]].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "11px 16px", fontSize: "12px", whiteSpace: "nowrap", color: activeTab === id ? T.accent : T.muted, borderBottom: activeTab === id ? `2px solid ${T.accent}` : "2px solid transparent" }}>{label}</button>
        ))}
      </div>

      <main style={{ padding: "16px", maxWidth: "1200px", margin: "0 auto" }}>
        {error && <div style={{ background: "#ef535010", border: "1px solid #ef535033", borderRadius: "4px", padding: "10px 14px", marginBottom: "14px", fontSize: "12px", color: "#ef5350" }}>{error} — showing cached data if available.</div>}

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "32px", animation: "pulse 1.1s infinite", marginBottom: "12px" }}>📡</div>
            <div style={{ fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: T.muted }}>Fetching live market data from Yahoo Finance…</div>
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <div>
                <div style={{ fontSize: "10px", color: T.accent, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "12px" }}>📈 Indian & Global Indices</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "10px", marginBottom: "20px" }}>
                  {indices.map(item => <MarketCard key={item.symbol} item={item} color={item.color} T={T} />)}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <div style={{ fontSize: "10px", color: "#2196f3", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>💱 Forex — INR Rates</div>
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "4px", overflow: "hidden" }}>
                      {forex.map(item => <StockRow key={item.symbol} item={item} T={T} />)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "#ff8c00", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>🪙 Commodities</div>
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "4px", overflow: "hidden" }}>
                      {commodities.map(item => <StockRow key={item.symbol} item={item} T={T} />)}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "16px" }}>
                  <div style={{ fontSize: "10px", color: "#4caf50", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>💊 Healthcare & Pharma Stocks</div>
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "4px", overflow: "hidden" }}>
                    {healthcareStocks.map(item => <StockRow key={item.symbol} item={item} T={T} />)}
                  </div>
                </div>
              </div>
            )}

            {/* INDICES */}
            {activeTab === "indices" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "10px" }}>
                  {indices.map(item => (
                    <div key={item.symbol} style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: `3px solid ${item.color}`, borderRadius: "4px", padding: "16px" }}>
                      <div style={{ fontSize: "10px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>{item.label}</div>
                      <div style={{ fontSize: "26px", fontWeight: "bold", color: T.text, marginBottom: "6px" }}>{item.formatted?.price || "—"}</div>
                      <ChangeChip changePct={item.changePct} />
                      {item.previousClose && <div style={{ fontSize: "10px", color: T.muted, marginTop: "6px" }}>Prev close: {formatPrice(item.previousClose, 0)}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FOREX */}
            {activeTab === "forex" && (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "4px", overflow: "hidden" }}>
                {[...forex, ...marketData.filter(d => d.type === "forex" && !FOREX_SYMBOLS.find(f => f.symbol === d.symbol))].map(item => (
                  <div key={item.symbol} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
                    <div>
                      <div style={{ fontSize: "14px", color: T.text, fontWeight: "bold" }}>{item.label}</div>
                      <div style={{ fontSize: "10px", color: T.muted }}>{item.symbol}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "18px", fontWeight: "bold", color: T.text }}>₹{formatPrice(item.price, 2)}</div>
                      <ChangeChip changePct={item.changePct} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* COMMODITIES */}
            {activeTab === "commodities" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "10px" }}>
                {commodities.map(item => (
                  <div key={item.symbol} style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: `3px solid ${item.color}`, borderRadius: "4px", padding: "16px" }}>
                    <div style={{ fontSize: "10px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>{item.label}</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: T.text, marginBottom: "6px" }}>{item.formatted?.price || "—"}</div>
                    <div style={{ fontSize: "11px", color: T.muted, marginBottom: "6px" }}>{item.unit}</div>
                    <ChangeChip changePct={item.changePct} />
                  </div>
                ))}
              </div>
            )}

            {/* HEALTHCARE STOCKS */}
            {activeTab === "healthcare" && (
              <div>
                <div style={{ fontSize: "11px", color: T.muted, marginBottom: "14px" }}>Live NSE prices for Indian pharma and healthcare stocks.</div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "4px", overflow: "hidden" }}>
                  {healthcareStocks.map(item => (
                    <div key={item.symbol} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
                      <div>
                        <div style={{ fontSize: "14px", color: T.text, fontWeight: "bold" }}>{item.label}</div>
                        <div style={{ fontSize: "10px", color: T.muted }}>{item.symbol} · NSE</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "18px", fontWeight: "bold", color: T.text }}>₹{formatPrice(item.price, 0)}</div>
                        <ChangeChip changePct={item.changePct} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WATCHLIST */}
            {activeTab === "watchlist" && (
              <div>
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                  <input type="text" value={newSymbol} onChange={e => setNewSymbol(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addToWatchlist()}
                    placeholder="Add symbol e.g. WIPRO or WIPRO.NS"
                    style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "9px 12px", borderRadius: "4px", fontSize: "13px" }} />
                  <button onClick={addToWatchlist} style={{ background: T.accent, color: "#000", border: "none", borderRadius: "4px", padding: "9px 18px", fontSize: "12px", fontWeight: "bold" }}>+ Add</button>
                  <button onClick={() => { fetchWatchlist(); }} disabled={watchlistLoading} style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, borderRadius: "4px", padding: "9px 14px", fontSize: "11px" }}>↻</button>
                </div>

                {watchlistLoading ? (
                  <div style={{ textAlign: "center", padding: "30px", color: T.muted, animation: "pulse 1.2s infinite" }}>Loading watchlist prices…</div>
                ) : (
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "4px", overflow: "hidden" }}>
                    {watchlistData.map(item => item && (
                      <div key={item.symbol} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
                        <div>
                          <div style={{ fontSize: "14px", color: T.text, fontWeight: "bold" }}>{item.label || item.symbol}</div>
                          <div style={{ fontSize: "10px", color: T.muted }}>{item.symbol}</div>
                        </div>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "18px", fontWeight: "bold", color: T.text }}>{item.price ? `₹${formatPrice(item.price, 0)}` : "—"}</div>
                            {item.changePct !== undefined && <ChangeChip changePct={item.changePct} />}
                          </div>
                          <button onClick={() => removeFromWatchlist(item.symbol)} style={{ background: "none", border: "none", color: "#ef5350", cursor: "pointer", fontSize: "14px" }}>✕</button>
                        </div>
                      </div>
                    ))}
                    {watchlistData.length === 0 && <div style={{ padding: "20px", textAlign: "center", color: T.muted, fontSize: "13px" }}>Add stocks above to track their live prices.</div>}
                  </div>
                )}

                <p style={{ fontSize: "10px", color: T.muted, marginTop: "12px" }}>
                  Use NSE symbols: RELIANCE.NS, TCS.NS, INFY.NS, WIPRO.NS etc. Data from Yahoo Finance, refreshed every 60 seconds.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
