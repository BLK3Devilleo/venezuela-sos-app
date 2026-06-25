import React, { useState, useEffect } from 'react';
import Logo from './Logo';

/**
 * SplashScreen component for VenezuelaSOS.
 * Plays a premium intro animation when the application starts:
 * 1. Logo scales up elastically with active glowing shadows.
 * 2. Background pulse glows in yellow, blue, and red colors.
 * 3. A tricolor progress bar simulates connecting to the emergency database.
 * 4. Fades out smoothly after completion.
 * 
 * @param {object} props
 * @param {function} props.onFinish - Callback fired when the splash animation completes
 */
export default function SplashScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate progress bar over 2.2 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Smooth logarithmic deceleration toward the end
        const diff = Math.max(1.5, (100 - prev) * 0.1);
        return Math.min(100, prev + diff);
      });
    }, 40);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      // Start exit fadeout
      const timeout = setTimeout(() => {
        setIsExiting(true);
        // Wait for CSS fadeout transition (350ms) to complete before unmounting
        const finishTimeout = setTimeout(() => {
          onFinish();
        }, 350);
        return () => clearTimeout(finishTimeout);
      }, 500); // Hold for 500ms at 100% progress for visual polish
      return () => clearTimeout(timeout);
    }
  }, [progress, onFinish]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#070b15',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: isExiting ? 0 : 1,
      transform: isExiting ? 'scale(1.03)' : 'scale(1)',
      transition: 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      pointerEvents: isExiting ? 'none' : 'auto',
      overflow: 'hidden'
    }}>
      {/* Background radial tricolor glow */}
      <div className="splash-glow" style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(234,179,8,0.06) 0%, rgba(37,99,235,0.04) 40%, rgba(220,38,38,0.04) 70%, transparent 100%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
        zIndex: 1,
        animation: 'splash-glow-spin 12s infinite linear'
      }} />

      {/* Main Logo container */}
      <div style={{
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2.5rem',
        animation: 'splash-scale-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both'
      }}>
        {/* Animated Logo */}
        <Logo size={130} animated={true} />

        {/* Brand name */}
        <div style={{ textAlign: 'center' }}>
          <h1 className="font-display" style={{
            fontSize: '2.25rem',
            fontWeight: '900',
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
            margin: 0,
            lineHeight: 1.1
          }}>
            Venezuela<span style={{
              background: 'linear-gradient(135deg, #0d9488, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: '950'
            }}>SOS</span>
          </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.45)',
            fontSize: '0.875rem',
            fontWeight: '500',
            marginTop: '0.4rem',
            letterSpacing: '0.02em'
          }}>
            SISTEMA DE ASISTENCIA COMUNITARIA
          </p>
          <div style={{
            fontSize: '0.725rem',
            fontWeight: '700',
            color: '#0d9488',
            marginTop: '0.6rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            opacity: 0.8
          }}>
            BY: FILO
          </div>
        </div>
      </div>

      {/* Progress indicators at bottom */}
      <div style={{
        position: 'absolute',
        bottom: '8%',
        width: '100%',
        maxWidth: '280px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.85rem',
        zIndex: 10,
        animation: 'splash-fade-in 1s ease 0.4s both'
      }}>
        {/* Custom Progress Bar */}
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          borderRadius: '2px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(to right, #ffcc00 0% 33.3%, #00247d 33.3% 66.6%, #cf142b 66.6%)',
            transition: 'width 0.1s ease-out',
            boxShadow: '0 0 8px rgba(37,99,235,0.5)'
          }} />
        </div>

        {/* Status text */}
        <span style={{
          fontSize: '0.725rem',
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          textAlign: 'center'
        }}>
          {progress < 40 && 'Iniciando conexión segura...'}
          {progress >= 40 && progress < 80 && 'Cargando mapas de refugios...'}
          {progress >= 80 && progress < 100 && 'Sincronizando reportes de ayuda...'}
          {progress === 100 && 'Listo'}
        </span>
      </div>

      {/* Embedded CSS for custom keyframe animations */}
      <style>{`
        @keyframes splash-scale-in {
          0% {
            transform: scale(0.4);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes splash-fade-in {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes splash-glow-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
