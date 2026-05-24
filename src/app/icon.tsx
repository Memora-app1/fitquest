import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 512, height: 512 }

export default function Icon() {
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
          borderRadius: '115px',
        }}
      >
        <div
          style={{
            fontSize: 320,
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
