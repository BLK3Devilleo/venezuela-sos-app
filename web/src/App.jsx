import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import LoginView from './views/LoginView';
import SplashScreen from './components/SplashScreen';
import Logo from './components/Logo';
import DashboardView from './views/DashboardView';
import MapView from './views/MapView';
import ResourcesView from './views/ResourcesView';
import DirectoryView from './views/DirectoryView';
import MissingPersonsView from './views/MissingPersonsView';
import MissingPetsView from './views/MissingPetsView';
import ChatRoomsView from './views/ChatRoomsView';
import MarketplaceView from './views/MarketplaceView';
import ProfileView from './views/ProfileView';
import LegalView from './views/LegalView';
import AdminPanelView from './views/AdminPanelView';
import CookieBanner from './components/CookieBanner';
import EmergencyShortcutsView from './views/EmergencyShortcutsView';
import { Home, Map, Users, Activity, HelpCircle, LogOut, Heart, ShoppingBag, User, MessageSquare, ShieldAlert, Sun, Moon } from 'lucide-react';

const TAB_ITEMS = [
  { id: 'dashboard', label: 'Inicio', icon: Home },
  { id: 'map', label: 'Mapa', icon: Map },
  { id: 'missing_persons', label: 'Personas', icon: Users },
  { id: 'chat_rooms', label: 'Chats', icon: MessageSquare },
  { id: 'services', label: 'Servicios', icon: Activity },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [view, setView] = useState('dashboard');
  const [showSplash, setShowSplash] = useState(true);
  const [viewUserId, setViewUserId] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [showGuestAuthModal, setShowGuestAuthModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [theme, setTheme] = useState(() => localStorage.getItem('filoSOS_theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('filoSOS_theme', nextTheme);
  };

  useEffect(() => {
    window.history.pushState({ path: view }, '');

    const handlePopState = () => {
      if (view !== 'dashboard') {
        setView('dashboard');
        window.history.pushState({ path: 'dashboard' }, '');
      } else {
        if (window.lastBackPress && Date.now() - window.lastBackPress < 2000) {
          window.close();
        } else {
          window.lastBackPress = Date.now();
          showToast("Presiona atrás de nuevo para salir de la app", "info");
          window.history.pushState({ path: 'dashboard' }, '');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [view]);

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => prev.message === message ? { ...prev, show: false } : prev);
    }, 4500);
  };

  useEffect(() => {
    window.showToast = showToast;
    window.alert = (msg) => {
      if (typeof msg !== 'string') msg = String(msg);
      const isError = /error|falla|inválido|no tienes|permiso|requerido|obligatorio|vacío/i.test(msg);
      showToast(msg, isError ? 'error' : 'success');
    };
  }, []);

  useEffect(() => {
    const savedZoom = localStorage.getItem('filoSOS_fontZoom');
    if (savedZoom) {
      document.documentElement.style.fontSize = savedZoom;
    }

    // Configuración para Capacitor (Deep Linking OAuth)
    const initCapacitorAuth = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
          const { App: CapApp } = await import('@capacitor/app');
          const { Browser } = await import('@capacitor/browser');
          
          CapApp.addListener('appUrlOpen', (event) => {
            // Si la URL contiene el token, es el callback de login
            if (event.url.includes('#access_token') || event.url.includes('?code=')) {
              Browser.close(); // Cerramos la pestaña de Chrome
              // Reemplazamos la URL del webview para que Supabase la procese
              // Solo agarramos la parte después del dominio (ej. /#access_token=...)
              const urlObj = new URL(event.url);
              window.location.replace(urlObj.pathname + urlObj.search + urlObj.hash);
            }
          });
        }
      } catch (e) {
        console.warn('Capacitor no detectado o error al cargar:', e);
      }
    };
    initCapacitorAuth();
  }, []);

  useEffect(() => {
    // Limpiar el hash de redirección de OAuth para evitar que se comparta el access_token o cause error 400
    if (window.location.hash && (window.location.hash.includes('access_token=') || window.location.hash.includes('refresh_token='))) {
      window.history.replaceState(null, null, window.location.pathname + window.location.search);
    }

    // 1. Obtener la sesión inicial de Supabase Auth
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession) {
        checkUserProfile(initialSession.user);
      } else {
        setLoadingProfile(false);
      }
    });

    // 2. Escuchar cambios en la sesión de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      if (currentSession) {
        checkUserProfile(currentSession.user);
      } else {
        setUser(null);
        setNeedsOnboarding(false);
        setLoadingProfile(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserProfile = async (authUser) => {
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const isOwner = authUser.email === 'devimeo@gmail.com';

      if (error || !data) {
        // Usuario logueado en Google, pero no registrado en la BD de perfiles
        setUser({ id: authUser.id, nombre: authUser.user_metadata?.full_name || '', rol: isOwner ? 'admin' : 'afectado' });
        setNeedsOnboarding(true);
      } else {
        let finalProfile = data;
        if (isOwner && data.rol !== 'admin') {
          const { data: updated } = await supabase
            .from('usuarios')
            .update({ rol: 'admin' })
            .eq('id', authUser.id)
            .select();
          if (updated && updated.length > 0) {
            finalProfile = updated[0];
          }
        }
        setUser(finalProfile);
        setNeedsOnboarding(false);
      }
    } catch (err) {
      console.error('Error al verificar perfil en Supabase:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleConsentChange = (consent) => {
    if (consent.analytics) {
      injectTrackingScripts();
    }
  };

  const injectTrackingScripts = () => {
    // Inject Microsoft Clarity
    if (!window.clarityLoaded) {
      const clarityScript = document.createElement('script');
      clarityScript.type = 'text/javascript';
      clarityScript.innerHTML = `
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "xcs11wj1kv");
      `;
      document.head.appendChild(clarityScript);
      window.clarityLoaded = true;
    }

    // Inject Google Analytics
    if (!window.gaLoaded) {
      const gaScript1 = document.createElement('script');
      gaScript1.async = true;
      gaScript1.src = 'https://www.googletagmanager.com/gtag/js?id=G-8DW9DFCTX6';
      document.head.appendChild(gaScript1);

      const gaScript2 = document.createElement('script');
      gaScript2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-8DW9DFCTX6');
      `;
      document.head.appendChild(gaScript2);
      window.gaLoaded = true;
    }
  };

  const handleLogin = (loggedUser) => {
    setUser(loggedUser);
    setIsGuest(false);
    setNeedsOnboarding(false);
    setView('dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('sos_user');
    setUser(null);
    setSession(null);
    setIsGuest(false);
    setNeedsOnboarding(false);
    setView('dashboard');
  };

  const handleRequireLogin = () => {
    setShowGuestAuthModal(true);
  };

  const renderView = () => {
    switch (view) {
      case 'login': return (
        <LoginView 
          onLogin={handleLogin} 
          needsOnboarding={false} 
          authUserId={null}
          authUserName={null}
          onBack={() => setView('dashboard')}
        />
      );
      case 'dashboard': return <DashboardView user={user} setView={setView} onRequireLogin={handleRequireLogin} />;
      case 'map': return <MapView user={user} onRequireLogin={handleRequireLogin} />;
      case 'directory': return (
        <DirectoryView 
          user={user} 
          onViewProfile={(id) => {
            setViewUserId(id);
            setView('profile');
          }} 
          onRequireLogin={handleRequireLogin}
        />
      );
      case 'missing_persons': return <MissingPersonsView user={user} onRequireLogin={handleRequireLogin} />;
      case 'missing_pets': return <MissingPetsView user={user} onRequireLogin={handleRequireLogin} />;
      case 'services': return (
        <DirectoryView 
          user={user} 
          onViewProfile={(id) => {
            setViewUserId(id);
            setView('profile');
          }} 
          onRequireLogin={handleRequireLogin}
        />
      );
      case 'chat_rooms': return (
        <ChatRoomsView 
          user={user} 
          onViewProfile={(id) => {
            setViewUserId(id);
            setView('profile');
          }} 
          onRequireLogin={handleRequireLogin}
        />
      );
      case 'marketplace': return <MarketplaceView user={user} onRequireLogin={handleRequireLogin} />;
      case 'profile': return (
        <ProfileView 
          user={user} 
          onUserUpdate={(updatedUser) => {
            setUser(updatedUser);
            localStorage.setItem('sos_user', JSON.stringify(updatedUser));
          }}
          viewUserId={viewUserId} 
          setView={setView} 
        />
      );
      case 'admin_panel': return <AdminPanelView user={user} />;
      case 'legal': return <LegalView setView={setView} />;
      case 'emergency_shortcuts': return <EmergencyShortcutsView setView={setView} />;
      default: return <DashboardView user={user} setView={setView} onRequireLogin={handleRequireLogin} />;
    }
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loadingProfile) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#060d1a',
        color: '#fff',
        fontFamily: 'sans-serif'
      }}>
        <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>Verificando sesión...</p>
      </div>
    );
  }

  if ((!user && !isGuest) || (user && needsOnboarding)) {
    return (
      <LoginView 
        onLogin={handleLogin} 
        onEnterAsGuest={() => {
          setIsGuest(true);
          setView('dashboard');
        }}
        needsOnboarding={needsOnboarding} 
        authUserId={user?.id}
        authUserName={user?.nombre}
      />
    );
  }

  const isMapView = view === 'map';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-primary)',
      paddingBottom: '72px' // espacio para el tab bar
    }}>

      {/* Header mínimo */}
      <header className="glass" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid var(--border)',
        paddingTop: 'env(safe-area-inset-top, 24px)', // Fix for edge-to-edge status bar
        minHeight: 'calc(56px + env(safe-area-inset-top, 24px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'env(safe-area-inset-top, 24px) 1.25rem 0 1.25rem'
      }}>
        {/* Tricolor strip */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(to right, var(--ve-red) 33.3%, var(--ve-yellow) 33.3% 66.6%, var(--ve-blue) 66.6%)'
        }} />

        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          onClick={() => setView('dashboard')}
        >
          <Logo size={26} style={{ display: 'flex', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1' }}>
            <span className="font-display" style={{ fontWeight: '800', fontSize: '1.15rem' }}>
              Venezuela<span className="text-gradient">SOS</span>
            </span>
            <span style={{ fontSize: '0.55rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.12em', marginTop: '1px' }}>
              BY FILO
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Day/Night Mode toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
            style={{
              background: 'var(--bg-surface-soft)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              padding: '0.4rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-secondary)'
            }}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          {user ? (
            <>
              {/* Clickable Profile Badge */}
              <div 
                onClick={() => {
                  setViewUserId(null);
                  setView('profile');
                }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-surface-soft)',
                  padding: '0.25rem 0.65rem 0.25rem 0.35rem',
                  borderRadius: '2rem',
                  border: '1px solid var(--border)',
                  transition: 'all 0.2s',
                  userSelect: 'none'
                }}
                className="btn-profile-badge"
              >
                {user.foto_perfil ? (
                  <img src={user.foto_perfil} alt={user.nombre} style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={12} style={{ color: 'var(--primary)' }} />
                  </div>
                )}
                <span style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--text-primary)', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.nombre.split(' ')[0]}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="Cerrar Sesión"
                style={{
                  background: 'var(--bg-surface-soft)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  padding: '0.4rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--text-secondary)'
                }}
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setView('login');
              }}
              style={{
                background: 'var(--primary)',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.4rem 0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: '700',
                transition: 'all 0.2s'
              }}
            >
              <User size={14} /> Iniciar Sesión
            </button>
          )}
        </div>
      </header>

      {/* Contenido principal */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: isMapView ? '0' : '1rem',
        overflow: 'auto',
        position: 'relative'
      }}>
        {renderView()}
      </main>

      {/* Bottom Tab Bar */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '72px',
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'stretch',
        zIndex: 200,
        backdropFilter: 'blur(16px)',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }} className="hide-scrollbar">
        {[
          { id: 'dashboard', label: 'Inicio', icon: Home },
          { id: 'map', label: 'Mapa', icon: Map },
          { id: 'missing_persons', label: 'Personas', icon: Users },
          { id: 'missing_pets', label: 'Mascotas', icon: Heart },
          { id: 'chat_rooms', label: 'Chats', icon: MessageSquare },
          { id: 'services', label: 'Servicios', icon: Activity },
          { id: 'marketplace', label: 'Mercado', icon: ShoppingBag },
          ...(user && user.rol === 'admin' ? [{ id: 'admin_panel', label: 'Admin', icon: ShieldAlert }] : [])
        ].map(({ id, label, icon: Icon }) => {
          const isActive = view === id;
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              style={{
                flex: 1,
                flexShrink: 0,
                minWidth: '68px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                transition: 'all 0.15s ease',
                position: 'relative',
                padding: '0.5rem 0'
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '20%',
                  right: '20%',
                  height: '2px',
                  backgroundColor: 'var(--primary)',
                  borderRadius: '0 0 2px 2px'
                }} />
              )}
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.75} />
              <span style={{
                fontSize: '0.65rem',
                fontWeight: isActive ? '700' : '500',
                letterSpacing: '0.01em'
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Modal de Requisito de Login para Invitados */}
      {showGuestAuthModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(6, 13, 26, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '1.5rem',
            padding: '2rem 1.5rem',
            maxWidth: '360px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              fontSize: '2.5rem',
              marginBottom: '1rem'
            }}>
              🤝
            </div>
            
            <h3 className="font-display" style={{
              fontSize: '1.35rem',
              fontWeight: '800',
              color: '#fff',
              marginBottom: '0.75rem'
            }}>
              ¿Quieres aportar?
            </h3>
            
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              lineHeight: '1.5',
              marginBottom: '1.75rem'
            }}>
              Para una mejor gestión de los datos te pediremos que crees una cuenta y te sumes a esta gran comunidad.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setShowGuestAuthModal(false);
                  setIsGuest(false);
                  setUser(null);
                  setView('login');
                }}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  borderRadius: '0.75rem',
                  fontWeight: '700',
                  fontSize: '0.95rem'
                }}
              >
                Crear Cuenta / Iniciar Sesión
              </button>
              
              <button
                onClick={() => setShowGuestAuthModal(false)}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '0.75rem',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                Seguir explorando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: toast.type === 'error' ? '#dc2626' :
                           toast.type === 'success' ? '#10b981' :
                           toast.type === 'warning' ? '#ea580c' : '#0d9488',
          color: '#ffffff',
          padding: '0.85rem 1.5rem',
          borderRadius: '1rem',
          zIndex: 10000,
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: '700',
          fontSize: '0.85rem',
          maxWidth: '90%',
          width: 'max-content',
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {toast.type === 'error' && '🚨'}
          {toast.type === 'success' && '✅'}
          {toast.type === 'warning' && '⚠️'}
          {toast.type === 'info' && '💡'}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Cookie Banner */}
      <CookieBanner onConsentChange={handleConsentChange} />
    </div>
  );
}
