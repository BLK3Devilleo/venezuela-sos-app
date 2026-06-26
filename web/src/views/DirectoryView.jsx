import React, { useState, useEffect } from 'react';
import ServicesView from './ServicesView';
import ResourcesView from './ResourcesView';
import { supabase } from '../supabase';
import { AlertTriangle, Plus, MapPin, Image as ImageIcon, Trash2, Clock, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { compressImage } from '../utils/imageCompression';

// Configurar marcador por defecto para Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapSelector({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
}

export default function DirectoryView({ user, onViewProfile }) {
  const [activeTab, setActiveTab] = useState('emergencias'); // Emergencias por defecto
  const [emergencias, setEmergencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [mapPos, setMapPos] = useState([10.4806, -66.9036]); // Caracas por defecto
  const [selectedPos, setSelectedPos] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeTab === 'emergencias') {
      fetchEmergencias();
    }
  }, [activeTab]);

  const fetchEmergencias = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('emergencias')
        .select('*, creador:usuarios(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmergencias(data || []);
    } catch (e) {
      console.error('Error al cargar emergencias:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return alert('Por favor describe la emergencia');
    if (!selectedPos) return alert('Por favor toca el mapa para indicar la ubicación exacta de la emergencia');

    setSubmitting(true);
    try {
      let fotoBase64 = null;
      if (imageFile) {
        // Compresión local segura anti-malware
        const compressed = await compressImage(imageFile);
        fotoBase64 = await new Promise((resolve) => {
          const r = new FileReader();
          r.onloadend = () => resolve(r.result);
          r.readAsDataURL(compressed);
        });
      }

      const { error } = await supabase.from('emergencias').insert({
        creador_id: user?.id,
        descripcion: description,
        foto: fotoBase64,
        ubicacion_lat: selectedPos[0],
        ubicacion_lng: selectedPos[1],
        ubicacion_text: locationText || 'Ubicación reportada'
      });

      if (error) throw error;

      // Limpiar formulario y cerrar
      setDescription('');
      setLocationText('');
      setSelectedPos(null);
      setImageFile(null);
      setImagePreview('');
      setShowForm(false);
      fetchEmergencias();
    } catch (e) {
      console.error('Error al reportar emergencia:', e);
      alert('Error al publicar reporte. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este reporte de emergencia?')) return;
    try {
      const { error } = await supabase.from('emergencias').delete().eq('id', id);
      if (error) throw error;
      setEmergencias(emergencias.filter(item => item.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '2rem', paddingTop: '1rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: '800' }}>Directorio</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Reportes comunitarios, solicitudes de apoyo y suministros en tiempo real.
          </p>
        </div>
        {activeTab === 'emergencias' && (
          <button 
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', borderRadius: '2rem' }}
          >
            <Plus size={16} /> Reportar Emergencia
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '0.35rem', 
        marginBottom: '1.5rem', 
        backgroundColor: 'var(--bg-surface)', 
        padding: '0.35rem', 
        borderRadius: '1.25rem',
        border: '1px solid var(--border)',
        overflowX: 'auto'
      }}>
        {[
          { id: 'emergencias', label: '🚨 Emergencias en Vivo', color: 'var(--ve-red)' },
          { id: 'services', label: '🤝 Servicios y Apoyo', color: 'var(--primary)' },
          { id: 'resources', label: '📦 Suministros y Refugios', color: 'var(--ve-blue)' },
        ].map(t => (
          <button
            key={t.id}
            style={{ 
              flex: 1, 
              padding: '0.65rem 0.75rem', 
              borderRadius: '1rem', 
              border: 'none', 
              backgroundColor: activeTab === t.id ? t.color : 'transparent', 
              color: activeTab === t.id ? 'white' : 'var(--text-secondary)', 
              fontWeight: activeTab === t.id ? '700' : '500', 
              transition: 'all 0.2s',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Active Tab rendering */}
      {activeTab === 'services' && (
        <ServicesView user={user} onViewProfile={onViewProfile} isChild />
      )}

      {activeTab === 'resources' && (
        <ResourcesView user={user} isChild />
      )}

      {activeTab === 'emergencias' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              Cargando reportes de emergencia...
            </div>
          ) : emergencias.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              borderRadius: '1rem',
              border: '2px dashed var(--border)',
              color: 'var(--text-secondary)'
            }}>
              <AlertTriangle size={36} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <p style={{ fontWeight: '600' }}>No hay reportes de emergencia activos en este momento.</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>La comunidad está a salvo. Reporta si ves una situación de peligro.</p>
            </div>
          ) : (
            emergencias.map(item => (
              <div 
                key={item.id}
                className="card"
                style={{
                  borderLeft: '4px solid var(--ve-red)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  padding: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>🚨</span>
                    <span style={{ fontWeight: '800', color: 'var(--ve-red)', fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      Emergencia Crítica
                    </span>
                  </div>
                  {(user?.rol === 'admin' || user?.id === item.creador_id) && (
                    <button 
                      onClick={() => handleDelete(item.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {item.foto && (
                  <img 
                    src={item.foto} 
                    alt="Reporte de Emergencia" 
                    style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: '0.75rem' }} 
                  />
                )}

                <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                  {item.descripcion}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <MapPin size={14} style={{ color: 'var(--ve-red)' }} />
                    <span><strong>Ubicación:</strong> {item.ubicacion_text}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                    <Clock size={14} />
                    <span>Reportado hace {new Date(item.created_at).toLocaleDateString()} a las {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <a 
                    href={`https://maps.google.com/?q=${item.ubicacion_lat},${item.ubicacion_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', flex: 1, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <MapPin size={14} /> Ver en Google Maps
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Reportar Emergencia */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
            backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)',
            padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowForm(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h2 className="font-display" style={{ fontSize: '1.35rem', fontWeight: '900', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🚨 Reportar Emergencia en Vivo
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Foto */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span className="input-label">Foto del Incidente (Opcional)</span>
                {imagePreview ? (
                  <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '0.75rem', overflow: 'hidden' }}>
                    <img src={imagePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                    <button 
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(''); }}
                      style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', padding: '0.25rem', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label style={{
                    height: '100px', border: '2px dashed var(--border)', borderRadius: '0.75rem',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', gap: '0.25rem', color: 'var(--text-secondary)'
                  }}>
                    <ImageIcon size={24} />
                    <span style={{ fontSize: '0.8rem' }}>Subir Imagen de la Emergencia</span>
                    <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                  </label>
                )}
              </div>

              {/* Descripción */}
              <div className="input-group">
                <label className="input-label">¿Qué está sucediendo?</label>
                <textarea 
                  className="input-field"
                  placeholder="Describe la emergencia. Ej: Inundación en la calle 4, postes eléctricos caídos o personas atrapadas..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{ height: '80px', resize: 'none' }}
                  required
                />
              </div>

              {/* Ubicación Texto */}
              <div className="input-group">
                <label className="input-label">Ubicación (Referencia / Dirección)</label>
                <input 
                  className="input-field"
                  type="text"
                  placeholder="Ej: Av. Francisco de Miranda, frente al Metro de Chacao"
                  value={locationText}
                  onChange={e => setLocationText(e.target.value)}
                />
              </div>

              {/* Mini mapa selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span className="input-label">Selecciona el punto en el mapa (Toca para marcar)</span>
                <div style={{ height: '180px', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <MapContainer center={mapPos} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapSelector position={selectedPos} setPosition={setSelectedPos} />
                  </MapContainer>
                </div>
                {selectedPos && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                    📍 Coordenadas marcadas: {selectedPos[0].toFixed(5)}, {selectedPos[1].toFixed(5)}
                  </span>
                )}
              </div>

              <button 
                type="submit" 
                className="btn btn-danger"
                disabled={submitting}
                style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', fontWeight: 'bold' }}
              >
                {submitting ? 'Publicando reporte...' : '🚨 Publicar Reporte de Emergencia'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
