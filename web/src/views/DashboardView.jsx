import React from 'react';
import { Users, Heart, Map, ArrowRight } from 'lucide-react';

export default function DashboardView({ setView }) {
  return (
    <div style={{ 
      paddingTop: '1rem', 
      paddingBottom: '2.5rem', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '1.5rem',
      animation: 'sos-fade-in 0.3s ease'
    }}>
      
      {/* Cabecera minimalista de emergencia */}
      <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: '900', color: '#fff', margin: '0 0 0.5rem 0' }}>
          filoSOS
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '340px', margin: '0 auto', lineHeight: '1.4' }}>
          Canal de coordinación táctica y de respuesta rápida ante situaciones de emergencia.
        </p>
      </div>

      {/* 3 Botones Gigantes de Acción Táctica */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* 1. PERSONAS */}
        <button
          onClick={() => setView('missing_persons')}
          style={{
            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(234, 88, 12, 0.08) 100%)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '1.5rem',
            padding: '1.75rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'transform 0.2s, border-color 0.2s',
            boxShadow: '0 4px 20px rgba(220, 38, 38, 0.05)'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.3)'; }}
        >
          <div style={{ 
            background: '#dc2626', 
            borderRadius: '1rem', 
            padding: '0.9rem', 
            color: '#fff', 
            display: 'flex',
            boxShadow: '0 8px 16px rgba(220, 38, 38, 0.3)'
          }}>
            <Users size={32} strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 0.25rem 0', color: '#fff', fontSize: '1.3rem', fontWeight: '900' }}>
              👤 Personas
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.3' }}>
              Buscar personas desaparecidas o reportar a un familiar no localizado de inmediato.
            </p>
          </div>
          <ArrowRight size={20} style={{ color: 'rgba(220, 38, 38, 0.6)' }} />
        </button>

        {/* 2. AYUDAR AHORA */}
        <button
          onClick={() => setView('services')}
          style={{
            background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.15) 0%, rgba(13, 148, 136, 0.08) 100%)',
            border: '1px solid rgba(22, 163, 74, 0.3)',
            borderRadius: '1.5rem',
            padding: '1.75rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'transform 0.2s, border-color 0.2s',
            boxShadow: '0 4px 20px rgba(22, 163, 74, 0.05)'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(22, 163, 74, 0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(22, 163, 74, 0.3)'; }}
        >
          <div style={{ 
            background: '#16a34a', 
            borderRadius: '1rem', 
            padding: '0.9rem', 
            color: '#fff', 
            display: 'flex',
            boxShadow: '0 8px 16px rgba(22, 163, 74, 0.3)'
          }}>
            <Heart size={32} strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 0.25rem 0', color: '#fff', fontSize: '1.3rem', fontWeight: '900' }}>
              🤝 Ayudar Ahora
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.3' }}>
              Ver necesidades médicas, centros de acopio urgentes y asistencia requerida.
            </p>
          </div>
          <ArrowRight size={20} style={{ color: 'rgba(22, 163, 74, 0.6)' }} />
        </button>

        {/* 3. ZONAS AFECTADAS */}
        <button
          onClick={() => setView('map')}
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(79, 70, 229, 0.08) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '1.5rem',
            padding: '1.75rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'transform 0.2s, border-color 0.2s',
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.05)'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'; }}
        >
          <div style={{ 
            background: '#3b82f6', 
            borderRadius: '1rem', 
            padding: '0.9rem', 
            color: '#fff', 
            display: 'flex',
            boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)'
          }}>
            <Map size={32} strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 0.25rem 0', color: '#fff', fontSize: '1.3rem', fontWeight: '900' }}>
              🗺️ Zonas Afectadas
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.3' }}>
              Consultar el mapa en tiempo real de centros abastecidos y solicitudes de apoyo.
            </p>
          </div>
          <ArrowRight size={20} style={{ color: 'rgba(59, 130, 246, 0.6)' }} />
        </button>

      </div>

      {/* Footer minimalista */}
      <footer style={{
        marginTop: '1.5rem',
        textAlign: 'center',
        padding: '1rem 0 0.5rem 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.4rem'
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span>filoSOS</span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span style={{ color: 'var(--primary)' }}>APOYO DE EMERGENCIA</span>
        </div>
      </footer>
    </div>
  );
}
