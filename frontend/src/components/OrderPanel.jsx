import React, { useState, useEffect, useRef } from 'react'
import { TrendingUp, TrendingDown, Loader, RefreshCw, AlertCircle } from 'lucide-react'
import { getPrice, placeOrder } from '../utils/api'
import { useToast } from './Toast'

function validateSymbol(symbol) {
  if (!symbol || symbol.trim().length === 0) return 'Please select or enter a symbol.'
  if (!/^[A-Z0-9\-\.]{1,20}$/.test(symbol.trim())) return 'Invalid symbol format.'
  return null
}

function validateQty(qty, action, price, cash, position) {
  const n = parseFloat(qty)
  if (!qty || isNaN(n))   return 'Enter a valid quantity.'
  if (n <= 0)              return 'Quantity must be greater than zero.'
  if (!Number.isFinite(n)) return 'Quantity is out of range.'
  if (action === 'buy' && price) {
    const cost = n * price * 1.0005
    if (cash != null && cost > cash)
      return `Insufficient funds. Need ₹${cost.toFixed(2)}, available ₹${cash.toFixed(2)}.`
  }
  if (action === 'sell') {
    if (position === 0) return 'No position in this symbol to sell.'
    if (position !== null && n > position) return `You only hold ${position} units. Cannot sell ${n}.`
  }
  return null
}

export default function OrderPanel({ symbol, exchange, cash, holdings, onOrderPlaced }) {
  const toast = useToast()
  const [action, setAction]             = useState('buy')
  const [qty, setQty]                   = useState('')
  const [slippage, setSlippage]         = useState(true)
  const [price, setPrice]               = useState(null)
  const [priceErr, setPriceErr]         = useState(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [qtyErr, setQtyErr]             = useState(null)
  const [touched, setTouched]           = useState(false)

  const currentPosition = holdings?.find(h => h.symbol === symbol && h.exchange === exchange)?.qty ?? null
  const priceTimer = useRef(null)

  useEffect(() => {
    if (!symbol) return
    const symErr = validateSymbol(symbol)
    if (symErr) { setPriceErr(symErr); setPrice(null); return }
    clearTimeout(priceTimer.current)
    setPriceLoading(true); setPriceErr(null)
    priceTimer.current = setTimeout(() => {
      getPrice(exchange, symbol)
        .then(({ data }) => { setPrice(data.price); setPriceErr(null) })
        .catch(err => {
          const msg = err.response?.data?.detail || 'Symbol not found or no data available.'
          setPriceErr(msg); setPrice(null)
          toast.warning(`Could not load price for ${symbol}.`)
        })
        .finally(() => setPriceLoading(false))
    }, 300)
    return () => clearTimeout(priceTimer.current)
  }, [symbol, exchange])

  useEffect(() => {
    if (!touched) return
    setQtyErr(validateQty(qty, action, price, cash, currentPosition))
  }, [qty, action, price, cash, currentPosition, touched])

  const slipMul = slippage ? (action === 'buy' ? 1.0005 : 0.9995) : 1
  const estimatedCost = price && qty && !isNaN(parseFloat(qty))
    ? (price * parseFloat(qty) * slipMul).toFixed(2) : null

  const handleOrder = async () => {
    setTouched(true)
    const symErr = validateSymbol(symbol)
    if (symErr) { toast.error(symErr); return }
    const qErr = validateQty(qty, action, price, cash, currentPosition)
    if (qErr) { toast.error(qErr); setQtyErr(qErr); return }
    if (!price) { toast.error('Cannot place order — price unavailable.'); return }
    setSubmitting(true)
    try {
      const { data } = await placeOrder({ symbol, exchange, action, qty: parseFloat(qty), use_slippage: slippage })
      toast.success(`${action.toUpperCase()} ${qty} × ${symbol} @ ₹${data.exec_price}`)
      setQty(''); setTouched(false); setQtyErr(null)
      onOrderPlaced()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Order failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const refreshPrice = () => {
    if (!symbol) return
    setPriceLoading(true); setPriceErr(null)
    getPrice(exchange, symbol)
      .then(({ data }) => { setPrice(data.price); toast.info(`Price updated: ₹${data.price}`) })
      .catch(() => { setPriceErr('Refresh failed'); toast.error('Could not refresh price.') })
      .finally(() => setPriceLoading(false))
  }

  const canSubmit = !!(symbol && qty && !qtyErr && !priceErr && price && !submitting)

  // High-usage warning
  const showCashWarning = action === 'buy' && price && qty && cash != null && (() => {
    const cost = parseFloat(qty) * price * (slippage ? 1.0005 : 1)
    return cost > cash * 0.9 && cost <= cash
  })()

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[11px] font-display uppercase tracking-widest text-[#8892a4]">Order Entry</h2>

      {/* Symbol / Price card */}
      <div className={`flex items-center justify-between p-3 rounded border transition-colors ${priceErr ? 'bg-[#f03e3e]/5 border-[#f03e3e]/20' : 'bg-[#1a1d26] border-white/5'}`}>
        <div>
          <p className="text-[10px] text-[#8892a4]">{exchange}</p>
          <p className="font-display text-base text-[#f5f0e8]">{symbol || '—'}</p>
          {currentPosition != null && currentPosition > 0 && (
            <p className="text-[10px] text-[#8892a4] mt-0.5">Holding: <span className="text-[#f5c518]">{currentPosition}</span> units</p>
          )}
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end mb-0.5">
            <p className="text-[10px] text-[#8892a4]">LTP</p>
            <button onClick={refreshPrice} title="Refresh price" className="text-[#8892a4] hover:text-[#00c896] transition-colors">
              <RefreshCw size={10} className={priceLoading ? 'spinner' : ''} />
            </button>
          </div>
          {priceLoading
            ? <Loader size={14} className="spinner text-[#8892a4] ml-auto" />
            : priceErr
              ? <p className="text-[10px] text-[#f03e3e]">Unavailable</p>
              : <p className="font-display text-[#f5c518]">{price != null ? `₹${price.toFixed(2)}` : '—'}</p>
          }
        </div>
      </div>

      {/* Price error */}
      {priceErr && (
        <div className="flex items-start gap-2 p-2.5 rounded bg-[#f03e3e]/8 border border-[#f03e3e]/20 text-[11px] text-[#f03e3e]">
          <AlertCircle size={12} className="mt-0.5 shrink-0" /><span>{priceErr}</span>
        </div>
      )}

      {/* Buy / Sell toggle */}
      <div className="flex rounded overflow-hidden border border-white/10">
        {['buy','sell'].map(a => (
          <button key={a} onClick={() => { setAction(a); setTouched(false); setQtyErr(null) }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-display uppercase tracking-wider transition-colors
              ${action === a
                ? a === 'buy' ? 'bg-[#00c896] text-[#0d0f14]' : 'bg-[#f03e3e] text-white'
                : 'bg-[#1a1d26] text-[#8892a4] hover:text-[#f5f0e8]'}`}>
            {a === 'buy' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {a.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Quantity */}
      <div>
        <label className="text-[10px] font-display uppercase tracking-widest text-[#8892a4] mb-1.5 flex items-center justify-between">
          <span>Quantity</span>
          {action === 'sell' && currentPosition != null && currentPosition > 0 && (
            <button onClick={() => { setQty(String(currentPosition)); setTouched(true) }}
              className="text-[#00c896] hover:underline font-body normal-case text-[10px]">
              Max ({currentPosition})
            </button>
          )}
        </label>
        <input type="number" min="0" step="1" value={qty}
          onChange={e => { setQty(e.target.value); setTouched(true) }}
          onBlur={() => setTouched(true)}
          placeholder="0"
          className={`w-full px-3 py-2.5 rounded border text-sm font-display text-[#f5f0e8] placeholder-[#8892a4]/40 bg-[#1a1d26] focus:outline-none transition-colors
            ${touched && qtyErr ? 'border-[#f03e3e]/50 bg-[#f03e3e]/5' : 'border-white/10 focus:border-[#00c896]/40'}`}
        />
        {touched && qtyErr && (
          <p className="mt-1.5 flex items-start gap-1 text-[11px] text-[#f03e3e]">
            <AlertCircle size={11} className="mt-0.5 shrink-0" />{qtyErr}
          </p>
        )}
        {!qtyErr && estimatedCost && (
          <p className="mt-1 text-[10px] text-[#8892a4]">
            Est. {action === 'buy' ? 'Cost' : 'Proceeds'}:{' '}
            <span className="text-[#f5c518] font-display">₹{parseFloat(estimatedCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            {slippage && <span className="ml-1 opacity-50">(incl. slippage)</span>}
          </p>
        )}
      </div>

      {/* High cash usage warning */}
      {showCashWarning && (
        <div className="flex items-start gap-2 p-2 rounded bg-[#f5c518]/8 border border-[#f5c518]/20 text-[11px] text-[#f5c518]">
          <AlertCircle size={11} className="mt-0.5 shrink-0" />
          This order uses over 90% of your available cash.
        </div>
      )}

      {/* Slippage */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <div onClick={() => setSlippage(s => !s)}
          className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${slippage ? 'bg-[#00c896]' : 'bg-[#2e3345]'}`}>
          <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-150 ${slippage ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </div>
        <span className="text-xs text-[#8892a4]">0.05% slippage simulation</span>
      </label>

      {/* Submit */}
      <button onClick={handleOrder} disabled={!canSubmit}
        className={`w-full py-2.5 rounded font-display text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all
          ${action === 'buy' ? 'bg-[#00c896] hover:bg-[#009e76] text-[#0d0f14]' : 'bg-[#f03e3e] hover:bg-[#c42f2f] text-white'}
          disabled:opacity-30 disabled:cursor-not-allowed`}>
        {submitting && <Loader size={14} className="spinner" />}
        {submitting ? 'Placing…' : `${action.toUpperCase()} ${symbol || 'SELECT SYMBOL'}`}
      </button>

      {!symbol && (
        <p className="text-center text-[10px] text-[#8892a4]/50 font-display">Search a symbol above to begin</p>
      )}
    </div>
  )
}
