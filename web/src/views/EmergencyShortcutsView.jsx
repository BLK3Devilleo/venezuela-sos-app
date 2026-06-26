import React, { useState } from 'react';
import { Search, Phone, ShieldAlert, ArrowLeft, MapPin } from 'lucide-react';

const EMERGENCY_CONTACTS = [
  // National
  { region: 'Nacional', name: 'VEN 911 (Emergencias)', number: '911', category: 'Emergencia General', desc: 'Atención médica, policial y de bomberos unificada a nivel nacional.' },
  { region: 'Nacional', name: 'Cruz Roja Venezolana', number: '02127810620', category: 'Asistencia Médica', desc: 'Soporte humanitario y ambulancias de emergencia.' },
  { region: 'Nacional', name: 'Protección Civil Nacional', number: '08007248454', category: 'Rescate', desc: 'Atención ante desastres naturales y sismos.' },
  
  // Caracas / Dto Capital
  { region: 'Caracas / Distrito Capital', name: 'Bomberos de Caracas', number: '02125422222', category: 'Bomberos', desc: 'Estación Central de Bomberos Metropolitanos.' },
  { region: 'Caracas / Distrito Capital', name: 'Protección Civil Dto Capital', number: '02125751823', category: 'Rescate', desc: 'Operaciones de salvamento y emergencias locales.' },
  { region: 'Caracas / Distrito Capital', name: 'Salud Chacao (Ambulancias)', number: '02128991900', category: 'Asistencia Médica', desc: 'Servicio municipal de emergencias Chacao.' },
  { region: 'Caracas / Distrito Capital', name: 'PoliChacao Emergencias', number: '02129059711', category: 'Seguridad', desc: 'Seguridad y patrullaje en el municipio Chacao.' },

  // Miranda
  { region: 'Miranda', name: 'Bomberos del Estado Miranda', number: '02123224444', category: 'Bomberos', desc: 'Comando principal de bomberos del estado Miranda.' },
  { region: 'Miranda', name: 'Protección Civil Miranda', number: '02123229288', category: 'Rescate', desc: 'Monitoreo de sismos y rescate en el estado.' },

  // Zulia
  { region: 'Zulia', name: 'Bomberos de Maracaibo', number: '02617225152', category: 'Bomberos', desc: 'Cuerpo de bomberos principal del municipio Maracaibo.' },
  { region: 'Zulia', name: 'Protección Civil Zulia', number: '02617557342', category: 'Rescate', desc: 'Atención de emergencias y desastres en la región zuliana.' },

  // Carabobo
  { region: 'Carabobo', name: 'Bomberos de Valencia', number: '02418316222', category: 'Bomberos', desc: 'Cuerpo de bomberos en Valencia, Carabobo.' },
  { region: 'Carabobo', name: 'Protección Civil Carabobo', number: '02418586411', category: 'Rescate', desc: 'Rescate urbano e incendios.' },

  // Aragua
  { region: 'Aragua', name: 'Bomberos de Aragua', number: '02432422222', category: 'Bomberos', desc: 'Comando Central de Bomberos en Maracay.' },
  { region: 'Aragua', name: 'Protección Civil Aragua', number: '02432424097', category: 'Rescate', desc: 'Gestión de riesgos en el estado Aragua.' },

  // Lara
  { region: 'Lara', name: 'Bomberos de Barquisimeto', number: '02512313333', category: 'Bomberos', desc: 'Cuerpo de bomberos de Barquisimeto, Lara.' },
  { region: 'Lara', name: 'Protección Civil Lara', number: '02512543977', category: 'Rescate', desc: 'Operativos de búsqueda y salvamento.' },

  // Tachira
  { region: 'Táchira', name: 'Bomberos de San Cristóbal', number: '02763477777', category: 'Bomberos', desc: 'Cuerpo de bomberos principal en San Cristóbal.' },
  { region: 'Táchira', name: 'Protección Civil Táchira', number: '02763475111', category: 'Rescate', desc: 'Atención y rescate en zonas montañosas e infraestructuras.' }
];

export default function EmergencyShortcutsView({ setView }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = EMERGENCY_CONTACTS.filter(contact => {
    const matchStr = `${contact.region} ${contact.name} ${contact.category} ${contact.number}`.toLowerCase();
    return matchStr.includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '2.5rem', width: '100%', animation: 'fadeIn 0.3s ease' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setView('dashboard')}
          style={{
            background: 'var(--bg-surface-soft)',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            width: '36px', height: '36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-secondary)'
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
          Atajos de Emergencia
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Search Banner */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={22} style={{ color: 'var(--primary)' }} />
            <h2 className="font-display" style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0 }}>Atajos y Números de Emergencia</h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Llama al instante a los cuerpos de rescate o bomberos de tu región. Los botones de llamada nativa están diseñados para abrir el marcador del teléfono automáticamente.
          </p>

          <div style={{ position: 'relative', width: '100%' }}>
            <Search 
              size={18} 
              style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
            />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Buscar por estado o institución (ej. Caracas, Zulia, Bomberos)..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>
        </div>

        {/* Directory List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredContacts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No se encontraron contactos para "{searchTerm}". Intenta con otro término de búsqueda.
            </div>
          ) : (
            filteredContacts.map((contact, idx) => (
              <div 
                key={idx} 
                className="card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.75rem', 
                  backgroundColor: 'var(--bg-surface-soft)',
                  border: '1px solid var(--border)' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', padding: '0.1rem 0.5rem', backgroundColor: 'rgba(13,148,136,0.1)', borderRadius: '4px' }}>
                        {contact.category}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <MapPin size={10} /> {contact.region}
                      </span>
                    </div>
                    <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                      {contact.name}
                    </span>
                  </div>

                  <a 
                    href={`tel:${contact.number}`}
                    className="btn btn-primary"
                    style={{ 
                      padding: '0.5rem 0.875rem', 
                      fontSize: '0.8rem', 
                      borderRadius: '2rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}
                  >
                    <Phone size={12} />
                    <span>Llamar</span>
                  </a>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {contact.desc}
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Número directo:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{contact.number}</strong>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
