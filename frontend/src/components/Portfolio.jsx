import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function Portfolio({ holdings = [] }) {
  if (holdings.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-[#8892a4] border border-dashed border-white/10 rounded">
        No open positions. Place a buy order to get started.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/5 text-[#8892a4] font-display uppercase tracking-widest text-[10px]">
            <th className="text-left py-2 px-3">Symbol</th>
            <th className="text-left py-2 px-3">Exch</th>
            <th className="text-right py-2 px-3">Qty</th>
            <th className="text-right py-2 px-3">Avg Entry</th>
            <th className="text-right py-2 px-3">LTP</th>
            <th className="text-right py-2 px-3">Value</th>
            <th className="text-right py-2 px-3">P&amp;L</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h, i) => {
            const pl = h.unrealized_pl
            const positive = pl >= 0
            return (
              <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="py-2.5 px-3 font-display text-[#f5f0e8]">{h.symbol}</td>
                <td className="py-2.5 px-3 text-[#8892a4]">
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#1a1d26] border border-white/5">{h.exchange}</span>
                </td>
                <td className="py-2.5 px-3 text-right font-display text-[#f5f0e8]">{h.qty}</td>
                <td className="py-2.5 px-3 text-right text-[#8892a4]">₹{h.avg_entry.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right text-[#f5c518] font-display">₹{h.current_price.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right text-[#f5f0e8]">₹{h.position_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className={`py-2.5 px-3 text-right font-display flex items-center justify-end gap-1 ${positive ? 'text-[#00c896]' : 'text-[#f03e3e]'}`}>
                  {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {positive ? '+' : ''}₹{pl.toFixed(2)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
