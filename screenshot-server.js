/**
 * ProductShot Screenshot Server
 * Runs as a sidecar to the Next.js app.
 * Endpoints:
 *   GET /screenshot?url=https://...  → PNG image
 *   GET /health                       → OK
 */
const http = require('http')
const { chromium } = require('playwright')

const PORT = process.env.SCREENSHOT_PORT || 3008
const CACHE = new Map()
const CACHE_TTL = 1000 * 60 * 15 // 15 minutes

async function capture(url) {
  const cacheKey = url
  if (CACHE.has(cacheKey)) {
    const { data, ts } = CACHE.get(cacheKey)
    if (Date.now() - ts < CACHE_TTL) return data
  }

  const browser = await chromium.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(2000)
  const screenshot = await page.screenshot({ type: 'png' })
  await browser.close()
  CACHE.set(cacheKey, { data: screenshot, ts: Date.now() })
  return screenshot
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)

  if (url.pathname === '/health') {
    res.writeHead(200)
    res.end('OK')
    return
  }

  if (url.pathname === '/screenshot' && url.searchParams.has('url')) {
    const targetUrl = url.searchParams.get('url')
    try {
      const img = await capture(targetUrl)
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=900',
        'Access-Control-Allow-Origin': '*'
      })
      res.end(img)
    } catch (e) {
      res.writeHead(500)
      res.end('Screenshot failed: ' + e.message)
    }
    return
  }

  res.writeHead(404)
  res.end('Not found')
})

server.listen(PORT, () => {
  console.log(`📸 Screenshot server running on port ${PORT}`)
})
