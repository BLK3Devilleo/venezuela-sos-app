/**
 * ApiGlobalSearchView.jsx
 * 
 * Buscador Global Centralizado de APIs.
 * Permite buscar por Nombre, Cédula o Teléfono en todas las APIs conectadas.
 * No muestra feed inicial; es 100% on-demand.
 */

import React, { useState } from 'react';
import { useExternalSources, EXTERNAL_SOURCES } from '../utils/useExternalSources';
import { Search, Globe, User, Phone, Hash, AlertCircle, ExternalLink, MapPin } from 'lucide-react';

function PersonAvatar({ src, name, size = 64, status }) {
  const [failed, setFailed] = useState(false);
  const statusColor = { missing: '#dc2626', found: '#16a34a', deceased: '#6b7280', hospitalized: '#2563eb' }[status] || '#6b7280';

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        style={{
          width: size, height: size,
          borderRadius: '0.5rem',
          objectFit: 'cover',
          border: `2px solid ${statusColor}40`,
          backgroundColor: 'var(--bg-surface-soft)',
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '0.5rem',
      backgroundColor: `${statusColor}15`,
      border: `2px solid ${statusColor}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <User size={size * 0.45} style={{ color: statusColor, opacity: 0.6 }} />
    </div>
  );
}

export default function ApiGlobalSearchView() {
  const [queryName, setQueryName] = useState('');
  const [queryCedula, setQueryCedula] = useState('');
  const [queryPhone, setQueryPhone] = useState('');
  
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Usamos el hook para buscar. El texto principal va al search.
  // Cedula y telefono se filtran localmente ya que las APIs abiertas suelen no soportarlo.
  const { data, loading, refresh, allData, hasError } = useExternalSources({
    search: queryName || queryCedula || queryPhone, // Forzamos request si hay algo
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!queryName && !queryCedula && !queryPhone) return;
    
    setHasSearched(true);
    setIsSearching(true);
    
    await refresh(); // Fuerza a recargar con el useExternalSources
    setIsSearching(false);
  };

  // Filtrado estricto post-búsqueda
  const finalResults = allData.filter(item => {
    let match = true;
    const str = JSON.stringify(item.originalData || {}).toLowerCase();
    
    if (queryName) {
      match = match && item.name.toLowerCase().includes(queryName.toLowerCase());
    }
    if (queryCedula) {
      match = match && str.includes(queryCedula.toLowerCase());
    }
    if (queryPhone) {
      match = match && str.includes(queryPhone.toLowerCase());
    }
    return match;
  });

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: '2rem' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: 56, height: 56,
          borderRadius: '1.25rem',
          background: 'linear-gradient(135deg, #4f46e5, #0d9488)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem',
        }}>
          <Search size={28} style={{ color: '#fff' }} />
        </div>
        <h1 style={{ fontWeight: '900', fontSize: '1.5rem', margin: '0 0 0.5rem', fontFamily: 'var(--font-display)' }}>
          Buscador Global
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          Consulta simultánea en múltiples plataformas aliadas de búsqueda en Venezuela.
        </p>
      </div>

      {/* Caja de Búsqueda */}
      <form onSubmit={handleSearch} style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '1.25rem',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 8px 24px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Nombre y/o Apellido
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                value={queryName}
                onChange={e => setQueryName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)', backgroundColor: 'var(--bg-surface-soft)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Número de Cédula
            </label>
            <div style={{ position: 'relative' }}>
              <Hash size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                value={queryCedula}
                onChange={e => setQueryCedula(e.target.value)}
                placeholder="V-12345678"
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)', backgroundColor: 'var(--bg-surface-soft)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Teléfono
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                value={queryPhone}
                onChange={e => setQueryPhone(e.target.value)}
                placeholder="0414..."
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)', backgroundColor: 'var(--bg-surface-soft)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
          </div>
        </div>

        <button 
          type="submit"
          disabled={isSearching || (!queryName && !queryCedula && !queryPhone)}
          style={{
            width: '100%',
            padding: '0.875rem',
            borderRadius: '0.75rem',
            backgroundColor: 'var(--primary)',
            color: '#fff',
            border: 'none',
            fontWeight: '800',
            fontSize: '0.95rem',
            cursor: isSearching || (!queryName && !queryCedula && !queryPhone) ? 'not-allowed' : 'pointer',
            opacity: isSearching || (!queryName && !queryCedula && !queryPhone) ? 0.6 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
          }}
        >
          <Search size={18} />
          {isSearching ? 'Buscando en todas las fuentes...' : 'Buscar'}
        </button>
      </form>

      {/* Resultados */}
      {hasSearched && (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Resultados ({finalResults.length})
          </h3>

          {isSearching ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Globe size={32} style={{ animation: 'spin 2s linear infinite', margin: '0 auto 1rem', color: 'var(--primary)', opacity: 0.5 }} />
              <p>Consultando APIs...</p>
            </div>
          ) : finalResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '1rem' }}>
              <AlertCircle size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: '700', color: 'var(--text-secondary)', margin: '0 0 0.5rem' }}>No se encontraron coincidencias</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Intenta con otro término de búsqueda o verifica la ortografía.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {finalResults.map(item => {
                const src = EXTERNAL_SOURCES[item.sourceKey];
                return (
                  <div key={item.id} style={{
                    backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1rem',
                    display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap'
                  }}>
                    <PersonAvatar src={item.photoUrl} name={item.name} status={item.status} />
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>{item.name}</h4>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', backgroundColor: `${src.color}15`, color: src.color, padding: '0.15rem 0.5rem', borderRadius: '1rem' }}>
                          {src.emoji} {src.name}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', backgroundColor: 'var(--bg-surface-soft)', color: 'var(--text-secondary)', padding: '0.15rem 0.5rem', borderRadius: '1rem' }}>
                          Estado: {item.status.toUpperCase()}
                        </span>
                      </div>

                      {(item.age || item.zone) && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={12} /> {[item.age ? `${item.age} años` : null, item.zone].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    
                    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{
                      backgroundColor: 'var(--bg-surface-soft)', color: src.color, padding: '0.5rem 1rem', borderRadius: '0.75rem',
                      textDecoration: 'none', fontWeight: '700', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
                      border: `1px solid ${src.color}30`
                    }}>
                      <ExternalLink size={14} /> Ver original
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
