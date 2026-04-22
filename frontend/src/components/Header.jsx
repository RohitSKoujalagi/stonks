import React from 'react'
import { BarChart2, RefreshCw, Zap } from 'lucide-react'
import { resetSim } from '../utils/api'

export default function Header({ equity, cash, onReset }) {
  const handleReset = async () => {
    if (!confirm('Reset simulation to ₹10,000? All trades will be cleared.')) return
    await resetSim()
    onReset()
  }

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#0d0f14]">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded bg-[#00c896] flex items-center justify-center">
          <Zap size={14} className="text-[#0d0f14]" fill="currentColor" />
        </div>
        <span className="font-display text-sm font-bold tracking-widest uppercase text-[#f5f0e8]">
          TradeSim
        </span>
        <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-[#1a1d26] text-[#8892a4] font-display tracking-wider">
          PAPER
        </span>
      </div>

      {/* Equity display */}
      <div className="flex items-center gap-6 text-sm">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-[#8892a4]">Cash</p>
          <p className="font-display text-[#f5c518]">
            ₹{cash != null ? cash.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
          </p>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-[#8892a4]">Total Equity</p>
          <p className="font-display text-[#00c896]">
            ₹{equity != null ? equity.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
          </p>
        </div>
        <button
          onClick={handleReset}
          title="Reset simulation"
          className="ml-2 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-[#1a1d26] hover:bg-[#22263340] text-[#8892a4] hover:text-[#f03e3e] border border-white/5 transition-colors"
        >
          <RefreshCw size={12} />
          <span>Reset</span>
        </button>
      </div>
    </header>
  )
}
