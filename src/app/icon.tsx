import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const contentType = 'image/png';
export const size = { width: 512, height: 512 };

export default function Icon() {
  return new ImageResponse(
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
          width: 384,
          height: 384,
          background: 'linear-gradient(135deg, #FF4D00 0%, #7C3AED 100%)',
          borderRadius: 84,
        }}
      >
        <span style={{ fontSize: 220, lineHeight: 1 }}>⚡</span>
      </div>
    </div>,
    { ...size }
  );
}
