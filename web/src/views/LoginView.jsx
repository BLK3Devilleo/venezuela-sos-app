import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { ShieldAlert, Phone, User, ArrowRight, Lock, LogIn, UserPlus } from 'lucide-react';
import { z } from 'zod';
import Logo from '../components/Logo';

const phoneRegex = /^\d{7,15}$/;
const pinRegex = /^\d{4,6}$/;

const loginSchema = z.object({
  telefono: z.string().regex(phoneRegex, "Teléfono inválido. Solo números y máximo 15 dígitos."),
  pin: z.string().regex(pinRegex, "El PIN debe tener entre 4 y 6 números.")
});

const registerSchema = loginSchema.extend({
  nombre: z.string().min(3, "Ingresa tu nombre completo (mínimo 3 letras)").max(60, "Nombre demasiado largo"),
});

export default function LoginView({ onLogin, onEnterAsGuest = null, onBack = null, needsOnboarding = false, authUserId = null, authUserName = '' }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [nombre, setNombre] = useState(authUserName || '');
  const [telefono, setTelefono] = useState('');
  const [pin, setPin] = useState('');
  const [rol, setRol] = useState('afectado');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (needsOnboarding) {
      setIsRegistering(true);
      if (authUserName) setNombre(authUserName);
    }
  }, [needsOnboarding, authUserName]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validar según el modo
    const schema = isRegistering ? registerSchema : loginSchema;
    const result = schema.safeParse(isRegistering ? { telefono, pin, nombre } : { telefono, pin });
    
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    
    // Truco: Usamos el sistema de Email Auth nativo de Supabase sin costo de SMS
    const email = `${telefono.trim()}@filosos.local`;
    // Supabase requiere contraseñas de min 6 caracteres. Si el PIN tiene 4, agregamos '00' al final silenciosamente.
    const securePassword = pin.length < 6 ? pin.padEnd(6, '0') : pin;

    try {
      if (isRegistering) {
        // 1. Sign Up
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password: securePassword,
          options: { data: { full_name: nombre.trim() } }
        });

        if (authError) {
          if (authError.message.includes('already registered')) throw new Error('Este teléfono ya está registrado. Por favor, inicia sesión.');
          throw authError;
        }

        const userId = authData.user?.id || `sim_${Date.now()}`;

        // 2. Insertar en perfil
        const { data: dbData, error: dbError } = await supabase
          .from('usuarios')
          .insert({ id: userId, nombre: nombre.trim(), contacto: telefono.trim(), rol })
          .select();
          
        if (dbError) {
          // Fallback if RLS or something fails
          console.error("Error al crear perfil", dbError);
        }

        const profile = dbData?.[0] || { id: userId, nombre: nombre.trim(), contacto: telefono.trim(), rol };
        localStorage.setItem('sos_user', JSON.stringify(profile));
        if (onLogin) onLogin(profile);

      } else {
        // 1. Sign In
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password: securePassword
        });

        if (authError) throw new Error('Teléfono o PIN incorrectos.');

        // 2. Fetch perfil
        const { data: dbData } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (dbData) {
          localStorage.setItem('sos_user', JSON.stringify(dbData));
          if (onLogin) onLogin(dbData);
        } else {
          throw new Error('Perfil no encontrado.');
        }
      }
    } catch (err) {
      console.error('Error Auth:', err);
      setError(err.message || 'Ocurrió un error. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

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
      padding: '2rem 1.25rem', position: 'relative', overflow: 'hidden'
    }}>
      {/* Decorative */}
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(to right, #dc2626 33.3%, #eab308 33.3% 66.6%, #1d4ed8 66.6%)' }} />

      <div style={{ width: '100%', maxWidth: '380px', animation: 'fadeIn 0.4s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Logo size={80} animated={true} />
        </div>
        
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '1.25rem',
          padding: '2rem 1.5rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }}>
          
          {onBack && (
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}>
              ← Volver
            </button>
          )}

          <h2 className="font-display" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', marginBottom: '0.5rem', textAlign: 'center' }}>
            {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: '1.75rem', textAlign: 'center' }}>
            {isRegistering ? 'Ingresa tus datos para registrarte.' : 'Accede para gestionar tus reportes.'}
          </p>

          {error && (
            <div style={{ backgroundColor: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={16} flexShrink={0} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {isRegistering && (
              <div>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Nombre Completo</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                  <input type="text" placeholder="Ej. María González" value={nombre} onChange={e => setNombre(e.target.value)} disabled={loading} required style={{ width: '100%', padding: '0.875rem 0.875rem 0.875rem 2.5rem', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.75rem', color: '#fff', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}

            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Teléfono (Tu Usuario)</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input type="tel" placeholder="Ej. 04141234567" value={telefono} onChange={e => setTelefono(e.target.value)} disabled={loading} required style={{ width: '100%', padding: '0.875rem 0.875rem 0.875rem 2.5rem', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.75rem', color: '#fff', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>PIN Secreto (4 dígitos)</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input type="password" placeholder="****" maxLength="6" value={pin} onChange={e => setPin(e.target.value)} disabled={loading} required style={{ width: '100%', padding: '0.875rem 0.875rem 0.875rem 2.5rem', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.75rem', color: '#fff', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box', letterSpacing: '0.2em' }} />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '1rem', marginTop: '0.5rem', borderRadius: '0.875rem', background: loading ? 'rgba(13,148,136,0.4)' : 'linear-gradient(135deg, #0d9488, #0891b2)', border: 'none', color: '#fff', fontSize: '1rem', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 8px 32px rgba(13,148,136,0.3)' }}>
              {isRegistering ? <><UserPlus size={18}/> {loading ? 'Creando...' : 'Crear Cuenta'}</> : <><LogIn size={18}/> {loading ? 'Entrando...' : 'Ingresar'}</>}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }} 
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isRegistering ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>

          <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>o</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          </div>

          <button onClick={handleGoogleLogin} disabled={loading} style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.9rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            Continuar con Google
          </button>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="/privacy.html" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Privacidad</a>
            <a href="/terms.html" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Términos</a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder { color: rgba(255,255,255,0.25); letter-spacing: normal; }
        input:focus { border-color: rgba(13,148,136,0.5) !important; box-shadow: 0 0 0 3px rgba(13,148,136,0.15); }
      `}</style>
    </div>
  );
}
