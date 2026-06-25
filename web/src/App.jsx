import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import LoginView from './views/LoginView';
import SplashScreen from './components/SplashScreen';
import Logo from './components/Logo';
import DashboardView from './views/DashboardView';
import MapView from './views/MapView';
import ResourcesView from './views/ResourcesView';
import ServicesView from './views/ServicesView';
import MissingPersonsView from './views/MissingPersonsView';
import MissingPetsView from './views/MissingPetsView';
import ChatRoomsView from './views/ChatRoomsView';
import MarketplaceView from './views/MarketplaceView';
import ProfileView from './views/ProfileView';
import LegalView from './views/LegalView';
import CookieBanner from './components/CookieBanner';
import { Home, Map, Users, Activity, HelpCircle, LogOut, Heart, ShoppingBag, User, MessageSquare } from 'lucide-react';

const TAB_ITEMS = [
  { id: 'dashboard', label: 'Inicio', icon: Home },
  { id: 'map', label: 'Mapa', icon: Map },
  { id: 'missing_persons', label: 'Buscar', icon: Users },
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

  useEffect(() => {
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

      if (error || !data) {
        // Usuario logueado en Google, pero no registrado en la BD de perfiles
        setUser({ id: authUser.id, nombre: authUser.user_metadata?.full_name || '' });
        setNeedsOnboarding(true);
      } else {
        // El perfil existe, entra directo
        setUser(data);
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
    setNeedsOnboarding(false);
    setView('dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('sos_user');
    setUser(null);
    setSession(null);
    setNeedsOnboarding(false);
    setView('dashboard');
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <DashboardView user={user} setView={setView} />;
      case 'map': return <MapView user={user} />;
      case 'resources': return <ResourcesView user={user} />;
      case 'services': return (
        <ServicesView 
          user={user} 
          onViewProfile={(id) => {
            setViewUserId(id);
            setView('profile');
          }} 
        />
      );
      case 'missing_persons': return <MissingPersonsView user={user} />;
      case 'missing_pets': return <MissingPetsView user={user} />;
      case 'chat_rooms': return (
        <ChatRoomsView 
          user={user} 
          onViewProfile={(id) => {
            setViewUserId(id);
            setView('profile');
          }} 
        />
      );
      case 'marketplace': return <MarketplaceView user={user} />;
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
      case 'legal': return <LegalView setView={setView} />;
      default: return <DashboardView user={user} setView={setView} />;
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

  if (!user || needsOnboarding) {
    return (
      <LoginView 
        onLogin={handleLogin} 
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
        backdropFilter: 'blur(16px)'
      }}>
        {TAB_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = view === id;
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              style={{
                flex: 1,
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

      {/* Cookie Banner */}
      <CookieBanner onConsentChange={handleConsentChange} />
    </div>
  );
}
