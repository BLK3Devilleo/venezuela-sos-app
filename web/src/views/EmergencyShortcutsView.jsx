import React, { useState } from 'react';
import { Phone, Search, ArrowLeft, Heart, ShieldAlert, LifeBuoy, AlertTriangle } from 'lucide-react';

const EMERGENCY_DATA = [
  {
    category: "🏥 Hospitales y Clínicas en Caracas",
    icon: "⚕️",
    color: "#ef4444",
    items: [
      { name: "Hospital Andrés Herrera Vegas (El Algodonal)", phone: "(0212) 472.31.38" },
      { name: "Hospital Centro Médico IVSS (Caricuao)", phone: "(0212) 432.55.11" },
      { name: "Hospital Clínico Universitario (Chaguaramos)", phone: "(0212) 606.71.11" },
      { name: "Hospital de Clínicas Caracas (San Bernardino)", phone: "(0212) 508.61.11" },
      { name: "Hospital de Niños J.M. de Los Ríos (San Bernardino)", phone: "(0212) 574.35.11" },
      { name: "Hospital Dr. Domingo Luciani (El Llanito)", phone: "(0212) 257.87.12" },
      { name: "Hospital El Algodonal (Antímano)", phone: "(0212) 472.54.10" },
      { name: "Hospital El Manicomio", phone: "(0212) 860.13.13" },
      { name: "Hospital José Gregorio Hernández (Los Magallanes)", phone: "(0212) 870.78.97" },
      { name: "Hospital Miguel Pérez Carreño (Bella Vista)", phone: "(0212) 472.84.72" },
      { name: "Hospital Militar (San Martín)", phone: "(0212) 406.12.41" },
      { name: "Hospital Periférico de Catia (Catia)", phone: "(0212) 870.27.71" },
      { name: "Hospital Periférico de Coche (Coche)", phone: "(0212) 681.11.33" },
      { name: "Policlínica David Lobo (Santa Rosalía)", phone: "(0212) 541.54.65" },
      { name: "Policlínica La Arboleda (San Bernardino)", phone: "(0212) 550.18.11" },
      { name: "Policlínica Las Mercedes (Las Mercedes)", phone: "(0212) 993.23.23" },
      { name: "Policlínica Santiago de León (Sabana Grande)", phone: "(0212) 762.90.25" },
      { name: "Centro Clínico / Anexo Clínica Razetti (La Candelaria)", phone: "(0212) 597.02.48" },
      { name: "Centro Médico de Caracas (San Bernardino)", phone: "(0212) 555.91.11" },
      { name: "Clínica La Floresta (Los Palos Grandes)", phone: "(0212) 285.60.58" },
      { name: "Clínica Leopoldo Aguerrevere (Prados del Este)", phone: "(0212) 907.08.11" },
      { name: "Clínica Rescarven (Santa Cecilia)", phone: "(0212) 239.56.86" }
    ]
  },
  {
    category: "🚨 Números de Emergencia Principales",
    icon: "🆘",
    color: "#dc2626",
    items: [
      { name: "Desde un fijo Cantv", phone: "171" },
      { name: "Desde Movilnet", phone: "*1" },
      { name: "Desde Digitel", phone: "112" },
      { name: "Desde Movistar", phone: "911" }
    ]
  },
  {
    category: "🚑 Ambulancias",
    icon: "🚒",
    color: "#f59e0b",
    items: [
      { name: "Aeroambulancias 1", phone: "(0212) 993.25.41" },
      { name: "Aeroambulancias 2", phone: "(0212) 992.89.80" },
      { name: "Aeroambulancias 3", phone: "(0212) 992.89.90" },
      { name: "Aeroambulancias 4", phone: "(0212) 991.79.40" },
      { name: "Rescarven 1", phone: "(0212) 993.69.11" },
      { name: "Rescarven 2", phone: "(0212) 993.69.91" },
      { name: "Rescarven 3", phone: "(0212) 993.13.10" },
      { name: "Rescarven 4", phone: "(0212) 993.33.67" },
      { name: "Servicio de Ambulancia Metropolitano 1", phone: "(0212) 545.45.45" },
      { name: "Servicio de Ambulancia Metropolitano 2", phone: "(0212) 545.46.55" },
      { name: "Servicio de Ambulancia Metropolitano 3", phone: "(0212) 577.92.09" }
    ]
  },
  {
    category: "🔥 Bomberos",
    icon: "👨‍🚒",
    color: "#ea580c",
    items: [
      { name: "Bomberos Antímano", phone: "(0212) 472.20.54" },
      { name: "Bomberos Catia la Mar", phone: "(0212) 351.99.66" },
      { name: "Bomberos Chacao", phone: "(0212) 265.32.61" },
      { name: "Bomberos del Este (Cafetal) 1", phone: "(0212) 987.43.34" },
      { name: "Bomberos del Este (Cafetal) 2", phone: "(0212) 985.50.60" },
      { name: "Bomberos Sucre", phone: "(0212) 985.36.40" },
      { name: "Bomberos El Cafetal", phone: "(0212) 985.36.40" },
      { name: "Bomberos El Cafetal 2", phone: "(0212) 985.29.77" },
      { name: "Bomberos El Paraíso", phone: "(0212) 481.09.61" },
      { name: "Bomberos El Valle 1", phone: "(0212) 672.01.75" },
      { name: "Bomberos El Valle 2", phone: "(0212) 672.06.36" },
      { name: "Bomberos La Guaira 1", phone: "(0212) 332.76.20" },
      { name: "Bomberos La Guaira 2", phone: "(0212) 331.04.45" },
      { name: "Bomberos La Trinidad", phone: "(0212) 943.43.61" },
      { name: "Bomberos La Urbina", phone: "(0212) 241.66.41" },
      { name: "Bomberos Metropolitanos", phone: "(0212) 545.45.45" },
      { name: "Bomberos Miranda", phone: "(0212) 235.69.67" },
      { name: "Bomberos Plaza Venezuela 1", phone: "(0212) 793.00.39" },
      { name: "Bomberos Plaza Venezuela 2", phone: "(0212) 793.64.57" },
      { name: "Bomberos San Bernardino", phone: "(0212) 577.92.09" }
    ]
  },
  {
    category: "✊ Héroes Civiles de Apoyo",
    icon: "🤝",
    color: "#2563eb",
    items: [
      { name: "Cuerpo de Emergencias Rescate y Transmisiones", phone: "(0212) 545.47.47" },
      { name: "Defensa Civil Alcaldía Mayor 1", phone: "(0212) 662.67.59" },
      { name: "Defensa Civil Alcaldía Mayor 2", phone: "(0212) 662.32.05" },
      { name: "Bomberos Metropolitanos", phone: "(0212) 545.45.45" }
    ]
  },
  {
    category: "🧗 Grupos de Rescate y Socorro",
    icon: "🧗",
    color: "#0d9488",
    items: [
      { name: "Cuerpo de Emergencias Rescate y Transmisiones", phone: "(0212) 545.47.47" },
      { name: "Grupo de Rescate Caracas (El Ávila) 1", phone: "(0212) 615.63.86" },
      { name: "Grupo de Rescate Caracas (El Ávila) 2", phone: "(0212) 415.46.61" },
      { name: "Grupo de Rescate Venezuela", phone: "(0212) 977.47.10" },
      { name: "Organización de Rescate Humboldt 1", phone: "(0212) 234.22.34" },
      { name: "Organización de Rescate Humboldt (Celular)", phone: "0414.926.21.39" },
      { name: "Organización de Rescate Humboldt (Actualizado)", phone: "0414.305.68.68" },
      { name: "Socorristas Cruz Roja", phone: "(0212) 571.47.13" },
      { name: "Inspectoría Nacional de Tránsito (I.N.T.)", phone: "167" },
      { name: "VIVEX (Vigilancia Vías Expresas) 1", phone: "(0212) 471.60.01" },
      { name: "VIVEX (Vigilancia Vías Expresas) 2", phone: "(0212) 471.14.81" },
      { name: "Atención de Emergencias Min. Transporte Terrestre", phone: "(0212) 537.26.77" }
    ]
  }
];

export default function EmergencyShortcutsView({ setView }) {
  const [search, setSearch] = useState('');

  const filteredData = EMERGENCY_DATA.map(cat => {
    const items = cat.items.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase()) || 
      item.phone.includes(search)
    );
    return { ...cat, items };
  }).filter(cat => cat.items.length > 0);

  return (
    <div className="fade-in" style={{ paddingBottom: '3rem', paddingTop: '0.5rem' }}>
      <button
        onClick={() => setView('dashboard')}
        style={{
          background: 'none', border: 'none', color: 'var(--primary)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem',
          fontSize: '0.85rem', fontWeight: '700', marginBottom: '1.25rem', padding: 0
        }}
      >
        <ArrowLeft size={16} /> Volver al Inicio
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '12px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <ShieldAlert size={22} />
        </div>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.65rem', fontWeight: '800' }}>Directorio de Emergencias</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Caracas (Actualizados) · Presiona cualquier número para llamar</p>
        </div>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(245,158,11,0.12) 100%)',
        border: '1px solid rgba(239,68,68,0.25)',
        borderRadius: '1rem',
        padding: '1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        fontSize: '0.825rem',
        color: '#fca5a5',
        lineHeight: '1.5'
      }}>
        <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#f87171' }} />
        <div>
          <strong>🔗 Compartan:</strong> Mantén esta lista guardada fuera de línea para casos de cortes de energía o comunicaciones limitadas. Toda la información ha sido recopilada con fines de auxilio comunitario.
        </div>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="input-field"
          type="text"
          placeholder="Buscar clínica, hospital, bomberos, rescatistas..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: '2.25rem' }}
        />
      </div>

      {filteredData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No se encontraron contactos que coincidan con la búsqueda.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredData.map((cat, idx) => (
            <div key={idx}>
              <h3 className="font-display" style={{
                fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem',
                color: cat.color, borderBottom: `1.5px solid var(--border)`, paddingBottom: '0.4rem', marginBottom: '0.75rem'
              }}>
                <span>{cat.icon}</span> {cat.category}
              </h3>

              <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {cat.items.map((item, i) => (
                  <a
                    key={i}
                    href={`tel:${item.phone.replace(/[^0-9]/g, '')}`}
                    className="card btn-profile-badge"
                    style={{
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textDecoration: 'none',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      transition: 'transform 0.15s',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', paddingRight: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>{item.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Presiona para marcar</span>
                    </div>
                    <div style={{
                      backgroundColor: `${cat.color}15`,
                      color: cat.color,
                      padding: '0.4rem 0.75rem',
                      borderRadius: '2rem',
                      fontSize: '0.8rem',
                      fontWeight: '800',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Phone size={12} /> {item.phone}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
