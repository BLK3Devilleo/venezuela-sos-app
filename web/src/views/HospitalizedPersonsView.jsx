import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Search, Plus, MapPin, Heart, Activity, Trash2, ShieldAlert, Phone, Calendar, Clock } from 'lucide-react';
import BottomModal from '../components/BottomModal';

const ESTADO_SALUD_CONFIG = {
  estable: { label: 'Estable', color: '#10b981', bg: 'rgba(16,185,129,0.12)', emoji: '🟢' },
  reservado: { label: 'Reservado', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', emoji: '🟡' },
  critico: { label: 'Crítico / UCI', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', emoji: '🔴' },
  alta: { label: 'Dado de Alta', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', emoji: '🔵' }
};

export default function HospitalizedPersonsView({ user, onRequireLogin }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterHealth, setFilterHealth] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nombre_completo: '',
    cedula: '',
    edad: '',
    hospital_clinica: '',
    estado_salud: 'estable',
    observaciones: '',
    contacto_reportante: user?.contacto || '',
    nombre_contacto: user?.nombre || ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hospitalizados')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPatients(data || []);
    } catch (err) {
      console.error('Error fetching hospitalized patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.nombre_completo.trim()) return alert('El nombre es obligatorio');
    if (!formData.hospital_clinica.trim()) return alert('El hospital o clínica es obligatorio');
    if (!formData.contacto_reportante.trim()) return alert('El contacto del reportante es obligatorio');
    if (!formData.nombre_contacto.trim()) return alert('El nombre del reportante es obligatorio');

    setSubmitting(true);
    try {
      const { error } = await supabase.from('hospitalizados').insert({
        creador_id: user?.id || null,
        nombre_completo: formData.nombre_completo.trim(),
        cedula: formData.cedula.trim() || null,
        edad: formData.edad ? parseInt(formData.edad, 10) : null,
        hospital_clinica: formData.hospital_clinica.trim(),
        estado_salud: formData.estado_salud,
        observaciones: formData.observaciones.trim() || null,
        contacto_reportante: formData.contacto_reportante.trim(),
        nombre_contacto: formData.nombre_contacto.trim(),
        contacto_whatsapp: formData.contacto_reportante.trim()
      });
      if (error) throw error;

      setShowAddForm(false);
      setFormData({
        nombre_completo: '',
        cedula: '',
        edad: '',
        hospital_clinica: '',
        estado_salud: 'estable',
        observaciones: '',
        contacto_reportante: user?.contacto || ''
      });
      fetchPatients();
    } catch (err) {
      console.error(err);
      alert('Error al registrar paciente. Intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este registro médico?')) return;
    try {
      const { error } = await supabase.from('hospitalizados').delete().eq('id', id);
      if (error) throw error;
      setSelected(null);
      fetchPatients();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar.');
    }
  };

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    const matchesSearch = 
      p.nombre_completo.toLowerCase().includes(q) || 
      p.hospital_clinica.toLowerCase().includes(q) ||
      (p.cedula && p.cedula.includes(q));

    const matchesHealth = filterHealth === 'all' || p.estado_salud === filterHealth;

    return matchesSearch && matchesHealth;
  });

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: '800' }}>🏥 Personas Hospitalizadas</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Registro de personas admitidas en centros médicos para localización familiar.</p>
        </div>
        <button 
          onClick={() => {
            setShowAddForm(true);
          }}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.5rem 1rem', borderRadius: '2rem' }}
        >
          <Plus size={16} /> Registrar Paciente
        </button>
      </div>

      {/* Buscador */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div className="search-bar" style={{ flex: 1, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, cédula u hospital..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem' }}
          />
        </div>

        {/* Filtros de Estado de Salud */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }} className="hide-scrollbar">
          <button className={`filter-chip ${filterHealth === 'all' ? 'active' : ''}`} onClick={() => setFilterHealth('all')}>Todos</button>
          {Object.entries(ESTADO_SALUD_CONFIG).map(([key, value]) => (
            <button 
              key={key} 
              className={`filter-chip ${filterHealth === key ? 'active' : ''}`} 
              onClick={() => setFilterHealth(key)}
            >
              {value.emoji} {value.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando directorio de pacientes...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No se encontraron personas registradas en hospitales con estos filtros.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {filtered.map(p => {
            const config = ESTADO_SALUD_CONFIG[p.estado_salud] || ESTADO_SALUD_CONFIG.estable;
            const isRegisteredUser = !!p.creador_id;
            return (
              <div 
                key={p.id} 
                className="card btn-profile-badge" 
                onClick={() => setSelected(p)}
                style={{ 
                  padding: '1rem', cursor: 'pointer', borderLeft: `4px solid ${config.color}`,
                  border: isRegisteredUser ? '2.5px solid var(--primary)' : '1px solid var(--border)',
                  borderLeftWidth: '5px',
                  display: 'flex', flexDirection: 'column', gap: '0.5rem',
                  backgroundColor: 'var(--bg-surface)',
                  boxShadow: isRegisteredUser ? '0 8px 24px rgba(13,148,136,0.15)' : 'var(--shadow-sm)',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', marginBottom: '0.1rem' }}>
                  <span style={{
                    fontSize: '0.55rem',
                    fontWeight: '800',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '3px',
                    textTransform: 'uppercase',
                    backgroundColor: isRegisteredUser ? 'rgba(13,148,136,0.12)' : 'rgba(255,255,255,0.05)',
                    color: isRegisteredUser ? 'var(--primary)' : 'var(--text-secondary)',
                    border: isRegisteredUser ? '1px solid var(--primary)' : '1px solid var(--border)'
                  }}>
                    {isRegisteredUser ? '👤 Registrado' : '📢 Ciudadano'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                    {p.nombre_completo}
                  </h3>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: config.bg, color: config.color, borderRadius: '0.5rem', fontWeight: '700' }}>
                    {config.emoji} {config.label.toUpperCase()}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} style={{ color: 'var(--primary)' }} />
                    <span><strong>Centro:</strong> {p.hospital_clinica}</span>
                  </div>
                  {p.cedula && <span><strong>Cédula:</strong> {p.cedula}</span>}
                  {p.edad && <span><strong>Edad:</strong> {p.edad} años</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Registrar */}
      <BottomModal isOpen={showAddForm} onClose={() => setShowAddForm(false)} title="🏥 Registrar Paciente Hospitalizado">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div className="input-group">
            <label className="input-label">Nombre Completo *</label>
            <input 
              className="input-field" 
              placeholder="Ej. Juan Carlos Pérez" 
              value={formData.nombre_completo} 
              onChange={e => setFormData({ ...formData, nombre_completo: e.target.value })} 
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label className="input-label">Cédula (Opcional)</label>
              <input 
                className="input-field" 
                placeholder="Ej. V-12345678" 
                value={formData.cedula} 
                onChange={e => setFormData({ ...formData, cedula: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Edad (Opcional)</label>
              <input 
                className="input-field" 
                type="number" 
                placeholder="Ej. 42" 
                value={formData.edad} 
                onChange={e => setFormData({ ...formData, edad: e.target.value })}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Hospital o Clínica *</label>
            <input 
              className="input-field" 
              placeholder="Ej. Hospital Domingo Luciani" 
              value={formData.hospital_clinica} 
              onChange={e => setFormData({ ...formData, hospital_clinica: e.target.value })} 
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Estado de Salud</label>
            <select 
              className="input-field select-field" 
              value={formData.estado_salud} 
              onChange={e => setFormData({ ...formData, estado_salud: e.target.value })}
            >
              <option value="estable">🟢 Estable (Habitación / Observación)</option>
              <option value="reservado">🟡 Reservado (Bajo evaluación médica)</option>
              <option value="critico">🔴 Crítico / UCI (Cuidados intensivos)</option>
              <option value="alta">🔵 Dado de Alta (Ya egresó del centro)</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Observaciones o Notas Adicionales</label>
            <textarea 
              className="input-field" 
              style={{ height: '60px', resize: 'none' }}
              placeholder="Ej. Ingresó por traumatismo leve, despierto, buscando a sus hijos..." 
              value={formData.observaciones} 
              onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Tu Nombre *</label>
              <input 
                className="input-field" 
                placeholder="Ej. Carmen Guzmán" 
                value={formData.nombre_contacto} 
                onChange={e => setFormData({ ...formData, nombre_contacto: e.target.value })} 
                required
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">WhatsApp Reportante *</label>
              <input 
                className="input-field" 
                type="tel"
                placeholder="Ej. 04121234567" 
                value={formData.contacto_reportante} 
                onChange={e => setFormData({ ...formData, contacto_reportante: e.target.value })} 
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={submitting} 
            style={{ width: '100%', padding: '0.85rem', fontWeight: 'bold', marginTop: '0.5rem' }}
          >
            {submitting ? 'Registrando...' : '🏥 Guardar Registro de Paciente'}
          </button>
        </form>
      </BottomModal>

      {/* Modal Detalle */}
      <BottomModal isOpen={!!selected} onClose={() => setSelected(null)} title="🏥 Detalle del Paciente">
        {selected && (() => {
          const config = ESTADO_SALUD_CONFIG[selected.estado_salud] || ESTADO_SALUD_CONFIG.estable;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h2 className="font-display" style={{ fontSize: '1.4rem', fontWeight: '800', margin: '0 0 0.25rem 0', color: '#fff' }}>
                  {selected.nombre_completo}
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: config.bg, color: config.color, borderRadius: '0.5rem', fontWeight: '700' }}>
                    {config.emoji} ESTADO: {config.label.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Registrado el {new Date(selected.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <div>📍 <strong>Centro Médico:</strong> {selected.hospital_clinica}</div>
                {selected.cedula && <div>🪪 <strong>Cédula:</strong> {selected.cedula}</div>}
                {selected.edad && <div>🎂 <strong>Edad:</strong> {selected.edad} años</div>}
              </div>

              {selected.observaciones && (
                <div style={{ backgroundColor: 'var(--bg-surface-soft)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.75rem 1rem', fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>
                  <strong>Observaciones:</strong>
                  <p style={{ margin: '0.25rem 0 0 0' }}>{selected.observaciones}</p>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                <a 
                  href={`https://wa.me/${selected.contacto_reportante.replace(/[^0-9]/g, '')}?text=Hola,%20tengo%20información%20o%20soy%20familiar%20de%20${selected.nombre_completo}`}
                  target="_blank" rel="noopener noreferrer"
                  className="btn btn-primary" style={{ backgroundColor: '#25D366', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                >
                  Contactar al Reportante (WhatsApp)
                </a>

                {user && (user.rol === 'admin' || user.rol === 'staff' || selected.creador_id === user.id) && (
                  <button 
                    onClick={() => handleDelete(selected.id)}
                    className="btn"
                    style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.65rem' }}
                  >
                    <Trash2 size={16} /> Eliminar Registro
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </BottomModal>
    </div>
  );
}
