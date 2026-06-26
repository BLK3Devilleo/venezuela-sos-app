import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { ShoppingBag, Search, Plus, Trash2, MessageCircle, AlertTriangle, User, Phone, MapPin } from 'lucide-react';
import BottomModal from '../components/BottomModal';
import { compressImage } from '../utils/imageCompression';

const MARKETPLACE_CATEGORIES = {
  ropa: { label: 'Ropa y Abrigo', icon: '👕', color: '#f59e0b' },
  energia: { label: 'Iluminación y Energía', icon: '🔦', color: '#eab308' },
  hogar: { label: 'Hogar y Cocina', icon: '🍳', color: '#ef4444' },
  higiene: { label: 'Higiene y Salud', icon: '🧴', color: '#3b82f6' },
  herramientas: { label: 'Herramientas y Camping', icon: '🔧', color: '#6b7280' },
  otros: { label: 'Otros', icon: '📦', color: '#a855f7' }
};

const MARKETPLACE_TYPES = {
  ofrezco: { label: 'Ofrezco / Dono', color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: '🟢' },
  necesito: { label: 'Necesito', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: '🔴' }
};

export default function MarketplaceView({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('filoSOS_marketplace_onboarding_dismissed'));
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const [revealedContacts, setRevealedContacts] = useState({});
  const [formImages, setFormImages] = useState([]);
  const [compressing, setCompressing] = useState(false);

  const getInitialForm = () => ({
    titulo: '',
    descripcion: '',
    categoria: 'ropa',
    tipo: 'ofrezco',
    ubicacion_text: '',
    nombre_contacto: user?.nombre || '',
    contacto_whatsapp: user?.contacto || ''
  });

  const [formData, setFormData] = useState(getInitialForm());

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
    if (!formData.nombre_contacto.trim()) return alert('El nombre de contacto es obligatorio');
    if (!formData.contacto_whatsapp.trim()) return alert('El WhatsApp de contacto es obligatorio');

    setSubmitting(true);
    try {
      const imageUrls = [];
      for (const imgObj of formImages) {
        const fileName = `marketplace-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
        const uploadRes = await fetch(`https://venezuelasos-media-api.filocentraldemando.workers.dev/upload?file=${fileName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'image/jpeg' },
          body: imgObj.file
        });

        if (uploadRes.ok) {
          const resData = await uploadRes.json();
          imageUrls.push(resData.url);
        } else {
          throw new Error('Error al subir una de las imágenes.');
        }
      }

      const { error } = await supabase.from('marketplace').insert({
        creador_id: user?.id || null,
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        categoria: formData.categoria,
        tipo: formData.tipo,
        ubicacion_text: formData.ubicacion_text.trim(),
        nombre_contacto: formData.nombre_contacto.trim(),
        contacto_whatsapp: formData.contacto_whatsapp.trim(),
        fotos: imageUrls
      });
      if (error) throw error;

      formImages.forEach(img => {
        if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
      });
      setShowForm(false);
      setFormImages([]);
      setFormData(getInitialForm());
      fetchItems();
      window.showToast('Artículo publicado exitosamente', 'success');
    } catch (e) {
      console.error(e);
      alert('Error al publicar. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageAdd = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (formImages.length + files.length > 4) {
      alert('Puedes subir un máximo de 4 imágenes por publicación.');
      return;
    }

    setCompressing(true);
    try {
      const newImages = [];
      for (const file of files) {
        const compressedFile = await compressImage(file);
        const previewUrl = URL.createObjectURL(compressedFile);
        newImages.push({ file: compressedFile, previewUrl });
      }
      setFormImages(prev => [...prev, ...newImages]);
    } catch (err) {
      console.error(err);
      alert('Error al comprimir una de las imágenes.');
    } finally {
      setCompressing(false);
    }
  };

  const handleImageRemove = (indexToRemove) => {
    const imgToRemove = formImages[indexToRemove];
    if (imgToRemove && imgToRemove.previewUrl) {
      URL.revokeObjectURL(imgToRemove.previewUrl);
    }
    setFormImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta publicación?')) return;
    try {
      await supabase.from('marketplace').delete().eq('id', id);
      setItems(items.filter(i => i.id !== id));
      window.showToast('Publicación eliminada', 'info');
    } catch (e) { console.error(e); }
  };

  const filtered = items.filter(item => {
    const matchSearch = !search || item.titulo.toLowerCase().includes(search.toLowerCase()) || (item.descripcion || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || item.categoria === filterCat;
    const matchType = filterType === 'all' || item.tipo === filterType;
    return matchSearch && matchCat && matchType;
  });

  return (
    <div className="fade-in" style={{ paddingBottom: '2rem', paddingTop: '0.5rem' }}>

      {/* Modal Onboarding Reglas del Mercado */}
      {showOnboarding && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(6, 13, 26, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '1.5rem',
            padding: '2rem 1.5rem',
            maxWidth: '380px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: 'rgba(168, 85, 247, 0.15)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
              }}>
                🤝
              </div>
              <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', margin: 0 }}>
                Reglas del Mercado Solidario
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'left', lineHeight: '1.5' }}>
              <p style={{ margin: 0 }}>
                Este espacio fue creado con el único propósito de **dar y recibir ayuda**. No se permiten transacciones comerciales de ningún tipo.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span>🚫</span>
                <span><strong>Cero Negocios/Trueques:</strong> Quedan estrictamente prohibidos los trueques, intercambios comerciales o monetarios.</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span>🎁</span>
                <span><strong>Solo Donaciones:</strong> Toda publicación tipo "Ofrezco" debe ser una entrega 100% gratuita y desinteresada.</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span>🔒</span>
                <span><strong>Privacidad:</strong> Los números de contacto se muestran transparentemente pero bajo un botón opcional para evitar spam web.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', cursor: 'pointer' }} onClick={() => setDontShowAgain(prev => !prev)}>
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={() => {}}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', userSelect: 'none' }}>
                No volver a mostrar estas reglas
              </span>
            </div>

            <button
              onClick={() => {
                if (dontShowAgain) {
                  localStorage.setItem('filoSOS_marketplace_onboarding_dismissed', 'true');
                }
                setShowOnboarding(false);
              }}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', fontWeight: '700' }}
            >
              Entendido y Acepto
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.65rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🤝 Mercado Solidario
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Dona o solicita insumos y herramientas. Prohibido ventas o trueques.
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
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Cargando artículos...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem', borderRadius: '1rem',
          border: '2px dashed var(--border)', color: 'var(--text-secondary)'
        }}>
          <ShoppingBag size={36} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <p style={{ fontWeight: '600' }}>No hay artículos publicados todavía.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
          {filtered.map(item => {
            const cat = MARKETPLACE_CATEGORIES[item.categoria] || MARKETPLACE_CATEGORIES.otros;
            const tipo = MARKETPLACE_TYPES[item.tipo] || MARKETPLACE_TYPES.ofrezco;
            const isRegisteredUser = !!item.creador_id;
            
            return (
              <div 
                key={item.id} 
                className="card" 
                style={{ 
                  padding: '1.25rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.75rem',
                  border: isRegisteredUser ? '2.5px solid var(--primary)' : '1px solid var(--border)',
                  boxShadow: isRegisteredUser ? '0 8px 24px rgba(13,148,136,0.15)' : 'var(--shadow-sm)',
                  position: 'relative'
                }}
              >
                {/* Visual Queen: Large Photo on Top */}
                {item.fotos && item.fotos.length > 0 && (
                  <div style={{ width: '100%', height: '220px', overflow: 'hidden', borderRadius: '0.75rem', position: 'relative', border: '1px solid var(--border)' }}>
                    <img
                      src={item.fotos[0]}
                      alt={item.titulo}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    {/* Floating type badge */}
                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                      <span style={{
                        padding: '0.25rem 0.6rem', borderRadius: '2rem',
                        backgroundColor: tipo.bg, color: tipo.color,
                        fontSize: '0.65rem', fontWeight: '800', backdropFilter: 'blur(8px)',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                      }}>
                        {tipo.icon} {tipo.label.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Badge de usuario registrado vs invitado */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.25rem',
                    textTransform: 'uppercase',
                    backgroundColor: isRegisteredUser ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.06)',
                    color: isRegisteredUser ? 'var(--primary)' : 'var(--text-secondary)',
                    border: isRegisteredUser ? '1px solid var(--primary)' : '1px solid var(--border)'
                  }}>
                    {isRegisteredUser ? '👤 Perfil Registrado' : '📢 Reporte Ciudadano'}
                  </span>
                  
                  {(user?.rol === 'admin' || user?.id === item.creador_id) && (
                    <button 
                      onClick={() => handleDelete(item.id)} 
                      style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '4px', padding: '4px', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Title and Category */}
                <div>
                  <h3 className="font-display" style={{ fontWeight: '800', fontSize: '1.15rem', color: '#fff', margin: 0, lineHeight: '1.3' }}>
                    {item.titulo}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'inline-block', marginTop: '2px' }}>
                    {cat.icon} {cat.label}
                  </span>
                </div>

                {/* Description */}
                {item.descripcion && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4', margin: 0 }}>
                    {item.descripcion}
                  </p>
                )}

                {/* Other Photos Thumbnails */}
                {item.fotos && item.fotos.length > 1 && (
                  <div className="hide-scrollbar" style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', margin: '0.1rem 0' }}>
                    {item.fotos.slice(1).map((f, idx) => (
                      <img
                        key={idx}
                        src={f}
                        alt={`Miniatura ${idx + 2}`}
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '0.5rem',
                          objectFit: 'cover',
                          border: '1px solid var(--border)',
                          flexShrink: 0
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Location and Metadata */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                  {item.ubicacion_text && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} /> <span>{item.ubicacion_text}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                    <span>Por: <strong>{item.nombre_contacto || item.creador?.nombre || 'Anónimo'}</strong></span>
                    <span>🕐 {new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* WhatsApp direct contact (revealing phone number) */}
                {!revealedContacts[item.id] ? (
                  <button
                    onClick={() => setRevealedContacts(prev => ({ ...prev, [item.id]: true }))}
                    style={{
                      width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
                      fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer',
                      border: '1.5px dashed var(--border)', backgroundColor: 'transparent',
                      color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}
                  >
                    📞 Mostrar Teléfono de Contacto
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#fff', fontWeight: 'bold' }}>
                      <Phone size={14} style={{ color: 'var(--primary)' }} />
                      <span>{item.contacto_whatsapp}</span>
                    </div>
                    <a
                      href={`https://wa.me/${item.contacto_whatsapp?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola, vi tu publicación "${item.titulo}" en FiloSOS. ¿Sigue disponible?`)}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        padding: '0.75rem 1rem', backgroundColor: '#25D366', color: '#fff',
                        borderRadius: '0.75rem', textDecoration: 'none', fontWeight: '700',
                        fontSize: '0.85rem', boxShadow: '0 2px 8px rgba(37,211,102,0.3)'
                      }}
                    >
                      <MessageCircle size={16} /> Contactar por WhatsApp
                    </a>
                  </div>
                )}
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
        onClose={() => {
          formImages.forEach(img => {
            if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
          });
          setFormImages([]);
          setFormData(getInitialForm());
          setShowForm(false);
        }}
        title="📦 Publicar en Mercado Solidario"
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

          {/* Carga de Imágenes (Máx 4) */}
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', justifyContext: 'space-between', justifyContent: 'space-between' }}>
              <span>Fotos del artículo (Máx 4) *</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formImages.length}/4 cargadas</span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              {formImages.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', width: '60px', height: '60px' }}>
                  <img src={img.previewUrl} alt="Preview" style={{ width: '100%', height: '100%', borderRadius: '0.5rem', objectFit: 'cover', border: '1px solid var(--border)' }} />
                  <button
                    type="button"
                    onClick={() => handleImageRemove(idx)}
                    style={{
                      position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ef4444',
                      border: 'none', borderRadius: '50%', width: '16px', height: '16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                      fontSize: '9px', cursor: 'pointer', fontWeight: 'bold'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {formImages.length < 4 && (
                <label style={{
                  width: '60px', height: '60px', borderRadius: '0.5rem', border: '2px dashed var(--border)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 'bold',
                  backgroundColor: 'var(--bg-surface-soft)', gap: '2px'
                }}>
                  <span>➕</span>
                  <span>Subir</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageAdd}
                    disabled={compressing}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
            {compressing && <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.25rem' }}>Comprimiendo imágenes...</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label className="input-label">Nombre del Contacto *</label>
              <input
                className="input-field"
                placeholder="Ej. Juan Pérez"
                value={formData.nombre_contacto}
                onChange={e => setFormData({ ...formData, nombre_contacto: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">WhatsApp de Contacto *</label>
              <input
                type="tel"
                className="input-field"
                placeholder="Ej. 04121234567"
                value={formData.contacto_whatsapp}
                onChange={e => setFormData({ ...formData, contacto_whatsapp: e.target.value })}
                required
              />
            </div>
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
