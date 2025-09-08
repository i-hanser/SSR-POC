import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import compression from 'compression'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProd = process.env.NODE_ENV === 'production'
const resolve = (p) => path.resolve(__dirname, p)

const app = express()
app.use(compression())
app.use('/styles', express.static(resolve('styles')))

let vite
let manifest
if (!isProd) {
  const { createServer } = await import('vite')
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom'
  })
  app.use(vite.middlewares)
} else {
  app.use('/assets', express.static(resolve('dist/client/assets'), { index: false }))
  manifest = JSON.parse(fs.readFileSync(resolve('dist/client/.vite/ssr-manifest.json'), 'utf-8'))
}

// Fake price API (personalized if logged=1 query present)
app.get('/api/price', (req, res) => {
  const base = Number(req.query.base ?? 99)
  const logged = req.query.logged === '1'
  const price = logged ? Math.max(1, base - 20) : base
  setTimeout(() => {
    res.json({ price, logged })
  }, 400) // simulate latency
})

// Simple HTML render
async function render(url, promoState) {
  const indexHtml = fs.readFileSync(resolve('index.html'), 'utf-8')
  let template = indexHtml

  if (!isProd) {
    template = await vite.transformIndexHtml(url, template)
    const mod = await vite.ssrLoadModule('/src/entry-server.tsx')
    const appHtml = await mod.render(url, promoState)
    return template.replace('<!--ssr-outlet-->', appHtml)
  } else {
    const templateHtml = fs.readFileSync(resolve('dist/client/index.html'), 'utf-8')
    const render = (await import('./dist/server/entry-server.js')).render
    const appHtml = await render(url, promoState)
    return templateHtml.replace('<!--ssr-outlet-->', appHtml)
  }
}

app.get('/demo', async (req, res, next) => {
  try {
    // Simulate server-side "safe" promo state (no user-specific data)
    const promoState = {
      productId: 'SKU-001',
      title: '限时闪购 · 蓝牙耳机',
      basePrice: 199,
      endAt: Date.now() + 1000 * 60 * 10 // 10 minutes from now
    }
    const html = await render(req.originalUrl, promoState)
    res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
  } catch (e) {
    vite && vite.ssrFixStacktrace(e)
    next(e)
  }
})

app.get('/', (req, res) => res.redirect('/demo'))

const port = process.env.PORT || 5173
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`)
})
