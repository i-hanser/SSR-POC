import React, { useEffect, useMemo } from 'react'
import { createResource } from './createResource'

export function PersonalizedPrice({ base }: { base: number }) {
  const resource = useMemo(
    () =>
      createResource(async () => {
        const logged = localStorage.getItem('logged') === '1'
        const controller = new AbortController()
        const id = setTimeout(() => controller.abort(), 3000)
        try {
          const res = await fetch(`/api/price?base=${base}&logged=${logged ? '1' : '0'}`, {
            signal: controller.signal
          })
          const data = await res.json()
          if (typeof data.price !== 'number') {
            throw new Error('请求失败，已回退为 SSR 价格')
          }
          return data.price as number
        } catch (e: any) {
          if (e.name === 'AbortError') {
            throw new Error('请求超时，已回退为 SSR 价格')
          }
          throw new Error('请求失败，已回退为 SSR 价格')
        } finally {
          clearTimeout(id)
        }
      }),
    [base]
  )

  const price = resource.read()

  useEffect(() => {
    const el = document.getElementById('price-ssr')
    if (el && typeof price === 'number') {
      el.textContent = '¥' + price
      console.log('replace:complete', { success: true })
    }
  }, [price])

  return (
    <div>
      <strong>个性化价格：</strong>
      <span>¥{price}（基于登录状态）</span>
      <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>
        提示：在浏览器控制台运行 <code>localStorage.setItem('logged','1')</code> 再刷新，即可看到会员价生效。
      </div>
    </div>
  )
}
