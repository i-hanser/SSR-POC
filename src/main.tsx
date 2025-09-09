import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Button, Skeleton } from 'antd'
import 'antd/dist/reset.css'
import { PersonalizedPrice } from './personalized/PersonalizedPrice'
import { Countdown } from './personalized/Countdown'
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

  return (
    <div className="container" data-promo data-product-id={initial.productId} data-title={initial.title}
      data-base-price={initial.basePrice} data-end-at={initial.endAt}>
      <h1>{initial.title} <span className="badge">SSR 语义化骨架</span></h1>

      {/* SSR skeleton for image/title/price */}
      <div className="row" style={{ marginTop: 8 }}>
        <Skeleton.Button active style={{ width: 120, height: 120, borderRadius: 12 }} />
        <div style={{ flex: 1 }}>
          <Skeleton.Input active style={{ height: 16, width: '70%', marginBottom: 8 }} />
          <Skeleton.Input active style={{ height: 16, width: '40%' }} />
          <div style={{ marginTop: 12 }}>
            {/* SSR shows safe base price; client may replace with personalized price */}
            <div className="price" id="price-ssr">¥{initial.basePrice}</div>
          </div>
        </div>
      </div>

      {/* CSR: precise countdown & CTA inside Shadow DOM-like wrapper */}
      <section style={{ marginTop: 16 }}>
        <strong>距离结束：</strong>{' '}
        <Countdown endAt={initial.endAt} />
      </section>

      <section style={{ marginTop: 16 }}>
        <promo-shadow data-cta="立即购买"></promo-shadow>
        <span style={{ marginLeft: 12, color: 'var(--muted)' }}>（按钮样式隔离，支持 :host 与 CSS 变量桥接）</span>
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
        const mount = document.createElement('div');
        this._shadow.append(mount);
        const btnText = this.getAttribute('data-cta') || '立即购买';
        const root = ReactDOM.createRoot(mount);
        root.render(
          <Button
            type="primary"
            {...({ part: 'button ant-btn ant-btn-primary' } as any)}
            onClick={() => {
              alert('下单成功（示例）');
            }}
          >
            {btnText}
          </Button>
        );
      }
    }
  }

  if (!customElements.get('promo-shadow')) {
    customElements.define('promo-shadow', PromoShadow);
  }
}

