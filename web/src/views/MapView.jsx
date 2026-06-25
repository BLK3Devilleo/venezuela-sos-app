import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../supabase';
import { Plus, RefreshCw, X, MapPin, Navigation2, Search, MessageCircle, Phone, ArrowLeft, Filter } from 'lucide-react';
import BottomModal from '../components/BottomModal';

// Fix Leaflet marker icon URLs
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Helper to create custom circular glowing map markers
const createCustomIcon = (color, emoji) => {
  return L.divIcon({
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      ">
        <span style="font-size: 15px; transform: translateY(-1px);">${emoji}</span>
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
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17]
  });
};

const MACRO_CATEGORIES = {
  salud: {
    label: 'Salud y Sanidad',
    color: '#ef4444', // Red
    bg: 'rgba(239, 68, 68, 0.1)',
    sub: {
      'primeros_auxilios': { label: 'Primeros Auxilios', icon: '⚕️' },
      'medicamentos': { label: 'Medicamentos', icon: '💊' },
      'atencion_medica': { label: 'Atención Médica', icon: '🏥' },
      'atencion_psicologica': { label: 'Atención Mental', icon: '🧠' }
    }
  },
  rescate: {
    label: 'Rescate y Seguridad',
    color: '#f59e0b', // Orange/Yellow
    bg: 'rgba(245, 158, 11, 0.1)',
    sub: {
      'atrapados': { label: 'Personas Atrapadas', icon: '🆘' },
      'colapsos': { label: 'Zonas Colapsadas', icon: '⚠️' },
      'refugios': { label: 'Refugios Habilitados', icon: '🎪' },
      'acampada': { label: 'Zonas de Acampada', icon: '⛺' },
      'control': { label: 'Puntos de Control', icon: '🚧' }
    }
  },
  suministros: {
    label: 'Suministros Básicos',
    color: '#3b82f6', // Blue
    bg: 'rgba(59, 130, 246, 0.1)',
    sub: {
      'comida': { label: 'Reparto de Comida', icon: '🍲' },
      'agua': { label: 'Agua Potable', icon: '💧' },
      'donaciones': { label: 'Ropa / Mantas', icon: '👕' },
      'acopio': { label: 'Centro de Acopio', icon: '📦' }
    }
  }
};

// Generate icons cache
const iconsCache = {};
Object.keys(MACRO_CATEGORIES).forEach(macroKey => {
  const macro = MACRO_CATEGORIES[macroKey];
  Object.keys(macro.sub).forEach(subKey => {
    iconsCache[`${macroKey}_${subKey}`] = createCustomIcon(macro.color, macro.sub[subKey].icon);
  });
});

const legacyIcons = {
  emergencia: createCustomIcon('#ef4444', '🆘'),
  alimentos: createCustomIcon('#3b82f6', '🍲'),
  baños: createCustomIcon('#3b82f6', '🚿'),
  refugio: createCustomIcon('#f59e0b', '🎪'),
  medicamentos: createCustomIcon('#ef4444', '💊'),
  servicio_medico: createCustomIcon('#ef4444', '⚕️'),
  servicio_apoyo: createCustomIcon('#f59e0b', '🛠️')
};

// Component to dynamically update map center and zoom level
function ChangeMapView({ center, zoom }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true, duration: 1 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapView({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Set all subcategories as enabled by default
  const [activeFilters, setActiveFilters] = useState(() => {
    const filters = [];
    Object.keys(MACRO_CATEGORIES).forEach(macroKey => {
      Object.keys(MACRO_CATEGORIES[macroKey].sub).forEach(subKey => {
        filters.push(`${macroKey}_${subKey}`);
      });
    });
    return filters;
  });

  // Map positioning state
  const [mapCenter, setMapCenter] = useState([10.5000, -66.9000]); // Caracas default
  const [mapZoom, setMapZoom] = useState(13);

  // New marker creation state
  const [newMarkerPos, setNewMarkerPos] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    macro: 'salud',
    sub: 'primeros_auxilios',
    nombre: '',
    descripcion: '',
    cantidad: '',
    contacto_whatsapp: user?.contacto || ''
  });

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

      const formattedRecursos = (resRec.data || []).map(r => {
        let icon = null;
        let displayType = '';
        const cacheKey = `${r.tipo}_${r.categoria}`;

        if (MACRO_CATEGORIES[r.tipo] && MACRO_CATEGORIES[r.tipo].sub[r.categoria]) {
          icon = iconsCache[cacheKey];
          displayType = `${MACRO_CATEGORIES[r.tipo].label} - ${MACRO_CATEGORIES[r.tipo].sub[r.categoria].label}`;
        } else {
          icon = legacyIcons[r.categoria] || legacyIcons.alimentos;
          displayType = r.categoria;
        }

        return {
          ...r,
          mapType: r.tipo,
          displayType,
          icon,
          categoryKey: cacheKey
        };
      });

      const formattedServicios = (resServ.data || []).map(s => {
        return {
          ...s,
          mapType: 'servicio',
          displayType: s.subtipo || s.tipo_servicio,
          nombre: s.nombre || s.subtipo,
          icon: s.tipo_servicio === 'medico' ? legacyIcons.servicio_medico : legacyIcons.servicio_apoyo,
          categoryKey: `legacy_${s.tipo_servicio}`
        };
      });

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

  const handleFilterToggle = (key) => {
    setActiveFilters(prev => 
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  };

  const selectAllFilters = () => {
    const filters = [];
    Object.keys(MACRO_CATEGORIES).forEach(macroKey => {
      Object.keys(MACRO_CATEGORIES[macroKey].sub).forEach(subKey => {
        filters.push(`${macroKey}_${subKey}`);
      });
    });
    setActiveFilters(filters);
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
  };

  // Map Click Listener
  function MapEvents() {
    useMapEvents({
      click(e) {
        setNewMarkerPos(e.latlng);
        setShowForm(true);
      }
    });
    return null;
  }

  // Update subcategory automatically when macro category changes in form
  useEffect(() => {
    if (MACRO_CATEGORIES[formData.macro]) {
      const firstSubKey = Object.keys(MACRO_CATEGORIES[formData.macro].sub)[0];
      setFormData(prev => ({ ...prev, sub: firstSubKey }));
    }
  }, [formData.macro]);

  const handleCreateMarker = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.contacto_whatsapp.trim()) {
      alert('Nombre y contacto son requeridos');
      return;
    }

    try {
      const { error } = await supabase.from('recursos').insert({
        creador_id: user.id,
        tipo: formData.macro,
        categoria: formData.sub,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        cantidad: formData.cantidad.trim(),
        ubicacion_lat: newMarkerPos ? newMarkerPos.lat : 10.5000,
        ubicacion_lng: newMarkerPos ? newMarkerPos.lng : -66.9000,
        contacto_whatsapp: formData.contacto_whatsapp.trim()
      });
      
      if (error) throw error;

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

  // Filter items based on active filters and search query
  const filteredItems = items.filter(item => {
    // If it's a legacy type, check if we have legacy matches, otherwise filter by macro_sub key
    const isLegacy = item.categoryKey.startsWith('legacy_');
    const matchesFilter = isLegacy || activeFilters.includes(item.categoryKey);
    
    const matchesSearch = 
      item.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.descripcion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.displayType?.toLowerCase().includes(searchQuery.toLowerCase());
      
    return matchesFilter && matchesSearch;
  });

  const handleLocateOnMap = (item) => {
    setMapCenter([item.ubicacion_lat, item.ubicacion_lng]);
    setMapZoom(16); // High zoom focus
    setShowMap(true); // Open the full-screen map view
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}>
      
      {showMap ? (
        /* ================== FULL SCREEN MAP MODE ================== */
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          zIndex: 999, 
          backgroundColor: '#070b15',
          display: 'flex',
          flexDirection: 'column',
          animation: 'sos-fade-in 0.3s ease'
        }}>
          {/* Map Header Overlay */}
          <div style={{
            position: 'absolute',
            top: 'env(safe-area-inset-top, 16px)',
            left: '1rem',
            right: '1rem',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pointerEvents: 'none'
          }}>
            {/* Go Back button */}
            <button
              onClick={() => setShowMap(false)}
              style={{
                background: 'rgba(19, 28, 46, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid var(--border)',
                borderRadius: '2rem',
                padding: '0.6rem 1.2rem',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                pointerEvents: 'auto'
              }}
            >
              <ArrowLeft size={16} /> Volver a Filtros
            </button>

            {/* Indicator of active points */}
            <div style={{
              background: 'rgba(19, 28, 46, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--border)',
              borderRadius: '2rem',
              padding: '0.6rem 1.2rem',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: '600',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
            }}>
              Mostrando {filteredItems.length} puntos
            </div>
          </div>

          {/* Interactive Leaflet Map */}
          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            style={{ height: '100%', width: '100%', zIndex: 1 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <MapEvents />
            <ChangeMapView center={mapCenter} zoom={mapZoom} />

            {/* Display Filtered Markers */}
            {filteredItems.map((item) => (
              <Marker
                key={item.id}
                position={[item.ubicacion_lat, item.ubicacion_lng]}
                icon={item.icon || legacyIcons.alimentos}
              >
                <Popup>
                  <div style={{ color: '#111', fontSize: '0.85rem', width: '220px', fontFamily: 'var(--font-sans)' }}>
                    <div style={{ 
                      fontSize: '0.65rem', 
                      fontWeight: '800', 
                      textTransform: 'uppercase', 
                      marginBottom: '4px', 
                      color: MACRO_CATEGORIES[item.tipo]?.color || '#2563eb' 
                    }}>
                      {item.displayType}
                    </div>
                    <div style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '4px', lineHeight: '1.2', color: '#1e293b' }}>
                      {item.nombre || item.subtipo}
                    </div>
                    {item.descripcion && (
                      <div style={{ color: '#555', fontSize: '0.8rem', marginBottom: '8px', lineHeight: '1.3' }}>
                        {item.descripcion}
                      </div>
                    )}
                    <a
                      href={`https://wa.me/${item.contacto_whatsapp?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hola, vi tu publicación en el mapa de VenezuelaSOS.')}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '0.4rem',
                        padding: '8px 12px', 
                        backgroundColor: '#25D366', 
                        color: '#fff', 
                        borderRadius: '8px', 
                        textDecoration: 'none', 
                        fontWeight: '700', 
                        fontSize: '0.8rem', 
                        marginTop: '10px',
                        boxShadow: '0 2px 8px rgba(37,211,102,0.3)'
                      }}
                    >
                      <MessageCircle size={14} /> Contactar por WhatsApp
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* User Selected New Marker */}
            {newMarkerPos && (
              <Marker position={[newMarkerPos.lat, newMarkerPos.lng]}>
                <Popup>
                  <div style={{ color: '#1e293b', fontSize: '0.8rem', fontWeight: '700' }}>
                    Nueva ubicación seleccionada
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Floating Instruction overlay */}
          <div style={{
            position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
            zIndex: 1000, pointerEvents: 'none'
          }}>
            <div style={{
              backgroundColor: 'rgba(19, 28, 46, 0.95)', backdropFilter: 'blur(8px)',
              border: '1px solid var(--border)',
              padding: '0.5rem 1rem', borderRadius: '2rem',
              fontSize: '0.75rem', color: '#fff', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
              <MapPin size={14} style={{ color: '#ef4444' }} /> Toca un punto en el mapa para reportar ayuda
            </div>
          </div>

          {/* Floating action button (FAB) to Add report without map tap */}
          <button
            onClick={() => {
              setNewMarkerPos(null);
              setShowForm(true);
            }}
            style={{
              position: 'absolute', bottom: '1.5rem', right: '1.5rem', zIndex: 1000,
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff',
              boxShadow: '0 8px 24px rgba(239,68,68,0.4)',
              transition: 'transform 0.15s ease'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
      ) : (
        /* ================== CONFIGURATION & DIRECTORY MODE ================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'sos-fade-in 0.3s ease' }}>
          
          {/* Guide Header */}
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: '900', color: '#fff', marginBottom: '0.4rem' }}>
              Mapa de Emergencias
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto', lineHeight: '1.5' }}>
              Configura qué ayuda o reportes deseas visualizar antes de ingresar al mapa interactivo.
            </p>
          </div>

          {/* 1. Category Filter Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontWeight: '700', fontSize: '0.9rem' }}>
                <Filter size={16} className="text-primary" />
                <span>1. Configurar Filtros de Mapa</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                <button 
                  onClick={selectAllFilters}
                  style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border)', padding: '0.3rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600' }}
                >
                  Marcar todos
                </button>
                <button 
                  onClick={clearAllFilters}
                  style={{ background: 'var(--bg-surface-soft)', border: '1px solid var(--border)', padding: '0.3rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600' }}
                >
                  Limpiar
                </button>
              </div>
            </div>

            {/* Macro categories grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.keys(MACRO_CATEGORIES).map(macroKey => {
                const macro = MACRO_CATEGORIES[macroKey];
                return (
                  <div 
                    key={macroKey} 
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.01)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '0.875rem', 
                      padding: '0.875rem 1rem' 
                    }}
                  >
                    {/* Macro Title */}
                    <div style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '800', 
                      color: macro.color, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: macro.color }} />
                      {macro.label}
                    </div>

                    {/* Subcategories buttons */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                      gap: '0.5rem' 
                    }}>
                      {Object.keys(macro.sub).map(subKey => {
                        const sub = macro.sub[subKey];
                        const filterKey = `${macroKey}_${subKey}`;
                        const isActive = activeFilters.includes(filterKey);
                        return (
                          <button
                            key={subKey}
                            onClick={() => handleFilterToggle(filterKey)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.6rem 0.8rem',
                              borderRadius: '0.65rem',
                              border: '1px solid',
                              borderColor: isActive ? macro.color : 'var(--border)',
                              backgroundColor: isActive ? `${macro.color}15` : 'var(--bg-surface-soft)',
                              color: isActive ? '#fff' : 'var(--text-secondary)',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '0.75rem',
                              fontWeight: isActive ? '700' : '500',
                              transition: 'all 0.2s',
                              userSelect: 'none',
                              boxShadow: isActive ? `0 0 10px ${macro.color}15` : 'none'
                            }}
                          >
                            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{sub.icon}</span>
                            <span style={{ 
                              whiteSpace: 'nowrap', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis' 
                            }}>
                              {sub.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Open Map Action Button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button
              onClick={() => {
                setMapZoom(13); // Reset zoom
                setShowMap(true);
              }}
              style={{
                width: '100%',
                padding: '1.1rem',
                borderRadius: '0.875rem',
                background: 'linear-gradient(to right, #ffcc00 0% 33.3%, #00247d 33.3% 66.6%, #cf142b 66.6%)',
                border: 'none',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 8px 32px rgba(0, 36, 125, 0.35)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Internal layout to make sure text is high contrast and matches the premium gradient */}
              <div style={{
                position: 'absolute', inset: '1px', borderRadius: '0.8rem',
                backgroundColor: 'rgba(7, 11, 21, 0.9)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                transition: 'background 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(7, 11, 21, 0.82)'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(7, 11, 21, 0.9)'}
              >
                <span>🗺️</span>
                <span>ABRIR MAPA INTERACTIVO</span>
                <span style={{ 
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: 'var(--primary)'
                }}>
                  {filteredItems.length} reportes
                </span>
              </div>
            </button>
          </div>

          {/* 3. Directory Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontWeight: '700', fontSize: '0.9rem' }}>
              <span>2. Directorio de Reportes Activos</span>
            </div>

            {/* Directory Search Bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              backgroundColor: 'var(--bg-surface-soft)', border: '1px solid var(--border)',
              padding: '0.75rem 1rem', borderRadius: '0.875rem'
            }}>
              <Search size={18} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Buscar por palabra clave o categoría..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent', border: 'none', color: '#fff',
                  width: '100%', fontSize: '0.9rem', outline: 'none'
                }}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* List of Report Cards */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Cargando directorio...
              </div>
            ) : filteredItems.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-surface)',
                border: '1px dashed var(--border)', borderRadius: '1rem',
                color: 'var(--text-muted)', fontSize: '0.85rem'
              }}>
                No se encontraron reportes con los filtros o búsquedas seleccionadas.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {filteredItems.map((item) => {
                  const macroColor = MACRO_CATEGORIES[item.tipo]?.color || '#0d9488';
                  return (
                    <div 
                      key={item.id}
                      className="card"
                      style={{ 
                        padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
                        borderLeft: `4px solid ${macroColor}`,
                        backgroundColor: 'var(--bg-surface)'
                      }}
                    >
                      {/* Top Category Indicator */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ 
                          fontSize: '0.65rem', 
                          fontWeight: '800', 
                          color: macroColor, 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.05em' 
                        }}>
                          {item.displayType}
                        </span>
                        
                        {/* Compact Whatsapp link */}
                        <a
                          href={`https://wa.me/${item.contacto_whatsapp.replace(/[^0-9]/g, '')}?text=Hola,%20vi%20tu%20anuncio%20en%20el%20mapa%20de%20VenezuelaSOS.`}
                          target="_blank" rel="noopener noreferrer"
                          style={{
                            fontSize: '0.7rem', fontWeight: '700', color: '#25D366',
                            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem'
                          }}
                        >
                          <MessageCircle size={12} /> WhatsApp
                        </a>
                      </div>

                      {/* Title & Description */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <h4 className="font-display" style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fff', lineHeight: '1.2' }}>
                          {item.nombre || item.subtipo}
                        </h4>
                        {item.descripcion && (
                          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                            {item.descripcion}
                          </p>
                        )}
                        {item.cantidad && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <strong>Cantidad/Estado:</strong> {item.cantidad}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.6rem', marginTop: '0.2rem' }}>
                        <button
                          onClick={() => handleLocateOnMap(item)}
                          style={{
                            flex: 1, padding: '0.5rem', borderRadius: '0.5rem',
                            background: 'var(--bg-surface-soft)', border: '1px solid var(--border)',
                            color: 'var(--primary)', fontWeight: '700', fontSize: '0.75rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: '0.3rem', transition: 'all 0.15s'
                          }}
                          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        >
                          <Navigation2 size={12} style={{ transform: 'rotate(45deg)' }} />
                          📍 Ubicar en el Mapa
                        </button>
                        <a
                          href={`tel:${item.contacto_whatsapp}`}
                          style={{
                            padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                            background: 'var(--bg-surface-soft)', border: '1px solid var(--border)',
                            color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', cursor: 'pointer', textDecoration: 'none'
                          }}
                          title="Llamar"
                        >
                          <Phone size={12} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Sheet — Form for adding a new report */}
      <BottomModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setNewMarkerPos(null); }}
        title={newMarkerPos ? '📍 Nuevo Reporte en el Mapa' : 'Nuevo Reporte en el Mapa'}
      >
        {newMarkerPos ? (
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <MapPin size={14} style={{ color: 'var(--primary)' }} />
            Lat {newMarkerPos.lat.toFixed(5)}, Lng {newMarkerPos.lng.toFixed(5)}
          </div>
        ) : (
          <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#fca5a5' }}>
            💡 Toca un punto exacto en el mapa primero para una mayor precisión, o llena este formulario para usar tu ubicación actual.
          </div>
        )}

        <form onSubmit={handleCreateMarker} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div className="input-group">
            <label className="input-label">Categoría Principal</label>
            <select 
              className="input-field select-field" 
              value={formData.macro} 
              onChange={e => setFormData({ ...formData, macro: e.target.value })}
            >
              {Object.keys(MACRO_CATEGORIES).map(key => (
                <option key={key} value={key}>{MACRO_CATEGORIES[key].label}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Subcategoría Específica</label>
            <select 
              className="input-field select-field" 
              value={formData.sub} 
              onChange={e => setFormData({ ...formData, sub: e.target.value })}
            >
              {Object.keys(MACRO_CATEGORIES[formData.macro].sub).map(key => (
                <option key={key} value={key}>
                  {MACRO_CATEGORIES[formData.macro].sub[key].icon} {MACRO_CATEGORIES[formData.macro].sub[key].label}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Nombre o Título Breve *</label>
            <input 
              className="input-field" 
              placeholder="Ej. Centro de Hidratación / Edificio Colapsado" 
              value={formData.nombre} 
              onChange={e => setFormData({ ...formData, nombre: e.target.value })} 
              required 
            />
          </div>

          <div className="input-group">
            <label className="input-label">Descripción o Detalles</label>
            <textarea 
              className="input-field" 
              style={{ height: '70px', resize: 'none' }} 
              placeholder="Detalles importantes sobre la ayuda o emergencia..." 
              value={formData.descripcion} 
              onChange={e => setFormData({ ...formData, descripcion: e.target.value })} 
            />
          </div>

          <div className="input-group">
            <label className="input-label">WhatsApp de Contacto / Coordinador *</label>
            <input 
              type="tel" 
              className="input-field" 
              placeholder="+584121234567" 
              value={formData.contacto_whatsapp} 
              onChange={e => setFormData({ ...formData, contacto_whatsapp: e.target.value })} 
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              padding: '0.9rem', 
              fontSize: '1rem', 
              background: MACRO_CATEGORIES[formData.macro].color, 
              borderColor: MACRO_CATEGORIES[formData.macro].color 
            }}
          >
            <Plus size={18} /> Añadir al Mapa de Catástrofe
          </button>
        </form>
      </BottomModal>

      {/* Embedded CSS for custom keyframe animations and animations */}
      <style>{`
        @keyframes map-pulse {
          0% {
            transform: scale(1);
            opacity: 0.4;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes sos-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .filter-chip {
          padding: 0.4rem 0.8rem;
          background-color: var(--bg-surface-soft);
          border: 1px solid var(--border);
          border-radius: 2rem;
          color: var(--text-secondary);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .filter-chip.active {
          background-color: var(--primary-glow);
          border-color: var(--primary);
          color: #fff;
        }
      `}</style>
    </div>
  );
}
