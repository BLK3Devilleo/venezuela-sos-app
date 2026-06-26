import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Activity, Plus, Search, MessageCircle, Heart, User, Clock, Trash2, Phone, MapPin, Wrench, Truck, Info } from 'lucide-react';
import BottomModal from '../components/BottomModal';
import { z } from 'zod';

const phoneRegex = /^\d{7,15}$/;
const formSchema = z.object({
  tipo_servicio: z.enum(['medico', 'apoyo']),
  subtipo: z.string().min(3, "Mínimo 3 letras").max(100, "Muy largo"),
  rol_servicio: z.enum(['ofrece', 'solicita']),
  descripcion: z.string().max(500, "Máximo 500 caracteres").optional(),
  disponibilidad: z.string().max(100, "Muy largo").optional(),
  contacto_whatsapp: z.string().regex(phoneRegex, "Teléfono inválido. Solo números y máximo 15 dígitos."),
  nombre_contacto: z.string().min(2, "Requerido"),
  ubicacion_gmaps: z.string().url("Enlace inválido").or(z.literal('')).optional(),
  que_hace: z.string().optional(),
  que_aporta: z.string().optional(),
  horarios: z.string().optional(),
  tiene_herramientas: z.boolean().optional(),
  tiene_transporte: z.boolean().optional(),
  danos_que_tiene: z.string().optional(),
  danos_que_repara: z.string().optional(),
  que_necesita: z.string().optional(),
  que_ofrece: z.string().optional()
});

export default function ServicesView({ user, onViewProfile, isChild = false, onRequireLogin }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); 
  const [filterRole, setFilterRole] = useState('all'); 
  const [showAddForm, setShowAddForm] = useState(false);
  const [selected, setSelected] = useState(null);

  const getInitialForm = () => ({
    tipo_servicio: 'medico', subtipo: '', rol_servicio: 'ofrece',
    descripcion: '', disponibilidad: '', contacto_whatsapp: user?.contacto || '',
    nombre_contacto: user?.nombre || '', ubicacion_gmaps: '', que_hace: '', que_aporta: '',
    horarios: '', tiene_herramientas: false, tiene_transporte: false,
    danos_que_tiene: '', danos_que_repara: '', que_necesita: '', que_ofrece: ''
  });

  const [formData, setFormData] = useState(getInitialForm());
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('servicios')
        .select('*, creador:usuarios(*)')
        .order('created_at', { ascending: false });
      setServices(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const result = formSchema.safeParse(formData);
    if (!result.success) {
      const errors = {};
      result.error.issues.forEach(err => {
        errors[err.path[0]] = err.message;
      });
      setFormErrors(errors);
      window.showToast(`${result.error.issues[0].path[0].toUpperCase()}: ${result.error.issues[0].message}`, 'error');
      return;
    }

    try {
      await supabase.from('servicios').insert({
        creador_id: user?.id || null,
        tipo_servicio: formData.tipo_servicio,
        subtipo: formData.subtipo.trim(),
        rol_servicio: formData.rol_servicio,
        descripcion: formData.descripcion.trim(),
        disponibilidad: formData.disponibilidad.trim() || 'Inmediata',
        ubicacion_lat: 10.5000, 
        ubicacion_lng: -66.9000,
        contacto_whatsapp: formData.contacto_whatsapp.trim(),
        nombre_contacto: formData.nombre_contacto.trim(),
        ubicacion_gmaps: formData.ubicacion_gmaps.trim(),
        que_hace: formData.que_hace.trim(),
        que_aporta: formData.que_aporta.trim(),
        horarios: formData.horarios.trim(),
        tiene_herramientas: formData.tiene_herramientas,
        tiene_transporte: formData.tiene_transporte,
        danos_que_tiene: formData.rol_servicio === 'solicita' ? formData.danos_que_tiene.trim() : null,
        danos_que_repara: formData.rol_servicio === 'ofrece' ? formData.danos_que_repara.trim() : null,
        que_necesita: formData.rol_servicio === 'solicita' ? formData.que_necesita.trim() : null,
        que_ofrece: formData.rol_servicio === 'ofrece' ? formData.que_ofrece.trim() : null
      });

      setShowAddForm(false);
      setFormData(getInitialForm());
      fetchServices();
      window.showToast('Servicio publicado con éxito', 'success');
    } catch (err) { 
      console.error(err); 
      alert("Error al publicar: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este registro?')) return;
    try {
      await supabase.from('servicios').delete().eq('id', id);
      setSelected(null);
      fetchServices();
      window.showToast('Servicio eliminado', 'info');
    } catch (err) { 
      console.error(err); 
      alert("Error al eliminar: " + err.message);
    }
  };

  const filteredServices = services.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = s.subtipo.toLowerCase().includes(q) || (s.descripcion && s.descripcion.toLowerCase().includes(q)) || (s.nombre_contacto && s.nombre_contacto.toLowerCase().includes(q));
    const matchType = filterType === 'all' || s.tipo_servicio === filterType;
    const matchRole = filterRole === 'all' || s.rol_servicio === filterRole;
    return matchSearch && matchType && matchRole;
  });

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      {!isChild && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: '800' }}>Servicios y Apoyo</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Directorio comunitario de ayuda.</p>
          </div>
        </div>
      )}

      {/* Acciones principales */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button 
          className="btn btn-primary" 
          style={{ padding: '0.625rem 1rem', borderRadius: '2rem', boxShadow: '0 4px 12px rgba(13,148,136,0.3)' }} 
          onClick={() => {
            setShowAddForm(true);
          }}
        >
          <Plus size={18} /> Publicar
        </button>
      </div>

      {/* Buscador y Filtros */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div className="search-bar" style={{ flex: 1, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar especialidad..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem', scrollbarWidth: 'none' }}>
          <button className={`filter-chip ${filterRole === 'all' ? 'active' : ''}`} onClick={() => setFilterRole('all')}>Todos</button>
          <button className={`filter-chip ${filterRole === 'ofrece' ? 'active' : ''}`} onClick={() => setFilterRole('ofrece')}>🙋 Ofrecen</button>
          <button className={`filter-chip ${filterRole === 'solicita' ? 'active' : ''}`} onClick={() => setFilterRole('solicita')}>🆘 Solicitan</button>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem', scrollbarWidth: 'none' }}>
          <button className={`filter-chip ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>Todo Tipo</button>
          <button className={`filter-chip ${filterType === 'medico' ? 'active' : ''}`} onClick={() => setFilterType('medico')}>⚕️ Médico</button>
          <button className={`filter-chip ${filterType === 'apoyo' ? 'active' : ''}`} onClick={() => setFilterType('apoyo')}>🛠️ Apoyo Técnico</button>
        </div>
      </div>

      {/* Listado de Tarjetas */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Cargando...</div>
      ) : filteredServices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>No se encontraron registros.</div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {filteredServices.map((serv) => {
            const isOffer = serv.rol_servicio === 'ofrece';
            const isRegisteredUser = !!serv.creador_id;
            return (
              <div 
                key={serv.id} 
                className="card" 
                onClick={() => setSelected(serv)}
                style={{ 
                  display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem', cursor: 'pointer',
                  border: isRegisteredUser ? '2.5px solid var(--primary)' : '1px solid var(--border)',
                  borderTop: `4px solid ${isOffer ? 'var(--primary)' : '#ef4444'}`,
                  boxShadow: isRegisteredUser ? '0 8px 24px rgba(13,148,136,0.15)' : '0 4px 12px rgba(0,0,0,0.05)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{
                    fontSize: '0.6rem',
                    fontWeight: '800',
                    padding: '0.15rem 0.4rem',
                    borderRadius: '3px',
                    textTransform: 'uppercase',
                    backgroundColor: isRegisteredUser ? 'rgba(13,148,136,0.12)' : 'rgba(255,255,255,0.05)',
                    color: isRegisteredUser ? 'var(--primary)' : 'var(--text-secondary)',
                    border: isRegisteredUser ? '1px solid var(--primary)' : '1px solid var(--border)'
                  }}>
                    {isRegisteredUser ? '👤 Perfil Registrado' : '📢 Reporte Ciudadano'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '1rem', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0,
                    backgroundColor: isOffer ? 'rgba(13,148,136,0.1)' : 'rgba(239,68,68,0.1)'
                  }}>
                    {serv.tipo_servicio === 'medico' ? '⚕️' : '🛠️'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '800', color: isOffer ? 'var(--primary)' : '#ef4444', marginBottom: '0.2rem' }}>
                      {isOffer ? '🙋 OFRECE AYUDA' : '🆘 SOLICITA AYUDA'}
                    </div>
                    <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
                      {serv.subtipo}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Por: <strong>{serv.nombre_contacto || serv.creador?.nombre || 'Usuario'}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                  {serv.tiene_herramientas && (
                    <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Wrench size={10} /> Herramientas
                    </span>
                  )}
                  {serv.tiene_transporte && (
                    <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Truck size={10} /> Transporte
                    </span>
                  )}
                  {serv.ubicacion_gmaps && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary)', backgroundColor: 'var(--primary-glow)', padding: '0.2rem 0.5rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={10} /> Ubicación
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Formulario Bottom Sheet */}
      <BottomModal isOpen={showAddForm} onClose={() => setShowAddForm(false)} title="Publicar Servicio o Apoyo">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={16} /> Información Básica
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Mi Rol</label>
                <select className="input-field select-field" value={formData.rol_servicio} onChange={e => setFormData({ ...formData, rol_servicio: e.target.value })}>
                  <option value="ofrece">🙋 Soy voluntario</option>
                  <option value="solicita">🆘 Necesito apoyo</option>
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Categoría</label>
                <select className="input-field select-field" value={formData.tipo_servicio} onChange={e => setFormData({ ...formData, tipo_servicio: e.target.value })}>
                  <option value="medico">⚕️ Salud / Médico</option>
                  <option value="apoyo">🛠️ Apoyo / Escombros</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Título de tu anuncio *</label>
              <input className="input-field" placeholder="Ej. Médico Pediatra, Retiro de escombros..." value={formData.subtipo} onChange={e => setFormData({ ...formData, subtipo: e.target.value })} />
              {formErrors.subtipo && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>{formErrors.subtipo}</span>}
            </div>
            
            <div className="input-group">
              <label className="input-label">¿Qué hace / Descripción general?</label>
              <textarea className="input-field" style={{ height: '60px', resize: 'none' }} placeholder="Resume brevemente..." value={formData.que_hace} onChange={e => setFormData({ ...formData, que_hace: e.target.value })} />
            </div>
          </div>

          {/* DATOS DE CONTACTO Y UBICACIÓN */}
          <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={16} /> Contacto y Ubicación
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Nombre *</label>
                <input className="input-field" placeholder="Tu nombre" value={formData.nombre_contacto} onChange={e => setFormData({ ...formData, nombre_contacto: e.target.value })} />
                {formErrors.nombre_contacto && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>{formErrors.nombre_contacto}</span>}
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">WhatsApp *</label>
                <input className="input-field" type="tel" placeholder="04141234567" value={formData.contacto_whatsapp} onChange={e => setFormData({ ...formData, contacto_whatsapp: e.target.value })} />
                {formErrors.contacto_whatsapp && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>{formErrors.contacto_whatsapp}</span>}
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Enlace a Google Maps (Opcional)</label>
              <input className="input-field" type="url" placeholder="https://maps.google.com/..." value={formData.ubicacion_gmaps} onChange={e => setFormData({ ...formData, ubicacion_gmaps: e.target.value })} />
              {formErrors.ubicacion_gmaps && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>{formErrors.ubicacion_gmaps}</span>}
            </div>
          </div>

          {/* CAPACIDADES / NECESIDADES DINÁMICAS */}
          <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} /> Detalles del {formData.rol_servicio === 'ofrece' ? 'Apoyo Ofrecido' : 'Apoyo Solicitado'}
            </h4>
            
            {formData.rol_servicio === 'ofrece' ? (
              <>
                <div className="input-group">
                  <label className="input-label">¿Qué daños puede reparar / Qué aporta?</label>
                  <textarea className="input-field" style={{ height: '50px', resize: 'none' }} placeholder="Tuberías rotas, primeros auxilios..." value={formData.danos_que_repara} onChange={e => setFormData({ ...formData, danos_que_repara: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">¿Qué puede ofrecer específicamente?</label>
                  <input className="input-field" placeholder="Mano de obra, consultas gratis..." value={formData.que_ofrece} onChange={e => setFormData({ ...formData, que_ofrece: e.target.value })} />
                </div>
              </>
            ) : (
              <>
                <div className="input-group">
                  <label className="input-label">¿Qué daños o situación tiene?</label>
                  <textarea className="input-field" style={{ height: '50px', resize: 'none' }} placeholder="Casa colapsada, herida leve..." value={formData.danos_que_tiene} onChange={e => setFormData({ ...formData, danos_que_tiene: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">¿Qué necesita específicamente?</label>
                  <input className="input-field" placeholder="Materiales, un médico general..." value={formData.que_necesita} onChange={e => setFormData({ ...formData, que_necesita: e.target.value })} />
                </div>
              </>
            )}

            <div className="input-group">
              <label className="input-label">Horarios / Disponibilidad</label>
              <input className="input-field" placeholder="Ej. Todo el día, Fines de semana..." value={formData.horarios} onChange={e => setFormData({ ...formData, horarios: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.tiene_herramientas} onChange={e => setFormData({...formData, tiene_herramientas: e.target.checked})} style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }} />
                ¿Tiene herramientas?
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.tiene_transporte} onChange={e => setFormData({...formData, tiene_transporte: e.target.checked})} style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }} />
                ¿Tiene transporte?
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '0.5rem', fontSize: '1rem' }}>
            Publicar
          </button>
        </form>
      </BottomModal>

      {/* Detalle Bottom Sheet */}
      <BottomModal isOpen={!!selected} onClose={() => setSelected(null)} title="Detalles del Servicio">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ 
                width: '64px', height: '64px', borderRadius: '1rem', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
                backgroundColor: selected.rol_servicio === 'ofrece' ? 'rgba(13,148,136,0.1)' : 'rgba(239,68,68,0.1)'
              }}>
                {selected.tipo_servicio === 'medico' ? '⚕️' : '🛠️'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: selected.rol_servicio === 'ofrece' ? 'var(--primary)' : '#ef4444', marginBottom: '0.25rem' }}>
                  {selected.rol_servicio === 'ofrece' ? '🙋 OFRECE AYUDA' : '🆘 SOLICITA AYUDA'}
                </div>
                <h2 className="font-display" style={{ fontSize: '1.35rem', fontWeight: '800', lineHeight: 1.1, margin: '0 0 0.25rem 0' }}>{selected.subtipo}</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Contacto: <strong style={{ color: '#fff' }}>{selected.nombre_contacto || selected.creador?.nombre || 'Anónimo'}</strong>
                </div>
              </div>
            </div>

            {selected.que_hace && (
              <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>¿Qué hace?</span>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>{selected.que_hace}</div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Logística</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                  <div style={{ color: selected.tiene_herramientas ? '#4ade80' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Wrench size={14} /> {selected.tiene_herramientas ? 'Con Herramientas' : 'Sin Herramientas'}
                  </div>
                  <div style={{ color: selected.tiene_transporte ? '#4ade80' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Truck size={14} /> {selected.tiene_transporte ? 'Con Transporte' : 'Sin Transporte'}
                  </div>
                </div>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Horarios</span>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <Clock size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>{selected.horarios || selected.disponibilidad || 'No especificado'}</span>
                </div>
              </div>
            </div>

            {(selected.danos_que_repara || selected.que_ofrece || selected.danos_que_tiene || selected.que_necesita) && (
              <div style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                {selected.rol_servicio === 'ofrece' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selected.danos_que_repara && <div><span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700' }}>Daños que repara:</span><p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem' }}>{selected.danos_que_repara}</p></div>}
                    {selected.que_ofrece && <div><span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700' }}>Ofrece específicamente:</span><p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem' }}>{selected.que_ofrece}</p></div>}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selected.danos_que_tiene && <div><span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '700' }}>Situación / Daños:</span><p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem' }}>{selected.danos_que_tiene}</p></div>}
                    {selected.que_necesita && <div><span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '700' }}>Necesita específicamente:</span><p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem' }}>{selected.que_necesita}</p></div>}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
              <a 
                href={`https://wa.me/${selected.contacto_whatsapp.replace(/[^0-9]/g, '')}?text=Hola,%20vi%20tu%20anuncio%20de%20${selected.subtipo}%20en%20filoSOS`}
                target="_blank" rel="noopener noreferrer"
                className="btn btn-primary" style={{ backgroundColor: '#25D366', color: '#fff', padding: '0.875rem' }}
              >
                <MessageCircle size={18} /> WhatsApp
              </a>
              <a 
                href={`tel:${selected.contacto_whatsapp}`}
                className="btn btn-secondary" style={{ padding: '0.875rem' }}
              >
                <Phone size={18} /> Llamar
              </a>
              
              {selected.ubicacion_gmaps && (
                <a 
                  href={selected.ubicacion_gmaps}
                  target="_blank" rel="noopener noreferrer"
                  className="btn btn-secondary" style={{ gridColumn: '1 / -1', padding: '0.875rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(13,148,136,0.1)', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                >
                  <MapPin size={18} /> Ver en Google Maps
                </a>
              )}

              {(user && (selected.creador_id === user.id || user.rol === 'admin')) && (
                <button 
                  onClick={() => handleDelete(selected.id)}
                  style={{ gridColumn: '1 / -1', padding: '0.75rem', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Trash2 size={18} /> Eliminar Publicación
                </button>
              )}
            </div>
          </div>
        )}
      </BottomModal>
    </div>
  );
}
