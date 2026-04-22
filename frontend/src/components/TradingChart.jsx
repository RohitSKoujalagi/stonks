import React, { useEffect, useRef, useState } from 'react'
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts'
import { getChart } from '../utils/api'
import { Loader } from 'lucide-react'

const PERIODS = ['1mo','3mo','6mo','1y','2y']

export default function TradingChart({ symbol, exchange }) {
  const chartRef     = useRef(null)
  const rsiRef       = useRef(null)
  const chartObj     = useRef(null)
  const rsiObj       = useRef(null)
  const candleSeries = useRef(null)
  const smaSeries    = useRef(null)
  const volumeSeries = useRef(null)
  const rsiSeries    = useRef(null)
  const rsiOB        = useRef(null)
  const rsiOS        = useRef(null)

  const [period, setPeriod]   = useState('6mo')
  const [loading, setLoading] = useState(false)
  const [info, setInfo]       = useState(null)

  // Init charts once
  useEffect(() => {
    const opts = {
      layout:     { background: { color: '#0d0f14' }, textColor: '#8892a4' },
      grid:       { vertLines: { color: '#1a1d26' }, horzLines: { color: '#1a1d26' } },
      crosshair:  { mode: CrosshairMode.Normal },
      timeScale:  { borderColor: '#1a1d26', timeVisible: true },
      rightPriceScale: { borderColor: '#1a1d26' },
    }
    chartObj.current = createChart(chartRef.current, { ...opts, height: 340 })
    rsiObj.current   = createChart(rsiRef.current,   { ...opts, height: 110 })

    candleSeries.current = chartObj.current.addCandlestickSeries({
      upColor:        '#00c896',
      downColor:      '#f03e3e',
      borderUpColor:  '#00c896',
      borderDownColor:'#f03e3e',
      wickUpColor:    '#00c896',
      wickDownColor:  '#f03e3e',
    })

    smaSeries.current = chartObj.current.addLineSeries({
      color: '#f5c518', lineWidth: 1.5, priceLineVisible: false,
    })

    volumeSeries.current = chartObj.current.addHistogramSeries({
      color: '#ffffff18', priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })
    chartObj.current.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })

    rsiSeries.current = rsiObj.current.addLineSeries({ color: '#8892a4', lineWidth: 1.5 })

    rsiOB.current = rsiObj.current.addLineSeries({
      color: '#f03e3e44', lineWidth: 1, lineStyle: LineStyle.Dashed,
    })
    rsiOS.current = rsiObj.current.addLineSeries({
      color: '#00c89644', lineWidth: 1, lineStyle: LineStyle.Dashed,
    })

    const ro = new ResizeObserver(() => {
      chartObj.current?.applyOptions({ width: chartRef.current?.offsetWidth })
      rsiObj.current?.applyOptions({ width: rsiRef.current?.offsetWidth })
    })
    ro.observe(chartRef.current)
    ro.observe(rsiRef.current)

    return () => {
      ro.disconnect()
      chartObj.current?.remove()
      rsiObj.current?.remove()
    }
  }, [])

  // Fetch data when symbol / period changes
  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    getChart(exchange, symbol, period)
      .then(({ data }) => {
        const candles = data.data
        candleSeries.current.setData(candles.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close })))
        smaSeries.current.setData(candles.filter(d => d.sma20 != null).map(d => ({ time: d.time, value: d.sma20 })))
        volumeSeries.current.setData(candles.map(d => ({ time: d.time, value: d.volume, color: d.close >= d.open ? '#00c89630' : '#f03e3e30' })))
        rsiSeries.current.setData(candles.filter(d => d.rsi14 != null).map(d => ({ time: d.time, value: d.rsi14 })))

        // OB/OS reference lines
        const times = candles.filter(d => d.rsi14 != null).map(d => d.time)
        if (times.length) {
          rsiOB.current.setData([{ time: times[0], value: 70 }, { time: times[times.length-1], value: 70 }])
          rsiOS.current.setData([{ time: times[0], value: 30 }, { time: times[times.length-1], value: 30 }])
        }

        const last = candles[candles.length - 1]
        setInfo({ price: last.close, rsi: last.rsi14, sma: last.sma20 })
        chartObj.current.timeScale().fitContent()
        rsiObj.current.timeScale().fitContent()
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [symbol, exchange, period])

  return (
    <div className="flex flex-col gap-0 fade-up">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1a1d26] rounded-t border border-white/5">
        <div className="flex items-center gap-3 text-xs font-display">
          {info && (
            <>
              <span className="text-[#f5f0e8]">₹{info.price?.toFixed(2)}</span>
              {info.sma && <span className="text-[#f5c518]">SMA20: {info.sma.toFixed(2)}</span>}
              {info.rsi && (
                <span className={info.rsi > 70 ? 'text-[#f03e3e]' : info.rsi < 30 ? 'text-[#00c896]' : 'text-[#8892a4]'}>
                  RSI: {info.rsi.toFixed(1)}
                </span>
              )}
            </>
          )}
        </div>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-2 py-0.5 rounded text-[10px] font-display uppercase transition-colors ${p === period ? 'bg-[#00c896] text-[#0d0f14]' : 'text-[#8892a4] hover:text-[#f5f0e8]'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main chart */}
      <div className="relative border-x border-white/5 bg-[#0d0f14]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0d0f1480]">
            <Loader size={20} className="spinner text-[#00c896]" />
          </div>
        )}
        <div ref={chartRef} className="w-full" />
      </div>

      {/* RSI chart */}
      <div className="relative border border-white/5 rounded-b bg-[#0d0f14]">
        <div className="absolute top-1 left-3 text-[10px] font-display text-[#8892a4] z-10 pointer-events-none">RSI(14)</div>
        <div ref={rsiRef} className="w-full" />
      </div>
    </div>
  )
}
