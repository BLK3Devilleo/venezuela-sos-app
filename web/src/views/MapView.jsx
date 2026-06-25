import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../supabase';
import { Plus, RefreshCw, X, MapPin, Navigation2 } from 'lucide-react';
import BottomModal from '../components/BottomModal';

// Corregir icono por defecto de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Crear iconos de colores personalizados usando L.divIcon para un diseño WOW
const createCustomIcon = (color, label) => {
  return L.divIcon({
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      ">
        <span style="font-size: 14px;">${label}</span>
        <div style="
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: ${color};
          opacity: 0.4;
          z-index: -1;
          animation: map-pulse 2s infinite ease-in-out;
        "></div>
      </div>
    `,
    className: 'custom-map-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const icons = {
  emergencia: createCustomIcon('var(--ve-red)', '🆘'),
  alimentos: createCustomIcon('var(--ve-green)', '🍲'),
  baños: createCustomIcon('var(--ve-blue)', '🚿'),
  refugio: createCustomIcon('var(--ve-blue)', '🎪'),
  medicamentos: createCustomIcon('var(--ve-yellow)', '💊'),
  servicio_medico: createCustomIcon('var(--ve-red)', '⚕️'),
  servicio_apoyo: createCustomIcon('var(--ve-blue)', '🛠️')
};

export default function MapView({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estado para crear nuevo marcador
  const [newMarkerPos, setNewMarkerPos] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tipo_registro: 'recurso', // recurso / servicio
    categoria: 'alimentos', // alimentos / baños / refugio / medicamentos
    tipo_servicio: 'apoyo', // medico / apoyo
    subtipo: 'escombros',
    nombre: '',
    descripcion: '',
    cantidad: '',
    contacto_whatsapp: user?.contacto || ''
  });

  // Caracas por defecto
  const center = [10.5000, -66.9000];

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    setLoading(true);
    try {
      const [resRec, resServ] = await Promise.all([
        supabase.from('recursos').select('*'),
        supabase.from('servicios').select('*')
      ]);

      const formattedRecursos = (resRec.data || []).map(r => ({
        ...r,
        mapType: 'recurso',
        icon: icons[r.categoria] || icons.alimentos
      }));

      const formattedServicios = (resServ.data || []).map(s => ({
        ...s,
        mapType: 'servicio',
        icon: s.tipo_servicio === 'medico' ? icons.servicio_medico : icons.servicio_apoyo
      }));

      const allItems = [...formattedRecursos, ...formattedServicios].filter(
        item => item.ubicacion_lat != null && item.ubicacion_lng != null
      );
      setItems(allItems);
    } catch (err) {
      console.error('Error fetching map data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Componente para capturar eventos de click en el mapa
  function MapEvents() {
    useMapEvents({
      click(e) {
        setNewMarkerPos(e.latlng);
        setShowForm(true);
      }
    });
    return null;
  }

  const handleCreateMarker = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.contacto_whatsapp.trim()) {
      alert('Nombre y contacto son requeridos');
      return;
    }

    try {
      if (formData.tipo_registro === 'recurso') {
        const { error } = await supabase.from('recursos').insert({
          creador_id: user.id,
          tipo: formData.categoria === 'refugio' || formData.categoria === 'baños' ? 'inmueble' : 'mueble',
          categoria: formData.categoria,
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim(),
          cantidad: formData.cantidad.trim(),
          ubicacion_lat: newMarkerPos.lat,
          ubicacion_lng: newMarkerPos.lng,
          contacto_whatsapp: formData.contacto_whatsapp.trim()
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('servicios').insert({
          creador_id: user.id,
          tipo_servicio: formData.tipo_servicio,
          subtipo: formData.subtipo.trim(),
          rol_servicio: 'ofrece', // por defecto ofrece
          descripcion: formData.descripcion.trim(),
          disponibilidad: formData.cantidad.trim() || 'Inmediata',
          ubicacion_lat: newMarkerPos.lat,
          ubicacion_lng: newMarkerPos.lng,
          contacto_whatsapp: formData.contacto_whatsapp.trim()
        });
        if (error) throw error;
      }

      setShowForm(false);
      setNewMarkerPos(null);
      setFormData({
        ...formData,
        nombre: '',
        descripcion: '',
        cantidad: ''
      });
      fetchMapData();
    } catch (err) {
      console.error(err);
      alert('Error creando reporte en el mapa');
    }
  };

  return (
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapEvents />

        {items.map((item) => (
          <Marker
            key={item.id}
            position={[item.ubicacion_lat, item.ubicacion_lng]}
            icon={item.icon || icons.alimentos}
          >
            <Popup>
              <div style={{ color: '#111', fontSize: '0.875rem', width: '200px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', color: item.mapType === 'recurso' ? '#2563eb' : '#dc2626' }}>
                  {item.mapType === 'recurso' ? item.categoria : `Servicio: ${item.tipo_servicio}`}
                </div>
                <div style={{ fontWeight: '700', fontSize: '0.9375rem', marginBottom: '4px' }}>{item.nombre || item.subtipo}</div>
                <div style={{ color: '#666', fontSize: '0.8125rem', marginBottom: '8px' }}>{item.descripcion}</div>
                <a
                  href={`https://wa.me/${item.contacto_whatsapp?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hola, vi tu publicación en VenezuelaSOS.')}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', textAlign: 'center', padding: '6px 12px', backgroundColor: '#25D366', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: '700', fontSize: '0.8125rem' }}
                >
                  WhatsApp
                </a>
              </div>
            </Popup>
          </Marker>
        ))}

        {newMarkerPos && (
          <Marker position={[newMarkerPos.lat, newMarkerPos.lng]}>
            <Popup>Nueva ubicación seleccionada</Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Hint tap-to-add */}
      <div style={{
        position: 'absolute', top: '0.75rem', left: '50%', transform: 'translateX(-50%)',
        zIndex: 500, pointerEvents: 'none'
      }}>
        <div style={{
          backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '0.375rem 0.875rem', borderRadius: '2rem',
          fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)',
          display: 'flex', alignItems: 'center', gap: '0.375rem'
        }}>
          <MapPin size={12} /> Toca el mapa para colocar un punto · o usa el botón +
        </div>
      </div>

      {/* Refresh button */}
      <button
        onClick={fetchMapData}
        disabled={loading}
        style={{
          position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 500,
          width: '40px', height: '40px', borderRadius: '50%',
          backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#fff'
        }}
      >
        <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
      </button>

      {/* FAB — Agregar Punto */}
      <button
        onClick={() => setShowForm(true)}
        style={{
          position: 'absolute', bottom: '1.25rem', right: '1.25rem', zIndex: 500,
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #0d9488, #0891b2)',
          border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#fff',
          boxShadow: '0 8px 32px rgba(13,148,136,0.5), 0 2px 8px rgba(0,0,0,0.4)',
          transition: 'transform 0.15s ease'
        }}
        title="Agregar punto al mapa"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Bottom Sheet — Formulario */}
      <BottomModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setNewMarkerPos(null); }}
        title={newMarkerPos ? '📍 Nuevo Punto en el Mapa' : 'Nuevo Punto en el Mapa'}
      >
        {newMarkerPos ? (
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <MapPin size={14} style={{ color: 'var(--primary)' }} />
            Lat {newMarkerPos.lat.toFixed(5)}, Lng {newMarkerPos.lng.toFixed(5)}
          </div>
        ) : (
          <div style={{ backgroundColor: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.3)', borderRadius: '0.75rem', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--primary)' }}>
            💡 Toca el mapa primero para colocar la ubicación exacta, o completa el formulario y se usará Caracas como referencia.
          </div>
        )}

        <form onSubmit={handleCreateMarker} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div className="input-group">
            <label className="input-label">Tipo de Reporte</label>
            <select className="input-field select-field" value={formData.tipo_registro} onChange={e => setFormData({ ...formData, tipo_registro: e.target.value })}>
              <option value="recurso">🧺 Recurso Físico / Suministros</option>
              <option value="servicio">🤝 Servicio / Ayuda Humana</option>
            </select>
          </div>

          {formData.tipo_registro === 'recurso' ? (
            <div className="input-group">
              <label className="input-label">Categoría</label>
              <select className="input-field select-field" value={formData.categoria} onChange={e => setFormData({ ...formData, categoria: e.target.value })}>
                <option value="alimentos">🍲 Alimentos / Comida</option>
                <option value="baños">🚿 Baños / Aseo</option>
                <option value="refugio">🎪 Refugio / Carpas</option>
                <option value="medicamentos">💊 Medicamentos</option>
              </select>
            </div>
          ) : (
            <div className="input-group">
              <label className="input-label">Tipo de Servicio</label>
              <select className="input-field select-field" value={formData.tipo_servicio} onChange={e => setFormData({ ...formData, tipo_servicio: e.target.value })}>
                <option value="medico">⚕️ Médico / Sanitario</option>
                <option value="apoyo">🛠️ Apoyo en Escombros</option>
              </select>
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Nombre del Punto *</label>
            <input className="input-field" placeholder="Ej. Comedor Plaza Bolívar" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} required />
          </div>

          <div className="input-group">
            <label className="input-label">Descripción</label>
            <textarea className="input-field" style={{ height: '70px', resize: 'none' }} placeholder="Qué ofreces o necesitas..." value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} />
          </div>

          <div className="input-group">
            <label className="input-label">WhatsApp de Contacto *</label>
            <input type="tel" className="input-field" placeholder="+584121234567" value={formData.contacto_whatsapp} onChange={e => setFormData({ ...formData, contacto_whatsapp: e.target.value })} required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}>
            <Plus size={18} /> Publicar en el Mapa
          </button>
        </form>
      </BottomModal>

      <style>{`
        @keyframes map-pulse { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(2); opacity: 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
