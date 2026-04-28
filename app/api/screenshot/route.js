import { NextResponse } from 'next/server'

const SCREENSHOT_SERVER = process.env.SCREENSHOT_SERVER || 'http://localhost:3008'

export async function POST(request) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 })
    }

    // Validate URL
    let targetUrl
    try {
      targetUrl = url.startsWith('http') ? url : `https://${url}`
      new URL(targetUrl)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Call local Playwright screenshot server
    const screenshotUrl = `${SCREENSHOT_SERVER}/screenshot?url=${encodeURIComponent(targetUrl)}`

    return NextResponse.json({
      success: true,
      screenshotUrl
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
