# 📰 Morning Briefing v2.0

Your AI-powered global executive business news app with 15 features.

## ✨ Features

### 🟢 Core
- **Live news** across 9 categories: Markets, Pharma, Tech, Economy, TATA Group, USA, Europe, Asia, Global
- **Search** any company, topic, or sector
- **Bookmark** articles to read later
- **Dark/Light mode** toggle
- **Share** headlines to WhatsApp, email, or clipboard

### 🟡 Intelligence
- **Daily email digest** — send today's briefing to your inbox
- **Portfolio watchlist** — track your stocks with news + price
- **Competitor tracker** — monitor PharmEasy, Practo, Apollo 247 etc.
- **Currency & commodity watchlist** — USD/INR, Gold, Crude and more
- **Sentiment score** — Bullish/Bearish/Neutral rating per category

### 🔴 Power Features
- **Voice briefing** — tap 🔊 on any card to hear it read aloud
- **Weekly summary** — full AI-generated week-in-review
- **Custom watchlist** — add/remove any company
- **India vs Global** — dedicated tabs for each region
- **Global ticker** — 8 live market indicators at the top

---

## 🚀 Deploy to Vercel

### Step 1 — GitHub
```bash
git init
git add .
git commit -m "v2 - all features"
git branch -M main
git remote add origin https://github.com/YOURNAME/news-briefing.git
git push -u origin main --force
```

### Step 2 — Vercel
1. Go to vercel.com → Import your repo → Deploy
2. Add Environment Variables:
   - `ANTHROPIC_API_KEY` — from console.anthropic.com
   - `GMAIL_USER` — your Gmail address (optional, for email feature)
   - `GMAIL_APP_PASSWORD` — Gmail App Password (optional)
3. Redeploy

### Step 3 — Gmail App Password (for email feature)
1. Go to myaccount.google.com → Security
2. Enable 2-Step Verification
3. Search "App Passwords" → Create one named "Morning Briefing"
4. Copy the 16-character password → paste into Vercel as GMAIL_APP_PASSWORD

### Step 4 — Add to Phone Home Screen
- **iPhone**: Open in Safari → Share → Add to Home Screen
- **Android**: Open in Chrome → ⋮ → Add to Home Screen

---

## 🔧 Run Locally
```bash
npm install
cp .env.example .env.local
# Edit .env.local with your keys
npm run dev
```
