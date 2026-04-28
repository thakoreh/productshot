'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

// ── Screenshot — called directly from browser, no server needed ──────────────
function getScreenshotUrl(url) {
  return `https://image.thum.io/get/width/1200/crop/630/noanimate/${encodeURIComponent(url)}`
}

// ── Canvas card renderer ─────────────────────────────────────────────────────
function renderCardToCanvas(canvas, { screenshotUrl, name, tagline, date, showBadge }) {
  const ctx = canvas.getContext('2d')
  const W = 1200
  const H = 630
  canvas.width = W
  canvas.height = H

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#13131a')
  bg.addColorStop(0.5, '#1a1a25')
  bg.addColorStop(1, '#0f0f18')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Glow
  const glow = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.7)
  glow.addColorStop(0, 'rgba(99,102,241,0.08)')
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // Screenshot — right side
  const shotX = W * 0.48
  const shotY = 60
  const shotW = W * 0.46
  const shotH = H - 120

  // Screenshot frame
  ctx.fillStyle = '#1e1e2e'
  roundRect(ctx, shotX - 4, shotY - 4, shotW + 8, shotH + 8, 16)
  ctx.fill()

  // Browser chrome
  ctx.fillStyle = '#2a2a35'
  roundRect(ctx, shotX, shotY, shotW, 36, 12)
  ctx.fill()

  // Traffic lights
  ;[{x: shotX+16, c:'#ff5f57'}, {x: shotX+38, c:'#febc2e'}, {x: shotX+60, c:'#28c840'}].forEach(dot => {
    ctx.beginPath()
    ctx.arc(dot.x, shotY+18, 7, 0, Math.PI*2)
    ctx.fillStyle = dot.c
    ctx.fill()
  })

  // URL text
  ctx.fillStyle = '#52525b'
  ctx.font = '13px Inter, sans-serif'
  try {
    const u = new URL(screenshotUrl)
    ctx.fillText(u.hostname, shotX+80, shotY+23)
  } catch {}

  // Screenshot image
  if (screenshotUrl) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      ctx.drawImage(img, shotX, shotY + 36, shotW, shotH - 36)
      drawText(ctx, W, H, name, tagline, date, showBadge)
    }
    img.onerror = () => {
      drawText(ctx, W, H, name, tagline, date, showBadge)
    }
    img.src = screenshotUrl
  } else {
    drawText(ctx, W, H, name, tagline, date, showBadge)
  }
}

function drawText(ctx, W, H, name, tagline, date, showBadge) {
  const leftX = W * 0.07
  const centerY = H / 2

  // Badge
  if (showBadge) {
    ctx.fillStyle = '#6366f1'
    roundRect(ctx, leftX, centerY - 110, 130, 32, 8)
    ctx.fill()
    ctx.fillStyle = 'white'
    ctx.font = 'bold 13px Inter, sans-serif'
    ctx.fillText('🚀 JUST LAUNCHED', leftX + 16, centerY - 84)
  }

  // Name
  ctx.fillStyle = '#f1f1f5'
  ctx.font = 'bold 62px Inter, sans-serif'
  ctx.fillText((name || 'Your Product Name').slice(0, 28), leftX, centerY - 30)

  // Tagline
  ctx.fillStyle = '#a1a1aa'
  ctx.font = '26px Inter, sans-serif'
  ctx.fillText((tagline || 'One line description').slice(0, 45), leftX, centerY + 20)

  // Date
  if (date) {
    ctx.fillStyle = '#52525b'
    ctx.font = '16px Inter, sans-serif'
    ctx.fillText(`📅 ${date}`, leftX, centerY + 60)
  }

  // Brand
  ctx.fillStyle = '#3f3f46'
  ctx.font = '14px Inter, sans-serif'
  ctx.fillText('made with ProductShot', leftX, H - 30)

  // Divider
  ctx.strokeStyle = '#2a2a35'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(leftX, centerY + 80)
  ctx.lineTo(W * 0.42, centerY + 80)
  ctx.stroke()
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [date, setDate] = useState(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
  const [screenshotUrl, setScreenshotUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showBadge, setShowBadge] = useState(true)
  const canvasRef = useRef(null)

  const updatePreview = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    renderCardToCanvas(canvas, { screenshotUrl, name, tagline, date, showBadge })
  }, [screenshotUrl, name, tagline, date, showBadge])

  useEffect(() => { updatePreview() }, [updatePreview])

  async function handleCapture() {
    if (!url) { setError('Enter a URL first'); return }
    setError('')
    setLoading(true)
    try {
      const targetUrl = url.startsWith('http') ? url : `https://${url}`
      new URL(targetUrl) // validate
      setScreenshotUrl(targetUrl)
      if (!name) {
        try {
          const u = new URL(targetUrl)
          const host = u.hostname.replace('www.', '')
          const firstPart = host.split('.')[0]
          setName(firstPart.charAt(0).toUpperCase() + firstPart.slice(1))
        } catch {}
      }
    } catch (e) {
      setError('Invalid URL')
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `productshot-${(name || 'launch').toLowerCase().replace(/\s+/g, '-')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 mb-6">
            <span className="text-indigo-400 text-sm">🎯</span>
            <span className="text-indigo-300 text-sm">Free to use. No signup required.</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-3">
            <span className="gradient-text">ProductShot</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-xl mx-auto">
            Turn any product URL into a beautiful launch card for Product Hunt, Twitter, and IH.
          </p>
        </div>

        {/* 2-column layout */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: Controls */}
          <div className="space-y-5">
            <div className="glass rounded-2xl p-6">
              <label className="block text-sm font-semibold text-zinc-300 mb-3">Product URL</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCapture()}
                  placeholder="https://yourproduct.com"
                  className="input-field flex-1 px-4 py-3 rounded-xl text-sm"
                />
                <button
                  onClick={handleCapture}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2 whitespace-nowrap"
                >
                  {loading ? <><div className="spinner" />Capturing...</> : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>Capture</>}
                </button>
              </div>
              {error && <p className="mt-2 text-red-400 text-sm">⚠️ {error}</p>}
              <p className="mt-2 text-zinc-500 text-xs">Free screenshot via image.thum.io</p>
            </div>

            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-300 mb-4">Card Details</h3>
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Product Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="My Awesome Product" className="input-field w-full px-4 py-2.5 rounded-xl text-sm" maxLength={40} />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Tagline</label>
                <input type="text" value={tagline} onChange={e => setTagline(e.target.value)}
                  placeholder="One line that explains what it does" className="input-field w-full px-4 py-2.5 rounded-xl text-sm" maxLength={60} />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Launch Date</label>
                <input type="text" value={date} onChange={e => setDate(e.target.value)}
                  placeholder="April 28, 2026" className="input-field w-full px-4 py-2.5 rounded-xl text-sm" />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button onClick={() => setShowBadge(v => !v)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${showBadge ? 'bg-indigo-500' : 'bg-zinc-700'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${showBadge ? 'left-6' : 'left-1'}`} />
                </button>
                <span className="text-sm text-zinc-400">Show "Just Launched" badge</span>
              </div>
            </div>

            <button onClick={handleDownload} className="btn-primary w-full text-center">
              ⬇️ Download as PNG (1200×630)
            </button>

            <p className="text-center text-zinc-600 text-xs">
              Perfect for Twitter cards (1200×630) and Product Hunt launches
            </p>
          </div>

          {/* Right: Preview */}
          <div className="lg:sticky lg:top-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-400">Preview</h3>
              <span className="text-xs text-zinc-600">1200 × 630</span>
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
              {screenshotUrl && (
                <div className="absolute inset-0 z-10 pointer-events-none"
                  style={{margin: '52px 16px 16px 16px', borderRadius: '8px', overflow: 'hidden'}}>
                  <img
                    src={getScreenshotUrl(screenshotUrl)}
                    alt="Screenshot"
                    className="w-full object-cover object-top"
                    style={{height: 'calc(100% - 36px)'}}
                    crossOrigin="anonymous"
                  />
                </div>
              )}
              <canvas ref={canvasRef} className="w-full h-auto block" />
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-zinc-800 text-center">
          <p className="text-zinc-600 text-sm">
            Built for indie hackers who ship. No tracking. No signup. Just launch cards.
          </p>
        </div>
      </div>
    </div>
  )
}
