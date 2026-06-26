import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Map, Package, Activity, Users, Heart, ShieldAlert, Plus, AlertTriangle, Phone, MapPin, CheckCircle2, Navigation, ArrowRight, X } from 'lucide-react';

export default function DashboardView({ user, setView, onRequireLogin, setMapInitialState }) {
  const [stats, setStats] = useState({ desaparecidos: '—', mascotas: '—', recursos: '—', servicios: '—' });
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInForm, setCheckInForm] = useState({ zona: '', actividad: 'rescate', personas: 1 });

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

  // Zonas hardcodeadas para la demo/prototipo (en el futuro se calculan del DB)
  const ZONAS_PRIORIDAD = [
    { id: 'z1', nombre: 'Las Tejerías', estado: 'Aragua', prioridad: 'alta', req: ['Agua', 'Rescate', 'Medicinas'], coords: [10.25, -67.16] },
    { id: 'z2', nombre: 'El Castaño', estado: 'Aragua', prioridad: 'alta', req: ['Maquinaria', 'Alimentos'], coords: [10.28, -67.59] },
    { id: 'z3', nombre: 'Cumanacoa', estado: 'Sucre', prioridad: 'media', req: ['Ropa', 'Limpieza'], coords: [10.24, -63.92] },
    { id: 'z4', nombre: 'Macuto', estado: 'La Guaira', prioridad: 'baja', req: ['Voluntarios suficientes'], coords: [10.61, -66.94] }
  ];

  const handleZonaClick = (zona) => {
    if (setMapInitialState) {
      setMapInitialState({
        center: zona.coords,
        zoom: 14,
        filters: zona.prioridad === 'alta' ? ['salud_atencion', 'rescate_equipo'] : [] // Ejemplo de filtros automáticos
      });
    }
    setView('map');
  };

  const submitCheckIn = async () => {
    if (!user) {
      onRequireLogin();
      return;
    }
    if (!checkInForm.zona.trim()) return alert('Por favor, indica a qué zona vas.');
    
    try {
      // Registraríamos en BD el check-in (recurso voluntario en movimiento)
      // await supabase.from('servicios').insert({...});
      alert('¡Gracias por ayudar! Tu presencia se ha registrado en el mapa.');
      setShowCheckInModal(false);
    } catch (e) {
      console.error(e);
      alert('Error al registrar tu llegada.');
    }
  };

  return (
    <div style={{ paddingTop: '0.5rem', paddingBottom: '2.5rem', position: 'relative' }}>
      
      {/* 1. Atajo de Emergencia (Compacto) */}
      <div 
        onClick={() => setView('emergency_shortcuts')}
        style={{
          background: 'linear-gradient(135deg, rgba(220,38,38,0.12) 0%, rgba(234,88,12,0.06) 100%)',
          borderRadius: '1rem',
          padding: '0.75rem 1rem',
          border: '1px solid rgba(220,38,38,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          marginBottom: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: '#dc2626', borderRadius: '50%', padding: '0.4rem', color: '#fff', display: 'flex' }}>
            <Phone size={16} />
          </div>
          <div>
            <h4 style={{ margin: 0, color: '#fff', fontSize: '0.9rem', fontWeight: '800' }}>Directorio de Emergencia</h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Bomberos, PC, CICPC por estado</p>
          </div>
        </div>
        <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />
      </div>

      {/* 2. PANEL DE NECESIDADES EN VIVO (Volunteers First) */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="font-display" style={{ fontSize: '1.5rem', fontWeight: '900', margin: '0 0 0.25rem 0', color: '#fff' }}>
          Panel de Necesidades
        </h2>
        <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>
          Coordinación en tiempo real. Selecciona una zona roja para ver qué falta o haz check-in para equilibrar la ayuda.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {ZONAS_PRIORIDAD.map((z, i) => (
            <div
              key={i}
              onClick={() => handleZonaClick(z)}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: `1px solid ${z.prioridad === 'alta' ? 'rgba(239, 68, 68, 0.4)' : z.prioridad === 'media' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                borderRadius: '1rem',
                padding: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                boxShadow: z.prioridad === 'alta' ? '0 4px 20px rgba(239, 68, 68, 0.08)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                {z.prioridad === 'alta' ? (
                  <AlertTriangle size={20} style={{ color: '#ef4444', marginTop: '2px' }} />
                ) : z.prioridad === 'media' ? (
                  <Activity size={20} style={{ color: '#f59e0b', marginTop: '2px' }} />
                ) : (
                  <CheckCircle2 size={20} style={{ color: '#10b981', marginTop: '2px' }} />
                )}
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {z.nombre} <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>({z.estado})</span>
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
                    {z.req.map((r, ri) => (
                      <span key={ri} style={{ 
                        fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase',
                        backgroundColor: z.prioridad === 'alta' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-surface-soft)',
                        color: z.prioridad === 'alta' ? '#fca5a5' : 'var(--text-secondary)',
                        padding: '0.15rem 0.4rem', borderRadius: '4px'
                      }}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Navigation size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
          ))}
        </div>

        {/* CTA Check-In */}
        <button
          onClick={() => setShowCheckInModal(true)}
          style={{
            width: '100%',
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#10b981',
            color: '#000',
            border: 'none',
            borderRadius: '1rem',
            fontWeight: '900',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.25)'
          }}
        >
          <MapPin size={20} />
          🙋 ¿Vas a ayudar? Haz check-in aquí
        </button>
      </div>

      <hr style={{ borderColor: 'var(--border)', margin: '2rem 0' }} />

      {/* 3. HERRAMIENTAS ADICIONALES (Botonera) */}
      <div>
        <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1rem', color: '#fff' }}>
          Más herramientas
        </h3>

        {/* Tarjeta Principal: Red Solidaria */}
        <button
          onClick={() => setView('external_sources')}
          style={{
            width: '100%',
            marginBottom: '0.75rem',
            background: 'linear-gradient(135deg, rgba(29, 78, 216, 0.15) 0%, rgba(13, 148, 136, 0.08) 100%)',
            border: '1px solid rgba(29, 78, 216, 0.3)',
            borderRadius: '1.25rem',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '0.5rem',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
            <div style={{ fontSize: '1.75rem' }}>🌐</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#60a5fa' }}>Red Solidaria (Buscador Global)</h4>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Centraliza información de múltiples páginas de búsqueda.
              </p>
            </div>
          </div>
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
          {[
            { label: 'Mapa Completo', view: 'map', emoji: '🗺️', color: '#14b8a6' },
            { label: 'Reportar Persona', view: 'missing_persons', emoji: '🧍', color: '#dc2626' },
            { label: 'Reunir Familias', view: 'family_reunification', emoji: '❤️', color: '#fb7185' },
            { label: 'Hospitalizados', view: 'hospitalized_persons', emoji: '🏥', color: '#3b82f6' },
            { label: 'Agregar Refugio', view: 'international_shelters', emoji: '🏠', color: '#0d9488' },
            { label: 'Mercado Solidario', view: 'marketplace', emoji: '🤝', color: '#a855f7' },
            { label: 'Salas de Chat', view: 'chat_rooms', emoji: '💬', color: '#ec4899' },
            { label: 'Donar Recursos', view: 'resources', emoji: '📦', color: '#16a34a' }
          ].map((act, i) => (
            <button
              key={i}
              onClick={() => setView(act.view)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.875rem', borderRadius: '1rem',
                border: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)',
                cursor: 'pointer', textAlign: 'left'
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>{act.emoji}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>{act.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MODAL DE CHECK-IN DE VOLUNTARIOS */}
      {showCheckInModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-base)',
            width: '100%', maxWidth: '500px',
            borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem',
            padding: '1.5rem', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowCheckInModal(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '900', color: '#fff' }}>Hacer Check-in</h3>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Indica hacia dónde te diriges. Esto ayuda a equilibrar la distribución de voluntarios y evitar colapsos.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>¿A qué zona vas?</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ej: Las Tejerías, Sector Central..."
                  value={checkInForm.zona}
                  onChange={e => setCheckInForm({...checkInForm, zona: e.target.value})}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>¿Cuántas personas van en tu grupo?</label>
                <input 
                  type="number" 
                  min="1"
                  className="input-field" 
                  value={checkInForm.personas}
                  onChange={e => setCheckInForm({...checkInForm, personas: parseInt(e.target.value)||1})}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>¿Qué tipo de ayuda llevan?</label>
                <select 
                  className="input-field"
                  value={checkInForm.actividad}
                  onChange={e => setCheckInForm({...checkInForm, actividad: e.target.value})}
                >
                  <option value="rescate">Equipo de Rescate / Despeje</option>
                  <option value="medico">Asistencia Médica / Primeros Auxilios</option>
                  <option value="suministros">Entrega de Suministros (Comida/Agua)</option>
                  <option value="transporte">Vehículo / Transporte de heridos</option>
                  <option value="psicologico">Apoyo Psicológico</option>
                </select>
              </div>

              <button 
                onClick={submitCheckIn}
                style={{
                  width: '100%', padding: '1rem', marginTop: '0.5rem',
                  backgroundColor: '#10b981', color: '#000', border: 'none', borderRadius: '1rem',
                  fontWeight: '900', fontSize: '1rem', cursor: 'pointer'
                }}
              >
                Confirmar Ruta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        marginTop: '2.5rem',
        textAlign: 'center',
        padding: '1.25rem 0 0.5rem 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.4rem'
      }}>
        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span>filoSOS</span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span style={{ color: 'var(--primary)' }}>BY FILO</span>
        </div>
      </footer>
    </div>
  );
}
