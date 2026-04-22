import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const getChart   = (exchange, symbol, period='6mo') => api.get(`/chart/${exchange}/${symbol}?period=${period}`)
export const getPrice   = (exchange, symbol)               => api.get(`/price/${exchange}/${symbol}`)
export const getSymbols = (exchange)                       => api.get(`/symbols/${exchange}`)
export const getWallet  = ()                               => api.get('/wallet')
export const getTrades  = ()                               => api.get('/trades')
export const placeOrder = (payload)                        => api.post('/order', payload)
export const resetSim   = ()                               => api.post('/reset')
