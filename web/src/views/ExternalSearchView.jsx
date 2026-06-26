import React, { useState } from 'react';
import { Search, Globe, ExternalLink, ShieldAlert, ArrowLeft, Building2 } from 'lucide-react';

const EXTERNAL_SOURCES = [
  { id: 'cruz_roja', name: 'Cruz Roja Venezolana', logo: '🏥', desc: 'Base de datos oficial de restablecimiento de contactos familiares (RCF).' },
  { id: 'google_finder', name: 'Google Person Finder (Mock API)', logo: '🔍', desc: 'Registro internacional de Google activado durante catástrofes.' },
  { id: 'ong_local', name: 'Alianza Ciudadana ONGs', logo: '🤝', desc: 'Consolidado de reportes de organizaciones voluntarias locales de rescate.' },
  { id: 'oficial_gov', name: 'Registro Público Nacional', logo: '🇻🇪', desc: 'Consolidado de listados provistos por cuerpos oficiales de seguridad.' }
];

const MOCK_EXTERNAL_RESULTS = [
  { id: 'ext1', nombre: 'Alejandro Rafael Mendoza', edad: 42, estado: 'localizado', fuente: 'cruz_roja', ubicacion: 'Refugio Polideportivo Caraballeda', fecha: 'Hace 2 horas', url: 'https://cruzroja.org.ve/rcf/search?id=10294' },
  { id: 'ext2', nombre: 'Carla Sofía Rodríguez Rivas', edad: 19, estado: 'buscando', fuente: 'google_finder', ubicacion: 'Sector Macuto, La Guaira', fecha: 'Hace 6 horas', url: 'https://personfinder.google.com/person/carla-rivas-sos' },
  { id: 'ext3', nombre: 'Manuel Antonio Medina Rivas', edad: 65, estado: 'buscando', fuente: 'ong_local', ubicacion: 'El Limón, Maracay', fecha: 'Ayer', url: 'https://redongvenezuela.org/desaparecidos/manuel-medina' },
  { id: 'ext4', nombre: 'Yusmila Josefina Oviedo', edad: 38, estado: 'localizado', fuente: 'oficial_gov', ubicacion: 'Centro de Diagnóstico Integral Catia', fecha: 'Hace 30 minutos', url: 'http://ministerio.gob.ve/emergencia-sismo/c90210' },
  { id: 'ext5', nombre: 'José Raquel Medina', edad: 47, estado: 'buscando', fuente: 'cruz_roja', ubicacion: 'Sector Punta de Piedra, Macuto', fecha: 'Hace 4 horas', url: 'https://cruzroja.org.ve/rcf/search?id=10298' }
];

export default function ExternalSearchView({ onBack }) {
  const [query, setQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setSearched(true);

    // Simular consulta a API externa federada
    setTimeout(() => {
      const q = query.toLowerCase();
      const filtered = MOCK_EXTERNAL_RESULTS.filter(item => {
        const matchesQuery = item.nombre.toLowerCase().includes(q) || item.ubicacion.toLowerCase().includes(q);
        const matchesSource = selectedSource === 'all' || item.fuente === selectedSource;
        return matchesQuery && matchesSource;
      });
      setResults(filtered);
      setSearching(false);
    }, 800);
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '2.5rem', paddingTop: '0.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button 
          onClick={onBack} 
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.65rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🌐 Buscador Externo Federado
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
            Consulta bases de datos de la Cruz Roja, Google Finder y registros públicos en un solo lugar.
          </p>
        </div>
      </div>

      {/* Warning banner */}
      <div style={{
        background: 'rgba(13, 148, 136, 0.08)',
        border: '1px solid rgba(13, 148, 136, 0.2)',
        borderRadius: '0.75rem',
        padding: '0.75rem 1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
        fontSize: '0.8rem',
        color: 'var(--text-secondary)',
        lineHeight: '1.4'
      }}>
        <ShieldAlert size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
        <span>
          <strong>Centralización de Datos:</strong> Esta herramienta indexa y refleja reportes de portales externos autorizados de ayuda comunitaria. Para editar o dar de baja un registro externo, por favor dirígete al enlace del proveedor correspondiente.
        </span>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Introduce nombre, apellido o ubicación (Ej. Medina, Macuto)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.5rem', height: '48px', fontSize: '0.95rem' }}
          />
        </div>

        {/* Source filter tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }} className="hide-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedSource('all')}
            style={{
              padding: '0.4rem 0.8rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer',
              whiteSpace: 'nowrap', border: '1px solid',
              backgroundColor: selectedSource === 'all' ? 'var(--primary)' : 'var(--bg-surface-soft)',
              borderColor: selectedSource === 'all' ? 'var(--primary)' : 'var(--border)',
              color: selectedSource === 'all' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            🌎 Todas las Fuentes
          </button>
          {EXTERNAL_SOURCES.map(src => (
            <button
              key={src.id}
              type="button"
              onClick={() => setSelectedSource(src.id)}
              style={{
                padding: '0.4rem 0.8rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer',
                whiteSpace: 'nowrap', border: '1px solid',
                backgroundColor: selectedSource === src.id ? 'var(--primary)' : 'var(--bg-surface-soft)',
                borderColor: selectedSource === src.id ? 'var(--primary)' : 'var(--border)',
                color: selectedSource === src.id ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              {src.logo} {src.name}
            </button>
          ))}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.85rem', fontWeight: 'bold', fontSize: '0.95rem' }}
          disabled={searching}
        >
          {searching ? 'Buscando en APIs...' : 'Realizar Búsqueda Cruzada'}
        </button>
      </form>

      {/* Sources Grid overview when not searched */}
      {!searched && (
        <div>
          <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Fuentes Conectadas en Tiempo Real
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
            {EXTERNAL_SOURCES.map(src => (
              <div key={src.id} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontSize: '1.75rem', backgroundColor: 'var(--bg-surface-soft)', padding: '0.4rem', borderRadius: '0.75rem', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {src.logo}
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '800', color: 'var(--text-primary)' }}>{src.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{src.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search results */}
      {searched && (
        <div>
          <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Resultados Cruzados ({results.length})
          </h3>

          {searching ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Consultando servidores remotos...</div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', borderRadius: '1rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <Building2 size={36} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <p style={{ fontWeight: '600', color: 'var(--text-primary)' }}>No se encontraron coincidencias en las fuentes seleccionadas.</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Prueba con otros términos de búsqueda.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {results.map(res => {
                const srcInfo = EXTERNAL_SOURCES.find(s => s.id === res.fuente);
                return (
                  <div 
                    key={res.id} 
                    className="card" 
                    style={{ 
                      padding: '1rem', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '0.5rem',
                      borderLeft: `4px solid ${res.estado === 'localizado' ? '#10b981' : '#f59e0b'}` 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.6rem',
                        fontWeight: '800',
                        backgroundColor: res.estado === 'localizado' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                        color: res.estado === 'localizado' ? '#10b981' : '#f59e0b',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {res.estado === 'localizado' ? '🟢 Localizado Externo' : '🔍 Buscando Externo'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{res.fecha}</span>
                    </div>

                    <h4 className="font-display" style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                      {res.nombre} ({res.edad} años)
                    </h4>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      📍 Último registro: <strong>{res.ubicacion}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span>{srcInfo?.logo} Reflejado de:</span> 
                        <strong style={{ color: 'var(--text-secondary)' }}>{srcInfo?.name}</strong>
                      </span>
                      
                      <a 
                        href={res.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary)',
                          textDecoration: 'none'
                        }}
                      >
                        Ver Ficha <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
