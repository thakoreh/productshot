/**
 * ProductShot Screenshot Server
 * Production-ready Playwright headless screenshot service
 * 
 * Usage:
 *   GET /screenshot?url=https://example.com&width=1200&height=630
 *   GET /health
 */
const http = require('http')
const { chromium } = require('playwright')

const PORT = process.env.PORT || 3008
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS || '20000')
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT || '5')

// In-memory cache (simple LRU)
const cache = new Map()
const CACHE_TTL = 1000 * 60 * 15 // 15 minutes

let activeRequests = 0
let browser = null

async function getBrowser() {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
      ],
      timeout: 30000,
    })
  }
  return browser
}

async function capture({ url, width = 1280, height = 800 }) {
  if (activeRequests >= MAX_CONCURRENT) {
    throw new Error('Server busy - try again shortly')
  }
  activeRequests++

  const cacheKey = `${url}|${width}|${height}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    activeRequests--
    return cached.data
  }

  const browser = await getBrowser()
  const page = await browser.newPage()

  try {
    await page.setViewportSize({ width: parseInt(width), height: parseInt(height) })
    
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: TIMEOUT_MS,
    })

    if (!response || response.status() >= 400) {
      throw new Error(`Failed to load: HTTP ${response ? response.status() : 'no response'}`)
    }

    // Wait extra for JS-heavy pages
    await page.waitForTimeout(1000)

    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
    })

    // Cache result
    cache.set(cacheKey, { data: screenshot, ts: Date.now() })

    // Limit cache size
    if (cache.size > 100) {
      const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0]
      cache.delete(oldest[0])
    }

    return screenshot
  } finally {
    await page.close()
    activeRequests--
  }
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url, `http://localhost:${PORT}`)

  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end(`OK - ${activeRequests} active requests, ${cache.size} cached`)
    return
  }

  // Screenshot endpoint
  if (url.pathname === '/screenshot') {
    const targetUrl = url.searchParams.get('url')
    const width = url.searchParams.get('width') || '1280'
    const height = url.searchParams.get('height') || '800'

    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Missing url parameter' }))
      return
    }

    // Validate URL
    try {
      new URL(targetUrl)
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid URL' }))
      return
    }

    try {
      const startTime = Date.now()
      const img = await Promise.race([
        capture({ url: targetUrl, width, height }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Screenshot timeout (20s)')), TIMEOUT_MS + 1000)
        ),
      ])

      console.log(`[${new Date().toISOString()}] Screenshot: ${targetUrl} (${(Date.now() - startTime) / 1000}s, ${img.length} bytes)`)

      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=900',
        'X-Cache': cache.has(`${targetUrl}|${width}|${height}`) ? 'HIT' : 'MISS',
      })
      res.end(img)
    } catch (e) {
      console.error(`Screenshot error for ${targetUrl}: ${e.message}`)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: e.message }))
    }
    return
  }

  res.writeHead(404)
  res.end('Not found. Try /screenshot?url=https://example.com')
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...')
  if (browser) await browser.close()
  server.close()
  process.exit(0)
})

server.listen(PORT, () => {
  console.log(`ProductShot Screenshot Server running on port ${PORT}`)
  console.log(`  Health: http://localhost:${PORT}/health`)
  console.log(`  Screenshot: http://localhost:${PORT}/screenshot?url=https://example.com`)
})
