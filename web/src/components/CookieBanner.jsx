import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, CheckCircle, Info } from 'lucide-react';

export default function CookieBanner({ onConsentChange }) {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('filosos_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    } else {
      // If already has consent, notify parent to load scripts if applicable
      const parsedConsent = JSON.parse(consent);
      if (onConsentChange) onConsentChange(parsedConsent);
    }
  }, [onConsentChange]);

  const handleAcceptAll = () => {
    const consent = { essential: true, analytics: true };
    localStorage.setItem('filosos_cookie_consent', JSON.stringify(consent));
    setIsVisible(false);
    if (onConsentChange) onConsentChange(consent);
  };

  const handleAcceptEssential = () => {
    const consent = { essential: true, analytics: false };
    localStorage.setItem('filosos_cookie_consent', JSON.stringify(consent));
    setIsVisible(false);
    if (onConsentChange) onConsentChange(consent);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'var(--bg-surface)',
      borderTop: '1px solid var(--border)',
      padding: '1.5rem',
      zIndex: 9999,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      backdropFilter: 'blur(10px)'
    }}>
      {!showPreferences ? (
        <>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ backgroundColor: 'var(--primary-glow)', padding: '0.5rem', borderRadius: '50%' }}>
              <ShieldAlert size={24} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '700' }}>Privacidad y Uso de Cookies</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Filo:SOS utiliza tecnologías de almacenamiento local para agilizar la carga en zonas de baja conectividad (Cookies Esenciales) y métricas anónimas para optimizar la red (Cookies de Optimización).
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              onClick={() => setShowPreferences(true)}
              style={{
                padding: '0.6rem 1rem',
                border: '1px solid var(--border)',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            >
              Configurar Preferencias
            </button>
            <button
              onClick={handleAcceptEssential}
              style={{
                padding: '0.6rem 1rem',
                border: 'none',
                backgroundColor: 'var(--bg-surface-soft)',
                color: 'var(--text-primary)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            >
              Solo Esenciales
            </button>
            <button
              onClick={handleAcceptAll}
              style={{
                padding: '0.6rem 1.25rem',
                border: 'none',
                backgroundColor: 'var(--primary)',
                color: '#fff',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '700'
              }}
            >
              Aceptar Todas
            </button>
          </div>
        </>
      ) : (
        <>
          <div>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '700' }}>Preferencias de Cookies</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>Cookies Estrictamente Necesarias</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Vitales para mantener la sesión y enviar reportes. No se pueden desactivar.</p>
                </div>
                <CheckCircle size={20} style={{ color: 'var(--success-color, #10b981)' }} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>Rendimiento y Optimización</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Métricas anónimas (Clarity y Analytics) para detectar fallos y optimizar la app.</p>
                </div>
                {/* Visual toggle for aesthetics, functionality handled by the buttons below */}
                <div style={{ width: '40px', height: '22px', borderRadius: '12px', backgroundColor: 'var(--primary)', position: 'relative' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '2px', right: '2px' }} />
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
             <button
              onClick={handleAcceptEssential}
              style={{
                padding: '0.6rem 1rem',
                border: '1px solid var(--border)',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            >
              Rechazar Optimización
            </button>
            <button
              onClick={handleAcceptAll}
              style={{
                padding: '0.6rem 1.25rem',
                border: 'none',
                backgroundColor: 'var(--primary)',
                color: '#fff',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '700'
              }}
            >
              Aceptar Todas
            </button>
          </div>
        </>
      )}
    </div>
  );
}
