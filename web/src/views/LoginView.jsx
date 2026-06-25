import React, { useState } from 'react';
import { supabase } from '../supabase';
import { ShieldAlert, Phone, User, ArrowRight } from 'lucide-react';
import { z } from 'zod';
import Logo from '../components/Logo';

const phoneRegex = /^(0414|0424|0412|0416|0426|0212)\d{7}$/;
const loginSchema = z.object({
  nombre: z.string().min(3, "Ingresa tu nombre completo (mínimo 3 letras)").max(60, "Nombre demasiado largo"),
  telefono: z.string().regex(phoneRegex, "Teléfono inválido. Ej: 04141234567")
});

export default function LoginView({ onLogin, needsOnboarding = false, authUserId = null, authUserName = '' }) {
  const [step, setStep] = useState(needsOnboarding ? 3 : 1);
  const [nombre, setNombre] = useState(authUserName || '');
  const [telefono, setTelefono] = useState('');
  const [rol, setRol] = useState('afectado');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (needsOnboarding) {
      setStep(3);
      if (authUserName) {
        setNombre(authUserName);
      }
      const savedRol = localStorage.getItem('onboarding_rol');
      if (savedRol) {
        setRol(savedRol);
      }
    } else {
      setStep(1);
    }
  }, [needsOnboarding, authUserName]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // Guardar el rol temporalmente para recuperarlo tras el redirect
      localStorage.setItem('onboarding_rol', rol);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Error al iniciar Google Auth:', err);
      setError('No se pudo conectar con Google. Inténtalo de nuevo.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = loginSchema.safeParse({ nombre, telefono });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    setError('');
    
    // Si estamos en onboarding, usamos el ID de autenticación de Google de Supabase
    const targetUserId = authUserId || `google_sim_${Date.now()}`;
    try {
      const { data, error: dbError } = await supabase
        .from('usuarios')
        .insert({ id: targetUserId, nombre: nombre.trim(), contacto: telefono.trim(), rol })
        .select();
      if (dbError) throw dbError;
      
      localStorage.setItem('sos_user', JSON.stringify(data[0]));
      onLogin(data[0]);
    } catch (err) {
      console.error('Error al registrar perfil:', err);
      setError('Error al registrar tu perfil. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #060d1a 0%, #0b1c2e 50%, #091520 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.25rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative glow blobs */}
      <div style={{
        position: 'absolute', top: '-100px', right: '-100px',
        width: '400px', height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-80px', left: '-80px',
        width: '350px', height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Tricolor top strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
        background: 'linear-gradient(to right, #dc2626 33.3%, #eab308 33.3% 66.6%, #1d4ed8 66.6%)'
      }} />

      {step === 1 ? (
        /* --- LANDING --- */
        <div style={{ textAlign: 'center', maxWidth: '380px', width: '100%', animation: 'fadeIn 0.4s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <Logo size={110} animated={true} />
          </div>
          <h1 className="font-display" style={{
            fontSize: 'clamp(2.5rem, 8vw, 3.5rem)',
            fontWeight: '900',
            lineHeight: '1.05',
            marginBottom: '0.4rem',
            color: '#fff'
          }}>
            Venezuela<span style={{
              background: 'linear-gradient(135deg, #0d9488, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>SOS</span>
          </h1>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: '800',
            color: '#0d9488',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '1.75rem',
            opacity: 0.8
          }}>
            BY: FILO
          </div>
          <p style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '1rem',
            lineHeight: '1.6',
            marginBottom: '2.5rem'
          }}>
            Red de apoyo comunitaria para coordinar ayuda humanitaria tras el sismo en Venezuela.
          </p>

          {/* Alert badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'rgba(220,38,38,0.15)',
            border: '1px solid rgba(220,38,38,0.3)',
            borderRadius: '2rem',
            padding: '0.5rem 1rem',
            marginBottom: '2.5rem',
            fontSize: '0.8125rem',
            color: '#f87171',
            fontWeight: '600'
          }}>
            <ShieldAlert size={14} />
            Sismo M7.5 · Estado de Emergencia Nacional
          </div>

          {/* Selector de rol como cards grandes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
            {[
              { id: 'afectado', emoji: '🆘', label: 'Necesito\nAyuda' },
              { id: 'voluntario', emoji: '🤝', label: 'Quiero\nAyudar' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setRol(r.id)}
                style={{
                  padding: '1.25rem 1rem',
                  borderRadius: '1rem',
                  border: `2px solid ${rol === r.id ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                  background: rol === r.id ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>{r.emoji}</div>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  color: rol === r.id ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
                  whiteSpace: 'pre-line',
                  lineHeight: '1.3'
                }}>{r.label}</div>
              </button>
            ))}
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '0.875rem',
              background: loading ? 'rgba(13,148,136,0.4)' : 'linear-gradient(135deg, #0d9488, #0891b2)',
              border: 'none',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 8px 32px rgba(13,148,136,0.35)'
            }}
          >
            <span>{loading ? 'Redirigiendo...' : 'Ingresar con Google'}</span>
            <ArrowRight size={18} />
          </button>
          <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
            Gratuito · Sin fines comerciales · Código abierto
          </p>
        </div>
      ) : (
        /* --- FORMULARIO & ONBOARDING --- */
        <div style={{
          width: '100%', maxWidth: '380px',
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '1.25rem',
          padding: '2rem 1.5rem',
          animation: 'slideUp 0.3s ease'
        }}>
          {needsOnboarding ? (
            <button
              onClick={() => supabase.auth.signOut()}
              style={{
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                fontSize: '0.875rem', marginBottom: '1.25rem',
                display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0
              }}
            >
              ← Cancelar y salir
            </button>
          ) : (
            <button
              onClick={() => setStep(1)}
              style={{
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                fontSize: '0.875rem', marginBottom: '1.25rem',
                display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0
              }}
            >
              ← Volver
            </button>
          )}

          <h2 className="font-display" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', marginBottom: '0.25rem' }}>
            {needsOnboarding ? 'Completa tu perfil' : 'Tus datos de contacto'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
            {needsOnboarding 
              ? 'Has ingresado con Google. Por favor completa tus datos para finalizar el registro.' 
              : 'Para que puedan contactarte en caso de que tengas información relevante.'}
          </p>

          {error && (
            <div style={{
              backgroundColor: 'rgba(220,38,38,0.15)',
              border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              color: '#f87171',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              <ShieldAlert size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>
                Nombre Completo
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input
                  type="text"
                  placeholder="Ej. María González"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  disabled={loading}
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 0.875rem 0.875rem 2.5rem',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>
                Tu Rol en la Plataforma
              </label>
              <select
                value={rol}
                onChange={e => setRol(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="afectado" style={{ backgroundColor: '#0b1c2e' }}>🆘 Necesito Ayuda / Afectado</option>
                <option value="voluntario" style={{ backgroundColor: '#0b1c2e' }}>🤝 Quiero Ayudar / Voluntario</option>
              </select>
            </div>

            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>
                WhatsApp / Teléfono
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input
                  type="tel"
                  placeholder="Ej. 04121234567"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  disabled={loading}
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 0.875rem 0.875rem 2.5rem',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                marginTop: '0.5rem',
                borderRadius: '0.875rem',
                background: loading ? 'rgba(13,148,136,0.4)' : 'linear-gradient(135deg, #0d9488, #0891b2)',
                border: 'none',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 32px rgba(13,148,136,0.3)'
              }}
            >
              {loading ? 'Guardando...' : 'Completar Registro'}
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder { color: rgba(255,255,255,0.25); }
        input:focus { border-color: rgba(13,148,136,0.5) !important; box-shadow: 0 0 0 3px rgba(13,148,136,0.15); }
      `}</style>
    </div>
  );
}
