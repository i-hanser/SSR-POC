import React, { useEffect, useMemo, useState } from 'react'
import { PersonalizedPrice } from './personalized/PersonalizedPrice'
import { Countdown } from './personalized/Countdown'
import { on, off } from './bus'
import './style.css'

type PromoState = {
  productId: string
  title: string
  basePrice: number
  endAt: number
}

// In SSR we pass promoState as prop; on client, no prop means render will read from data-*.
export function App({ promoState }: { promoState?: PromoState }) {
  // During SSR we have promoState; on client hydrate, we re-read from DOM if not provided.
  const initial = useMemo<PromoState>(() => {
    if (promoState) return promoState
    // Client: read from SSR data attributes
    const el = document.querySelector('[data-promo]') as HTMLElement | null
    if (el) {
      return {
        productId: el.dataset.productId!,
        title: el.dataset.title!,
        basePrice: Number(el.dataset.basePrice),
        endAt: Number(el.dataset.endAt)
      }
    }
    // Fallback (should not happen on /demo route)
    return { productId: 'SKU', title: 'Demo', basePrice: 99, endAt: Date.now() + 60_000 }
  }, [promoState])

  const [ssrPrice, setSsrPrice] = useState(initial.basePrice)
  const [promoEnded, setPromoEnded] = useState(false)

  useEffect(() => {
    const handler = (p: number) => setSsrPrice(p)
    on('price:update', handler)
    return () => off('price:update', handler)
  }, [])

  useEffect(() => {
    const handler = () => setPromoEnded(true)
    on('countdown:done', handler)
    return () => off('countdown:done', handler)
  }, [])

  return (
    <div className="container" data-promo data-product-id={initial.productId} data-title={initial.title}
      data-base-price={initial.basePrice} data-end-at={initial.endAt}>
      <h1>{initial.title} <span className="badge">SSR 语义化骨架</span></h1>

      {/* SSR skeleton for image/title/price */}
      <div className="row" style={{ marginTop: 8 }}>
        <div className="skeleton" style={{ width: 120, height: 120, borderRadius: 12 }} aria-hidden="true"></div>
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 8 }} aria-hidden="true"></div>
          <div className="skeleton" style={{ height: 16, width: '40%' }} aria-hidden="true"></div>
          <div style={{ marginTop: 12 }}>
            {/* SSR shows safe base price; client may replace with personalized price */}
            <div className="price" id="price-ssr">¥{ssrPrice}</div>
          </div>
        </div>
      </div>

      {/* CSR: precise countdown & CTA inside Shadow DOM-like wrapper */}
      <section style={{ marginTop: 16 }}>
        <strong>距离结束：</strong>{' '}
        <Countdown endAt={initial.endAt} />
        {promoEnded && <span style={{ color: '#b91c1c', marginLeft: 8 }}>活动已结束</span>}
      </section>

      <section style={{ marginTop: 16 }}>
        {promoEnded ? (
          <button disabled>活动已结束</button>
        ) : (
          <>
            <promo-shadow data-cta="立即购买"></promo-shadow>
            <span style={{ marginLeft: 12, color: 'var(--muted)' }}>（按钮样式隔离，支持 :host 与 CSS 变量桥接）</span>
          </>
        )}
      </section>

      <section style={{ marginTop: 16 }}>
        <PersonalizedPrice base={initial.basePrice} />
      </section>

      <footer>
        ⚙️ 混合模式说明：服务端输出基础视图（可抓取）；客户端在用户可见/登录时加载个性化数据并差量替换。
      </footer>
    </div>
  )
}

// Define a tiny web component to demonstrate Shadow DOM isolation and CSS var bridge.
// --- 放在文件末尾，替换你当前自定义元素的实现 ---
/** 仅在浏览器环境注册自定义元素，避免 SSR 时报 HTMLElement 未定义 */
if (typeof window !== 'undefined' && 'customElements' in window) {
  class PromoShadow extends HTMLElement {
    private _shadow!: ShadowRoot;

    connectedCallback() {
      if (!this._shadow) {
        this._shadow = this.attachShadow({ mode: 'open' });
        const btn = document.createElement('button');
        (btn as any).part = 'button';
        btn.textContent = this.getAttribute('data-cta') || '立即购买';
        btn.addEventListener('click', () => {
          alert('下单成功（示例）');
        });
        const style = document.createElement('style');
        style.textContent = `:host{display:inline-block} button{}`;
        this._shadow.append(style, btn);
      }
    }
  }

  if (!customElements.get('promo-shadow')) {
    customElements.define('promo-shadow', PromoShadow);
  }
}
