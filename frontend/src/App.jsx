import React, { useState, useCallback, useEffect } from 'react'
import Header from './components/Header'
import SymbolSearch from './components/SymbolSearch'
import TradingChart from './components/TradingChart'
import OrderPanel from './components/OrderPanel'
import Portfolio from './components/Portfolio'
import TradeHistory from './components/TradeHistory'
import { ToastProvider } from './components/Toast'
import { useWallet } from './hooks/useWallet'
import AuthPage from './pages/AuthPage'
import { getMe } from './utils/api'

const TABS = ['Portfolio', 'Trade History']

function TradeSim({ user, onLogout }) {
  const [symbol, setSymbol]         = useState('RELIANCE')
  const [exchange, setExchange]     = useState('NSE')
  const [activeTab, setActiveTab]   = useState('Portfolio')
  const [refreshKey, setRefreshKey] = useState(0)

  const { wallet, refresh: refreshWallet } = useWallet()

  const handleOrderPlaced = useCallback(() => {
    setRefreshKey(k => k + 1)
    refreshWallet()
  }, [refreshWallet])

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f14]">
      <Header
        equity={wallet?.equity}
        cash={wallet?.cash}
        onReset={handleOrderPlaced}
        user={user}
        onLogout={onLogout}
      />

      <main className="flex-1 p-4 grid grid-cols-[1fr_288px] gap-4 max-w-[1600px] mx-auto w-full">
        {/* Left column */}
        <div className="flex flex-col gap-4 min-w-0">
          <div className="bg-[#0d0f14] rounded border border-white/5 p-3">
            <SymbolSearch
              value={symbol}
              exchange={exchange}
              onSelect={(sym, exc) => { setSymbol(sym); setExchange(exc) }}
              onExchangeChange={exc => setExchange(exc)}
            />
          </div>

          <div className="rounded border border-white/5 overflow-hidden bg-[#0d0f14] p-1">
            <div className="px-2 py-1.5 flex items-center gap-2 mb-1">
              <span className="font-display text-base text-[#f5f0e8]">{symbol}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 text-[#8892a4] font-display">{exchange}</span>
            </div>
            <TradingChart symbol={symbol} exchange={exchange} />
          </div>

          <div className="rounded border border-white/5 bg-[#0d0f14] overflow-hidden">
            <div className="flex border-b border-white/5">
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 text-xs font-display uppercase tracking-widest transition-colors
                    ${activeTab === tab ? 'text-[#f5f0e8] border-b-2 border-[#00c896]' : 'text-[#8892a4] hover:text-[#f5f0e8]'}`}>
                  {tab}
                  {tab === 'Portfolio' && wallet?.holdings?.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] bg-[#00c896]/20 text-[#00c896]">
                      {wallet.holdings.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="p-3">
              {activeTab === 'Portfolio'
                ? <Portfolio holdings={wallet?.holdings ?? []} key={refreshKey} />
                : <TradeHistory refreshKey={refreshKey} />
              }
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4">
          <div className="rounded border border-white/5 bg-[#0d0f14] p-4">
            <OrderPanel
              symbol={symbol}
              exchange={exchange}
              cash={wallet?.cash}
              holdings={wallet?.holdings}
              onOrderPlaced={handleOrderPlaced}
            />
          </div>

          {wallet && (
            <div className="rounded border border-white/5 bg-[#0d0f14] p-4">
              <h2 className="text-[11px] font-display uppercase tracking-widest text-[#8892a4] mb-3">Account Summary</h2>
              <div className="space-y-2.5">
                {[
                  { label: 'Cash Balance',    value: wallet.cash,                color: '#f5c518' },
                  { label: 'Positions Value', value: wallet.equity - wallet.cash, color: '#8892a4' },
                  { label: 'Total Equity',    value: wallet.equity,              color: '#00c896' },
                  { label: 'P&L vs Start',    value: wallet.equity - 10000,      color: wallet.equity >= 10000 ? '#00c896' : '#f03e3e' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-[#8892a4]">{label}</span>
                    <span className="text-xs font-display" style={{ color }}>
                      {value < 0 ? '-' : ''}₹{Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-[#8892a4]">Return</span>
                  <span className={`text-[10px] font-display ${wallet.equity >= 10000 ? 'text-[#00c896]' : 'text-[#f03e3e]'}`}>
                    {wallet.equity >= 10000 ? '+' : ''}{((wallet.equity / 10000 - 1) * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="h-1 rounded-full bg-[#1a1d26] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(Math.abs(wallet.equity / 10000 - 1) * 500, 100)}%`,
                      backgroundColor: wallet.equity >= 10000 ? '#00c896' : '#f03e3e',
                    }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  const [user, setUser]       = useState(null)   // null = loading, false = logged out
  const [checking, setChecking] = useState(true)

  // On mount: check if session cookie already exists
  useEffect(() => {
    getMe()
      .then(({ data }) => setUser(data))
      .catch(() => setUser(false))
      .finally(() => setChecking(false))
  }, [])

  const handleAuth  = (data) => setUser(data)
  const handleLogout = () => setUser(false)

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#00c896] border-t-transparent spinner" />
      </div>
    )
  }

  return (
    <ToastProvider>
      {user
        ? <TradeSim user={user} onLogout={handleLogout} />
        : <AuthPage onAuth={handleAuth} />
      }
    </ToastProvider>
  )
}