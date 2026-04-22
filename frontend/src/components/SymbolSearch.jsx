import React, { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown, AlertCircle } from 'lucide-react'
import { getSymbols } from '../utils/api'

const EXCHANGES = ['NSE', 'BSE', 'US']
const SYMBOL_HINT = {
  NSE: 'e.g. RELIANCE, TCS, INFY',
  BSE: 'e.g. 500325, 532540 (scrip codes)',
  US:  'e.g. AAPL, TSLA, BTC-USD',
}

export default function SymbolSearch({ value, exchange, onSelect, onExchangeChange }) {
  const [input, setInput]     = useState(value || '')
  const [popular, setPopular] = useState([])
  const [showPop, setShowPop] = useState(false)
  const [excOpen, setExcOpen] = useState(false)
  const [warn, setWarn]       = useState(null)
  const wrapRef               = useRef(null)

  useEffect(() => {
    getSymbols(exchange).then(({ data }) => setPopular(data.symbols || []))
  }, [exchange])

  useEffect(() => {
    const handler = e => { if (!wrapRef.current?.contains(e.target)) setShowPop(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const validate = (sym) => {
    if (exchange === 'BSE' && !/^\d+$/.test(sym)) {
      setWarn('BSE uses numeric scrip codes (e.g. 500325 for Reliance).')
      return false
    }
    if (!/^[A-Z0-9\-\.]{1,20}$/.test(sym)) {
      setWarn('Symbol appears invalid. Use uppercase letters/numbers only.')
      return false
    }
    setWarn(null)
    return true
  }

  const submit = (sym) => {
    const s = (sym || input).trim().toUpperCase()
    if (!s) return
    if (!validate(s)) return
    setInput(s)
    setShowPop(false)
    onSelect(s, exchange)
  }

  const handleExchange = (exc) => {
    onExchangeChange(exc)
    setExcOpen(false)
    setInput('')
    setWarn(null)
  }

  return (
    <div ref={wrapRef} className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <div className="relative">
          <button onClick={() => setExcOpen(o => !o)}
            className="flex items-center gap-1 px-3 py-2 rounded bg-[#1a1d26] border border-white/10 text-xs font-display text-[#f5c518] hover:border-[#f5c518]/40 transition-colors min-w-[64px]">
            {exchange}<ChevronDown size={12} />
          </button>
          {excOpen && (
            <div className="absolute top-full mt-1 left-0 bg-[#1a1d26] border border-white/10 rounded shadow-xl z-50 w-24">
              {EXCHANGES.map(ex => (
                <button key={ex} onClick={() => handleExchange(ex)}
                  className={`block w-full text-left px-3 py-2 text-xs font-display hover:bg-white/5 transition-colors ${ex === exchange ? 'text-[#f5c518]' : 'text-[#f5f0e8]'}`}>
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative flex-1">
          <div className={`flex items-center gap-2 px-3 py-2 rounded border transition-colors ${warn ? 'border-[#f5c518]/40 bg-[#f5c518]/5' : 'border-white/10 bg-[#1a1d26] focus-within:border-[#00c896]/50'}`}>
            <Search size={13} className="text-[#8892a4] shrink-0" />
            <input value={input}
              onChange={e => { setInput(e.target.value.toUpperCase()); setWarn(null) }}
              onKeyDown={e => e.key === 'Enter' && submit()}
              onFocus={() => setShowPop(true)}
              placeholder={SYMBOL_HINT[exchange]}
              className="bg-transparent outline-none text-sm font-display text-[#f5f0e8] placeholder-[#8892a4]/40 w-full"
            />
            <button onClick={() => submit()}
              className="text-[10px] px-2 py-0.5 rounded bg-[#00c896]/10 text-[#00c896] hover:bg-[#00c896]/20 transition-colors font-display shrink-0">
              GO
            </button>
          </div>

          {showPop && popular.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-[#1a1d26] border border-white/10 rounded shadow-xl z-50 max-h-48 overflow-y-auto">
              <p className="px-3 py-1.5 text-[10px] text-[#8892a4] uppercase tracking-widest border-b border-white/5 sticky top-0 bg-[#1a1d26]">
                Popular on {exchange}
              </p>
              {popular.map(sym => (
                <button key={sym} onClick={() => { setInput(sym); setWarn(null); submit(sym) }}
                  className="block w-full text-left px-3 py-2 text-xs font-display hover:bg-white/5 text-[#f5f0e8] hover:text-[#00c896] transition-colors">
                  {sym}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {warn && (
        <div className="flex items-start gap-1.5 text-[11px] text-[#f5c518] px-1">
          <AlertCircle size={11} className="mt-0.5 shrink-0" /><span>{warn}</span>
        </div>
      )}
    </div>
  )
}
