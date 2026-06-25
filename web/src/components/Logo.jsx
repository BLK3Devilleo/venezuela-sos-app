import React from 'react';

/**
 * Logo component for VenezuelaSOS.
 * Renders a premium vector squircle button with a black lightning bolt,
 * a glowing border using Venezuela's flag colors (Yellow, Blue, Red),
 * and an "SOS" emergency indicator badge.
 * 
 * @param {object} props
 * @param {number} props.size - Width/Height of the logo (default: 80)
 * @param {boolean} props.animated - Whether the logo has active animations/shimmer (default: false)
 * @param {object} props.style - Additional inline styles
 */
export default function Logo({ size = 80, animated = false, style = {} }) {
  const glowStyle = animated 
    ? {
        animation: 'sos-glow-pulse 3s infinite ease-in-out, sos-rotate-glow 15s infinite linear'
      }
    : {};

  return (
    <div style={{
      width: size,
      height: size,
      display: 'inline-block',
      position: 'relative',
      filter: `
        drop-shadow(0 4px 12px rgba(0,0,0,0.25))
        drop-shadow(0 0 8px var(--ve-yellow-glow-strong))
        drop-shadow(0 0 16px var(--ve-blue-glow-strong))
        drop-shadow(0 0 24px var(--ve-red-glow-strong))
      `,
      ...style
    }}>
      <svg 
        viewBox="0 0 100 100" 
        width="100%" 
        height="100%" 
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Glowing Venezuelan Gradient for Border */}
          <linearGradient id="venezuela-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EAB308" /> {/* Yellow */}
            <stop offset="50%" stopColor="#2563EB" /> {/* Blue */}
            <stop offset="100%" stopColor="#DC2626" /> {/* Red */}
          </linearGradient>

          {/* SVG Glow Filter (Fallback / Enhancement) */}
          <filter id="svg-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Glow Ring (under the button) */}
        <rect 
          x="3" 
          y="3" 
          width="94" 
          height="94" 
          rx="28" 
          fill="none" 
          stroke="url(#venezuela-gradient)" 
          strokeWidth="3.5" 
          opacity="0.85"
          style={{
            transformOrigin: 'center',
            ...glowStyle
          }}
        />

        {/* Squircle Button Body */}
        <rect 
          x="5" 
          y="5" 
          width="90" 
          height="90" 
          rx="25" 
          fill="#FFFFFF" 
          stroke="#E2E8F0"
          strokeWidth="0.5"
        />

        {/* Lightning Bolt (⚡) perfectly aligned & rounded */}
        <path 
          d="M 54 22 L 31 52 H 48 L 44 78 L 69 48 H 52 L 54 22 Z"
          fill="#1E293B"
          stroke="#1E293B"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={animated ? {
            animation: 'sos-bolt-flicker 4s infinite'
          } : {}}
        />

        {/* SOS Emergency Badge on the border (top-right) */}
        <g 
          transform="translate(82, 18)"
          style={animated ? {
            animation: 'sos-badge-blink 1.5s infinite ease-in-out'
          } : {}}
        >
          {/* Badge Glow */}
          <rect 
            x="-15" 
            y="-6" 
            width="24" 
            height="12" 
            rx="6" 
            fill="#DC2626" 
            opacity="0.3"
            style={{
              transform: 'scale(1.3)',
              transformOrigin: 'center',
              filter: 'url(#svg-glow)'
            }}
          />
          {/* Badge Solid Pill */}
          <rect 
            x="-15" 
            y="-6" 
            width="24" 
            height="12" 
            rx="6" 
            fill="#DC2626" 
            stroke="#FFFFFF"
            strokeWidth="1"
          />
          {/* SOS Text */}
          <text 
            x="-3" 
            y="3" 
            fill="#FFFFFF" 
            fontSize="7.5" 
            fontWeight="900" 
            fontFamily="var(--font-display), 'Arial Black', sans-serif" 
            textAnchor="middle"
            letterSpacing="0.5"
          >
            SOS
          </text>
        </g>
      </svg>

      {/* Localized Styles for keyframe animations */}
      <style>{`
        :root {
          --ve-yellow-glow-strong: rgba(234, 179, 8, 0.4);
          --ve-blue-glow-strong: rgba(37, 99, 235, 0.35);
          --ve-red-glow-strong: rgba(220, 38, 38, 0.35);
        }

        @keyframes sos-glow-pulse {
          0%, 100% {
            opacity: 0.7;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.03);
          }
        }

        @keyframes sos-rotate-glow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes sos-badge-blink {
          0%, 100% {
            transform: translate(82px, 18px) scale(1);
            filter: drop-shadow(0 0 2px rgba(220, 38, 38, 0.5));
          }
          50% {
            transform: translate(82px, 18px) scale(1.08);
            filter: drop-shadow(0 0 8px rgba(220, 38, 38, 0.9));
          }
        }

        @keyframes sos-bolt-flicker {
          0%, 94%, 98%, 100% {
            opacity: 1;
            fill: #1E293B;
          }
          95%, 97% {
            opacity: 0.3;
            fill: #EAB308;
          }
        }
      `}</style>
    </div>
  );
}
