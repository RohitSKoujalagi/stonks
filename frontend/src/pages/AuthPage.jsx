import React, { useState } from 'react'
import { Zap, AlertCircle, Loader, Eye, EyeOff } from 'lucide-react'
import { login, register } from '../utils/api'

function validate(email, password, confirmPassword, isRegister) {
  const errs = {}
  if (!email || !/^[\w\.\+\-]+@[\w\-]+\.[a-z]{2,}$/i.test(email.trim()))
    errs.email = 'Enter a valid email address.'
  if (!password || password.length < 8)
    errs.password = 'Password must be at least 8 characters.'
  if (isRegister && !/[A-Z]/.test(password))
    errs.password = 'Password needs at least one uppercase letter.'
  if (isRegister && !/[0-9]/.test(password))
    errs.password = 'Password needs at least one digit.'
  if (isRegister && password !== confirmPassword)
    errs.confirm = 'Passwords do not match.'
  return errs
}

export default function AuthPage({ onAuth }) {
  const [mode, setMode]             = useState('login')   // 'login' | 'register'
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [errors, setErrors]         = useState({})
  const [serverErr, setServerErr]   = useState(null)
  const [loading, setLoading]       = useState(false)

  const isRegister = mode === 'register'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerErr(null)
    const errs = validate(email, password, confirm, isRegister)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      const fn = isRegister ? register : login
      const { data } = await fn({ email: email.trim().toLowerCase(), password })
      onAuth(data)
    } catch (err) {
      setServerErr(err.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login')
    setErrors({})
    setServerErr(null)
    setPassword('')
    setConfirm('')
  }

  return (
    <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center px-4"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.022'/%3E%3C/svg%3E\")" }}>

      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,200,150,0.04) 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-sm fade-up">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#00c896] flex items-center justify-center shadow-lg"
            style={{ boxShadow: '0 0 32px rgba(0,200,150,0.3)' }}>
            <Zap size={22} className="text-[#0d0f14]" fill="currentColor" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-xl font-bold tracking-widest uppercase text-[#f5f0e8]">TradeSim</h1>
            <p className="text-[11px] text-[#8892a4] mt-1 tracking-wider">Paper Trading Simulator</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#1a1d26] border border-white/5 rounded-xl p-6 shadow-2xl">
          {/* Mode tabs */}
          <div className="flex rounded-lg overflow-hidden border border-white/10 mb-6">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setErrors({}); setServerErr(null) }}
                className={`flex-1 py-2 text-xs font-display uppercase tracking-widest transition-colors
                  ${mode === m ? 'bg-[#00c896] text-[#0d0f14]' : 'text-[#8892a4] hover:text-[#f5f0e8]'}`}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {/* Email */}
            <div>
              <label className="text-[10px] font-display uppercase tracking-widest text-[#8892a4] block mb-1.5">
                Email
              </label>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(v => ({...v, email: null})) }}
                placeholder="you@example.com" autoComplete="email"
                className={`w-full px-3 py-2.5 rounded-lg border text-sm font-display text-[#f5f0e8] placeholder-[#8892a4]/30
                  bg-[#0d0f14] focus:outline-none transition-colors
                  ${errors.email ? 'border-[#f03e3e]/50' : 'border-white/10 focus:border-[#00c896]/50'}`} />
              {errors.email && <p className="mt-1 text-[11px] text-[#f03e3e] flex items-center gap-1"><AlertCircle size={10}/>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="text-[10px] font-display uppercase tracking-widest text-[#8892a4] block mb-1.5">
                Password
              </label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(v => ({...v, password: null})) }}
                  placeholder={isRegister ? 'Min 8 chars, 1 uppercase, 1 digit' : '••••••••'}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  className={`w-full px-3 py-2.5 pr-10 rounded-lg border text-sm font-display text-[#f5f0e8] placeholder-[#8892a4]/30
                    bg-[#0d0f14] focus:outline-none transition-colors
                    ${errors.password ? 'border-[#f03e3e]/50' : 'border-white/10 focus:border-[#00c896]/50'}`} />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8892a4] hover:text-[#f5f0e8] transition-colors">
                  {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-[11px] text-[#f03e3e] flex items-center gap-1"><AlertCircle size={10}/>{errors.password}</p>}
              {/* Password strength dots */}
              {isRegister && password && (
                <div className="flex gap-1 mt-2">
                  {[
                    password.length >= 8,
                    /[A-Z]/.test(password),
                    /[0-9]/.test(password),
                    password.length >= 12,
                  ].map((ok, i) => (
                    <div key={i} className={`h-0.5 flex-1 rounded-full transition-colors ${ok ? 'bg-[#00c896]' : 'bg-[#2e3345]'}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm password — register only */}
            {isRegister && (
              <div>
                <label className="text-[10px] font-display uppercase tracking-widest text-[#8892a4] block mb-1.5">
                  Confirm Password
                </label>
                <input type={showPw ? 'text' : 'password'} value={confirm}
                  onChange={e => { setConfirm(e.target.value); setErrors(v => ({...v, confirm: null})) }}
                  placeholder="Re-enter password" autoComplete="new-password"
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm font-display text-[#f5f0e8] placeholder-[#8892a4]/30
                    bg-[#0d0f14] focus:outline-none transition-colors
                    ${errors.confirm ? 'border-[#f03e3e]/50' : 'border-white/10 focus:border-[#00c896]/50'}`} />
                {errors.confirm && <p className="mt-1 text-[11px] text-[#f03e3e] flex items-center gap-1"><AlertCircle size={10}/>{errors.confirm}</p>}
              </div>
            )}

            {/* Server error */}
            {serverErr && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#f03e3e]/8 border border-[#f03e3e]/20 text-[11px] text-[#f03e3e]">
                <AlertCircle size={12} className="mt-0.5 shrink-0" />{serverErr}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 mt-1 rounded-lg bg-[#00c896] hover:bg-[#009e76] text-[#0d0f14]
                font-display text-sm uppercase tracking-widest flex items-center justify-center gap-2
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 0 20px rgba(0,200,150,0.2)' }}>
              {loading && <Loader size={14} className="spinner" />}
              {loading ? 'Please wait…' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Register note */}
          {isRegister && (
            <p className="mt-4 text-[10px] text-[#8892a4] text-center leading-relaxed">
              You'll start with a virtual <span className="text-[#f5c518] font-display">₹10,000</span> balance.<br/>
              No real money involved.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}