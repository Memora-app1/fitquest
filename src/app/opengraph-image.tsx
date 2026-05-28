import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Ascendia — Life OS Gamificado'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#050914',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Gradient blobs */}
        <div style={{
          position: 'absolute', top: -200, left: -200,
          width: 600, height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: -200, right: -200,
          width: 600, height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,77,0,0.4) 0%, transparent 70%)',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
          <span style={{ fontSize: 72 }}>⚡</span>
          <span style={{
            fontSize: 80,
            fontWeight: 900,
            color: '#FF4D00',
            letterSpacing: 4,
          }}>ASCENDIA</span>
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: 32,
          color: '#ffffff',
          fontWeight: 700,
          margin: '0 0 16px',
          textAlign: 'center',
          maxWidth: 800,
        }}>
          Sua vida inteira em um só sistema
        </p>

        <p style={{ fontSize: 22, color: '#8899BB', margin: 0, textAlign: 'center' }}>
          Fitness · Produtividade · Finanças · Coach IA · Gamificado
        </p>

        {/* Pills */}
        <div style={{ display: 'flex', gap: 16, marginTop: 48 }}>
          {['💪 Hábitos', '✅ Tarefas', '💰 Finanças', '🤖 Coach IA'].map((item) => (
            <div key={item} style={{
              background: 'rgba(255,77,0,0.15)',
              border: '1px solid rgba(255,77,0,0.4)',
              borderRadius: 999,
              padding: '10px 24px',
              color: '#ffffff',
              fontSize: 18,
              fontWeight: 600,
            }}>
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
