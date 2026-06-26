import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Map, Package, Activity, Users, Heart, ShieldAlert, Plus, AlertTriangle, Phone } from 'lucide-react';

export default function DashboardView({ user, setView, onRequireLogin }) {
  const [stats, setStats] = useState({ desaparecidos: '—', mascotas: '—', recursos: '—', servicios: '—' });
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('filoSOS_fontZoom') || '16px';
    return parseInt(saved, 10) || 16;
  });

  const handleSliderChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    setFontSize(newSize);
    const sizeStr = `${newSize}px`;
    localStorage.setItem('filoSOS_fontZoom', sizeStr);
    document.documentElement.style.fontSize = sizeStr;
  };

  useEffect(() => {
    (async () => {
      try {
        const [
          { count: d }, { count: m }, { count: r }, { count: s }
        ] = await Promise.all([
          supabase.from('desaparecidos').select('*', { count: 'exact', head: true }),
          supabase.from('mascotas').select('*', { count: 'exact', head: true }),
          supabase.from('recursos').select('*', { count: 'exact', head: true }),
          supabase.from('servicios').select('*', { count: 'exact', head: true }),
        ]);
        setStats({ desaparecidos: d || 0, mascotas: m || 0, recursos: r || 0, servicios: s || 0 });
      } catch (e) { console.error(e); }
    })();
  }, []);

  return (
    <div style={{ paddingTop: '0.5rem', paddingBottom: '2.5rem' }}>

      {/* PRIORIDAD MÁXIMA: Atajos de Emergencia al TOP */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(220,38,38,0.12) 0%, rgba(234,88,12,0.06) 100%)',
        borderRadius: '1.25rem',
        padding: '1.25rem',
        border: '1px solid rgba(220,38,38,0.25)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        alignItems: 'center',
        textAlign: 'center',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={20} style={{ color: '#ef4444' }} />
          <h4 className="font-display" style={{ fontWeight: '800', fontSize: '1.05rem', margin: 0, color: '#fff' }}>
            ¿Necesitas ayuda inmediata?
          </h4>
        </div>
        <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          Accede al directorio telefónico de emergencias de Venezuela filtrado por tu estado.
        </p>
        <button 
          onClick={() => setView('emergency_shortcuts')}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '0.25rem', fontWeight: 'bold', background: '#dc2626', color: '#fff', border: 'none' }}
        >
          <Phone size={14} /> Atajos de emergencia por estado
        </button>
      </div>

      {/* ACCORDIONS (Trucos y Letras Más Grandes) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        
        {/* Truco App */}
        <details style={{
          background: 'var(--bg-surface-soft)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '0.75rem 1rem',
          cursor: 'pointer'
        }}>
          <summary style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', outline: 'none', userSelect: 'none' }}>
            <span>💡</span> Truco: Úsalo como aplicación nativa
          </summary>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4', margin: '0.5rem 0 0 0', cursor: 'default' }}>
            Instala **VenezuelaSOS** en tu pantalla de inicio (**Compartir ➔ Agregar a pantalla de inicio** en Safari/Chrome) para ejecutarla a pantalla completa, optimizar batería y cargar más rápido en emergencias.
          </p>
        </details>

        {/* Letras Más Grandes */}
        <details style={{
          background: 'var(--bg-surface-soft)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '0.75rem 1rem',
          cursor: 'pointer'
        }}>
          <summary style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', outline: 'none', userSelect: 'none' }}>
            <span>🔍</span> Letras más grandes (Accesibilidad)
          </summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem', cursor: 'default' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>A-</span>
              <input 
                type="range" 
                min="14" 
                max="26" 
                value={fontSize} 
                onChange={handleSliderChange}
                style={{
                  flex: 1,
                  height: '6px',
                  borderRadius: '3px',
                  background: 'var(--bg-surface-soft)',
                  outline: 'none',
                  cursor: 'pointer',
                  accentColor: 'var(--primary)'
                }}
              />
              <span style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>A+</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Letra actual: <strong style={{ color: 'var(--primary)' }}>{fontSize}px</strong> 
            </div>
          </div>
        </details>

      </div>

      {/* PANEL DE ACCIÓN DIRECTA: Botonera Grilla "¿Qué necesitas hacer?" */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem', color: '#fff' }}>
          ¿Qué necesitas hacer hoy?
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
          {[
            { label: 'Reportar Persona', desc: 'Desaparecidos', view: 'missing_persons', emoji: '🧍', color: '#dc2626' },
            { label: 'Reuniendo Familias', desc: 'Niños e Infancia', view: 'family_reunification', emoji: '❤️', color: '#fb7185' },
            { label: 'Pacientes Clínicas', desc: 'Hospitalizados', view: 'hospitalized_persons', emoji: '🏥', color: '#3b82f6' },
            { label: 'Reportar Mascota', desc: 'Perros, gatos...', view: 'missing_pets', emoji: '🐾', color: '#d97706' },
            { label: 'Agregar Refugio', desc: 'Acogidas y refugios', view: 'international_shelters', emoji: '🏠', color: '#0d9488' },
            { label: 'Donar Recursos', desc: 'Suministros y ropa', view: 'resources', emoji: '📦', color: '#16a34a' },
            { label: 'Comida Caliente', desc: 'Comedores y ollas', view: 'resources', emoji: '🍲', color: '#ea580c' },
            { label: 'Apoyo Médico', desc: 'Asistencia y salud', view: 'services', emoji: '⚕️', color: '#2563eb' },
            { label: 'Mercado Solidario', desc: 'Bienes gratis', view: 'marketplace', emoji: '🤝', color: '#a855f7' },
            { label: 'Salas de Chat', desc: 'Apoyo voluntario', view: 'chat_rooms', emoji: '💬', color: '#ec4899' },
            { label: 'Buscador Externo', desc: 'APIs Cruz Roja/Google', view: 'external_search', emoji: '🌐', color: '#6366f1' },
            { label: 'Mapa en Vivo', desc: 'Alertas y refugios', view: 'map', emoji: '🗺️', color: '#14b8a6' }
          ].map((act, i) => (
            <button
              key={i}
              onClick={() => setView(act.view)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '0.5rem',
                padding: '1rem',
                borderRadius: '1rem',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-surface)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = act.color;
                e.currentTarget.style.backgroundColor = `${act.color}08`;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{act.emoji}</span>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '800', color: 'var(--text-primary)' }}>{act.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{act.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SECCIÓN: ¿Cómo funciona filoSOS? */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem' }}>
          ¿Cómo funciona filoSOS? 🇻🇪
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Plataforma de comunicación de código libre para coordinar ayuda comunitaria sin intermediarios:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {[
            { icon: '🗺️', title: 'Revisa el Mapa en Vivo', desc: 'Visualiza en tiempo real alertas de rescate, centros de acopio y refugios cercanos.', view: 'map' },
            { icon: '🆘', title: 'Reporta Personas o Mascotas', desc: 'Ingresa los datos para que la red comunitaria ayude a rastrear y localizar a tus familiares o mascotas.', view: 'missing_persons' },
            { icon: '🤝', title: 'Mercado Solidario Gratuito', desc: 'Intercambia insumos y dona bienes a quienes más lo necesitan, sin dinero de por medio.', view: 'marketplace' },
            { icon: '💬', title: 'Salas de Chat Temáticas', desc: 'Comunícate en tiempo real con brigadas de rescate, médicos y voluntarios directamente.', view: 'chat_rooms' }
          ].map((item, i) => (
            <div key={i} 
              onClick={() => setView(item.view)}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '1rem',
                padding: '1rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{
                fontSize: '1.5rem',
                backgroundColor: 'var(--bg-surface-soft)',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tutoriales del Mercado y Chats */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.75rem', color: '#fff' }}>
          Guías de Ayuda y Tutoriales
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {[
            { emoji: '🤝', title: 'Mercado Solidario', desc: 'Fotografía claramente el artículo que quieres donar o que necesitas. Deja tu número de contacto visible. No se permiten trueques comerciales ni cobros.' },
            { emoji: '💬', title: 'Uso Seguro de Chats', desc: 'Las salas son públicas y de lectura para invitados. Para enviar mensajes debes identificarte con Google. Comparte solo datos de apoyo y ubicación verificada.' },
            { emoji: '🍲', title: 'Comedores Comunitarios', desc: 'Si cocinas u ofreces comida caliente, agrégala en Donaciones para que los damnificados de tu zona puedan acudir.' }
          ].map((tut, i) => (
            <div key={i} style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '1rem',
              padding: '1rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start'
            }}>
              <span style={{ fontSize: '1.5rem', backgroundColor: 'var(--bg-surface-soft)', width: '40px', height: '40px', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {tut.emoji}
              </span>
              <div>
                <h4 style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '0.9rem', margin: '0 0 0.25rem 0' }}>{tut.title}</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{tut.desc}</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Botón Ver Más Guías */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <button 
            onClick={() => setView('legal')} 
            className="btn btn-secondary" 
            style={{ fontSize: '0.8rem', padding: '0.5rem 1.25rem', borderRadius: '1.5rem' }}
          >
            Ver más guías y manuales
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        marginTop: '2.5rem',
        textAlign: 'center',
        padding: '1.25rem 0 0.5rem 0',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.4rem'
      }}>
        <div style={{
          fontSize: '0.8rem',
          fontWeight: '700',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <span>filoSOS</span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span style={{ color: 'var(--primary)' }}>BY FILO</span>
        </div>
        <p style={{
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          lineHeight: '1.4',
          maxWidth: '300px',
          margin: 0
        }}>
          Desarrollo solidario de código abierto.
        </p>
      </footer>
    </div>
  );
}
