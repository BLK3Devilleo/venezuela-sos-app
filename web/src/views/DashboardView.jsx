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

      {/* Guía de Uso Formal/Cercana */}
      <div style={{
        marginBottom: '2rem',
        padding: '0.5rem 0'
      }}>
        <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.5rem' }}>
          ¿Cómo funciona filoSOS? 🇻🇪
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
          Aquí te explicamos de forma rápida cómo utilizar esta plataforma para apoyarnos mutuamente, porque juntos somos más fuertes:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {[
            { icon: '🗺️', title: 'Revisa el Mapa en Vivo', desc: 'Visualiza en tiempo real quién necesita ayuda en tu zona o dónde se han habilitado refugios y centros de acopio.' },
            { icon: '🆘', title: 'Reporta en la sección Buscar', desc: 'Si estás buscando a un familiar, amigo o incluso a tu mascota, publícalo aquí para que toda la red esté pendiente.' },
            { icon: '📦', title: 'Pide u Ofrece Apoyo (Servicios)', desc: 'Si tienes insumos médicos, alimentos, o si por el contrario necesitas asistencia, repórtalo en la sección de Servicios. Échanos una mano si está a tu alcance.' },
            { icon: '💬', title: 'Conéctate en los Chats', desc: 'Ingresa a las salas temáticas para coordinar acciones directas con la comunidad en tiempo real, sin intermediarios.' }
          ].map((item, i) => (
            <div key={i} style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '1rem',
              padding: '1rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                fontSize: '1.5rem',
                backgroundColor: 'var(--bg-surface-soft)',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
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
          Creado con ❤️ para coordinar ayuda comunitaria. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
