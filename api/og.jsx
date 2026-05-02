import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

export default function handler() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#080810',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          padding: '80px',
        }}
      >
        {/* Mode emojis */}
        <div style={{ display: 'flex', gap: '24px', fontSize: '56px' }}>
          <span>🥊</span>
          <span>😈</span>
          <span>🎯</span>
          <span>🔄</span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '96px',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-4px',
            lineHeight: 1,
          }}
        >
          Push<span style={{ color: '#ef4444' }}>Back</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '32px',
            color: '#7070a0',
            letterSpacing: '-0.5px',
          }}
        >
          Most AI agrees with you. We don't.
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '6px',
            background: '#ef4444',
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
