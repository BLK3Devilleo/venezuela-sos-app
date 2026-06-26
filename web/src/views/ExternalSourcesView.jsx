import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Heart, ClipboardList, Map, AlertTriangle, 
  Search, Plus, MapPin, CheckCircle, ExternalLink, Calendar, Clock, Phone, FileText 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Leaflet default marker config fixes
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom markers for help points
const createHelpIcon = (color) => {
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.3)"></div>`,
    className: 'custom-help-marker',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const HELP_COLORS = {
  Comida: '#ea580c',
  Medicinas: '#dc2626',
  Transporte: '#2563eb',
  Refugio: '#0d9488',
  Suministros: '#16a34a',
  Otro: '#7c3aed'
};

export default function ExternalSourcesView() {
  const [activeTab, setActiveTab] = useState('hospitalized');

  // --- SECCIÓN 1: PERSONAS HOSPITALIZADAS ---
  const [hospQuery, setHospQuery] = useState('');
  const [hospCedula, setHospCedula] = useState('');
  const [hospClinic, setHospClinic] = useState('all');
  const [hospitalizedData, setHospitalizedData] = useState([]);
  const [hospLoading, setHospLoading] = useState(false);

  // Mock initial hospitalized database from external API simulation
  const mockHospitalized = [
    { id: 'h1', name: 'Santiago José Guerrero', id_number: '12.482.019', hospital: 'Hospital Domingo Luciani', status: 'Estable - En observación', last_update: 'Hace 40 minutos' },
    { id: 'h2', name: 'Amanda Sofía Pérez', id_number: '28.192.551', hospital: 'Clínica El Avila', status: 'Estable - Dada de alta', last_update: 'Hace 2 horas' },
    { id: 'h3', name: 'Luis Alfredo Ramos', id_number: '9.481.302', hospital: 'Hospital Pérez Carreño', status: 'Cuidado Intensivo', last_update: 'Hace 10 minutos' },
    { id: 'h4', name: 'Gabriela Elena Castro', id_number: '21.038.992', hospital: 'Centro Médico Docente La Trinidad', status: 'Estable - En planta', last_update: 'Hace 1 hora' },
    { id: 'h5', name: 'Francisco Antonio Rivas', id_number: '15.940.320', hospital: 'Hospital Domingo Luciani', status: 'Crítico - Quirófano', last_update: 'Hace 5 minutos' }
  ];

  useEffect(() => {
    setHospLoading(true);
    // Simular fetch de endpoint externo
    const timer = setTimeout(() => {
      setHospitalizedData(mockHospitalized);
      setHospLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredHospitalized = hospitalizedData.filter(h => {
    const matchesName = h.name.toLowerCase().includes(hospQuery.toLowerCase());
    const matchesCedula = h.id_number.includes(hospCedula);
    const matchesHospital = hospClinic === 'all' || h.hospital === hospClinic;
    return matchesName && matchesCedula && matchesHospital;
  });

  // --- SECCIÓN 2: VOLUNTARIADO ---
  const [volLocation, setVolLocation] = useState('');
  const [volHelpType, setVolHelpType] = useState('Comida');
  const [volDate, setVolDate] = useState('');
  const [volTime, setVolTime] = useState('');
  const [volContact, setVolContact] = useState('');
  const [volNotes, setVolNotes] = useState('');
  
  const [mapHelpType, setMapHelpType] = useState('all');
  const [mapStatus, setMapStatus] = useState('all');
  
  // Mock de ayudas activas en el mapa
  const [activeHelps, setActiveHelps] = useState([
    { id: 'ap1', location: 'Plaza Bolívar de Macuto', help_type: 'Comida', status: 'En curso', volunteer_count: 5, lat: 10.6133, lng: -66.8833 },
    { id: 'ap2', location: 'Hospital Dr. José María Vargas', help_type: 'Medicinas', status: 'Planificada', volunteer_count: 2, lat: 10.6092, lng: -66.9322 },
    { id: 'ap3', location: 'Refugio Escuela República de El Salvador', help_type: 'Refugio', status: 'En curso', volunteer_count: 8, lat: 10.6055, lng: -66.9125 },
    { id: 'ap4', location: 'Distribuidor Altamira, Caracas', help_type: 'Transporte', status: 'Finalizada', volunteer_count: 4, lat: 10.4963, lng: -66.8492 }
  ]);

  const handleRegisterVolunteer = async (e) => {
    e.preventDefault();
    if (!volLocation.trim()) return alert('La ubicación es obligatoria');
    
    const newHelp = {
      id: `ap_${Date.now()}`,
      location: volLocation.trim(),
      help_type: volHelpType,
      status: 'Planificada',
      volunteer_count: 1,
      lat: 10.5000 + (Math.random() - 0.5) * 0.1, // Coordenadas ficticias cerca de Caracas
      lng: -66.9000 + (Math.random() - 0.5) * 0.1
    };

    setActiveHelps(prev => [newHelp, ...prev]);
    alert('Ayuda registrada con éxito. Se enviará a la API federada.');
    
    // Limpiar campos
    setVolLocation('');
    setVolDate('');
    setVolTime('');
    setVolContact('');
    setVolNotes('');
  };

  const filteredMapHelps = activeHelps.filter(h => {
    const matchesType = mapHelpType === 'all' || h.help_type === mapHelpType;
    const matchesStatus = mapStatus === 'all' || h.status === mapStatus;
    return matchesType && matchesStatus;
  });

  // --- SECCIÓN 3: RECURSOS Y SUMINISTROS ---
  const [acopios, setAcopios] = useState([
    { id: 'ac1', name: 'Caritas La Guaira', category: 'Comida', location: 'Av. Soublette, Edif. Diocesano', schedule: '8:00 AM a 4:00 PM', contact: '0412-3382944', description: 'Recepción de alimentos no perecederos y agua potable.' },
    { id: 'ac2', name: 'Cruz Roja Seccional Caracas', category: 'Medicina', location: 'San Bernardino, Av. Andrés Bello', schedule: '24 Horas', contact: '0212-5743511', description: 'Recepción exclusiva de insumos de primeros auxilios y kits de trauma.' },
    { id: 'ac3', name: 'Refugio Parroquia San Sebastián', category: 'Refugio', location: 'Maiquetía, Detrás de la Iglesia', schedule: 'Todo el día', contact: '0414-2938102', description: 'Hospedaje temporal con capacidad para 40 personas.' }
  ]);

  const [acName, setAcName] = useState('');
  const [acCategory, setAcCategory] = useState('Comida');
  const [acLocation, setAcLocation] = useState('');
  const [acSchedule, setAcSchedule] = useState('');
  const [acContact, setAcContact] = useState('');
  const [acDesc, setAcDesc] = useState('');

  const handleRegisterAcopio = (e) => {
    e.preventDefault();
    if (!acName.trim() || !acLocation.trim() || !acContact.trim()) return alert('Por favor, rellene los campos obligatorios.');

    const newAc = {
      id: `ac_${Date.now()}`,
      name: acName.trim(),
      category: acCategory,
      location: acLocation.trim(),
      schedule: acSchedule.trim() || 'No especificado',
      contact: acContact.trim(),
      description: acDesc.trim()
    };

    setAcopios(prev => [newAc, ...prev]);
    alert('Centro de acopio registrado con éxito.');
    
    // Resetear formulario
    setAcName('');
    setAcLocation('');
    setAcSchedule('');
    setAcContact('');
    setAcDesc('');
  };

  // --- SECCIÓN 4: TABLÓN / DIRECTORIO ---
  const [boardCat, setBoardCat] = useState('all');
  const [boardLoc, setBoardLoc] = useState('');
  
  const mockBoardData = [
    { id: 'b1', title: 'Traslado médico solicitado', category: 'Personas', location: 'Macuto', contact: '0412-9201923', short_desc: 'Se requiere ambulancia o vehículo de apoyo para trasladar paciente estable.', column: 'urgent' },
    { id: 'b2', title: 'Llegada de camión de agua potable', category: 'Recursos', location: 'Caraballeda', contact: '0424-3829102', short_desc: 'Punto de recolección de agua habilitado frente al polideportivo.', column: 'general_info' },
    { id: 'b3', title: 'Coordinación de brigadas de búsqueda', category: 'Coordinación', location: 'San Bernardino', contact: '0212-6067111', short_desc: 'Reunión general a las 8:00 AM para delimitar cuadrantes.', column: 'coordination' }
  ];

  const filteredBoard = mockBoardData.filter(item => {
    const matchesCat = boardCat === 'all' || item.category === boardCat;
    const matchesLoc = item.location.toLowerCase().includes(boardLoc.toLowerCase());
    return matchesCat && matchesLoc;
  });

  // --- SECCIÓN 5: REUNIENDO FAMILIAS ---
  const [disclaimerExpanded, setDisclaimerExpanded] = useState(true);

  return (
    <div className="fade-in" style={{ paddingBottom: '3rem', paddingTop: '0.5rem' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 className="font-display" style={{ fontSize: '1.65rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🌐 Red Solidaria Federada
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Módulos unificados que indexan APIs y reportes en tiempo real para coordinar la ayuda.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', marginBottom: '1.5rem', paddingBottom: '0.25rem' }} className="hide-scrollbar">
        {[
          { id: 'hospitalized', label: '🏥 Hospitalizados', tabName: 'hospitalized' },
          { id: 'volunteers', label: '🤝 Voluntariado', tabName: 'volunteers' },
          { id: 'acopios', label: '📦 Suministros/Acopios', tabName: 'acopios' },
          { id: 'board', label: '📋 Tablón de Avisos', tabName: 'board' },
          { id: 'families', label: '👨‍👩‍👧‍👦 Minor Disclaimer', tabName: 'families' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.tabName)}
            style={{
              padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer',
              whiteSpace: 'nowrap', border: '1px solid',
              backgroundColor: activeTab === tab.tabName ? 'var(--primary)' : 'var(--bg-surface-soft)',
              borderColor: activeTab === tab.tabName ? 'var(--primary)' : 'var(--border)',
              color: activeTab === tab.tabName ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: HOSPITALIZADOS */}
      {activeTab === 'hospitalized' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Filtro de Personas Hospitalizadas
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Nombre</label>
                  <input className="input-field" placeholder="Buscar por nombre..." value={hospQuery} onChange={e => setHospQuery(e.target.value)} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Cédula</label>
                  <input className="input-field" placeholder="Buscar por cédula..." value={hospCedula} onChange={e => setHospCedula(e.target.value)} />
                </div>
              </div>
              
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Hospital / Clínica</label>
                <select className="input-field select-field" value={hospClinic} onChange={e => setHospClinic(e.target.value)}>
                  <option value="all">Todos los Centros Médicos</option>
                  <option value="Hospital Domingo Luciani">Hospital Domingo Luciani</option>
                  <option value="Hospital Pérez Carreño">Hospital Pérez Carreño</option>
                  <option value="Clínica El Avila">Clínica El Avila</option>
                  <option value="Centro Médico Docente La Trinidad">Centro Médico Docente La Trinidad</option>
                </select>
              </div>
            </div>
          </div>

          {hospLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Consultando base de datos hospitalaria federada...</div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
              {filteredHospitalized.map(h => (
                <div key={h.id} className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: '800', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', alignSelf: 'flex-start', textTransform: 'uppercase' }}>
                    🏥 Registro Remoto Oficial
                  </span>
                  
                  <h4 className="font-display" style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                    {h.name}
                  </h4>
                  
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem', margin: '0.25rem 0' }}>
                    <div>Cédula: <strong>{h.id_number}</strong></div>
                    <div>Centro de salud: <strong>{h.hospital}</strong></div>
                    <div>Estado: <strong style={{ color: '#10b981' }}>{h.status}</strong></div>
                  </div>
                  
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>Actualización: {h.last_update}</span>
                    <a href="#" onClick={e => e.preventDefault()} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Ver Detalles ➔</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VOLUNTARIOS / AYUDAS ACTIVAS */}
      {activeTab === 'volunteers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Formulario */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              ¿Vas a prestar ayuda? Registrar ubicación de salida
            </h3>
            
            <form onSubmit={handleRegisterVolunteer} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Zona o Ubicación *</label>
                  <input className="input-field" placeholder="Ej. Plaza Altamira, Caracas" value={volLocation} onChange={e => setVolLocation(e.target.value)} required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Tipo de Ayuda *</label>
                  <select className="input-field select-field" value={volHelpType} onChange={e => setVolHelpType(e.target.value)}>
                    <option value="Comida">Comida</option>
                    <option value="Medicinas">Medicinas</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Refugio">Refugio</option>
                    <option value="Suministros">Suministros</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Fecha *</label>
                  <input className="input-field" type="date" value={volDate} onChange={e => setVolDate(e.target.value)} required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Hora Aproximada</label>
                  <input className="input-field" type="time" value={volTime} onChange={e => setVolTime(e.target.value)} />
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Contacto (WhatsApp / Celular)</label>
                <input className="input-field" placeholder="Ej. 04241234567" value={volContact} onChange={e => setVolContact(e.target.value)} />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Notas o Materiales que llevas</label>
                <textarea className="input-field" style={{ height: '60px', resize: 'none' }} placeholder="Describa brevemente..." value={volNotes} onChange={e => setVolNotes(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }}>
                Registrar y Coordinar Ayuda
              </button>
            </form>
          </div>

          {/* Mapa y Filtros */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)' }}>Mapa de Ayuda Voluntaria en Vivo</div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select className="input-field select-field" style={{ padding: '0.35rem 2rem 0.35rem 0.75rem', fontSize: '0.75rem', width: 'auto' }} value={mapHelpType} onChange={e => setMapHelpType(e.target.value)}>
                  <option value="all">Todos los tipos</option>
                  <option value="Comida">Comida</option>
                  <option value="Medicinas">Medicinas</option>
                  <option value="Refugio">Refugio</option>
                </select>
                <select className="input-field select-field" style={{ padding: '0.35rem 2rem 0.35rem 0.75rem', fontSize: '0.75rem', width: 'auto' }} value={mapStatus} onChange={e => setMapStatus(e.target.value)}>
                  <option value="all">Todos los estados</option>
                  <option value="Planificada">Planificada</option>
                  <option value="En curso">En curso</option>
                  <option value="Finalizada">Finalizada</option>
                </select>
              </div>
            </div>

            {/* Map frame */}
            <div style={{ height: '350px', borderRadius: '1.25rem', overflow: 'hidden', border: '1px solid var(--border)', zIndex: 1 }}>
              <MapContainer center={[10.6092, -66.9125]} zoom={12} style={{ width: '100%', height: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {filteredMapHelps.map(h => (
                  <Marker 
                    key={h.id} 
                    position={[h.lat, h.lng]} 
                    icon={createHelpIcon(HELP_COLORS[h.help_type] || '#7c3aed')}
                  >
                    <Popup>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>{h.location}</div>
                        <div>Ayuda: <strong style={{ color: HELP_COLORS[h.help_type] }}>{h.help_type}</strong></div>
                        <div>Voluntarios activos: <strong>{h.volunteer_count}</strong></div>
                        <div style={{ marginTop: '4px' }}>Estado: <span style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 4px', borderRadius: '3px', backgroundColor: 'var(--bg-surface-soft)' }}>{h.status}</span></div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RECURSOS Y SUMINISTROS (CENTROS DE ACOPIO) */}
      {activeTab === 'acopios' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Registrar Nuevo Centro de Acopio o Suministro
            </h3>
            
            <form onSubmit={handleRegisterAcopio} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Nombre del Centro *</label>
                  <input className="input-field" placeholder="Ej. Iglesia Maiquetía" value={acName} onChange={e => setAcName(e.target.value)} required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Categoría *</label>
                  <select className="input-field select-field" value={acCategory} onChange={e => setAcCategory(e.target.value)}>
                    <option value="Comida">Comida</option>
                    <option value="Medicina">Medicina</option>
                    <option value="Refugio">Refugio</option>
                    <option value="Suministros varios">Suministros varios</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Ubicación *</label>
                  <input className="input-field" placeholder="Dirección detallada" value={acLocation} onChange={e => setAcLocation(e.target.value)} required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Contacto (Teléfono/WhatsApp) *</label>
                  <input className="input-field" placeholder="Ej. 04121234567" value={acContact} onChange={e => setAcContact(e.target.value)} required />
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Horarios de Atención *</label>
                <input className="input-field" placeholder="Ej. Lunes a Viernes 8 AM a 5 PM" value={acSchedule} onChange={e => setAcSchedule(e.target.value)} required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Descripción Breve</label>
                <textarea className="input-field" style={{ height: '60px', resize: 'none' }} placeholder="Detalles de insumos requeridos..." value={acDesc} onChange={e => setAcDesc(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }}>
                Registrar Centro de Acopio
              </button>
            </form>
          </div>

          {/* Listado en galería */}
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
            {acopios.map(ac => (
              <div key={ac.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: '800', backgroundColor: 'var(--bg-surface-soft)', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', color: 'var(--primary)' }}>
                    📦 {ac.category}
                  </span>
                </div>

                <h4 className="font-display" style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0.25rem 0 0 0', color: 'var(--text-primary)' }}>
                  {ac.name}
                </h4>

                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {ac.description || 'Sin descripción adicional.'}
                </p>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <div>📍 <strong>Dirección:</strong> {ac.location}</div>
                  <div>🕒 <strong>Horarios:</strong> {ac.schedule}</div>
                  <div>📞 <strong>Contacto:</strong> {ac.contact}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TABLÓN / DIRECTORIO */}
      {activeTab === 'board' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Filtros */}
          <div className="card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
              <label className="input-label">Categoría</label>
              <select className="input-field select-field" value={boardCat} onChange={e => setBoardCat(e.target.value)} style={{ padding: '0.45rem 2rem 0.45rem 0.75rem', fontSize: '0.8rem' }}>
                <option value="all">Todas las Categorías</option>
                <option value="Personas">Personas</option>
                <option value="Recursos">Recursos</option>
                <option value="Refugios">Refugios</option>
                <option value="Coordinación">Coordinación</option>
                <option value="Noticias">Noticias</option>
              </select>
            </div>
            <div className="input-group" style={{ marginBottom: 0, flex: 1.5, minWidth: '180px' }}>
              <label className="input-label">Ubicación</label>
              <input className="input-field" placeholder="Ej. Macuto..." value={boardLoc} onChange={e => setBoardLoc(e.target.value)} style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }} />
            </div>
          </div>

          {/* Columnas Kanban del Tablón */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', alignItems: 'flex-start' }}>
            
            {/* Columna 1: Información general */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 1rem 0', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border)', fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                📋 Información General
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredBoard.filter(item => item.column === 'general_info').map(card => (
                  <div key={card.id} className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', border: '1.5px solid var(--border)' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '800', color: 'var(--text-primary)' }}>{card.title}</div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{card.short_desc}</p>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                      <span>📍 {card.location}</span>
                      <span>📞 {card.contact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Columna 2: Urgente */}
            <div style={{ backgroundColor: 'rgba(220,38,38,0.04)', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(220,38,38,0.15)' }}>
              <h4 style={{ margin: '0 0 1rem 0', paddingBottom: '0.5rem', borderBottom: '2px solid #ef4444', fontSize: '0.95rem', fontWeight: '800', color: '#fca5a5' }}>
                🚨 Solicitudes Urgentes
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredBoard.filter(item => item.column === 'urgent').map(card => (
                  <div key={card.id} className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', border: '1.5px solid rgba(220,38,38,0.3)', backgroundColor: 'var(--bg-surface)' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '800', color: '#fca5a5' }}>{card.title}</div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{card.short_desc}</p>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                      <span>📍 {card.location}</span>
                      <span style={{ color: '#ef4444' }}>📞 {card.contact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Columna 3: Coordinación */}
            <div style={{ backgroundColor: 'rgba(168,85,247,0.04)', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(168,85,247,0.15)' }}>
              <h4 style={{ margin: '0 0 1rem 0', paddingBottom: '0.5rem', borderBottom: '2px solid #a855f7', fontSize: '0.95rem', fontWeight: '800', color: '#d8b4fe' }}>
                ⚡ Coordinación Logística
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredBoard.filter(item => item.column === 'coordination').map(card => (
                  <div key={card.id} className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', border: '1.5px solid rgba(168,85,247,0.3)' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '800', color: 'var(--text-primary)' }}>{card.title}</div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{card.short_desc}</p>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                      <span>📍 {card.location}</span>
                      <span>📞 {card.contact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 5: MINOR SAFETY DISCLAIMER */}
      {activeTab === 'families' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
              Seguridad Familiar y Protección de Menores
            </h3>
            
            <details 
              open={disclaimerExpanded} 
              onToggle={(e) => setDisclaimerExpanded(e.target.open)}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                border: '1.5px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '0.75rem',
                padding: '1rem',
                cursor: 'pointer'
              }}
            >
              <summary style={{ fontWeight: '800', color: '#ef4444', outline: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', userSelect: 'none' }}>
                <AlertTriangle size={18} /> AVISO DE SEGURIDAD SOBRE MENORES
              </summary>
              <div style={{ cursor: 'default', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.6', marginTop: '0.75rem' }}>
                Entregar un niño o niña a una persona desconocida es extremadamente delicado. Recordamos lo sucedido en Vargas para evitar que se repita. Verifica siempre la identidad y la legitimidad de quien recibe o traslada a menores, y prioriza canales oficiales y personas debidamente identificadas.
              </div>
            </details>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
              Si deseas registrar un reporte de búsqueda de menores de edad o reportar que has localizado a un niño extraviado, por favor ingresa al panel principal del reencuentro de familias:
            </p>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <button 
                onClick={() => window.location.reload()}
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #fb7185 0%, #dc2626 100%)', color: '#fff', border: 'none', fontWeight: 'bold' }}
              >
                Acceder a Módulo Reuniendo Familias ➔
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
