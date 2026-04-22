import { useState, useEffect, useCallback } from 'react'
import { getWallet } from '../utils/api'

export function useWallet() {
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const { data } = await getWallet()
      setWallet(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])
  return { wallet, loading, refresh }
}
