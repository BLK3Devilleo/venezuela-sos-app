import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { ShoppingBag, Search, Plus, X, Trash2, MessageCircle, AlertTriangle, Filter } from 'lucide-react';
import BottomModal from '../components/BottomModal';

const MARKETPLACE_CATEGORIES = {
  ropa: { label: 'Ropa y Abrigo', icon: '👕', color: '#f59e0b' },
  energia: { label: 'Iluminación y Energía', icon: '🔦', color: '#eab308' },
  hogar: { label: 'Hogar y Cocina', icon: '🍳', color: '#ef4444' },
  higiene: { label: 'Higiene y Salud', icon: '🧴', color: '#3b82f6' },
  herramientas: { label: 'Herramientas y Camping', icon: '🔧', color: '#6b7280' },
  otros: { label: 'Otros', icon: '📦', color: '#a855f7' }
};

const MARKETPLACE_TYPES = {
  ofrezco: { label: 'Ofrezco', color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: '🟢' },
  necesito: { label: 'Necesito', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: '🔴' },
  intercambio: { label: 'Intercambio', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: '🔄' }
};

export default function MarketplaceView({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria: 'ropa',
    tipo: 'ofrezco',
    ubicacion_text: '',
    contacto_whatsapp: user?.contacto || ''
  });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketplace')
        .select('*, creador:usuarios(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (e) {
      console.error('Error cargando marketplace:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.titulo.trim()) return alert('El título es obligatorio');
    if (!formData.contacto_whatsapp.trim()) return alert('El WhatsApp de contacto es obligatorio');

    setSubmitting(true);
    try {
      const { error } = await supabase.from('marketplace').insert({
        creador_id: user?.id,
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        categoria: formData.categoria,
        tipo: formData.tipo,
        ubicacion_text: formData.ubicacion_text.trim(),
        contacto_whatsapp: formData.contacto_whatsapp.trim()
      });
      if (error) throw error;

      setShowForm(false);
      setFormData({ titulo: '', descripcion: '', categoria: 'ropa', tipo: 'ofrezco', ubicacion_text: '', contacto_whatsapp: user?.contacto || '' });
      fetchItems();
    } catch (e) {
      console.error(e);
      alert('Error al publicar. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta publicación?')) return;
    try {
      await supabase.from('marketplace').delete().eq('id', id);
      setItems(items.filter(i => i.id !== id));
    } catch (e) { console.error(e); }
  };

  const filtered = items.filter(item => {
    const matchSearch = !search || item.titulo.toLowerCase().includes(search.toLowerCase()) || (item.descripcion || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || item.categoria === filterCat;
    const matchType = filterType === 'all' || item.tipo === filterType;
    return matchSearch && matchCat && matchType;
  });

  return (
    <div className="fade-in" style={{ paddingBottom: '2rem', paddingTop: '1rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={24} className="text-primary" /> Marketplace
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Dona, solicita o intercambia artículos de primera necesidad. 100% gratuito y solidario.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', borderRadius: '2rem', whiteSpace: 'nowrap' }}
        >
          <Plus size={16} /> Publicar
        </button>
      </div>

      {/* Onboarding Tutorial Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(59,130,246,0.15) 100%)',
        border: '1px solid rgba(168,85,247,0.3)',
        borderRadius: '1.25rem',
        padding: '1.25rem',
        marginBottom: '1.25rem',
        boxShadow: '0 4px 12px rgba(168,85,247,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.35rem' }}>🤝</span>
          <span style={{ fontWeight: '800', color: '#fff', fontSize: '1rem' }}>¿Cómo funciona el Mercado Solidario?</span>
        </div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          ¿Tienes cosas que donar (una cobija, almohada, colchón, utensilios)? Súbelo aquí y alguien que lo necesite te contactará por WhatsApp de forma directa. Todo es 100% gratuito.
        </p>
      </div>

      {/* Safety Disclaimer */}
      <div style={{
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        borderRadius: '0.75rem',
        padding: '0.75rem 1rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
        fontSize: '0.8rem',
        color: '#fca5a5',
        lineHeight: '1.4'
      }}>
        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          <strong>Seguridad:</strong> Todos los encuentros para intercambio deben hacerse en lugares públicos, concurridos e iluminados. Nunca acuda a domicilios particulares.
        </span>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="input-field"
          type="text"
          placeholder="Buscar artículos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: '2.25rem' }}
        />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }} className="hide-scrollbar">
        {/* Type filters */}
        <button
          onClick={() => setFilterType('all')}
          style={{
            padding: '0.4rem 0.75rem', borderRadius: '2rem', border: '1px solid',
            borderColor: filterType === 'all' ? 'var(--primary)' : 'var(--border)',
            backgroundColor: filterType === 'all' ? 'rgba(13,148,136,0.15)' : 'transparent',
            color: filterType === 'all' ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap'
          }}
        >Todos</button>
        {Object.entries(MARKETPLACE_TYPES).map(([key, t]) => (
          <button
            key={key}
            onClick={() => setFilterType(key)}
            style={{
              padding: '0.4rem 0.75rem', borderRadius: '2rem', border: '1px solid',
              borderColor: filterType === key ? t.color : 'var(--border)',
              backgroundColor: filterType === key ? t.bg : 'transparent',
              color: filterType === key ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap'
            }}
          >{t.icon} {t.label}</button>
        ))}
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }} className="hide-scrollbar">
        <button
          onClick={() => setFilterCat('all')}
          style={{
            padding: '0.35rem 0.7rem', borderRadius: '2rem', border: '1px solid',
            borderColor: filterCat === 'all' ? 'var(--primary)' : 'var(--border)',
            backgroundColor: filterCat === 'all' ? 'rgba(13,148,136,0.1)' : 'transparent',
            color: filterCat === 'all' ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap'
          }}
        >Todas</button>
        {Object.entries(MARKETPLACE_CATEGORIES).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setFilterCat(key)}
            style={{
              padding: '0.35rem 0.7rem', borderRadius: '2rem', border: '1px solid',
              borderColor: filterCat === key ? cat.color : 'var(--border)',
              backgroundColor: filterCat === key ? `${cat.color}18` : 'transparent',
              color: filterCat === key ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap'
            }}
          >{cat.icon} {cat.label}</button>
        ))}
      </div>

      {/* Items List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem', borderRadius: '1rem',
          border: '2px dashed var(--border)', color: 'var(--text-secondary)'
        }}>
          <ShoppingBag size={36} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <p style={{ fontWeight: '600' }}>No hay publicaciones{filterCat !== 'all' || filterType !== 'all' ? ' con estos filtros' : ' todavía'}.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Sé el primero en publicar algo para la comunidad.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(item => {
            const cat = MARKETPLACE_CATEGORIES[item.categoria] || MARKETPLACE_CATEGORIES.otros;
            const tipo = MARKETPLACE_TYPES[item.tipo] || MARKETPLACE_TYPES.ofrezco;
            return (
              <div key={item.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    {/* Category icon */}
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '1rem',
                      backgroundColor: `${cat.color}15`, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0
                    }}>
                      {cat.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '800', fontSize: '1rem', color: '#fff', lineHeight: '1.3' }}>
                        {item.titulo}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {cat.label}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Type badge */}
                    <span style={{
                      padding: '0.25rem 0.6rem', borderRadius: '2rem',
                      backgroundColor: tipo.bg, color: tipo.color,
                      fontSize: '0.7rem', fontWeight: '800', whiteSpace: 'nowrap'
                    }}>
                      {tipo.icon} {tipo.label}
                    </span>
                    {(user?.rol === 'admin' || user?.id === item.creador_id) && (
                      <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                {item.descripcion && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
                    {item.descripcion}
                  </p>
                )}

                {/* Location + time */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {item.ubicacion_text && <span>📍 {item.ubicacion_text}</span>}
                  <span>🕐 {new Date(item.created_at).toLocaleDateString()}</span>
                  {item.creador?.nombre && <span>👤 {item.creador.nombre}</span>}
                </div>

                {/* WhatsApp contact */}
                <a
                  href={`https://wa.me/${item.contacto_whatsapp?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola, vi tu publicación "${item.titulo}" en filoSOS Marketplace. ¿Aún está disponible?`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    padding: '0.65rem 1rem', backgroundColor: '#25D366', color: '#fff',
                    borderRadius: '0.75rem', textDecoration: 'none', fontWeight: '700',
                    fontSize: '0.85rem', boxShadow: '0 2px 8px rgba(37,211,102,0.3)',
                    transition: 'transform 0.15s'
                  }}
                >
                  <MessageCircle size={16} /> Contactar por WhatsApp
                </a>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setShowForm(true)}
        style={{
          position: 'fixed', bottom: '5.5rem', right: '1.5rem', zIndex: 1000,
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), #0f766e)',
          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#fff', boxShadow: '0 8px 24px rgba(13,148,136,0.4)'
        }}
      >
        <Plus size={24} strokeWidth={3} />
      </button>

      {/* Create Form Modal */}
      <BottomModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="📦 Nueva Publicación"
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          <div className="input-group">
            <label className="input-label">¿Qué tipo de publicación es?</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {Object.entries(MARKETPLACE_TYPES).map(([key, t]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: key })}
                  style={{
                    flex: 1, padding: '0.6rem 0.5rem', borderRadius: '0.75rem',
                    border: '2px solid', cursor: 'pointer',
                    borderColor: formData.tipo === key ? t.color : 'var(--border)',
                    backgroundColor: formData.tipo === key ? t.bg : 'var(--bg-surface-soft)',
                    color: formData.tipo === key ? '#fff' : 'var(--text-secondary)',
                    fontWeight: '700', fontSize: '0.8rem', textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  {t.icon}<br/>{t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Categoría</label>
            <select
              className="input-field select-field"
              value={formData.categoria}
              onChange={e => setFormData({ ...formData, categoria: e.target.value })}
            >
              {Object.entries(MARKETPLACE_CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>{cat.icon} {cat.label}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Título del artículo *</label>
            <input
              className="input-field"
              placeholder="Ej: Cobija térmica, Linterna LED, Kit de cocina..."
              value={formData.titulo}
              onChange={e => setFormData({ ...formData, titulo: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Descripción</label>
            <textarea
              className="input-field"
              style={{ height: '70px', resize: 'none' }}
              placeholder="Detalla el estado del artículo, cantidad, condiciones..."
              value={formData.descripcion}
              onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Ubicación / Zona</label>
            <input
              className="input-field"
              type="text"
              placeholder="Ej: Chacao, Caracas / Punto de encuentro..."
              value={formData.ubicacion_text}
              onChange={e => setFormData({ ...formData, ubicacion_text: e.target.value })}
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

          {/* Safety reminder */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '0.65rem', padding: '0.6rem 0.75rem',
            fontSize: '0.75rem', color: '#fbbf24', lineHeight: '1.4',
            display: 'flex', alignItems: 'flex-start', gap: '0.4rem'
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
            Recuerda: los encuentros deben ser siempre en lugares públicos y seguros.
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%', padding: '0.85rem', fontWeight: 'bold' }}
          >
            {submitting ? 'Publicando...' : '📦 Publicar Artículo'}
          </button>
        </form>
      </BottomModal>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
