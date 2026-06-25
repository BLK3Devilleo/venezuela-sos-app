import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Map, Package, Activity, Users, Heart, ShieldAlert, Plus, AlertTriangle } from 'lucide-react';

const QUICK_ACTIONS = [
  { emoji: '🆘', label: 'Persona', sublabel: 'Desaparecida', view: 'missing_persons', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
  { emoji: '🐾', label: 'Mascota', sublabel: 'Perdida', view: 'missing_pets', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  { emoji: '🍲', label: 'Recurso', sublabel: 'Suministros', view: 'resources', color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
  { emoji: '⚕️', label: 'Servicio', sublabel: 'Médico/Apoyo', view: 'services', color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
  { emoji: '🗺️', label: 'Ver', sublabel: 'en el Mapa', view: 'map', color: '#0d9488', bg: 'rgba(13,148,136,0.1)' },
];

export default function DashboardView({ user, setView }) {
  const [stats, setStats] = useState({ desaparecidos: '—', mascotas: '—', recursos: '—', servicios: '—' });

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
    <div style={{ paddingTop: '0.5rem', paddingBottom: '2rem' }}>

      {/* Saludo Cálido */}
      <div style={{
        marginBottom: '1.5rem',
        padding: '0.5rem 0'
      }}>
        <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.25rem' }}>
          Hola, {user?.nombre || 'Amigo'} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          ¿Cómo podemos ayudarte hoy? Juntos somos más fuertes.
        </p>
      </div>

      {/* Alerta de emergencia (Más suave) */}
      <div style={{
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        border: '1px solid rgba(234, 179, 8, 0.2)',
        borderRadius: '1.25rem',
        padding: '1rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.875rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          backgroundColor: 'rgba(234, 179, 8, 0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <Heart size={20} style={{ color: '#eab308' }} />
        </div>
        <div>
          <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#facc15', marginBottom: '0.25rem' }}>
            Red de Apoyo Activa
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            Tu comunidad está conectada. Usa el mapa para encontrar ayuda cerca de ti o publica si necesitas asistencia.
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {[
          { num: stats.desaparecidos, label: 'Desaparecidos', icon: '🆘', bg: 'linear-gradient(135deg, rgba(220,38,38,0.15), rgba(220,38,38,0.05))', borderColor: 'rgba(220,38,38,0.3)', color: '#f87171' },
          { num: stats.mascotas, label: 'Mascotas', icon: '🐾', bg: 'linear-gradient(135deg, rgba(217,119,6,0.15), rgba(217,119,6,0.05))', borderColor: 'rgba(217,119,6,0.3)', color: '#fbbf24' },
          { num: stats.recursos, label: 'Recursos', icon: '🍲', bg: 'linear-gradient(135deg, rgba(22,163,74,0.15), rgba(22,163,74,0.05))', borderColor: 'rgba(22,163,74,0.3)', color: '#4ade80' },
          { num: stats.servicios, label: 'Servicios', icon: '⚕️', bg: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(37,99,235,0.05))', borderColor: 'rgba(37,99,235,0.3)', color: '#60a5fa' },
        ].map((s, i) => (
          <div key={i} style={{
            background: s.bg,
            border: `1px solid ${s.borderColor}`,
            borderRadius: '1.25rem',
            padding: '1.25rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{s.icon}</div>
            <div className="font-display" style={{ fontSize: '2rem', fontWeight: '800', color: s.color, lineHeight: '1' }}>
              {s.num}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '0.25rem' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tips de emergencia */}
      <div style={{
        background: 'var(--bg-surface-soft)',
        borderRadius: '1.25rem',
        padding: '1.25rem',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <AlertTriangle size={18} className="text-primary" />
          <span className="font-display" style={{ fontWeight: '700', fontSize: '1rem' }}>Contactos de Emergencia</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
          {[
            { label: 'Emergencias Nacionales', num: '171', desc: 'Atención inmediata' },
            { label: 'Bomberos / Rescate', num: '911', desc: 'Rescate y emergencias médicas' },
            { label: 'Cruz Roja Venezolana', num: '0212-781', desc: 'Asistencia humanitaria' },
          ].map((e, i) => (
            <a key={i} href={`tel:${e.num}`} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.875rem 1rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '0.875rem',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.05)',
              transition: 'background 0.2s ease'
            }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.125rem' }}>{e.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.desc}</div>
              </div>
              <div style={{ 
                backgroundColor: 'rgba(13, 148, 136, 0.1)', 
                color: 'var(--primary)', 
                padding: '0.375rem 0.75rem', 
                borderRadius: '2rem', 
                fontWeight: '700', 
                fontSize: '0.875rem' 
              }}>
                {e.num}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Footer / Credits */}
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
          <span>VenezuelaSOS</span>
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
          Creado con ❤️ para coordinar ayuda comunitaria. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
