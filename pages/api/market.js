// Live market data using Yahoo Finance v8 API - no API key required
// Symbols: ^BSESN=SENSEX, ^NSEI=NIFTY, USDINR=X=USD/INR, GC=F=Gold, CL=F=Crude Oil
// ^NSEBANK=Bank Nifty, ^CNXPHARMA=Nifty Pharma, TCS.NS, RELIANCE.NS etc.

const SYMBOLS = [
  // Indian indices
  { symbol: "^BSESN",     label: "SENSEX",      type: "index",    decimals: 0 },
  { symbol: "^NSEI",      label: "NIFTY 50",    type: "index",    decimals: 0 },
  { symbol: "^NSEBANK",   label: "BANK NIFTY",  type: "index",    decimals: 0 },
  { symbol: "^CNXPHARMA", label: "NIFTY PHARMA",type: "index",    decimals: 0 },
  // Currency
  { symbol: "USDINR=X",   label: "USD/INR",     type: "forex",    decimals: 2 },
  { symbol: "EURINR=X",   label: "EUR/INR",     type: "forex",    decimals: 2 },
  // Commodities
  { symbol: "GC=F",       label: "GOLD",        type: "commodity",decimals: 0, unit: "$/oz" },
  { symbol: "CL=F",       label: "CRUDE OIL",   type: "commodity",decimals: 2, unit: "$/bbl" },
  // Indian stocks relevant to healthcare
  { symbol: "TATACONSUM.NS", label: "TATA Consumer", type: "stock", decimals: 0 },
  { symbol: "DRREDDY.NS",    label: "Dr Reddy",       type: "stock", decimals: 0 },
  { symbol: "SUNPHARMA.NS",  label: "Sun Pharma",     type: "stock", decimals: 0 },
  { symbol: "APOLLOHOSP.NS", label: "Apollo Hosp",    type: "stock", decimals: 0 },
  { symbol: "THYROCARE.NS",  label: "Thyrocare",      type: "stock", decimals: 0 },
  { symbol: "METROPOLIS.NS", label: "Metropolis",     type: "stock", decimals: 0 },
  // Global
  { symbol: "^GSPC",      label: "S&P 500",     type: "index",    decimals: 0 },
  { symbol: "^IXIC",      label: "NASDAQ",      type: "index",    decimals: 0 },
  { symbol: "^FTSE",      label: "FTSE 100",    type: "index",    decimals: 0 },
];

function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined || isNaN(num)) return "—";
  if (Math.abs(num) >= 1000) {
    return num.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  return num.toFixed(decimals);
}

function formatChange(change, changePct) {
  if (!change && !changePct) return "";
  const dir = changePct >= 0 ? "▲" : "▼";
  const pct = Math.abs(changePct).toFixed(2);
  return `${dir}${pct}%`;
}

async function fetchYahooQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; MarketBot/1.0)",
      "Accept": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status} for ${symbol}`);
  const data = await res.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error(`No data for ${symbol}`);
  return {
    price: meta.regularMarketPrice || meta.previousClose,
    previousClose: meta.previousClose,
    change: (meta.regularMarketPrice || 0) - (meta.previousClose || 0),
    changePct: meta.regularMarketChangePercent || 0,
    currency: meta.currency,
    marketState: meta.marketState, // REGULAR, PRE, POST, CLOSED
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  // Allow custom symbols via query param
  const { type, symbols } = req.query;
  let symbolsToFetch;
  if (symbols) {
    // Custom symbol lookup e.g. ?symbols=WIPRO.NS
    const customSyms = symbols.split(",").map(s => s.trim());
    symbolsToFetch = customSyms.map(s => ({ symbol: s, label: s.replace(".NS","").replace(".BO",""), type: "stock", decimals: 0 }));
  } else if (type) {
    symbolsToFetch = SYMBOLS.filter(s => s.type === type);
  } else {
    symbolsToFetch = SYMBOLS;
  }

  // Cache control — 1 minute cache
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");

  try {
    // Fetch all symbols in parallel
    const results = await Promise.allSettled(
      symbolsToFetch.map(async (sym) => {
        try {
          const quote = await fetchYahooQuote(sym.symbol);
          const price = formatNumber(quote.price, sym.decimals);
          const changeStr = formatChange(quote.change, quote.changePct);
          const unit = sym.unit || (sym.type === "forex" ? "₹" : sym.type === "stock" ? "₹" : "");
          return {
            symbol: sym.symbol,
            label: sym.label,
            type: sym.type,
            price: quote.price,
            previousClose: quote.previousClose,
            change: quote.change,
            changePct: quote.changePct,
            display: `${sym.label}: ${unit}${price} ${changeStr}`,
            ticker: `${sym.label}: ${unit}${price} ${changeStr}`,
            marketState: quote.marketState,
            currency: quote.currency,
            isUp: quote.changePct >= 0,
            formatted: {
              price: `${unit}${price}`,
              change: changeStr,
            },
          };
        } catch (e) {
          return {
            symbol: sym.symbol,
            label: sym.label,
            type: sym.type,
            price: null,
            display: `${sym.label}: —`,
            ticker: `${sym.label}: —`,
            error: e.message,
          };
        }
      })
    );

    const data = results.map(r => r.status === "fulfilled" ? r.value : { label: "—", display: "—", error: r.reason?.message });
    const successful = data.filter(d => d.price !== null);
    const marketOpen = successful.some(d => d.marketState === "REGULAR");

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      market_status: marketOpen ? "OPEN" : "CLOSED",
      count: data.length,
      data,
      ticker_strings: data.map(d => d.ticker),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
