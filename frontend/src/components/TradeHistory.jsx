import React, { useEffect, useState } from 'react'
import { getTrades } from '../utils/api'

export default function TradeHistory({ refreshKey }) {
  const [trades, setTrades] = useState([])

  useEffect(() => {
    getTrades().then(({ data }) => setTrades(data.trades || []))
  }, [refreshKey])

  if (trades.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-[#8892a4] border border-dashed border-white/10 rounded">
        No trades yet.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto max-h-60 overflow-y-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-[#0d0f14]">
          <tr className="border-b border-white/5 text-[#8892a4] font-display uppercase tracking-widest text-[10px]">
            <th className="text-left py-2 px-3">Time</th>
            <th className="text-left py-2 px-3">Symbol</th>
            <th className="text-left py-2 px-3">Exch</th>
            <th className="text-left py-2 px-3">Action</th>
            <th className="text-right py-2 px-3">Qty</th>
            <th className="text-right py-2 px-3">Price</th>
            <th className="text-right py-2 px-3">Exec Price</th>
          </tr>
        </thead>
        <tbody>
          {trades.map(t => (
            <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
              <td className="py-2 px-3 text-[#8892a4]">{t.timestamp.slice(0,16).replace('T',' ')}</td>
              <td className="py-2 px-3 font-display text-[#f5f0e8]">{t.symbol}</td>
              <td className="py-2 px-3 text-[#8892a4]">{t.exchange}</td>
              <td className={`py-2 px-3 font-display uppercase text-[10px] ${t.action === 'buy' ? 'text-[#00c896]' : 'text-[#f03e3e]'}`}>
                {t.action}
              </td>
              <td className="py-2 px-3 text-right text-[#f5f0e8]">{t.qty}</td>
              <td className="py-2 px-3 text-right text-[#8892a4]">₹{t.price.toFixed(2)}</td>
              <td className="py-2 px-3 text-right font-display text-[#f5c518]">₹{t.slippage_price.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
