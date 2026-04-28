import { NextResponse } from 'next/server'

// Uses image.thum.io - a free screenshot service, no API key needed
// Falls back gracefully if it fails
const SCREENSHOT_SERVICE = 'https://image.thum.io/get/width/1200/crop/630/noanimate'

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

    const screenshotUrl = `${SCREENSHOT_SERVICE}/${encodeURIComponent(targetUrl)}`

    return NextResponse.json({
      success: true,
      screenshotUrl
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
