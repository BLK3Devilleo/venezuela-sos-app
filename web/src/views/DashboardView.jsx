import React, { useState } from 'react';
import { 
  Users, Heart, Map, ArrowRight, ShieldAlert, BookOpen, ChevronDown, ChevronUp,
  Home, PawPrint, ShoppingBag, MessageSquare, Hospital, PhoneCall, HelpCircle, Building2
} from 'lucide-react';

export default function DashboardView({ setView }) {
  const [expandedGuide, setExpandedGuide] = useState(null);

  const survivalGuides = [
    {
      id: 'first_aid',
      title: '🩹 Primeros Auxilios Básicos (Heridas y Fracturas)',
      description: 'Protocolos de acción inmediata para contener hemorragias y estabilizar fracturas:',
      steps: [
        'Hemorragias: Aplica presión directa sobre la herida con un paño limpio o gasa. Mantén presionado hasta que pare. Eleva la extremidad afectada.',
        'Fracturas: No intentes alinear el hueso. Inmoviliza la extremidad con una tablilla o cartón rígido amarrado suavemente por encima y debajo de la articulación.',
        'Quemaduras: Enfría con agua corriente limpia durante 10-15 minutos. No apliques hielo, cremas ni rompas las ampollas.'
      ]
    },
    {
      id: 'water_purification',
      title: '💧 Potabilización de Agua en Crisis',
      description: 'Asegura agua segura para tu familia mediante estos métodos rápidos:',
      steps: [
        'Ebullición: Hierve el agua vigorosamente durante al menos 5 minutos seguidos. Déjala enfriar y consérvala en un envase tapado.',
        'Cloración casera: Si no puedes hervir, agrega 2 gotas de cloro comercial sin fragancia (concentración al 5-6%) por cada litro de agua limpia. Mezcla bien y deja reposar 30 minutos antes de consumir.',
        'Filtración: Si el agua está turbia, fíltrala usando un paño limpio, filtro de café o arena/carbón antes de hervirla o clorarla.'
      ]
    },
    {
      id: 'emergency_bag',
      title: '🎒 Bolso de Emergencia de 72 Horas',
      description: 'Artículos esenciales que debes tener preparados en una mochila de fácil acceso:',
      steps: [
        'Documentos importantes: Cédulas, actas, títulos médicos y propiedad guardados dentro de bolsas herméticas de plástico (o fotos en pendrive/móvil).',
        'Suministros vitales: Linterna a dinamo o pilas, radio portátil FM/AM, cargador portátil (powerbank) con cables correspondientes.',
        'Salud e higiene: Botiquín básico de primeros auxilios, medicamentos personales recetados para mínimo 7 días, y agua embotellada (mínimo 2 litros por persona al día).'
      ]
    }
  ];

  const quickAccessFunctions = [
    { id: 'family_reunification', label: 'Protección de Menores', desc: 'Búsqueda de niños perdidos', icon: Heart, color: '#fb7185' },
    { id: 'infrastructure_checklist', label: 'Checklist de Vivienda', desc: 'Seguridad post-terremoto', icon: ShieldAlert, color: '#fcd34d' },
    { id: 'structural_damage_reports', label: 'Daños Estructurales', desc: 'Evalúa e inspecciona edificios', icon: Building2, color: '#3b82f6' },
    { id: 'resources', label: 'Suministros y Refugio', desc: 'Alimentos y alojamiento', icon: Home, color: '#0d9488' },
    { id: 'missing_pets', label: 'Mascotas Perdidas', desc: 'Muro de animales extraviados', icon: PawPrint, color: '#fb923c' },
    { id: 'marketplace', label: 'Mercado Solidario', desc: 'Donaciones e intercambio', icon: ShoppingBag, color: '#a855f7' },
    { id: 'chat_rooms', label: 'Salas de Chat', desc: 'Logística grupal por zonas', icon: MessageSquare, color: '#3b82f6' },
    { id: 'hospitalized_persons', label: 'Hospitalizados', desc: 'Centralizador de clínicas', icon: Hospital, color: '#f43f5e' },
    { id: 'emergency_shortcuts', label: 'Líneas de Apoyo', desc: 'Teléfonos a un solo toque', icon: PhoneCall, color: '#10b981' },
    { id: 'international_shelters', label: 'Puntos de Acogida', desc: 'Refugios internacionales', icon: HelpCircle, color: '#6366f1' }
  ];

  return (
    <div style={{ 
      paddingTop: '1rem', 
      paddingBottom: '3.5rem', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '1.75rem',
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

      {/* ── SECCIÓN DE GUÍAS DE SUPERVIVENCIA (Offline) ── */}
      <div style={{ 
        backgroundColor: 'var(--bg-surface)', 
        border: '1px solid var(--border)', 
        borderRadius: '1.5rem', 
        padding: '1.25rem 1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <BookOpen size={20} style={{ color: 'var(--primary)' }} />
          <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', margin: 0 }}>
            📖 Guías de Supervivencia y Emergencia
          </h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 1rem 0', lineHeight: '1.4' }}>
          Instrucciones críticas disponibles sin conexión en cualquier momento.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {survivalGuides.map(guide => {
            const isExpanded = expandedGuide === guide.id;
            return (
              <div 
                key={guide.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '1rem',
                  overflow: 'hidden',
                  backgroundColor: isExpanded ? 'var(--bg-surface-soft)' : 'transparent',
                  transition: 'all 0.25s ease'
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedGuide(isExpanded ? null : guide.id)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '0.85rem'
                  }}
                >
                  <span>{guide.title}</span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                
                {isExpanded && (
                  <div style={{ 
                    padding: '0 1rem 1rem 1rem', 
                    fontSize: '0.8rem', 
                    color: 'var(--text-secondary)', 
                    lineHeight: '1.5',
                    animation: 'sos-fade-in 0.2s ease'
                  }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>{guide.description}</p>
                    <ol style={{ margin: 0, paddingLeft: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {guide.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SECCIÓN MÁS ACCIONES / MÁS FUNCIONES (Bottom of home) ── */}
      <div>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', margin: 0 }}>
            ⚡ Más Funciones de Apoyo
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>
            Accede a las herramientas de logística secundaria y apoyo directo.
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '0.75rem' 
        }}>
          {quickAccessFunctions.map(item => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1.5px solid var(--border)',
                  borderRadius: '1.25rem',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = item.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 4px 12px ${item.color}22`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  padding: '0.6rem',
                  borderRadius: '0.75rem',
                  backgroundColor: `${item.color}15`,
                  color: item.color,
                  display: 'flex'
                }}>
                  <IconComponent size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#fff', display: 'block' }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px', lineHeight: '1.2' }}>
                    {item.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer minimalista */}
      <footer style={{
        marginTop: '0.5rem',
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
