'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

// ── Card renderer ─────────────────────────────────────────────────────────────
function renderCardToCanvas(canvas, { name, tagline, date, showBadge, accentColor }) {
  const ctx = canvas.getContext('2d')
  const W = 1200
  const H = 630
  canvas.width = W
  canvas.height = H

  // Parse accent color
  const colors = {
    indigo: { from: '#6366f1', to: '#8b5cf6' },
    green: { from: '#10b981', to: '#34d399' },
    orange: { from: '#f97316', to: '#fb923c' },
    pink: { from: '#ec4899', to: '#f472b6' },
    blue: { from: '#3b82f6', to: '#60a5fa' },
  }
  const c = colors[accentColor] || colors.indigo

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#13131a')
  bg.addColorStop(0.5, '#1a1a25')
  bg.addColorStop(1, '#0f0f18')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Left accent bar
  const barGrad = ctx.createLinearGradient(0, 0, 8, H)
  barGrad.addColorStop(0, c.from)
  barGrad.addColorStop(1, c.to)
  ctx.fillStyle = barGrad
  ctx.fillRect(0, 0, 8, H)

  // Glow
  const glow = ctx.createRadialGradient(W * 0.3, H * 0.4, 0, W * 0.3, H * 0.4, W * 0.5)
  glow.addColorStop(0, c.from + '22')
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  const leftX = W * 0.08
  const centerY = H / 2

  // Badge
  if (showBadge) {
    ctx.fillStyle = c.from
    roundRect(ctx, leftX, centerY - 100, 145, 34, 8)
    ctx.fill()
    ctx.fillStyle = 'white'
    ctx.font = 'bold 13px Inter, sans-serif'
    ctx.fillText('🚀 JUST LAUNCHED', leftX + 14, centerY - 73)
  }

  // Name
  ctx.fillStyle = '#f1f1f5'
  ctx.font = 'bold 72px Inter, sans-serif'
  const nameText = name || 'Your Product Name'
  ctx.fillText(nameText.slice(0, 28), leftX, centerY - 15)

  // Tagline
  ctx.fillStyle = '#a1a1aa'
  ctx.font = '28px Inter, sans-serif'
  const tagText = tagline || 'One line that explains what it does'
  // Word wrap tagline
  const words = tagText.split(' ')
  let line = ''
  let y = centerY + 30
  for (const word of words) {
    const test = line + word + ' '
    if (ctx.measureText(test).width > W * 0.36) {
      ctx.fillText(line.trim(), leftX, y)
      line = word + ' '
      y += 38
    } else {
      line = test
    }
  }
  ctx.fillText(line.trim(), leftX, y)

  // Date
  if (date) {
    ctx.fillStyle = '#52525b'
    ctx.font = '18px Inter, sans-serif'
    ctx.fillText(`📅 ${date}`, leftX, centerY + 90)
  }

  // Divider line
  ctx.strokeStyle = c.from + '40'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(leftX, centerY + 110)
  ctx.lineTo(W * 0.42, centerY + 110)
  ctx.stroke()

  // ProductShot brand
  ctx.fillStyle = '#3f3f46'
  ctx.font = '15px Inter, sans-serif'
  ctx.fillText('made with ProductShot', leftX, H - 28)
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
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [date, setDate] = useState(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
  const [showBadge, setShowBadge] = useState(true)
  const [accentColor, setAccentColor] = useState('indigo')
  const canvasRef = useRef(null)

  const updatePreview = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    renderCardToCanvas(canvas, { name, tagline, date, showBadge, accentColor })
  }, [name, tagline, date, showBadge, accentColor])

  useEffect(() => { updatePreview() }, [updatePreview])

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `productshot-${(name || 'launch').toLowerCase().replace(/\s+/g, '-')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  function handleReset() {
    setName('')
    setTagline('')
    setDate(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
    setShowBadge(true)
    setAccentColor('indigo')
  }

  const accentColors = [
    { id: 'indigo', label: 'Indigo', color: '#6366f1' },
    { id: 'green', label: 'Green', color: '#10b981' },
    { id: 'orange', label: 'Orange', color: '#f97316' },
    { id: 'pink', label: 'Pink', color: '#ec4899' },
    { id: 'blue', label: 'Blue', color: '#3b82f6' },
  ]

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 mb-6">
            <span className="text-indigo-400 text-sm">🎯</span>
            <span className="text-indigo-300 text-sm">Free to use. No signup. No backend.</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-3">
            <span className="gradient-text">ProductShot</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-xl mx-auto">
            Generate a launch card for Product Hunt, Twitter, and IH. Instant, no account needed.
          </p>
        </div>

        {/* 2-column layout */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: Controls */}
          <div className="space-y-5">
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-300 mb-2">Card Details</h3>

              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Product Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="My Awesome Product"
                  className="input-field w-full px-4 py-3 rounded-xl text-sm"
                  maxLength={40}
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="One line that explains what it does"
                  className="input-field w-full px-4 py-3 rounded-xl text-sm"
                  maxLength={80}
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Launch Date</label>
                <input
                  type="text"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  placeholder="April 28, 2026"
                  className="input-field w-full px-4 py-3 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-2">Accent Color</label>
                <div className="flex gap-2">
                  {accentColors.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setAccentColor(c.id)}
                      className={`w-9 h-9 rounded-full border-2 transition-all ${
                        accentColor === c.id ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowBadge(v => !v)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${showBadge ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${showBadge ? 'left-6' : 'left-1'}`} />
                </button>
                <span className="text-sm text-zinc-400">Show "Just Launched" badge</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleDownload} className="btn-primary flex-1 text-center">
                ⬇️ Download PNG (1200×630)
              </button>
              <button onClick={handleReset} className="px-4 py-3 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-all text-sm">
                Clear
              </button>
            </div>

            <p className="text-center text-zinc-600 text-xs">
              1200×630 — perfect for Twitter cards and Product Hunt
            </p>

            {/* Tip */}
            <div className="glass rounded-2xl p-4 border border-amber-500/10">
              <p className="text-amber-400 text-xs font-medium mb-1">💡 Tip</p>
              <p className="text-zinc-500 text-xs">
                Pair with a screenshot tool like <span className="text-zinc-300">Cleanmock</span> or <span className="text-zinc-300">Shots.so</span> for a product screenshot overlay.
              </p>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="lg:sticky lg:top-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-400">Preview</h3>
              <span className="text-xs text-zinc-600">1200 × 630</span>
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
              <canvas ref={canvasRef} className="w-full h-auto block" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-zinc-800 text-center">
          <p className="text-zinc-600 text-sm">
            Built for indie hackers who ship. No tracking. No signup. Just launch cards.
          </p>
        </div>
      </div>
    </div>
  )
}
