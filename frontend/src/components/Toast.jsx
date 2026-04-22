import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastCtx = createContext(null)

const ICONS = {
  success: <CheckCircle size={15} className="text-[#00c896] shrink-0" />,
  error:   <XCircle    size={15} className="text-[#f03e3e] shrink-0" />,
  warning: <AlertTriangle size={15} className="text-[#f5c518] shrink-0" />,
  info:    <Info       size={15} className="text-[#8892a4] shrink-0" />,
}
const BORDER = {
  success: 'border-[#00c896]/30',
  error:   'border-[#f03e3e]/30',
  warning: 'border-[#f5c518]/30',
  info:    'border-white/10',
}

let _id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((type, message, duration = 4000) => {
    const id = ++_id
    setToasts(t => [...t, { id, type, message }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration)
  }, [])

  const dismiss = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), [])

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2.5 px-3.5 py-2.5 rounded bg-[#1a1d26] border ${BORDER[t.type]} shadow-2xl max-w-[320px] animate-slide-in`}
            style={{ animation: 'slideIn 0.2s ease forwards' }}
          >
            {ICONS[t.type]}
            <p className="text-xs text-[#f5f0e8] leading-relaxed flex-1 font-body">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-[#8892a4] hover:text-[#f5f0e8] transition-colors mt-0.5">
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return {
    success: (msg) => ctx.push('success', msg),
    error:   (msg) => ctx.push('error',   msg),
    warning: (msg) => ctx.push('warning', msg),
    info:    (msg) => ctx.push('info',    msg),
  }
}
