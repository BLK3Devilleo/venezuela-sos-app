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

export default function DirectoryView({ user, onViewProfile, onRequireLogin }) {
  const [activeTab, setActiveTab] = useState('landing');
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
        .select('*, creador:creador_id(*)')
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
      
      {activeTab !== 'landing' && (
        <button
          onClick={() => setActiveTab('landing')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.85rem',
            fontWeight: '700',
            marginBottom: '1rem',
            padding: 0
          }}
        >
          ← Volver al Menú de Directorio
        </button>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: '800' }}>Directorio</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Reportes comunitarios, solicitudes de apoyo y suministros en tiempo real.
          </p>
        </div>
        {activeTab === 'emergencias' && (
          <button 
            onClick={() => {
              if (!user) {
                if (onRequireLogin) onRequireLogin();
                return;
              }
              setShowForm(true);
            }}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', borderRadius: '2rem' }}
          >
            <Plus size={16} /> Reportar Emergencia
          </button>
        )}
      </div>

      {activeTab === 'landing' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem', animation: 'sos-fade-in 0.3s ease' }}>
          <h2 className="font-display" style={{ fontSize: '1.25rem', fontWeight: '800', textAlign: 'center', marginBottom: '0.5rem', color: '#fff' }}>
            ¿Qué deseas consultar u ofrecer hoy?
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            {[
              { id: 'emergencias', label: '🚨 Emergencias', color: '#ef4444', desc: 'Zonas de peligro y pedidos de auxilio en vivo.', bg: 'rgba(239, 68, 68, 0.1)' },
              { id: 'services', label: '🛠️ Servicios y Apoyo', color: '#3b82f6', desc: 'Asistencia de médicos, apoyo y remoción de escombros.', bg: 'rgba(59, 130, 246, 0.1)' },
              { id: 'resources', label: '🎪 Suministros/Refugios', color: '#10b981', desc: 'Puntos de agua, acopio, albergues y baños.', bg: 'rgba(16, 185, 129, 0.1)' },
              { id: 'all', label: '👁️ Mostrar Todo', color: '#a855f7', desc: 'Visualiza todo el directorio en un feed unificado.', bg: 'rgba(168, 85, 247, 0.1)' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setActiveTab(opt.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '1.25rem',
                  borderRadius: '1.25rem',
                  border: '1.5px solid var(--border)',
                  backgroundColor: 'var(--bg-surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: 'var(--shadow-md)',
                  gap: '0.5rem',
                  height: '100%',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = opt.color;
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = `0 12px 30px ${opt.color}15`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
              >
                <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: '800', color: opt.color, margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem', lineHeight: '1.2' }}>
                  {opt.label}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4', flex: 1 }}>
                  {opt.desc}
                </p>
                <span style={{ fontSize: '0.65rem', fontWeight: '700', color: opt.color, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Ingresar →
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Active Tab rendering */}
          {activeTab === 'services' && (
            <ServicesView user={user} onViewProfile={onViewProfile} isChild onRequireLogin={onRequireLogin} />
          )}

          {activeTab === 'resources' && (
            <ResourcesView user={user} isChild onRequireLogin={onRequireLogin} />
          )}

          {activeTab === 'emergencias' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Cargando emergencias...</div>
              ) : emergencias.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No hay reportes de emergencia activos en este momento.
                </div>
              ) : (
                emergencias.map(e => (
                  <div key={e.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {e.creador?.foto_perfil ? (
                          <img src={e.creador.foto_perfil} alt={e.creador.nombre} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            👤
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fff' }}>
                            {e.creador?.nombre || 'Usuario Anónimo'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            <Clock size={10} /> {new Date(e.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {(user?.rol === 'admin' || user?.rol === 'staff' || e.creador_id === user?.id) && (
                        <button 
                          onClick={() => handleDelete(e.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.5', margin: 0 }}>
                      {e.descripcion}
                    </p>

                    {e.foto && (
                      <div style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--border)', maxHeight: '240px' }}>
                        <img src={e.foto} alt="Evidencia" style={{ width: '100%', maxHeight: '240px', objectFit: 'cover' }} />
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={12} style={{ color: 'var(--ve-red)' }} />
                        <strong>{e.ubicacion_text}</strong>
                      </div>
                      
                      {e.ubicacion_lat && e.ubicacion_lng && (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${e.ubicacion_lat},${e.ubicacion_lng}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gradient"
                          style={{ fontSize: '0.75rem', fontWeight: '800', marginLeft: 'auto', textDecoration: 'none' }}
                        >
                          Ver en Google Maps →
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'all' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h3 className="font-display" style={{ color: '#ef4444', fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>🚨 Emergencias Críticas Activas</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Cargando emergencias...</div>
                  ) : emergencias.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay reportes de emergencia activos.</div>
                  ) : (
                    emergencias.map(e => (
                      <div key={e.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {e.creador?.foto_perfil ? (
                              <img src={e.creador.foto_perfil} alt={e.creador.nombre} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                👤
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fff' }}>
                                {e.creador?.nombre || 'Usuario Anónimo'}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                <Clock size={10} /> {new Date(e.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {(user?.rol === 'admin' || user?.rol === 'staff' || e.creador_id === user?.id) && (
                            <button 
                              onClick={() => handleDelete(e.id)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.5', margin: 0 }}>
                          {e.descripcion}
                        </p>

                        {e.foto && (
                          <div style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--border)', maxHeight: '240px' }}>
                            <img src={e.foto} alt="Evidencia" style={{ width: '100%', maxHeight: '240px', objectFit: 'cover' }} />
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <MapPin size={12} style={{ color: 'var(--ve-red)' }} />
                            <strong>{e.ubicacion_text}</strong>
                          </div>
                          
                          {e.ubicacion_lat && e.ubicacion_lng && (
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${e.ubicacion_lat},${e.ubicacion_lng}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-gradient"
                              style={{ fontSize: '0.75rem', fontWeight: '800', marginLeft: 'auto', textDecoration: 'none' }}
                            >
                              Ver en Google Maps →
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-display" style={{ color: '#3b82f6', fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>🛠️ Servicios y Apoyo Disponible</h3>
                <ServicesView user={user} onViewProfile={onViewProfile} isChild onRequireLogin={onRequireLogin} />
              </div>
              <div>
                <h3 className="font-display" style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>🎪 Suministros y Refugios Activos</h3>
                <ResourcesView user={user} isChild onRequireLogin={onRequireLogin} />
              </div>
            </div>
          )}

          {/* Formulario Bottom Sheet */}
          {showForm && (
            <div style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
            }}>
              <div 
                className="glass" 
                style={{
                  width: '100%', maxWidth: '480px', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem',
                  padding: '1.5rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)',
                  maxHeight: '85vh', overflowY: 'auto', animation: 'sos-fade-in 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff', margin: 0 }}>
                    🚨 Reportar Emergencia Crítica
                  </h3>
                  <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {/* Imagen */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '100%', height: '140px', borderRadius: '0.75rem', backgroundColor: 'var(--bg-primary)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                      {imagePreview ? (
                        <img src={imagePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                          <ImageIcon size={28} />
                          <span style={{ fontSize: '0.75rem' }}>Añadir Foto Evidencia</span>
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={handleImageSelect} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                    </div>
                  </div>

                  {/* Descripción */}
                  <div className="input-group">
                    <label className="input-label">Describe la emergencia *</label>
                    <textarea 
                      className="input-field"
                      style={{ height: '70px', resize: 'none' }}
                      placeholder="Ej: Inundación en la calle principal, se requiere evacuación de ancianos..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
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
        </>
      )}
    </div>
  );
}
