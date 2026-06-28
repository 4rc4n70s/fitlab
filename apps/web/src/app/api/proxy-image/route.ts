import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  
  if (!url) {
    return new NextResponse('URL required', { status: 400 })
  }
  
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    
    return new NextResponse(blob, {
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (err) {
    console.error('Proxy error', err)
    return new NextResponse('Error fetching image', { status: 500 })
  }
}
