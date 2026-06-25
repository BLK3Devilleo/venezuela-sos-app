import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * BottomModal — Reusable sheet modal that slides up from the bottom.
 * Rendered using a React Portal in document.body to prevent stacking context,
 * clipping, and parent filter/blur bugs on mobile webviews.
 * 
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 *   children: ReactNode
 *   title?: string
 */
export default function BottomModal({ isOpen, onClose, children, title }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Dark Blur Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(5, 8, 21, 0.75)', // Deep dark overlay
          zIndex: 9999, // Ensure it is above the fixed tab bar (zIndex 200)
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          animation: 'sos-modal-fade-in 0.2s ease-out forwards',
          touchAction: 'none'
        }}
      />

      {/* Bottom Sheet Modal Container */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10000, // Above the overlay
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border)',
          borderRadius: '1.5rem 1.5rem 0 0',
          padding: '0 1.5rem calc(1.5rem + env(safe-area-inset-bottom, 16px))', // Safe area padding for mobile home indicators
          maxHeight: '85vh',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.5)',
          animation: 'sos-modal-slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Drag Handle Indicator */}
        <div style={{
          width: '36px',
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '2px',
          margin: '0.75rem auto 1.25rem',
          flexShrink: 0
        }} />

        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexShrink: 0
        }}>
          {title && (
            <h3 className="font-display" style={{ 
              fontSize: '1.25rem', 
              fontWeight: '800', 
              color: 'var(--text-primary)',
              margin: 0
            }}>
              {title}
            </h3>
          )}
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            style={{
              marginLeft: 'auto',
              background: 'var(--bg-surface-soft)',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s',
              outline: 'none'
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--border-focus)'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto',
          paddingRight: '4px',
          // Styles to improve scrollbar inside modal
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--border) transparent'
        }}>
          {children}
        </div>
      </div>

      {/* Localized animations to prevent naming collision */}
      <style>{`
        @keyframes sos-modal-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sos-modal-slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>,
    document.body
  );
}
