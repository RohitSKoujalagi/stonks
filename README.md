# TradeSim 📈

A beginner-friendly **paper trading simulator**. Practice buying and selling stocks with a virtual $10,000 — no real money involved.

---

## Stack

| Layer     | Tech                        |
|-----------|-----------------------------|
| Backend   | Python + FastAPI            |
| Frontend  | React (Vite) + Tailwind CSS |
| Database  | SQLite (auto-created)       |
| Data      | yfinance (Yahoo Finance)    |
| Charts    | Lightweight Charts          |

---

## Features

- 📊 Candlestick charts with SMA-20 and RSI-14 indicators
- 💰 Virtual wallet starting at $10,000
- 🛒 Buy/Sell orders with optional 0.05% slippage simulation
- 📁 Portfolio table with live P&L tracking
- 🔄 Supports NSE, BSE, and US markets

---

## Getting Started

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
> API runs at `http://127.0.0.1:8000`. The SQLite database is created automatically on first run.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
> App runs at `http://localhost:5173`.

---

## API Endpoints

| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| GET    | `/api/symbols/{exchange}`       | List symbols             |
| GET    | `/api/price/{exchange}/{symbol}`| Current price            |
| GET    | `/api/chart/{exchange}/{symbol}`| OHLC + SMA20 + RSI14     |
| GET    | `/api/wallet`                   | Balance + holdings       |
| POST   | `/api/order`                    | Place buy/sell order     |
| GET    | `/api/trades`                   | Trade history            |
| POST   | `/api/reset`                    | Reset to $10,000         |

---

## Supported Exchanges

- **NSE** — e.g. `RELIANCE`, `TCS`, `INFY`
- **BSE** — same ticker names as NSE (e.g. `RELIANCE`, not numeric codes)
- **US** — e.g. `AAPL`, `TSLA`, `BTC-USD`