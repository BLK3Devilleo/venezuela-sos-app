import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { ShieldAlert, Globe, User } from 'lucide-react';
import Logo from '../components/Logo';

export default function LoginView({ onLogin, onEnterAsGuest = null, onBack = null, needsOnboarding = false, authUserId = null, authUserName = '' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { Capacitor } = await import('@capacitor/core');
      const isNative = Capacitor.isNativePlatform();
      const redirectUrl = isNative ? 'com.filosos.app://login-callback/' : window.location.origin;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: isNative
        }
      });
      
      if (error) throw error;
      if (isNative && data?.url) {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: data.url });
      }
    } catch (err) {
      console.error('Error al iniciar Google Auth:', err);
      setError('No se pudo conectar con Google.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #060d1a 0%, #0b1c2e 50%, #091520 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1.25rem', position: 'relative', overflow: 'hidden',
      color: '#fff', fontFamily: 'sans-serif'
    }}>
      {/* Decorative gradients */}
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(to right, #dc2626 33.3%, #eab308 33.3% 66.6%, #1d4ed8 66.6%)' }} />

      <div style={{ width: '100%', maxWidth: '400px', animation: 'fadeIn 0.4s ease', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Brand / Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
          <Logo size={90} animated={true} />
          <div>
            <h1 className="font-display" style={{ fontSize: '2.5rem', fontWeight: '900', margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff 60%, rgba(255,255,255,0.7))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              FiloSOS
            </h1>
            <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
              Venezuela SOS
            </span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', maxWidth: '320px', lineHeight: '1.4', margin: '0.5rem 0 0 0' }}>
            Canal de comunicación unificado para conectarnos y apoyarnos mutuamente.
          </p>
        </div>
        
        {/* Action Panel */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '1.5rem',
          padding: '2.25rem 1.75rem',
          boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          
          {error && (
            <div style={{ backgroundColor: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={16} flexShrink={0} />
              <span>{error}</span>
            </div>
          )}

          {/* Botón Primario 1: Explorar como invitado */}
          {onEnterAsGuest && (
            <button 
              onClick={onEnterAsGuest}
              disabled={loading}
              style={{
                width: '100%',
                padding: '1.1rem',
                borderRadius: '1rem',
                background: 'linear-gradient(135deg, #0d9488, #0891b2)',
                border: 'none',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                boxShadow: '0 8px 24px rgba(13,148,136,0.3)',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'none'}
            >
              <User size={20} />
              Explorar como invitado
            </button>
          )}

          {/* Botón Primario 2: Ingresar con Google */}
          <button 
            onClick={handleGoogleLogin} 
            disabled={loading} 
            style={{ 
              width: '100%', 
              padding: '1.1rem', 
              borderRadius: '1rem', 
              background: 'rgba(255,255,255,0.06)', 
              border: '1px solid rgba(255,255,255,0.15)', 
              color: '#fff', 
              fontSize: '1rem', 
              fontWeight: '700', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.6rem',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
          >
            <Globe size={20} />
            {loading ? 'Conectando...' : 'Ingresar con Google'}
          </button>
          
          {/* Botones Secundarios: Necesito Ayuda / Quiero Ayudar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button 
              onClick={() => onEnterAsGuest && onEnterAsGuest()}
              style={{
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                background: 'rgba(239, 68, 68, 0.05)',
                color: '#f87171',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
            >
              🚨 Necesito Ayuda
            </button>
            <button 
              onClick={() => onEnterAsGuest && onEnterAsGuest()}
              style={{
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                background: 'rgba(16, 185, 129, 0.05)',
                color: '#34d399',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'}
            >
              🤝 Quiero Ayudar
            </button>
          </div>

          {/* Disclaimer de Seguridad */}
          <div style={{
            marginTop: '1.25rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            fontSize: '0.725rem',
            color: 'rgba(255,255,255,0.35)',
            lineHeight: '1.5',
            textAlign: 'center'
          }}>
            Para proteger a nuestra comunidad, inicia sesión con Google si deseas publicar información. Es 100% seguro.
            <div style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.25)' }}>
              Nota de transparencia: Aún estamos en desarrollo, por lo que al loguearte verás el enlace técnico de nuestro servidor ('Ir a mqjjgbynsslthrhwntra.supabase.co'). Puedes confiar en él.
            </div>
          </div>

        </div>

        {/* Footer Links */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Privacidad</a>
          <a href="/terms.html" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Términos</a>
        </div>

      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
