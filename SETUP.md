# TradeSim — Setup Guide

A paper trading simulator for **NSE**, **BSE**, and **US** markets built with:
- **Backend**: Python + FastAPI + SQLite + yfinance
- **Frontend**: React (Vite) + Tailwind CSS + TradingView Lightweight Charts

---

## Project Structure

```
tradesim/
├── backend/
│   ├── main.py              # FastAPI app (all routes + DB logic)
│   └── requirements.txt     # Python dependencies
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── utils/api.js
        ├── hooks/useWallet.js
        └── components/
            ├── Header.jsx
            ├── SymbolSearch.jsx
            ├── TradingChart.jsx
            ├── OrderPanel.jsx
            ├── Portfolio.jsx
            └── TradeHistory.jsx
```

---

## Prerequisites

| Tool | Min Version | Install |
|------|-------------|---------|
| Python | 3.10+ | https://python.org |
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | bundled with Node |

---

## Step-by-Step Setup

### 1 — Clone / Copy the Project

Place the `tradesim/` folder wherever you like, e.g. `~/projects/tradesim`.

---

### 2 — Backend Setup

```bash
# Navigate to backend
cd tradesim/backend

# (Recommended) Create a virtual environment
python -m venv venv

# Activate it
# macOS / Linux:
source venv/bin/activate
# Windows (CMD):
venv\Scripts\activate.bat
# Windows (PowerShell):
venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

**Start the backend server:**

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

The SQLite database file `tradesim.db` is created automatically on first run.

**Verify the API is working:**

Open http://localhost:8000/docs — you'll see the interactive Swagger UI with all endpoints.

---

### 3 — Frontend Setup

Open a **new terminal window/tab** (keep the backend running).

```bash
# Navigate to frontend
cd tradesim/frontend

# Install Node dependencies
npm install

# Start the dev server
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

**Open http://localhost:5173 in your browser.**

---

## Using TradeSim

### Exchanges Supported

| Exchange | Ticker Format | Example |
|----------|--------------|---------|
| NSE | `SYMBOL.NS` (auto-appended) | RELIANCE, TCS, INFY |
| BSE | `SYMBOL.BO` (auto-appended) | 500325 (Reliance), 532540 (TCS) |
| US | Direct ticker | AAPL, TSLA, BTC-USD |

### Workflow

1. **Select Exchange** — click the dropdown (NSE / BSE / US)
2. **Search Symbol** — type a symbol or pick from the popular list
3. **Analyze** — use the candlestick chart with SMA-20 and RSI-14
4. **Place Order** — enter quantity → toggle slippage → BUY or SELL
5. **Track** — watch Portfolio and P&L update in real-time

### Virtual Wallet

- Every session starts with **₹10,000**
- Click **Reset** in the header to wipe all trades and restore ₹10,000

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chart/{exchange}/{symbol}` | OHLCV + SMA20 + RSI14 |
| GET | `/api/price/{exchange}/{symbol}` | Latest price |
| GET | `/api/symbols/{exchange}` | Popular symbols list |
| GET | `/api/wallet` | Cash + holdings + equity |
| POST | `/api/order` | Place buy/sell order |
| GET | `/api/trades` | Trade history (last 100) |
| POST | `/api/reset` | Reset simulation |

---

## Common Issues

### "No data for ticker"
- BSE uses numeric codes (e.g. `500325` for Reliance), not names
- Some symbols may be delisted or unavailable on Yahoo Finance
- Crypto on US exchange: use `BTC-USD`, `ETH-USD` format

### CORS error in browser
- Ensure backend is running on port 8000
- The Vite proxy (`/api → localhost:8000`) handles CORS automatically in dev

### Port already in use
```bash
# Change backend port
uvicorn main:app --reload --port 8001

# Then update vite.config.js proxy target to http://localhost:8001
```

### yfinance rate limiting
Yahoo Finance may throttle requests temporarily. Wait 30–60 seconds and retry.

---

## Production Build

```bash
# Build frontend
cd frontend
npm run build
# Output is in frontend/dist/

# Serve static files from FastAPI (add to main.py):
# from fastapi.staticfiles import StaticFiles
# app.mount("/", StaticFiles(directory="../frontend/dist", html=True), name="static")

# Run backend (no --reload in prod)
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## Accounting Formulas Used

```
Average Entry Price  = Total Cost of All Buys / Total Quantity Owned
Unrealized P&L       = (Current Price - Avg Entry Price) × Quantity
Total Equity         = Cash Balance + Sum(Current Price × Qty) for all positions
Slippage (Buy)       = Market Price × 1.0005
Slippage (Sell)      = Market Price × 0.9995
```
