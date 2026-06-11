import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 180, height: 180 }

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#050914',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 144,
            height: 144,
            background: 'linear-gradient(135deg, #FF4D00 0%, #7C3AED 100%)',
            borderRadius: 32,
          }}
        >
          <span style={{ fontSize: 80, lineHeight: 1 }}>⚡</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
