import React, { useState } from 'react';
import { useExternalHospitals } from '../utils/useExternalHospitals';
import { ExternalLink, RefreshCw, AlertCircle, MapPin, Phone, CheckCircle, Clock } from 'lucide-react';

function HospitalCard({ hospital }) {
  const { nombre, tipo, estado, ciudad, telefono, estado_operativo, capacidad, nota, confirmaciones, ultima_actualizacion, verificado, personal_salud } = hospital;
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'abierto': return { bg: '#e4f6ea', text: '#16a34a', label: 'Abierto' };
      case 'saturado': return { bg: '#fcecd6', text: '#e08a16', label: 'Saturado' };
      case 'cerrado': return { bg: '#fce7e5', text: '#dc2626', label: 'Cerrado' };
      default: return { bg: '#e9edf2', text: '#7a8794', label: 'Sin reporte' };
    }
  };

  const getCapacityColor = (cap) => {
    switch(cap) {
      case 'disponible': return '#16a34a';
      case 'limitada': return '#e08a16';
      case 'llena': return '#dc2626';
      default: return '#7a8794';
    }
  };

  const formatCapacity = (cap) => {
    switch(cap) {
      case 'disponible': return 'Camas disponibles';
      case 'limitada': return 'Capacidad limitada';
      case 'llena': return 'Sin cupo';
      default: return '';
    }
  };

  const s = getStatusColor(estado_operativo);

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: '1rem',
      padding: '1.25rem',
      boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>{nombre}</h3>
        <span style={{
          background: s.bg,
          color: s.text,
          padding: '0.25rem 0.6rem',
          borderRadius: '99px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          whiteSpace: 'nowrap'
        }}>
          {s.label}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
        <MapPin size={14} />
        <span>{ciudad}, {estado}</span>
        <span style={{
          background: 'var(--bg-surface-soft)',
          padding: '0.1rem 0.4rem',
          borderRadius: '4px',
          fontSize: '0.7rem',
          textTransform: 'capitalize'
        }}>
          {tipo || 'Centro'}
        </span>
      </div>

      {(capacidad || nota) && (
        <div style={{
          background: 'var(--bg-base)',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          fontSize: '0.85rem',
          marginBottom: '0.75rem'
        }}>
          {capacidad && (
            <div style={{ fontWeight: 'bold', color: getCapacityColor(capacidad), marginBottom: nota ? '0.25rem' : 0 }}>
              {formatCapacity(capacidad)}
            </div>
          )}
          {nota && <div style={{ color: 'var(--text-primary)' }}>{nota}</div>}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        {telefono && (
          <a href={`tel:${telefono}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>
            <Phone size={14} /> {telefono}
          </a>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Clock size={14} />
          {ultima_actualizacion ? new Date(ultima_actualizacion).toLocaleDateString() : 'Sin fecha'}
        </div>

        {confirmaciones > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle size={14} color="#10b981" />
            {confirmaciones} {confirmaciones === 1 ? 'reporte' : 'reportes'}
          </div>
        )}

        {personal_salud && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontWeight: 'bold' }}>
            <AlertCircle size={14} /> Por personal
          </div>
        )}
      </div>
    </div>
  );
}

export default function HospitalsView() {
  const { data, loading, error, refresh } = useExternalHospitals();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(h => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (h.nombre || '').toLowerCase().includes(term) ||
           (h.ciudad || '').toLowerCase().includes(term) ||
           (h.estado || '').toLowerCase().includes(term);
  });

  return (
    <div className="fade-in" style={{ paddingBottom: '2rem' }}>
      <div style={{
        background: 'linear-gradient(135deg, #0a8d8f, #076d6f)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '1rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 15px rgba(10, 141, 143, 0.2)'
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🏥 Red Nacional de Salud
        </h2>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem', lineHeight: 1.4 }}>
          Información en tiempo real sobre la operatividad y capacidad de hospitales, clínicas y ambulatorios.
        </p>
        <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ExternalLink size={16} />
          <span>
            Datos obtenidos en tiempo real gracias a la comunidad de <a href="https://hospitalesenvenezuela.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'white', fontWeight: 'bold' }}>Hospitales en Venezuela</a>.
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <input 
          type="text"
          placeholder="Buscar hospital, ciudad o estado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field"
          style={{ flex: 1 }}
        />
        <button 
          onClick={() => refresh()}
          className="btn btn-secondary"
          style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          disabled={loading}
        >
          <RefreshCw size={20} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          <AlertCircle size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Error cargando datos: {error}
        </div>
      )}

      {loading && data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
          <RefreshCw size={32} className="spin" style={{ marginBottom: '1rem', color: '#0a8d8f' }} />
          <p>Sincronizando con Hospitales en Venezuela...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredData.length > 0 ? (
            filteredData.map(hospital => (
              <HospitalCard key={hospital.id} hospital={hospital} />
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
              No se encontraron hospitales con ese nombre o ubicación.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
