import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Package, Plus, Search, MessageCircle, MapPin, Trash2, Edit3, Tag, FileText } from 'lucide-react';

export default function ResourcesView({ user }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    tipo: 'mueble',
    categoria: 'alimentos',
    nombre: '',
    descripcion: '',
    cantidad: '',
    ubicacion_lat: 10.5000,
    ubicacion_lng: -66.9000,
    contacto_whatsapp: user?.contacto || ''
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recursos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (err) {
      console.error('Error fetching resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.contacto_whatsapp.trim()) {
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }

    try {
      const { error } = await supabase.from('recursos').insert({
        creador_id: user.id,
        tipo: formData.tipo,
        categoria: formData.categoria,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        cantidad: formData.cantidad.trim(),
        ubicacion_lat: formData.ubicacion_lat,
        ubicacion_lng: formData.ubicacion_lng,
        contacto_whatsapp: formData.contacto_whatsapp.trim()
      });

      if (error) throw error;

      setShowAddForm(false);
      setFormData({
        tipo: 'mueble',
        categoria: 'alimentos',
        nombre: '',
        descripcion: '',
        cantidad: '',
        ubicacion_lat: 10.5000,
        ubicacion_lng: -66.9000,
        contacto_whatsapp: user?.contacto || ''
      });
      fetchResources();
    } catch (err) {
      console.error(err);
      alert('Error al registrar recurso: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este recurso?')) return;
    try {
      const { error } = await supabase.from('recursos').delete().eq('id', id);
      if (error) throw error;
      fetchResources();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar: ' + err.message);
    }
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.nombre.toLowerCase().includes(search.toLowerCase()) || 
                          r.descripcion?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || r.categoria === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'alimentos': return 'var(--ve-green)';
      case 'baños': return 'var(--ve-blue)';
      case 'refugio': return 'var(--ve-blue)';
      case 'medicamentos': return 'var(--ve-yellow)';
      default: return 'var(--primary)';
    }
  };

  return (
    <div style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '2.25rem' }}>Suministros y Refugios</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Listado comunitario de bienes de ayuda y espacios de resguardo.
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ marginLeft: 'auto' }}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus size={18} />
          <span>{showAddForm ? 'Cerrar Formulario' : 'Ofrecer Recurso'}</span>
        </button>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }}>
          <h3 className="font-display" style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Registrar Nuevo Recurso</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Tipo de Recurso</label>
              <select 
                className="input-field select-field"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              >
                <option value="mueble">Bie Mueble (Alimentos, Ropa, etc.)</option>
                <option value="inmueble">Bien Inmueble (Baño, Refugio, Casa)</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Categoría</label>
              <select 
                className="input-field select-field"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              >
                <option value="alimentos">🍲 Alimentos / Comida</option>
                <option value="baños">🚿 Baños / Duchas / Higiene</option>
                <option value="refugio">🎪 Refugio / Carpas / Colchones</option>
                <option value="medicamentos">💊 Medicamentos / Botiquín</option>
              </select>
            </div>

            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Nombre del Recurso / Sitio</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Ej. Donación de 20 Cobijas / Baño familiar disponible"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>

            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Descripción</label>
              <textarea 
                className="input-field" 
                style={{ height: '80px', resize: 'none' }}
                placeholder="Detalla qué incluye, el estado actual, el horario o cualquier restricción legal..."
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Cantidad / Disponibilidad</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Ej. 15 carpas / Por turnos de 15 min"
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">WhatsApp de Contacto</label>
              <input 
                type="tel" 
                className="input-field" 
                placeholder="Ej. +584120000000"
                value={formData.contacto_whatsapp}
                onChange={(e) => setFormData({ ...formData, contacto_whatsapp: e.target.value })}
                required
              />
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'end', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Registrar Recurso</button>
            </div>
          </form>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, descripción..."
            className="input-field"
            style={{ width: '100%', paddingLeft: '2.5rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'alimentos', 'baños', 'refugio', 'medicamentos'].map((cat) => (
            <button
              key={cat}
              className="btn"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.75rem',
                backgroundColor: filterCategory === cat ? 'var(--primary)' : 'var(--bg-surface-soft)',
                borderColor: filterCategory === cat ? 'var(--primary)' : 'var(--border)'
              }}
              onClick={() => setFilterCategory(cat)}
            >
              {cat === 'all' ? 'Todos' : cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Recursos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando recursos...</div>
      ) : filteredResources.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          No se encontraron recursos que coincidan con tu búsqueda.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredResources.map((res) => (
            <div key={res.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'start', marginBottom: '1rem' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.375rem',
                  backgroundColor: getCategoryColor(res.categoria) + '22',
                  color: getCategoryColor(res.categoria)
                }}>
                  {res.categoria.toUpperCase()} ({res.tipo.toUpperCase()})
                </span>
                
                {/* Opciones de edición/eliminación si es el creador */}
                {(res.creador_id === user.id || user.rol === 'admin') && (
                  <button 
                    onClick={() => handleDelete(res.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--ve-red)', cursor: 'pointer', marginLeft: 'auto' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem', lineHeight: '1.3' }}>
                {res.nombre}
              </h3>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem', flex: '1' }}>
                {res.descripcion}
              </p>

              <div style={{ 
                borderTop: '1px solid var(--border)',
                paddingTop: '0.75rem',
                display: 'flex',
                justifyContent: 'between',
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
                marginBottom: '1rem'
              }}>
                <div>Cantidad: <strong style={{ color: 'var(--text-primary)' }}>{res.cantidad || 'No especificada'}</strong></div>
              </div>

              <a 
                href={`https://wa.me/${res.contacto_whatsapp.replace(/\+/g, '')}?text=Hola%20vi%20tu%20anuncio%20de%20recurso%20${res.nombre}%20en%20VenezuelaSOS...`}
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                <MessageCircle size={16} />
                <span>Contactar por WhatsApp</span>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
