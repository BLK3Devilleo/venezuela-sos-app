/**
 * ExternalSourcesView.jsx
 * 
 * Vista "Red Solidaria" — muestra personas buscadas de plataformas aliadas
 * en tiempo real, con créditos completos, separadas por fuente.
 */

import React, { useState, useMemo } from 'react';
import { useExternalSources, EXTERNAL_SOURCES } from '../utils/useExternalSources';
import {
  Globe, ExternalLink, RefreshCw, Search, Filter,
  AlertTriangle, User, MapPin, Heart, CheckCircle,
  XCircle, Clock, ChevronDown, Info, Wifi, WifiOff
} from 'lucide-react';

// ─── Avatar fallback ─────────────────────────────────────────────────────────
function PersonAvatar({ src, name, size = 80, status }) {
  const [failed, setFailed] = useState(false);

  const statusColor = {
    missing: '#dc2626',
    found: '#16a34a',
    deceased: '#6b7280',
    hospitalized: '#2563eb',
  }[status] || '#6b7280';

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        style={{
          width: size, height: size,
          borderRadius: '0.875rem',
          objectFit: 'cover',
          border: `2px solid ${statusColor}40`,
          flexShrink: 0,
          backgroundColor: 'var(--bg-surface-soft)',
        }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size,
      borderRadius: '0.875rem',
      backgroundColor: `${statusColor}15`,
      border: `2px solid ${statusColor}30`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <User size={size * 0.45} style={{ color: statusColor, opacity: 0.6 }} />
    </div>
  );
}

// ─── Badge de estado ─────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const config = {
    missing: { label: 'Buscado/a', color: '#dc2626', bg: 'rgba(220,38,38,0.12)', icon: AlertTriangle },
    found: { label: 'Localizado/a', color: '#16a34a', bg: 'rgba(22,163,74,0.12)', icon: CheckCircle },
    deceased: { label: 'Fallecido/a', color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: XCircle },
    hospitalized: { label: 'Hospitalizado/a', color: '#2563eb', bg: 'rgba(37,99,235,0.12)', icon: Heart },
  }[status] || { label: status, color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: Info };

  const Icon = config.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '0.7rem', fontWeight: '700',
      color: config.color, backgroundColor: config.bg,
      padding: '0.2rem 0.55rem', borderRadius: '2rem',
      border: `1px solid ${config.color}30`,
      whiteSpace: 'nowrap',
    }}>
      <Icon size={11} />
      {config.label}
    </span>
  );
}

// ─── Badge de fuente ─────────────────────────────────────────────────────────
function SourceBadge({ sourceKey }) {
  const src = EXTERNAL_SOURCES[sourceKey];
  if (!src) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '0.65rem', fontWeight: '700',
      color: src.color,
      backgroundColor: `${src.color}15`,
      padding: '0.2rem 0.5rem', borderRadius: '2rem',
      border: `1px solid ${src.color}25`,
      whiteSpace: 'nowrap',
    }}>
      {src.emoji} {src.shortName}
    </span>
  );
}

// ─── Tarjeta de persona ───────────────────────────────────────────────────────
function PersonCard({ person }) {
  const src = EXTERNAL_SOURCES[person.sourceKey];

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: '1rem',
      padding: '1rem',
      display: 'flex',
      gap: '0.875rem',
      transition: 'all 0.2s ease',
      cursor: 'default',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = src?.color || 'var(--primary)';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = `0 8px 24px ${src?.color || '#0d9488'}20`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Foto */}
      <PersonAvatar
        src={person.photoUrl}
        name={person.name}
        size={76}
        status={person.status}
      />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {/* Nombre */}
        <p style={{
          fontWeight: '800', fontSize: '0.9rem',
          color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          margin: 0,
        }}>
          {person.name}
        </p>

        {/* Edad y zona */}
        {(person.age || person.zone) && (
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'flex-start', gap: '0.3rem' }}>
            <MapPin size={11} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--text-muted)' }} />
            <span style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {[person.age ? `${person.age} años` : null, person.zone].filter(Boolean).join(' · ')}
            </span>
          </p>
        )}

        {/* Descripción */}
        {person.description && (
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
            {person.description}
          </p>
        )}

        {/* Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.2rem' }}>
          <StatusBadge status={person.status} />
          <SourceBadge sourceKey={person.sourceKey} />
        </div>

        {/* Enlace */}
        <a
          href={person.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            fontSize: '0.68rem', fontWeight: '700',
            color: src?.color || 'var(--primary)',
            textDecoration: 'none',
            marginTop: '0.2rem',
            opacity: 0.85,
          }}
          onClick={e => e.stopPropagation()}
        >
          <ExternalLink size={10} />
          Ver en fuente original
        </a>
      </div>
    </div>
  );
}

// ─── Tarjeta de fuente (encabezado de sección) ────────────────────────────────
function SourceHeader({ sourceKey, count, isLoading, error, stats }) {
  const src = EXTERNAL_SOURCES[sourceKey];
  if (!src) return null;

  const statData = stats?.[sourceKey];

  return (
    <div style={{
      background: `linear-gradient(135deg, ${src.color}18, ${src.color}08)`,
      border: `1px solid ${src.color}30`,
      borderRadius: '1rem',
      padding: '1rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: 40, height: 40,
          borderRadius: '0.75rem',
          backgroundColor: `${src.color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem',
        }}>
          {src.emoji}
        </div>
        <div>
          <div style={{ fontWeight: '800', fontSize: '0.95rem', color: src.color }}>
            {src.name}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            {src.description}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {statData && (
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem' }}>
            <span style={{ color: '#dc2626', fontWeight: '700' }}>
              🔴 {statData.missing?.toLocaleString() || '?'} buscados
            </span>
            <span style={{ color: '#16a34a', fontWeight: '700' }}>
              🟢 {statData.found?.toLocaleString() || '?'} localizados
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isLoading ? (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <RefreshCw size={11} className="spin" /> Cargando...
            </span>
          ) : error ? (
            <span style={{ fontSize: '0.72rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <WifiOff size={11} /> Sin conexión
            </span>
          ) : (
            <span style={{ fontSize: '0.72rem', color: src.color, fontWeight: '700', backgroundColor: `${src.color}15`, padding: '0.2rem 0.6rem', borderRadius: '2rem' }}>
              {count} mostrados
            </span>
          )}
          <a
            href={src.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: src.color, opacity: 0.75 }}
            title={`Visitar ${src.name}`}
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: '1rem',
      padding: '1rem',
      display: 'flex', gap: '0.875rem',
      animation: 'pulse 1.5s infinite',
    }}>
      <div style={{ width: 76, height: 76, borderRadius: '0.875rem', backgroundColor: 'var(--bg-surface-soft)' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ height: 14, backgroundColor: 'var(--bg-surface-soft)', borderRadius: '0.5rem', width: '70%' }} />
        <div style={{ height: 11, backgroundColor: 'var(--bg-surface-soft)', borderRadius: '0.5rem', width: '90%' }} />
        <div style={{ height: 11, backgroundColor: 'var(--bg-surface-soft)', borderRadius: '0.5rem', width: '50%' }} />
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
          <div style={{ height: 20, width: 80, backgroundColor: 'var(--bg-surface-soft)', borderRadius: '2rem' }} />
          <div style={{ height: 20, width: 70, backgroundColor: 'var(--bg-surface-soft)', borderRadius: '2rem' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────
export default function ExternalSourcesView() {
  const [activeSource, setActiveSource] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page] = useState(1);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  // Debounce búsqueda
  const searchTimeout = React.useRef(null);
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(val), 450);
  };

  const activeSources = activeSource === 'all'
    ? Object.keys(EXTERNAL_SOURCES)
    : [activeSource];

  const {
    data, loading, errors, stats, isLoading, refresh,
  } = useExternalSources({
    sources: activeSources,
    page,
    limit: 50,
    search: debouncedSearch,
    status: statusFilter,
  });

  const STATUS_OPTIONS = [
    { value: 'all', label: 'Todos', icon: '🌐' },
    { value: 'missing', label: 'Buscados', icon: '🔴' },
    { value: 'found', label: 'Localizados', icon: '🟢' },
    { value: 'deceased', label: 'Fallecidos', icon: '⚫' },
  ];

  const totalCount = activeSources.reduce((acc, k) => acc + (data[k]?.length || 0), 0);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: '2rem' }}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 44, height: 44,
              borderRadius: '1rem',
              background: 'linear-gradient(135deg, #1d4ed8, #0d9488)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Globe size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontWeight: '900', fontSize: '1.4rem', margin: 0, fontFamily: 'var(--font-display)' }}>
                Red Solidaria
              </h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Información de plataformas aliadas · En tiempo real
              </p>
            </div>
          </div>
          <button
            onClick={refresh}
            disabled={isLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              backgroundColor: 'var(--bg-surface-soft)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              padding: '0.5rem 0.9rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.78rem', fontWeight: '700',
              color: 'var(--text-secondary)',
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            <RefreshCw size={14} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            {isLoading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* ── Disclaimer humanitario ──────────────────────────────────── */}
      {showDisclaimer && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(13,148,136,0.12), rgba(29,78,216,0.08))',
          border: '1px solid rgba(13,148,136,0.25)',
          borderRadius: '1rem',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
        }}>
          <Heart size={18} style={{ color: '#0d9488', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: '800', fontSize: '0.85rem', color: 'var(--text-primary)', margin: '0 0 0.3rem' }}>
              🤝 Información de plataformas aliadas
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
              Esta sección refleja datos en tiempo real de otras plataformas humanitarias.
              Toda la información pertenece a sus respectivos autores y se reproduce
              exclusivamente con fines humanitarios. Para actualizar o retirar un registro, visita la plataforma original.
            </p>
          </div>
          <button
            onClick={() => setShowDisclaimer(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.1rem', flexShrink: 0 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Créditos / Fuentes ─────────────────────────────────────── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
          Plataformas colaboradoras
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {Object.values(EXTERNAL_SOURCES).map(src => (
            <a
              key={src.key}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                fontSize: '0.75rem', fontWeight: '700',
                color: src.color,
                backgroundColor: `${src.color}12`,
                border: `1px solid ${src.color}25`,
                padding: '0.35rem 0.75rem',
                borderRadius: '2rem',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${src.color}25`; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = `${src.color}12`; }}
            >
              {src.emoji} {src.name} <ExternalLink size={11} />
            </a>
          ))}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.7rem', color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-surface-soft)',
            border: '1px dashed var(--border)',
            padding: '0.35rem 0.75rem',
            borderRadius: '2rem',
          }}>
            + más próximamente
          </span>
        </div>
      </div>

      {/* ── Filtros ────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '1rem',
        padding: '1rem',
        marginBottom: '1.25rem',
        display: 'flex', flexDirection: 'column', gap: '0.875rem',
      }}>
        {/* Búsqueda */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{
            position: 'absolute', left: '0.85rem', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text-muted)',
            pointerEvents: 'none',
          }} />
          <input
            type="text"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Buscar por nombre, zona o municipio..."
            style={{
              width: '100%', padding: '0.7rem 0.875rem 0.7rem 2.5rem',
              backgroundColor: 'var(--bg-surface-soft)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--primary)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Filtro por fuente */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveSource('all')}
              style={{
                padding: '0.4rem 0.9rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '700',
                border: activeSource === 'all' ? '1px solid var(--primary)' : '1px solid var(--border)',
                backgroundColor: activeSource === 'all' ? 'var(--primary)' : 'var(--bg-surface-soft)',
                color: activeSource === 'all' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              🌐 Todas las fuentes
            </button>
            {Object.values(EXTERNAL_SOURCES).map(src => (
              <button
                key={src.key}
                onClick={() => setActiveSource(src.key)}
                style={{
                  padding: '0.4rem 0.9rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '700',
                  border: activeSource === src.key ? `1px solid ${src.color}` : '1px solid var(--border)',
                  backgroundColor: activeSource === src.key ? `${src.color}20` : 'var(--bg-surface-soft)',
                  color: activeSource === src.key ? src.color : 'var(--text-secondary)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {src.emoji} {src.shortName}
              </button>
            ))}
          </div>

          {/* Filtro por estado */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                style={{
                  padding: '0.4rem 0.8rem', borderRadius: '2rem', fontSize: '0.72rem', fontWeight: '700',
                  border: statusFilter === opt.value ? '1px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: statusFilter === opt.value ? 'rgba(13,148,136,0.15)' : 'var(--bg-surface-soft)',
                  color: statusFilter === opt.value ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contador total */}
        {!isLoading && (
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
            Mostrando <strong style={{ color: 'var(--text-primary)' }}>{totalCount.toLocaleString()}</strong> registros
            {debouncedSearch && ` para "${debouncedSearch}"`}
            {statusFilter !== 'all' && ` · filtro: ${STATUS_OPTIONS.find(o => o.value === statusFilter)?.label}`}
          </p>
        )}
      </div>

      {/* ── Contenido por fuente ───────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {activeSources.map(sourceKey => {
          const src = EXTERNAL_SOURCES[sourceKey];
          const sourceData = data[sourceKey] || [];
          const isSourceLoading = loading[sourceKey];
          const sourceError = errors[sourceKey];

          return (
            <section key={sourceKey}>
              {/* Header de fuente */}
              <SourceHeader
                sourceKey={sourceKey}
                count={sourceData.length}
                isLoading={isSourceLoading}
                error={sourceError}
                stats={stats}
              />

              {/* Error state */}
              {sourceError && !isSourceLoading && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '1rem 1.25rem',
                  backgroundColor: 'rgba(220,38,38,0.08)',
                  border: '1px solid rgba(220,38,38,0.2)',
                  borderRadius: '0.875rem',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                  <WifiOff size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontWeight: '700', fontSize: '0.85rem', color: '#f87171', margin: '0 0 0.2rem' }}>
                      No se pudo conectar con {src?.name}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0 }}>
                      {sourceError} · Puedes visitar{' '}
                      <a href={src?.url} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>
                        {src?.url}
                      </a>
                      {' '}directamente.
                    </p>
                  </div>
                </div>
              )}

              {/* Skeleton loaders */}
              {isSourceLoading && (
                <div style={{
                  marginTop: '0.875rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '0.75rem',
                }}>
                  {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              )}

              {/* Resultados */}
              {!isSourceLoading && !sourceError && sourceData.length > 0 && (
                <div style={{
                  marginTop: '0.875rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '0.75rem',
                }}>
                  {sourceData.map(person => (
                    <PersonCard key={person.id} person={person} />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!isSourceLoading && !sourceError && sourceData.length === 0 && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '2rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.875rem',
                }}>
                  <Search size={28} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                  <p style={{ fontWeight: '700', color: 'var(--text-secondary)', margin: '0 0 0.25rem', fontSize: '0.875rem' }}>
                    Sin resultados
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                    {debouncedSearch
                      ? `No se encontraron coincidencias para "${debouncedSearch}" en ${src?.name}`
                      : `No hay registros disponibles en ${src?.name} con el filtro actual`
                    }
                  </p>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* ── Footer legal ───────────────────────────────────────────── */}
      <div style={{
        marginTop: '2rem',
        padding: '1.25rem',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '1rem',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 0.5rem', lineHeight: '1.6' }}>
          📋 La información mostrada en esta sección pertenece a sus respectivas plataformas y es reproducida
          exclusivamente con fines humanitarios. Venezuela SOS no almacena estos datos en su base de datos.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          {Object.values(EXTERNAL_SOURCES).map(src => (
            <a
              key={src.key}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.7rem', color: src.color, textDecoration: 'none', fontWeight: '700' }}
            >
              © {src.name}
            </a>
          ))}
        </div>
      </div>

      {/* ── Spin animation ─────────────────────────────────────────── */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
