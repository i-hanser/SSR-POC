import React, { useEffect, useState } from 'react'
import { emit } from '../bus'

export function PersonalizedPrice({ base }: { base: number }) {
  const [price, setPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate "logged-in" state via localStorage flag. Toggle it in DevTools.
    const logged = localStorage.getItem('logged') === '1'

    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 3000) // timeout safeguard

    setLoading(true)
    fetch(`/api/price?base=${base}&logged=${logged ? '1' : '0'}`, { signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        setPrice(d.price)
        emit('price:update', d.price)
      })
      .catch(e => {
        if (e.name === 'AbortError') setError('请求超时，已回退为 SSR 价格')
        else setError('请求失败，已回退为 SSR 价格')
        emit('price:error', e.message)
      })
      .finally(() => {
        clearTimeout(id)
        setLoading(false)
      })
  }, [base])

  return (
    <div>
      <strong>个性化价格：</strong>
      {loading && <span>加载中…</span>}
      {!loading && error && <span style={{ color: '#b91c1c' }}>{error}</span>}
      {!loading && !error && price !== null && <span>¥{price}（基于登录状态）</span>}
      {!loading && !error && price === null && <span>（已回退为 SSR 价格）</span>}
      <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>
        提示：在浏览器控制台运行 <code>localStorage.setItem('logged','1')</code> 再刷新，即可看到会员价生效。
      </div>
    </div>
  )
}
