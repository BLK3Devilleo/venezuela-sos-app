import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Activity, Plus, Search, MessageCircle, Heart, User, Clock, Trash2, Phone } from 'lucide-react';
import BottomModal from '../components/BottomModal';
import { z } from 'zod';

const phoneRegex = /^\d{7,15}$/;
const formSchema = z.object({
  tipo_servicio: z.enum(['medico', 'apoyo']),
  subtipo: z.string().min(3, "Mínimo 3 letras").max(60, "Muy largo"),
  rol_servicio: z.enum(['ofrece', 'solicita']),
  descripcion: z.string().max(255, "Máximo 255 caracteres").optional(),
  disponibilidad: z.string().max(100, "Muy largo").optional(),
  contacto_whatsapp: z.string().regex(phoneRegex, "Teléfono inválido. Solo números y máximo 15 dígitos.")
});

export default function ServicesView({ user, onViewProfile }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); 
  const [filterRole, setFilterRole] = useState('all'); 
  const [showAddForm, setShowAddForm] = useState(false);
  const [selected, setSelected] = useState(null);

  const [formData, setFormData] = useState({
    tipo_servicio: 'medico', subtipo: '', rol_servicio: 'ofrece',
    descripcion: '', disponibilidad: '', contacto_whatsapp: user?.contacto || ''
  });
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
      result.error.errors.forEach(err => {
        errors[err.path[0]] = err.message;
      });
      setFormErrors(errors);
      return;
    }

    try {
      await supabase.from('servicios').insert({
        creador_id: user.id,
        tipo_servicio: formData.tipo_servicio,
        subtipo: formData.subtipo.trim(),
        rol_servicio: formData.rol_servicio,
        descripcion: formData.descripcion.trim(),
        disponibilidad: formData.disponibilidad.trim() || 'Inmediata',
        ubicacion_lat: 10.5000, 
        ubicacion_lng: -66.9000,
        contacto_whatsapp: formData.contacto_whatsapp.trim()
      });

      setShowAddForm(false);
      setFormData({ tipo_servicio: 'medico', subtipo: '', rol_servicio: 'ofrece', descripcion: '', disponibilidad: '', contacto_whatsapp: user?.contacto || '' });
      fetchServices();
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
    } catch (err) { 
      console.error(err); 
      alert("Error al eliminar: " + err.message);
    }
  };

  const filteredServices = services.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = s.subtipo.toLowerCase().includes(q) || (s.descripcion && s.descripcion.toLowerCase().includes(q));
    const matchType = filterType === 'all' || s.tipo_servicio === filterType;
    const matchRole = filterRole === 'all' || s.rol_servicio === filterRole;
    return matchSearch && matchType && matchRole;
  });

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: '800' }}>Servicios y Apoyo</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Directorio comunitario de ayuda.</p>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ padding: '0.625rem 1rem', borderRadius: '2rem', boxShadow: '0 4px 12px rgba(13,148,136,0.3)' }} 
          onClick={() => setShowAddForm(true)}
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
            return (
              <div 
                key={serv.id} 
                className="card" 
                onClick={() => setSelected(serv)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', cursor: 'pointer',
                  borderLeft: `4px solid ${isOffer ? 'var(--primary)' : '#ef4444'}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <div style={{ 
                  width: '54px', height: '54px', borderRadius: '1rem', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem',
                  backgroundColor: isOffer ? 'rgba(13,148,136,0.1)' : 'rgba(239,68,68,0.1)'
                }}>
                  {serv.tipo_servicio === 'medico' ? '⚕️' : '🛠️'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: isOffer ? 'var(--primary)' : '#ef4444', marginBottom: '0.2rem' }}>
                    {isOffer ? '🙋 OFRECE AYUDA' : '🆘 SOLICITA AYUDA'}
                  </div>
                  <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                    {serv.subtipo}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                    <Clock size={12} /> {serv.disponibilidad || 'Inmediata'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Formulario Bottom Sheet */}
      <BottomModal isOpen={showAddForm} onClose={() => setShowAddForm(false)} title="Publicar Servicio">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label className="input-label">Rol</label>
              <select className="input-field select-field" value={formData.rol_servicio} onChange={e => setFormData({ ...formData, rol_servicio: e.target.value })}>
                <option value="ofrece">🙋 Soy voluntario</option>
                <option value="solicita">🆘 Necesito apoyo</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Categoría</label>
              <select className="input-field select-field" value={formData.tipo_servicio} onChange={e => setFormData({ ...formData, tipo_servicio: e.target.value })}>
                <option value="medico">⚕️ Salud / Médico</option>
                <option value="apoyo">🛠️ Apoyo / Escombros</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Especialidad o Tarea Específica *</label>
            <input className="input-field" placeholder="Ej. Pediatra, Albañil" value={formData.subtipo} onChange={e => setFormData({ ...formData, subtipo: e.target.value })} />
            {formErrors.subtipo && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{formErrors.subtipo}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">Descripción Detallada</label>
            <textarea className="input-field" style={{ height: '70px', resize: 'none' }} placeholder="¿Qué puedes hacer o qué necesitas?..." value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} />
            {formErrors.descripcion && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{formErrors.descripcion}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">Disponibilidad</label>
            <input className="input-field" placeholder="Ej. Fines de semana, 24h..." value={formData.disponibilidad} onChange={e => setFormData({ ...formData, disponibilidad: e.target.value })} />
            {formErrors.disponibilidad && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{formErrors.disponibilidad}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">WhatsApp de Contacto *</label>
            <input className="input-field" type="tel" placeholder="04141234567" value={formData.contacto_whatsapp} onChange={e => setFormData({ ...formData, contacto_whatsapp: e.target.value })} />
            {formErrors.contacto_whatsapp && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.contacto_whatsapp}</span>}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem' }}>
            Publicar
          </button>
        </form>
      </BottomModal>

      {/* Detalle Bottom Sheet */}
      <BottomModal isOpen={!!selected} onClose={() => setSelected(null)} title="Detalles del Servicio">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ 
                width: '64px', height: '64px', borderRadius: '1rem', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
                backgroundColor: selected.rol_servicio === 'ofrece' ? 'rgba(13,148,136,0.1)' : 'rgba(239,68,68,0.1)'
              }}>
                {selected.tipo_servicio === 'medico' ? '⚕️' : '🛠️'}
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: selected.rol_servicio === 'ofrece' ? 'var(--primary)' : '#ef4444', marginBottom: '0.25rem' }}>
                  {selected.rol_servicio === 'ofrece' ? '🙋 OFRECE AYUDA' : '🆘 SOLICITA AYUDA'}
                </div>
                <h2 className="font-display" style={{ fontSize: '1.35rem', fontWeight: '800', lineHeight: 1.1 }}>{selected.subtipo}</h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span>Publicado por:</span>
                  <span 
                    onClick={() => {
                      setSelected(null);
                      if (onViewProfile) onViewProfile(selected.creador_id);
                    }}
                    style={{ 
                      color: 'var(--primary)', 
                      fontWeight: '700', 
                      cursor: 'pointer', 
                      textDecoration: 'underline' 
                    }}
                  >
                    {selected.creador?.nombre || 'Usuario'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <span style={{ fontWeight: '700', display: 'block', marginBottom: '0.25rem' }}>Descripción:</span>
              {selected.descripcion || 'Sin descripción adicional.'}
            </div>
            
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} /> <strong>Disponibilidad:</strong> {selected.disponibilidad || 'Inmediata'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
              <a 
                href={`https://wa.me/${selected.contacto_whatsapp.replace(/[^0-9]/g, '')}?text=Hola,%20vi%20tu%20anuncio%20de%20${selected.subtipo}%20en%20VenezuelaSOS`}
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
