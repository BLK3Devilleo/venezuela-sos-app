import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../supabase';
import { Plus, MapPin, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
        width: 36px;
        height: 36px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      ">
        <span style="font-size: 16px; transform: translateY(-1px);">${emoji}</span>
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
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

const MACRO_CATEGORIES = {
  salud: {
    label: 'Salud y Bienestar',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    icon: '❤️',
    sub: {
      'primeros_auxilios': { label: 'Primeros Auxilios', icon: '⚕️' },
      'medicamentos': { label: 'Medicamentos', icon: '💊' },
      'atencion_medica': { label: 'Hospitales / Clínicas', icon: '🏥' },
      'atencion_psicologica': { label: 'Apoyo Mental', icon: '🧠' }
    }
  },
  rescate: {
    label: 'Rescate y Auxilio',
    color: '#ea580c',
    bg: 'rgba(234, 88, 12, 0.1)',
    icon: '🚨',
    sub: {
      'atrapados': { label: 'Auxilio Inmediato', icon: '🚨' },
      'colapsos': { label: 'Zonas de Riesgo', icon: '⚠️' },
      'control': { label: 'Puntos de Control', icon: '🚧' },
      'primeros_auxilios_campo': { label: 'Primeros Auxilios de Campo', icon: '🩹' }
    }
  },
  refugio: {
    label: 'Refugio y Hospedaje',
    color: '#0d9488',
    bg: 'rgba(13, 148, 136, 0.1)',
    icon: '🏠',
    sub: {
      'refugios': { label: 'Refugios Oficiales', icon: '🎪' },
      'acampada': { label: 'Zonas de Acampada', icon: '⛺' },
      'hospedaje': { label: 'Casas de Hospedaje', icon: '🏠' },
      'bano': { label: 'Baños Disponibles', icon: '🚿' }
    }
  },
  suministros: {
    label: 'Alimentos y Agua',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.1)',
    icon: '🍲',
    sub: {
      'comida': { label: 'Comida / Ollas', icon: '🍲' },
      'agua': { label: 'Puntos de Agua', icon: '💧' },
      'donaciones': { label: 'Ropa / Abrigo', icon: '👕' },
      'acopio': { label: 'Centros de Acopio', icon: '📦' }
    }
  },
  servicios_com: {
    label: 'Servicios y Conexión',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.1)',
    icon: '🔌',
    sub: {
      'electricidad': { label: 'Puntos de Carga', icon: '🔌' },
      'internet': { label: 'Zonas WiFi', icon: '📶' },
      'transporte': { label: 'Transporte', icon: '🚌' },
      'combustible': { label: 'Combustible / Gas', icon: '⛽' }
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
  baños: createCustomIcon('#0d9488', '🚿'),
  refugio: createCustomIcon('#0d9488', '🎪'),
  hospedaje: createCustomIcon('#0d9488', '🏠'),
  bano: createCustomIcon('#0d9488', '🚿'),
  medicamentos: createCustomIcon('#ef4444', '💊'),
  servicio_medico: createCustomIcon('#ef4444', '⚕️'),
  servicio_apoyo: createCustomIcon('#ea580c', '🛠️'),
  servicio_comunes: createCustomIcon('#a855f7', '🔌')
};

// Helper to map any resource or service (including legacy ones) to our modern macro/sub categories
const mapItemToModernCategory = (item) => {
  const isResource = item.tipo !== undefined && (item.tipo === 'mueble' || item.tipo === 'inmueble' || MACRO_CATEGORIES[item.tipo]);
  
  if (isResource) {
    const tipo = item.tipo;
    const cat = item.categoria;
    
    // If it already matches our modern schema, keep it!
    if (MACRO_CATEGORIES[tipo] && MACRO_CATEGORIES[tipo].sub[cat]) {
      return { macro: tipo, sub: cat };
    }
    
    // Legacy resources mapping
    if (cat === 'alimentos') {
      return { macro: 'suministros', sub: 'comida' };
    }
    if (cat === 'baños') {
      return { macro: 'refugio', sub: 'bano' }; 
    }
    if (cat === 'refugio') {
      return { macro: 'refugio', sub: 'refugios' };
    }
    if (cat === 'medicamentos') {
      return { macro: 'salud', sub: 'medicamentos' };
    }
    
    // Default fallback for resources
    return { macro: 'suministros', sub: 'acopio' };
  } else {
    // It's a service (from 'servicios' table)
    const tipoServ = item.tipo_servicio; // 'medico' or 'apoyo'
    const subtipo = (item.subtipo || '').toLowerCase();
    
    if (tipoServ === 'medico') {
      if (subtipo.includes('mental') || subtipo.includes('psicol') || subtipo.includes('emocional')) {
        return { macro: 'salud', sub: 'atencion_psicologica' };
      }
      if (subtipo.includes('auxilio') || subtipo.includes('urgenc') || subtipo.includes('emergenc')) {
        return { macro: 'salud', sub: 'primeros_auxilios' };
      }
      if (subtipo.includes('medicamento') || subtipo.includes('pastilla') || subtipo.includes('farmacia')) {
        return { macro: 'salud', sub: 'medicamentos' };
      }
      return { macro: 'salud', sub: 'atencion_medica' };
    }
    
    if (tipoServ === 'apoyo') {
      if (subtipo.includes('luz') || subtipo.includes('energia') || subtipo.includes('carg') || subtipo.includes('electri')) {
        return { macro: 'servicios_com', sub: 'electricidad' };
      }
      if (subtipo.includes('wifi') || subtipo.includes('internet') || subtipo.includes('señal') || subtipo.includes('comun')) {
        return { macro: 'servicios_com', sub: 'internet' };
      }
      if (subtipo.includes('transp') || subtipo.includes('trasla') || subtipo.includes('bus') || subtipo.includes('carro')) {
        return { macro: 'servicios_com', sub: 'transporte' };
      }
      if (subtipo.includes('gas') || subtipo.includes('combust') || subtipo.includes('gasol')) {
        return { macro: 'servicios_com', sub: 'combustible' };
      }
      if (subtipo.includes('rescate') || subtipo.includes('escombro') || subtipo.includes('atrapado') || subtipo.includes('colapso')) {
        return { macro: 'rescate', sub: 'colapsos' };
      }
      if (subtipo.includes('refugio') || subtipo.includes('albergue') || subtipo.includes('carpa')) {
        return { macro: 'refugio', sub: 'refugios' };
      }
      if (subtipo.includes('comida') || subtipo.includes('alimento') || subtipo.includes('sopa') || subtipo.includes('comedor')) {
        return { macro: 'suministros', sub: 'comida' };
      }
      if (subtipo.includes('agua') || subtipo.includes('hidrata') || subtipo.includes('filtro')) {
        return { macro: 'suministros', sub: 'agua' };
      }
      if (subtipo.includes('ropa') || subtipo.includes('manta') || subtipo.includes('abrigo') || subtipo.includes('vestir')) {
        return { macro: 'suministros', sub: 'donaciones' };
      }
    }
    
    // Default fallback for services
    return { macro: 'servicios_com', sub: 'transporte' };
  }
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
  const [activePopupId, setActivePopupId] = useState(null);
  
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

  // Collapsible category cards state
  const [expandedMacros, setExpandedMacros] = useState({
    salud: false,
    rescate: false,
    refugio: false,
    suministros: false,
    servicios_com: false
  });

  // Map positioning state
  const [mapCenter] = useState([10.5000, -66.9000]); // Caracas default
  const [mapZoom] = useState(13);

  // New marker creation state
  const [newMarkerPos, setNewMarkerPos] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    macro: 'salud',
    sub: 'primeros_auxilios',
    nombre: '',
    descripcion: '',
    cantidad: '',
    contacto_whatsapp: user?.contacto || '',
    banoOptions: []
  });

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    console.log('Fetching map data...');
    setLoading(true);
    try {
      const [resRec, resServ] = await Promise.all([
        supabase.from('recursos').select('*'),
        supabase.from('servicios').select('*')
      ]);

      const formattedRecursos = (resRec.data || []).map(r => {
        const modernCat = mapItemToModernCategory(r);
        const cacheKey = `${modernCat.macro}_${modernCat.sub}`;
        const icon = iconsCache[cacheKey] || legacyIcons.alimentos;
        const displayType = `${MACRO_CATEGORIES[modernCat.macro]?.label || 'Recurso'} - ${MACRO_CATEGORIES[modernCat.macro]?.sub[modernCat.sub]?.label || 'Detalle'}`;

        return {
          ...r,
          mapType: 'recurso',
          displayType,
          icon,
          categoryKey: cacheKey,
          tipo: modernCat.macro,
          categoria: modernCat.sub
        };
      });

      const formattedServicios = (resServ.data || []).map(s => {
        const modernCat = mapItemToModernCategory(s);
        const cacheKey = `${modernCat.macro}_${modernCat.sub}`;
        const icon = iconsCache[cacheKey] || legacyIcons.servicio_comunes;
        const displayType = `${MACRO_CATEGORIES[modernCat.macro]?.label || 'Voluntariado'} - ${MACRO_CATEGORIES[modernCat.macro]?.sub[modernCat.sub]?.label || 'Detalle'}`;

        return {
          ...s,
          mapType: 'servicio',
          displayType,
          nombre: s.nombre || s.subtipo,
          icon,
          categoryKey: cacheKey,
          tipo: modernCat.macro,
          categoria: modernCat.sub
        };
      });

      const allItems = [...formattedRecursos, ...formattedServicios].filter(
        item => item.ubicacion_lat != null && item.ubicacion_lng != null
      );
      console.log(`Loaded ${allItems.length} map items in total.`);
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

  const toggleMacroCategory = (macroKey) => {
    const subKeys = Object.keys(MACRO_CATEGORIES[macroKey].sub).map(s => `${macroKey}_${s}`);
    const isAllActive = subKeys.every(k => activeFilters.includes(k));
    
    if (isAllActive) {
      setActiveFilters(prev => prev.filter(f => !subKeys.includes(f)));
    } else {
      setActiveFilters(prev => {
        const clean = prev.filter(f => !subKeys.includes(f));
        return [...clean, ...subKeys];
      });
    }
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

  const toggleMacroCardExpansion = (macroKey) => {
    setExpandedMacros(prev => ({
      ...prev,
      [macroKey]: !prev[macroKey]
    }));
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
        creador_id: user?.id || null,
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
        cantidad: '',
        banoOptions: []
      });
      fetchMapData();
    } catch (err) {
      console.error(err);
      alert('Error creando reporte en el mapa');
    }
  };

  // Filter items based on active filters
  const filteredItems = items.filter(item => activeFilters.includes(item.categoryKey));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', width: '100%' }}>
      
      {/* Main Container */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1.5rem', 
        animation: 'sos-fade-in 0.3s ease', 
        width: '100%', 
        padding: '1rem 1.25rem', 
        paddingBottom: '5rem' 
      }}>
        
        {/* Title Header */}
        <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
          <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: '900', color: '#fff', marginBottom: '0.4rem' }}>
            Mapa de Emergencias
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto', lineHeight: '1.5' }}>
            Red comunitaria en tiempo real. Gestiona la ayuda para Venezuela de forma transparente y eficiente.
          </p>
        </div>

        {/* 1. Disclaimer Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.1) 0%, rgba(29, 78, 216, 0.1) 100%)',
          border: '1px solid rgba(13, 148, 136, 0.2)',
          padding: '1.5rem',
          borderRadius: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px',
            background: 'linear-gradient(to bottom, #ffcc00, #00247d, #cf142b)' // Venezuela tricolor
          }} />
          <h2 className="font-display" style={{ fontSize: '1.25rem', fontWeight: '900', color: '#fff', margin: 0 }}>
            Antes de ver el mapa, configura qué quieres ver
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
            Personaliza el mapa marcando o desmarcando categorías a continuación. Esto filtrará tanto los pines en el mapa interactivo como el listado del directorio en tiempo real.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              onClick={selectAllFilters}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.75rem', borderRadius: '2rem', background: 'var(--bg-surface-soft)', border: '1px solid var(--border)', color: '#fff', cursor: 'pointer', fontWeight: '700' }}
            >
              👀 Mostrar Todo
            </button>
            <button 
              onClick={clearAllFilters}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.75rem', borderRadius: '2rem', background: 'var(--bg-surface-soft)', border: '1px solid var(--border)', color: '#fff', cursor: 'pointer', fontWeight: '700' }}
            >
              🧹 Limpiar
            </button>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '0.35rem', 
              fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginLeft: 'auto' 
            }}>
              <span className="live-pulse" style={{ backgroundColor: activeFilters.length > 0 ? '#10b981' : '#ef4444' }} />
              <span>{activeFilters.length} filtros activos</span>
            </div>
          </div>
        </div>

        {/* 2. The Map Container (Inline by default) */}
        <div style={{
          position: 'relative',
          height: '400px',
          width: '100%',
          borderRadius: '1.25rem',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          marginBottom: '0.5rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          {loading && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(7, 11, 21, 0.6)',
              zIndex: 10,
              color: '#fff',
              fontWeight: '700'
            }}>
              Cargando mapa...
            </div>
          )}
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
                eventHandlers={{
                  click: () => setActivePopupId(item.id)
                }}
              >
                {activePopupId === item.id && (
                  <Popup position={[item.ubicacion_lat, item.ubicacion_lng]} onClose={() => setActivePopupId(null)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#f8fafc' }}>
                      <div style={{ 
                        fontSize: '0.65rem', 
                        fontWeight: '800', 
                        textTransform: 'uppercase', 
                        color: MACRO_CATEGORIES[item.tipo]?.color || '#2563eb',
                        letterSpacing: '0.05em'
                      }}>
                        {item.displayType}
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#fff', lineHeight: '1.2' }}>
                        {item.nombre || item.subtipo}
                      </div>
                      {item.descripcion && (
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.4', marginTop: '2px' }}>
                          {item.descripcion}
                        </div>
                      )}
                      {item.cantidad && (
                        <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>
                          <strong>Cantidad/Estado:</strong> {item.cantidad}
                        </div>
                      )}
                      <a
                        href={`https://wa.me/${item.contacto_whatsapp?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hola, vi tu publicación en el mapa de filoSOS.')}`}
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
                          marginTop: '8px',
                          boxShadow: '0 2px 8px rgba(37,211,102,0.3)'
                        }}
                      >
                        <MessageCircle size={14} /> Contactar por WhatsApp
                      </a>
                    </div>
                  </Popup>
                )}
              </Marker>
            ))}

            {/* User Selected New Marker */}
            {newMarkerPos && (
              <Marker position={[newMarkerPos.lat, newMarkerPos.lng]}>
                <Popup>
                  <div style={{ color: '#f8fafc', fontSize: '0.8rem', fontWeight: '700' }}>
                    Nueva ubicación seleccionada
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Floating Instruction overlay */}
          <div style={{
            position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
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
              <MapPin size={14} style={{ color: '#ef4444' }} /> Toca el mapa para reportar ayuda en ese punto
            </div>
          </div>
        </div>

        {/* 3. The Filter Cards Grid (Collapsible below map) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.keys(MACRO_CATEGORIES).map(macroKey => {
            const macro = MACRO_CATEGORIES[macroKey];
            const subKeys = Object.keys(macro.sub).map(s => `${macroKey}_${s}`);
            const activeCount = subKeys.filter(k => activeFilters.includes(k)).length;
            const allSubKeysCount = subKeys.length;
            const isAllActive = activeCount === allSubKeysCount;
            const isExpanded = expandedMacros[macroKey];
            
            return (
              <div 
                key={macroKey} 
                className="card"
                style={{ 
                  borderColor: activeCount > 0 ? `${macro.color}40` : 'var(--border)',
                  boxShadow: activeCount > 0 ? `0 8px 30px ${macro.color}08` : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: isExpanded ? '1rem' : '0px',
                  padding: '1.25rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-surface)'
                }}
                onClick={() => toggleMacroCardExpansion(macroKey)}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ 
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%', 
                      backgroundColor: `${macro.color}15`,
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: macro.color,
                      fontSize: '1rem'
                    }}>
                      {macro.icon}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <h4 className="font-display" style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', lineHeight: '1.2', margin: 0 }}>
                        {macro.label}
                      </h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {activeCount} de {allSubKeysCount} activos
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => toggleMacroCategory(macroKey)}
                      style={{
                        background: activeCount > 0 ? `${macro.color}15` : 'var(--bg-surface-soft)',
                        border: '1px solid',
                        borderColor: activeCount > 0 ? `${macro.color}30` : 'var(--border)',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '2rem',
                        fontSize: '0.7rem',
                        color: activeCount > 0 ? '#fff' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontWeight: '700',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isAllActive ? 'Ocultar todo' : 'Mostrar todo'}
                    </button>
                    <div 
                      onClick={() => toggleMacroCardExpansion(macroKey)}
                      style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0.2rem' }}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>

                {/* Subcategories grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', 
                  gap: '0.5rem',
                  maxHeight: isExpanded ? '500px' : '0px',
                  opacity: isExpanded ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  pointerEvents: isExpanded ? 'auto' : 'none'
                }} onClick={e => e.stopPropagation()}>
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
                          gap: '0.45rem',
                          padding: '0.65rem 0.8rem',
                          borderRadius: '0.65rem',
                          border: '1px solid',
                          borderColor: isActive ? macro.color : 'var(--border)',
                          backgroundColor: isActive ? `${macro.color}18` : 'var(--bg-surface-soft)',
                          color: isActive ? '#fff' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '0.75rem',
                          fontWeight: isActive ? '800' : '500',
                          transition: 'all 0.2s ease',
                          userSelect: 'none',
                          boxShadow: isActive ? `0 2px 10px ${macro.color}15` : 'none'
                        }}
                      >
                        <span style={{ fontSize: '1.05rem', flexShrink: 0 }}>{sub.icon}</span>
                        <span style={{ 
                          lineHeight: '1.25',
                          wordBreak: 'break-word'
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

      {/* Floating Action Button (FAB) to Add report without map tap */}
      <button
        onClick={() => {
          setNewMarkerPos(null);
          setShowForm(true);
        }}
        style={{
          position: 'fixed', 
          bottom: '2rem', 
          right: '2rem', 
          zIndex: 1000,
          width: '56px', 
          height: '56px', 
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          border: 'none',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          cursor: 'pointer', 
          color: '#fff',
          boxShadow: '0 8px 24px rgba(239,68,68,0.4)',
          transition: 'transform 0.15s ease'
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Plus size={24} strokeWidth={3} />
      </button>

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
              {MACRO_CATEGORIES[formData.macro] && Object.keys(MACRO_CATEGORIES[formData.macro].sub).map(key => (
                <option key={key} value={key}>
                  {MACRO_CATEGORIES[formData.macro].sub[key].icon} {MACRO_CATEGORIES[formData.macro].sub[key].label}
                </option>
              ))}
            </select>
          </div>

          {formData.sub === 'bano' && (
            <div className="input-group" style={{ marginTop: '-0.25rem', marginBottom: '0.25rem' }}>
              <label className="input-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Servicios del Baño Disponibles</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                {[
                  { id: 'wc', label: 'WC / Necesidades Básicas 🚽' },
                  { id: 'ducha', label: 'Ducha disponible 🚿' },
                  { id: 'limpieza', label: 'Solo limpieza / Lavado de manos 🧼' }
                ].map(opt => {
                  const isChecked = (formData.banoOptions || []).includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        const currentOpts = formData.banoOptions || [];
                        const nextOpts = currentOpts.includes(opt.id)
                          ? currentOpts.filter(o => o !== opt.id)
                          : [...currentOpts, opt.id];
                        
                        const labels = {
                          wc: 'WC/Necesidades básicas',
                          ducha: 'Ducha disponible',
                          limpieza: 'Solo limpieza/lavado'
                        };
                        const selectedLabels = nextOpts.map(o => labels[o]).join(', ');
                        
                        setFormData(prev => ({
                          ...prev,
                          banoOptions: nextOpts,
                          descripcion: selectedLabels 
                            ? `Servicios disponibles: ${selectedLabels}. ${prev.descripcion.replace(/^Servicios disponibles: [^.]*\.?\s*/, '')}`
                            : prev.descripcion.replace(/^Servicios disponibles: [^.]*\.?\s*/, '')
                        }));
                      }}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '2rem',
                        border: '1px solid',
                        borderColor: isChecked ? 'var(--primary)' : 'var(--border)',
                        background: isChecked ? 'var(--primary-glow)' : 'var(--bg-surface-soft)',
                        color: isChecked ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
            <label className="input-label">WhatsApp de Contacto *</label>
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
              background: MACRO_CATEGORIES[formData.macro]?.color || 'var(--primary)', 
              borderColor: MACRO_CATEGORIES[formData.macro]?.color || 'var(--primary)',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            <Plus size={18} /> Añadir al Mapa de Catástrofe
          </button>
        </form>
      </BottomModal>

      {/* Embedded CSS for custom keyframe animations */}
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
        @keyframes sos-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Custom Leaflet Popup styling */
        .leaflet-popup-content-wrapper {
          background: #131c2e !important;
          color: #f8fafc !important;
          border-radius: 12px !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important;
          padding: 0 !important;
          overflow: hidden;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          padding: 12px 16px !important;
          width: 240px !important;
          line-height: 1.4;
          font-family: var(--font-sans), sans-serif !important;
        }
        .leaflet-popup-tip {
          background: #131c2e !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        .leaflet-container a.leaflet-popup-close-button {
          color: #94a3b8 !important;
          padding: 6px 6px 0 0 !important;
        }
        .leaflet-container a.leaflet-popup-close-button:hover {
          color: #f8fafc !important;
        }

        .live-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          animation: pulse-dot 2s infinite ease-in-out;
        }
        @keyframes pulse-dot {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
