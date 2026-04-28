'use client'
import { useState, useRef, useCallback, useEffect } from 'react'

// ── Card Renderer ──────────────────────────────────────────────────────────────
const COLOR_PRESETS = {
  emerald: { from: '#10b981', to: '#34d399', label: 'Emerald' },
  blue: { from: '#3b82f6', to: '#60a5fa', label: 'Blue' },
  violet: { from: '#8b5cf6', to: '#a78bfa', label: 'Violet' },
  rose: { from: '#f43f5e', to: '#fb7185', label: 'Rose' },
  amber: { from: '#f59e0b', to: '#fbbf24', label: 'Amber' },
  zinc: { from: '#71717a', to: '#a1a1aa', label: 'Zinc' },
}

const BG_PRESETS = [
  { id: 'dark', label: 'Dark', from: '#09090b', to: '#18181b' },
  { id: 'midnight', label: 'Midnight', from: '#0f172a', to: '#1e293b' },
  { id: 'forest', label: 'Forest', from: '#052e16', to: '#14532d' },
  { id: 'dusk', label: 'Dusk', from: '#1e1b4b', to: '#312e81' },
  { id: 'slate', label: 'Slate', from: '#18181b', to: '#27272a' },
  { id: 'white', label: 'Light', from: '#ffffff', to: '#f4f4f5' },
]

function renderCard(canvas, state) {
  const {
    name, tagline, date, showBadge, accentKey,
    bgKey, screenshot, customText, websiteUrl,
  } = state

  const ctx = canvas.getContext('2d')
  const W = 1200, H = 630
  canvas.width = W
  canvas.height = H

  const accent = COLOR_PRESETS[accentKey]
  const bg = BG_PRESETS.find(b => b.id === bgKey) || BG_PRESETS[0]
  const isLight = bgKey === 'white'

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, W, H)
  bgGrad.addColorStop(0, bg.from)
  bgGrad.addColorStop(1, bg.to)
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H)

  // Subtle accent glow
  const glow = ctx.createRadialGradient(W * 0.2, H * 0.5, 0, W * 0.2, H * 0.5, W * 0.5)
  glow.addColorStop(0, accent.from + (isLight ? '15' : '20'))
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // Left accent bar
  const bar = ctx.createLinearGradient(0, 0, 6, H)
  bar.addColorStop(0, accent.from)
  bar.addColorStop(1, accent.to)
  ctx.fillStyle = bar
  ctx.fillRect(0, 0, 6, H)

  // Corner dot pattern (subtle)
  ctx.fillStyle = accent.from + '08'
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 3; j++) {
      ctx.beginPath()
      ctx.arc(W - 40 - i * 22, 40 + j * 22, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const leftX = W * 0.07
  const topY = H * 0.35

  // Badge
  if (showBadge) {
    ctx.fillStyle = accent.from
    roundRect(ctx, leftX, topY - 60, 148, 36, 999)
    ctx.fill()
    ctx.fillStyle = isLight ? '#000' : '#fff'
    ctx.font = 'bold 13px system-ui, sans-serif'
    ctx.fillText('JUST LAUNCHED', leftX + 18, topY - 34)
  }

  // Product name
  ctx.fillStyle = isLight ? '#18181b' : '#fafafa'
  ctx.font = 'bold 72px system-ui, sans-serif'
  ctx.fillText((name || 'Your Product').slice(0, 30), leftX, topY + (showBadge ? 30 : 0))

  // Tagline
  ctx.fillStyle = isLight ? '#52525b' : '#a1a1aa'
  ctx.font = '24px system-ui, sans-serif'
  wrapText(ctx, tagline || 'One line that explains what it does', leftX, topY + 72 + (showBadge ? 30 : 0), W * 0.38, 36)

  // Date
  if (date) {
    ctx.fillStyle = isLight ? '#a1a1aa' : '#71717a'
    ctx.font = '16px system-ui, sans-serif'
    ctx.fillText(date, leftX, topY + 130 + (showBadge ? 30 : 0))
  }

  // Screenshot area — right side
  const shotX = W * 0.50
  const shotY = 52
  const shotW = W * 0.44
  const shotH = H - 104

  // Screenshot frame
  ctx.fillStyle = isLight ? '#e4e4e7' : '#27272a'
  roundRect(ctx, shotX - 5, shotY - 5, shotW + 10, shotH + 10, 16)
  ctx.fill()

  if (screenshot) {
    // Draw screenshot image
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // Cover fit
      const scale = Math.max(shotW / img.width, shotH / img.height)
      const dw = img.width * scale
      const dh = img.height * scale
      const dx = shotX + (shotW - dw) / 2
      const dy = shotY + (shotH - dh) / 2
      ctx.save()
      roundRect(ctx, shotX, shotY, shotW, shotH, 12)
      ctx.clip()
      ctx.drawImage(img, dx, dy, dw, dh)
      ctx.restore()
    }
    img.src = screenshot
  } else {
    // Placeholder
    ctx.fillStyle = isLight ? '#f4f4f5' : '#18181b'
    roundRect(ctx, shotX, shotY, shotW, shotH, 12)
    ctx.fill()

    // Placeholder icon
    ctx.fillStyle = isLight ? '#d4d4d8' : '#3f3f46'
    ctx.font = '48px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('+', shotX + shotW / 2, shotY + shotH / 2 + 16)
    ctx.textAlign = 'left'

    ctx.fillStyle = isLight ? '#a1a1aa' : '#71717a'
    ctx.font = '14px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Add screenshot', shotX + shotW / 2, shotY + shotH / 2 + 48)
    ctx.fillText('(paste or upload below)', shotX + shotW / 2, shotY + shotH / 2 + 68)
    ctx.textAlign = 'left'
  }

  // Browser chrome on screenshot
  const chromeH = 36
  ctx.fillStyle = isLight ? '#e4e4e7' : '#1a1a1a'
  roundRectTop(ctx, shotX, shotY, shotW, chromeH, 12)
  ctx.fill()

  // Traffic lights
  ;[{ x: shotX + 16, c: '#ff5f57' }, { x: shotX + 38, c: '#febc2e' }, { x: shotX + 60, c: '#28c840' }].forEach(dot => {
    ctx.beginPath()
    ctx.arc(dot.x, shotY + chromeH / 2, 6, 0, Math.PI * 2)
    ctx.fillStyle = dot.c
    ctx.fill()
  })

  // URL in chrome
  if (websiteUrl) {
    ctx.fillStyle = isLight ? '#a1a1aa' : '#52525b'
    ctx.font = '12px system-ui, sans-serif'
    try {
      const u = new URL(websiteUrl)
      ctx.fillText(u.hostname, shotX + 88, shotY + chromeH / 2 + 4)
    } catch {}
  }

  // Footer divider
  ctx.strokeStyle = (isLight ? '#e4e4e7' : '#27272a')
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(leftX, H - 52)
  ctx.lineTo(W * 0.44, H - 52)
  ctx.stroke()

  // Brand text
  ctx.fillStyle = isLight ? '#d4d4d8' : '#3f3f46'
  ctx.font = '13px system-ui, sans-serif'
  ctx.fillText('made with ProductShot', leftX, H - 26)

  // Custom text bottom right
  if (customText) {
    ctx.fillStyle = isLight ? '#a1a1aa' : '#71717a'
    ctx.font = '14px system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(customText, shotX + shotW, H - 26)
    ctx.textAlign = 'left'
  }
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
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

function roundRectTop(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h)
  ctx.lineTo(x, y + h)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(' ')
  let line = ''
  for (const word of words) {
    const test = line + word + ' '
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), x, y)
      line = word + ' '
      y += lineH
    } else {
      line = test
    }
  }
  ctx.fillText(line.trim(), x, y)
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function ProductShot() {
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [date, setDate] = useState(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
  const [showBadge, setShowBadge] = useState(true)
  const [accentKey, setAccentKey] = useState('emerald')
  const [bgKey, setBgKey] = useState('dark')
  const [screenshot, setScreenshot] = useState(null)
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [customText, setCustomText] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)

  const state = { name, tagline, date, showBadge, accentKey, bgKey, screenshot, customText, websiteUrl }

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    renderCard(canvas, state)
  }, [state])

  useEffect(() => { redraw() }, [redraw])

  // Paste handler for screenshots
  useEffect(() => {
    function handlePaste(e) {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile()
          const reader = new FileReader()
          reader.onload = (ev) => setScreenshot(ev.target.result)
          reader.readAsDataURL(blob)
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])

  function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setScreenshot(ev.target.result)
    reader.readAsDataURL(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer?.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (ev) => setScreenshot(ev.target.result)
    reader.readAsDataURL(file)
  }

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    const slug = (name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const a = document.createElement('a')
    a.download = `productshot-${slug}.png`
    a.href = canvas.toDataURL('image/png', 1.0)
    a.click()
  }

  function handleCopyLink() {
    const slug = (name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    navigator.clipboard.writeText(`https://productshot.app/c/${slug}`)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const bgColors = {
    dark: 'bg-zinc-900 border-zinc-800',
    midnight: 'bg-slate-900 border-slate-800',
    forest: 'bg-green-950 border-green-900',
    dusk: 'bg-indigo-950 border-indigo-900',
    slate: 'bg-neutral-900 border-neutral-800',
    white: 'bg-white border-zinc-200',
  }

  return (
    <div className="min-h-[100dvh]">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: COLOR_PRESETS[accentKey].from }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="3" fill="white" fillOpacity="0.9"/>
                <path d="M5 8h6M8 5v6" stroke={COLOR_PRESETS[accentKey].from} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight">ProductShot</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="tag">
              <span className="status-dot" />
              Live
            </span>
            <a href="https://github.com/thakoreh/productshot" target="_blank" rel="noopener"
              className="btn-ghost text-xs px-3 py-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Open Source
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="mb-12 fade-up">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3" style={{ color: 'var(--text)' }}>
            Launch cards for<br />
            <span style={{ color: COLOR_PRESETS[accentKey].from }}>indie hackers</span>
          </h1>
          <p className="text-zinc-500 max-w-lg text-base">
            Create a professional launch card in seconds. No signup, no friction. Paste your screenshot and download.
          </p>
        </div>

        {/* Main 2-col layout */}
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Left: Controls (3/5) */}
          <div className="lg:col-span-3 space-y-5 fade-up" style={{ animationDelay: '50ms' }}>

            {/* URL + Name */}
            <div className={`p-5 rounded-2xl border ${bgColors[bgKey]}`} style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Website URL</label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={e => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourproduct.com"
                    className="field"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Product Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="My Awesome Product"
                    className="field"
                    maxLength={40}
                  />
                </div>
              </div>
            </div>

            {/* Tagline + Date */}
            <div className={`p-5 rounded-2xl border ${bgColors[bgKey]}`} style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={e => setTagline(e.target.value)}
                    placeholder="One line that explains what it does"
                    className="field"
                    maxLength={80}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Launch Date</label>
                  <input
                    type="text"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    placeholder="Apr 28, 2026"
                    className="field"
                  />
                </div>
              </div>
            </div>

            {/* Screenshot Upload */}
            <div className={`p-5 rounded-2xl border ${bgColors[bgKey]}`} style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Product Screenshot</label>
                <div
                  className="relative rounded-xl border-2 border-dashed transition-all cursor-pointer"
                  style={{ borderColor: screenshot ? COLOR_PRESETS[accentKey].from + '60' : 'var(--border)' }}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                >
                  {screenshot ? (
                    <div className="relative p-2">
                      <img src={screenshot} alt="Screenshot" className="w-full h-48 object-cover rounded-lg" />
                      <button
                        onClick={e => { e.stopPropagation(); setScreenshot(null) }}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center text-xs font-bold hover:bg-black/90"
                      >
                        X
                      </button>
                      <div className="absolute bottom-4 left-4 text-xs px-2 py-1 rounded bg-black/60 text-white">
                        Click to replace
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-center p-6">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3" style={{ color: 'var(--muted)' }}>
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                      <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Drop image or click to upload</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--muted)', opacity: 0.7 }}>Paste from clipboard also works (Ctrl/Cmd+V)</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.6 }}>
                  Tip: Use CleanShot, Cleanmock, or macOS screenshot tool to capture your product
                </p>
              </div>
            </div>

            {/* Style Options */}
            <div className={`p-5 rounded-2xl border ${bgColors[bgKey]}`} style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="space-y-5">
                {/* Accent Colors */}
                <div className="space-y-2.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Accent Color</label>
                  <div className="flex gap-2.5">
                    {Object.entries(COLOR_PRESETS).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => setAccentKey(key)}
                        className={`swatch ${accentKey === key ? 'active' : ''}`}
                        style={{ background: `linear-gradient(135deg, ${val.from}, ${val.to})`, color: val.from }}
                        title={val.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Background */}
                <div className="space-y-2.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Background</label>
                  <div className="flex gap-2 flex-wrap">
                    {BG_PRESETS.map(bg => (
                      <button
                        key={bg.id}
                        onClick={() => setBgKey(bg.id)}
                        className={`w-9 h-9 rounded-lg border-2 transition-all ${bgKey === bg.id ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
                        style={{ background: `linear-gradient(135deg, ${bg.from}, ${bg.to})` }}
                        title={bg.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">Just Launched badge</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Shows rocket badge on card</p>
                  </div>
                  <button onClick={() => setShowBadge(v => !v)} className={`toggle ${showBadge ? 'on' : ''}`} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Custom footer text</label>
                  <input
                    type="text"
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    placeholder="yourdomain.com"
                    className="field"
                  />
                </div>
              </div>
            </div>

            {/* Download */}
            <div className="flex gap-3">
              <button onClick={handleDownload} className="btn-primary flex-1 justify-center py-3 text-base">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download PNG
              </button>
              <button onClick={handleCopyLink} className="btn-ghost py-3 px-5">
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            {/* Specs */}
            <p className="text-center text-xs" style={{ color: 'var(--muted)', opacity: 0.5 }}>
              1200 x 630 px — Twitter card, Open Graph, Product Hunt ready
            </p>
          </div>

          {/* Right: Preview (2/5) */}
          <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Preview</span>
              <span className="text-xs font-mono" style={{ color: 'var(--muted)', opacity: 0.5 }}>1200 x 630</span>
            </div>
            <div className="canvas-wrap">
              <canvas ref={canvasRef} />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {name || 'Your Product Name'}
              </span>
              {screenshot && (
                <span className="tag" style={{ fontSize: '10px' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Screenshot added
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Social proof / how it works */}
        <div className="mt-20 pt-12 border-t border-zinc-800 fade-up" style={{ animationDelay: '100ms' }}>
          <p className="text-xs uppercase tracking-wider font-medium mb-6" style={{ color: 'var(--muted)' }}>How it works</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Capture your product', desc: 'Use CleanShot, macOS screenshot, or any tool to capture your product. Paste or upload below.' },
              { step: '02', title: 'Customize the card', desc: 'Add your product name, tagline, and launch date. Pick colors and style to match your brand.' },
              { step: '03', title: 'Download and share', desc: 'Get a perfect 1200x630 PNG ready for Twitter, Product Hunt, and Indie Hackers.' },
            ].map(item => (
              <div key={item.step} className="space-y-2">
                <span className="text-4xl font-bold tracking-tight" style={{ color: COLOR_PRESETS[accentKey].from, opacity: 0.3 }}>{item.step}</span>
                <h3 className="text-base font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <p className="text-xs" style={{ color: 'var(--muted)' }}>ProductShot — Built for builders who ship.</p>
          <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.5 }}>
            100% free. No signup. No tracking.
          </p>
        </div>
      </footer>
    </div>
  )
}
