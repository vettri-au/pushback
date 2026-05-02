import { ImageResponse } from '@vercel/og'
import React from 'react'

export const config = { runtime: 'edge' }

export default function handler() {
  return new ImageResponse(
    React.createElement(
      'div',
      {
        style: {
          background: '#080810',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          padding: '80px',
          position: 'relative',
        },
      },
      React.createElement(
        'div',
        { style: { display: 'flex', gap: '20px', fontSize: '56px' } },
        '🥊  😈  🎯  🔄'
      ),
      React.createElement(
        'div',
        {
          style: {
            fontSize: '100px',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-4px',
            lineHeight: 1,
          },
        },
        React.createElement('span', { style: { color: '#ffffff' } }, 'Push'),
        React.createElement('span', { style: { color: '#ef4444' } }, 'Back')
      ),
      React.createElement(
        'div',
        {
          style: {
            fontSize: '30px',
            color: '#7070a0',
            letterSpacing: '-0.5px',
          },
        },
        "Most AI agrees with you. We don't."
      ),
      React.createElement('div', {
        style: {
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          height: '6px',
          background: '#ef4444',
        },
      })
    ),
    { width: 1200, height: 630 }
  )
}
