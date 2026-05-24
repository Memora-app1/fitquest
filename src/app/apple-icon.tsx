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
          borderRadius: '40px',
        }}
      >
        <div
          style={{
            fontSize: 110,
            lineHeight: 1,
          }}
        >
          ⚡
        </div>
      </div>
    ),
    { ...size }
  )
}
