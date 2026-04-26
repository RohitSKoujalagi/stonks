import React, { useEffect, useRef, useState } from 'react'
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts'
import { getChart } from '../utils/api'
import { Loader } from 'lucide-react'

// Intervals: intraday + daily/weekly/monthly periods
const INTERVALS = [
  { label: '1m',  value: '1m',  intraday: true  },
  { label: '5m',  value: '5m',  intraday: true  },
  { label: '10m', value: '10m', intraday: true  },
  { label: '1h',  value: '1h',  intraday: true  },
  { label: '1D',  value: '1d',  intraday: false },
  { label: '1mo', value: '1mo', intraday: false },
  { label: '3mo', value: '3mo', intraday: false },
  // { label: '6mo', value: '6mo', intraday: false },
  // { label: '1Y',  value: '1y',  intraday: false },
]

// Indicator groups
const OVERLAY_INDICATORS   = ['SMA20', 'EMA20', 'EMA50', 'BB', 'VWAP']
const OSCILLATOR_INDICATORS = ['RSI', 'MACD', 'StochRSI']

const CHART_OPTS = {
  layout:          { background: { color: '#0d0f14' }, textColor: '#8892a4' },
  grid:            { vertLines: { color: '#1a1d26' }, horzLines: { color: '#1a1d26' } },
  crosshair:       { mode: CrosshairMode.Normal },
  timeScale:       { borderColor: '#1a1d26', timeVisible: true },
  rightPriceScale: { borderColor: '#1a1d26' },
}

export default function TradingChart({ symbol, exchange }) {
  const chartRef  = useRef(null)
  const oscRef    = useRef(null)
  const chartObj  = useRef(null)
  const oscObj    = useRef(null)
  const series    = useRef({})  // holds all series refs
  const roRef     = useRef(null)

  const [interval, setInterval]           = useState('1d')
  const [loading, setLoading]             = useState(false)
  const [info, setInfo]                   = useState(null)
  const [activeOverlays, setActiveOverlays]   = useState(['SMA20'])
  const [activeOscillator, setActiveOscillator] = useState('RSI')

  // ── Init charts once ──────────────────────────────────────────────
  useEffect(() => {
    chartObj.current = createChart(chartRef.current, { ...CHART_OPTS, height: 340 })
    oscObj.current   = createChart(oscRef.current,   { ...CHART_OPTS, height: 120 })

    // Candles
    series.current.candle = chartObj.current.addCandlestickSeries({
      upColor: '#00c896', downColor: '#f03e3e',
      borderUpColor: '#00c896', borderDownColor: '#f03e3e',
      wickUpColor: '#00c896', wickDownColor: '#f03e3e',
    })

    // Volume
    series.current.volume = chartObj.current.addHistogramSeries({
      color: '#ffffff18', priceFormat: { type: 'volume' }, priceScaleId: 'volume',
    })
    chartObj.current.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })

    // Overlay series (hidden by default)
    series.current.sma20 = chartObj.current.addLineSeries({ color: '#f5c518',  lineWidth: 1.5, priceLineVisible: false })
    series.current.ema20 = chartObj.current.addLineSeries({ color: '#00c896',  lineWidth: 1.5, priceLineVisible: false })
    series.current.ema50 = chartObj.current.addLineSeries({ color: '#8892a4',  lineWidth: 1.5, priceLineVisible: false })
    series.current.vwap  = chartObj.current.addLineSeries({ color: '#a78bfa',  lineWidth: 1.5, priceLineVisible: false, lineStyle: LineStyle.Dashed })
    series.current.bbUpper = chartObj.current.addLineSeries({ color: '#3b82f650', lineWidth: 1, priceLineVisible: false, lineStyle: LineStyle.Dotted })
    series.current.bbMid   = chartObj.current.addLineSeries({ color: '#3b82f680', lineWidth: 1, priceLineVisible: false })
    series.current.bbLower = chartObj.current.addLineSeries({ color: '#3b82f650', lineWidth: 1, priceLineVisible: false, lineStyle: LineStyle.Dotted })

    // Oscillator series
    series.current.rsi       = oscObj.current.addLineSeries({ color: '#8892a4', lineWidth: 1.5 })
    series.current.rsiOB     = oscObj.current.addLineSeries({ color: '#f03e3e44', lineWidth: 1, lineStyle: LineStyle.Dashed })
    series.current.rsiOS     = oscObj.current.addLineSeries({ color: '#00c89644', lineWidth: 1, lineStyle: LineStyle.Dashed })
    series.current.macd      = oscObj.current.addLineSeries({ color: '#00c896', lineWidth: 1.5 })
    series.current.macdSig   = oscObj.current.addLineSeries({ color: '#f03e3e', lineWidth: 1.5 })
    series.current.macdHist  = oscObj.current.addHistogramSeries({ priceScaleId: 'right' })
    series.current.stochK    = oscObj.current.addLineSeries({ color: '#00c896', lineWidth: 1.5 })
    series.current.stochD    = oscObj.current.addLineSeries({ color: '#f5c518', lineWidth: 1.5 })
    series.current.stochOB   = oscObj.current.addLineSeries({ color: '#f03e3e44', lineWidth: 1, lineStyle: LineStyle.Dashed })
    series.current.stochOS   = oscObj.current.addLineSeries({ color: '#00c89644', lineWidth: 1, lineStyle: LineStyle.Dashed })

    // Resize observer
    roRef.current = new ResizeObserver(() => {
      chartObj.current?.applyOptions({ width: chartRef.current?.offsetWidth })
      oscObj.current?.applyOptions({ width: oscRef.current?.offsetWidth })
    })
    roRef.current.observe(chartRef.current)
    roRef.current.observe(oscRef.current)

    return () => {
      roRef.current?.disconnect()
      chartObj.current?.remove()
      oscObj.current?.remove()
    }
  }, [])

  // ── Fetch data ────────────────────────────────────────────────────
  useEffect(() => {
    if (!symbol) return
    setLoading(true)

    const period = ['1m','5m','10m','1h'].includes(interval) ? '7d' : '6mo'
    getChart(exchange, symbol, period, interval)
      .then(({ data }) => {
        const candles = data.data
        if (!candles?.length) return

        // const time = d => d.time
        // const time = d => d.time.split(' ')[0]
        const time = d => Math.floor(new Date(d.time).getTime() / 1000)

        // Candles + volume
        series.current.candle.setData(candles.map(d => ({ time: time(d), open: d.open, high: d.high, low: d.low, close: d.close })))
        series.current.volume.setData(candles.map(d => ({ time: time(d), value: d.volume, color: d.close >= d.open ? '#00c89630' : '#f03e3e30' })))

        // Helper — filter nulls & set series
        const set = (key, fn) => {
          const pts = candles.filter(d => fn(d) != null).map(d => ({ time: time(d), value: fn(d) }))
          series.current[key]?.setData(pts)
        }
        const setHist = (key, fn, colorFn) => {
          const pts = candles.filter(d => fn(d) != null).map(d => ({ time: time(d), value: fn(d), color: colorFn(d) }))
          series.current[key]?.setData(pts)
        }

        // Overlays
        set('sma20',   d => d.sma20)
        set('ema20',   d => d.ema20)
        set('ema50',   d => d.ema50)
        set('vwap',    d => d.vwap)
        set('bbUpper', d => d.bb_upper)
        set('bbMid',   d => d.bb_mid)
        set('bbLower', d => d.bb_lower)

        // RSI oscillator + reference lines
        set('rsi', d => d.rsi14)
        const rsiTimes = candles.filter(d => d.rsi14 != null).map(d => d.time)
        if (rsiTimes.length) {
          series.current.rsiOB.setData([{ time: rsiTimes[0], value: 70 }, { time: rsiTimes.at(-1), value: 70 }])
          series.current.rsiOS.setData([{ time: rsiTimes[0], value: 30 }, { time: rsiTimes.at(-1), value: 30 }])
        }

        // MACD
        set('macd',    d => d.macd)
        set('macdSig', d => d.macd_signal)
        setHist('macdHist', d => d.macd_hist, d => (d.macd_hist ?? 0) >= 0 ? '#00c89660' : '#f03e3e60')

        // Stochastic RSI + reference lines
        set('stochK', d => d.stoch_rsi_k)
        set('stochD', d => d.stoch_rsi_d)
        const stTimes = candles.filter(d => d.stoch_rsi_k != null).map(d => d.time)
        if (stTimes.length) {
          series.current.stochOB.setData([{ time: stTimes[0], value: 80 }, { time: stTimes.at(-1), value: 80 }])
          series.current.stochOS.setData([{ time: stTimes[0], value: 20 }, { time: stTimes.at(-1), value: 20 }])
        }

        const last = candles.at(-1)
        setInfo({ price: last.close, rsi: last.rsi14, sma20: last.sma20, ema20: last.ema20, macd: last.macd })
        chartObj.current.timeScale().fitContent()
        oscObj.current.timeScale().fitContent()
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [symbol, exchange, interval])

  // ── Visibility control ────────────────────────────────────────────
  useEffect(() => {
    // Overlays
    const show = (key, on) => series.current[key]?.applyOptions({ visible: on })
    show('sma20',   activeOverlays.includes('SMA20'))
    show('ema20',   activeOverlays.includes('EMA20'))
    show('ema50',   activeOverlays.includes('EMA50'))
    show('vwap',    activeOverlays.includes('VWAP'))
    show('bbUpper', activeOverlays.includes('BB'))
    show('bbMid',   activeOverlays.includes('BB'))
    show('bbLower', activeOverlays.includes('BB'))
  }, [activeOverlays])

  useEffect(() => {
    // Oscillators — show only active one
    const rsi   = activeOscillator === 'RSI'
    const macd  = activeOscillator === 'MACD'
    const stoch = activeOscillator === 'StochRSI'
    const show  = (key, on) => series.current[key]?.applyOptions({ visible: on })
    show('rsi',       rsi);   show('rsiOB',    rsi);   show('rsiOS',    rsi)
    show('macd',      macd);  show('macdSig',  macd);  show('macdHist', macd)
    show('stochK',    stoch); show('stochD',   stoch)
    show('stochOB',   stoch); show('stochOS',  stoch)
  }, [activeOscillator])

  const toggleOverlay = (ind) => {
    setActiveOverlays(prev =>
      prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]
    )
  }

  // ── Oscillator label for the pane ─────────────────────────────────
  const oscLabel = {
    RSI:     'RSI(14)',
    MACD:    'MACD(12,26,9)',
    StochRSI:'StochRSI(14,3,3)',
  }[activeOscillator]

  const oscInfo = activeOscillator === 'RSI' && info?.rsi != null
    ? { val: info.rsi.toFixed(1), color: info.rsi > 70 ? '#f03e3e' : info.rsi < 30 ? '#00c896' : '#8892a4' }
    : null

  return (
    <div className="flex flex-col gap-0 fade-up">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#1a1d26] rounded-t border border-white/5">
        {/* Live info */}
        <div className="flex items-center gap-3 text-xs font-display flex-wrap">
          {info && (
            <>
              <span className="text-[#f5f0e8]">₹{info.price?.toFixed(2)}</span>
              {info.sma20 && activeOverlays.includes('SMA20') && (
                <span className="text-[#f5c518]">SMA20: {info.sma20.toFixed(2)}</span>
              )}
              {info.ema20 && activeOverlays.includes('EMA20') && (
                <span className="text-[#00c896]">EMA20: {info.ema20.toFixed(2)}</span>
              )}
              {oscInfo && (
                <span style={{ color: oscInfo.color }}>RSI: {oscInfo.val}</span>
              )}
              {info.macd != null && activeOscillator === 'MACD' && (
                <span className={info.macd >= 0 ? 'text-[#00c896]' : 'text-[#f03e3e]'}>
                  MACD: {info.macd.toFixed(3)}
                </span>
              )}
            </>
          )}
        </div>

        {/* Interval selector */}
        <div className="flex gap-0.5 bg-[#0d0f14] rounded p-0.5">
          {INTERVALS.map(iv => (
            <button key={iv.value} onClick={() => setInterval(iv.value)}
              className={`px-2 py-0.5 rounded text-[10px] font-display uppercase transition-colors
                ${interval === iv.value
                  ? 'bg-[#00c896] text-[#0d0f14]'
                  : 'text-[#8892a4] hover:text-[#f5f0e8]'}`}>
              {iv.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overlay indicator toggles */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 bg-[#12151c] border-x border-white/5">
        <span className="text-[9px] font-display uppercase tracking-widest text-[#8892a4]/50 mr-1">Overlays</span>
        {OVERLAY_INDICATORS.map(ind => (
          <button key={ind} onClick={() => toggleOverlay(ind)}
            className={`px-2 py-0.5 rounded text-[9px] font-display uppercase tracking-wide border transition-colors
              ${activeOverlays.includes(ind)
                ? 'border-[#00c896]/50 bg-[#00c896]/10 text-[#00c896]'
                : 'border-white/10 text-[#8892a4] hover:text-[#f5f0e8]'}`}>
            {ind}
          </button>
        ))}
        <span className="text-[9px] font-display uppercase tracking-widest text-[#8892a4]/50 ml-3 mr-1">Oscillator</span>
        {OSCILLATOR_INDICATORS.map(ind => (
          <button key={ind} onClick={() => setActiveOscillator(ind)}
            className={`px-2 py-0.5 rounded text-[9px] font-display uppercase tracking-wide border transition-colors
              ${activeOscillator === ind
                ? 'border-[#f5c518]/50 bg-[#f5c518]/10 text-[#f5c518]'
                : 'border-white/10 text-[#8892a4] hover:text-[#f5f0e8]'}`}>
            {ind}
          </button>
        ))}
      </div>

      {/* Main price chart */}
      <div className="relative border-x border-white/5 bg-[#0d0f14]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0d0f1480]">
            <Loader size={20} className="spinner text-[#00c896]" />
          </div>
        )}
        <div ref={chartRef} className="w-full" />
      </div>

      {/* Oscillator chart */}
      <div className="relative border border-white/5 rounded-b bg-[#0d0f14]">
        <div className="absolute top-1 left-3 text-[10px] font-display text-[#8892a4] z-10 pointer-events-none">
          {oscLabel}
        </div>
        <div ref={oscRef} className="w-full" />
      </div>
    </div>
  )
}