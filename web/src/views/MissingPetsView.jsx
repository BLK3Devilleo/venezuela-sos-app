import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Plus, Search, Phone, MessageCircle, AlertTriangle, CheckCircle, MapPin, Trash2, Heart, Image as ImageIcon, X, Loader } from 'lucide-react';
import BottomModal from '../components/BottomModal';
import { z } from 'zod';
import { compressImage } from '../utils/imageCompression';
import { dbLocal } from '../utils/dbLocal';

const AVATAR_PET = '/avatar_pet.png';

const phoneRegex = /^\d{7,15}$/;
const formSchema = z.object({
  especie_y_raza: z.string().min(3, "Mínimo 3 letras").max(60, "Nombre muy largo"),
  estado: z.enum(['perdida', 'encontrada', 'necesita_atencion', 'donacion_alimento', 'donacion_medicina', 'donacion_otros']),
  ultima_ubicacion: z.string().max(100, "Ubicación muy larga").optional(),
  contacto: z.string().regex(phoneRegex, "Teléfono inválido. Solo números y máximo 15 dígitos.")
});

const ESTADO_CONFIG = {
  perdida:          { label: 'Perdida',          color: '#dc2626', bg: 'rgba(220,38,38,0.12)',  emoji: '🔍' },
  encontrada:       { label: 'Encontrada',       color: '#16a34a', bg: 'rgba(22,163,74,0.12)',  emoji: '🏠' },
  necesita_atencion:{ label: 'Necesita Atención',  color: '#d97706', bg: 'rgba(217,119,6,0.12)', emoji: '🆘' },
  donacion_alimento:{ label: 'Donación Alimento', color: '#10b981', bg: 'rgba(16,185,129,0.12)', emoji: '🥩' },
  donacion_medicina:{ label: 'Donación Medicina', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  emoji: '💊' },
  donacion_otros:   { label: 'Donación Otros',    color: '#a855f7', bg: 'rgba(168,85,247,0.12)', emoji: '📦' }
};

export default function MissingPetsView({ user, onRequireLogin }) {
  const [pets, setPets] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOfflineData, setIsOfflineData] = useState(!navigator.onLine);
  const [compressing, setCompressing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [activeArea, setActiveArea] = useState('reportes'); // 'reportes' or 'donaciones'
  
  const [formData, setFormData] = useState({
    especie_y_raza: '', estado: 'perdida',
    ultima_ubicacion: '', contacto: user?.contacto || ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchPets();
    fetchDrafts();

    if (navigator.onLine) {
      syncOfflineDrafts();
    }

    const handleOnline = () => {
      console.log('[Red] Conectado a internet. Sincronizando borradores...');
      syncOfflineDrafts();
      fetchPets();
    };

    const handleOffline = () => {
      console.log('[Red] Dispositivo offline. Cargando caché local...');
      fetchPets();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchPets = async () => {
    setLoading(true);
    try {
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('mascotas')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Actualizar caché local
        await dbLocal.mascotasCache.clear();
        if (data && data.length > 0) {
          await dbLocal.mascotasCache.bulkAdd(data);
        }

        setPets(data || []);
        setIsOfflineData(false);
      } else {
        // Cargar desde caché local
        const cached = await dbLocal.mascotasCache.toArray();
        setPets(cached || []);
        setIsOfflineData(true);
      }
    } catch (err) {
      console.error('Error fetching pets, usando caché local:', err);
      const cached = await dbLocal.mascotasCache.toArray();
      setPets(cached || []);
      setIsOfflineData(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrafts = async () => {
    try {
      const localDrafts = await dbLocal.mascotasDrafts.toArray();
      setDrafts(localDrafts || []);
    } catch (err) {
      console.error('Error fetching local drafts:', err);
    }
  };

  const syncOfflineDrafts = async () => {
    if (!navigator.onLine) return;

    try {
      const localDrafts = await dbLocal.mascotasDrafts.toArray();
      if (localDrafts.length === 0) return;

      console.log(`[Sync] Sincronizando ${localDrafts.length} reportes guardados offline...`);

      for (const draft of localDrafts) {
        let imageUrl = null;

        if (draft.fotoBlob) {
          try {
            const fileName = `mascota-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
            const uploadRes = await fetch(`https://venezuelasos-media-api.filocentraldemando.workers.dev/upload?file=${fileName}`, {
              method: 'POST',
              headers: { 'Content-Type': 'image/jpeg' },
              body: draft.fotoBlob
            });

            if (uploadRes.ok) {
              const resData = await uploadRes.json();
              imageUrl = resData.url;
            } else {
              continue;
            }
          } catch (picErr) {
            console.error('Error de red al subir foto del borrador:', picErr);
            continue;
          }
        }

        const { error } = await supabase.from('mascotas').insert({
          especie_y_raza: draft.especie_y_raza,
          estado: draft.estado,
          ultima_ubicacion: draft.ultima_ubicacion,
          contacto: draft.contacto,
          foto_principal: imageUrl,
          user_id: draft.user_id
        });

        if (error) {
          console.error('Error al guardar borrador en Supabase:', error);
          continue;
        }

        await dbLocal.mascotasDrafts.delete(draft.id);
      }

      fetchPets();
      fetchDrafts();
    } catch (err) {
      console.error('Error en proceso de sincronización:', err);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setFotoPreview(reader.result);
    reader.readAsDataURL(file);
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

    setLoading(true);
    try {
      let compressedBlob = null;
      if (imageFile) {
        setCompressing(true);
        compressedBlob = await compressImage(imageFile);
        setCompressing(false);
      }

      if (navigator.onLine) {
        let imageUrl = null;
        if (compressedBlob) {
          const fileName = `mascota-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
          const uploadRes = await fetch(`https://venezuelasos-media-api.filocentraldemando.workers.dev/upload?file=${fileName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'image/jpeg' },
            body: compressedBlob
          });

          if (uploadRes.ok) {
            const resData = await uploadRes.json();
            imageUrl = resData.url;
          } else {
            throw new Error('Error al subir imagen a Cloudflare.');
          }
        }

        const { error } = await supabase.from('mascotas').insert({
          especie_y_raza: formData.especie_y_raza.trim(),
          estado: formData.estado,
          ultima_ubicacion: formData.ultima_ubicacion.trim() || 'No especificada',
          contacto: formData.contacto.trim(),
          foto_principal: imageUrl,
          user_id: user?.id
        });

        if (error) throw error;
        alert('Mascota registrada exitosamente.');
      } else {
        await dbLocal.mascotasDrafts.add({
          especie_y_raza: formData.especie_y_raza.trim(),
          estado: formData.estado,
          ultima_ubicacion: formData.ultima_ubicacion.trim() || 'No especificada',
          contacto: formData.contacto.trim(),
          fotoBlob: compressedBlob,
          user_id: user?.id,
          created_at: new Date().toISOString()
        });
        alert('Sin conexión. Se guardó localmente y se sincronizará automáticamente al reconectar.');
      }

      setShowAddForm(false);
      setFormData({ especie_y_raza: '', estado: 'perdida', ultima_ubicacion: '', contacto: user?.contacto || '' });
      setImageFile(null);
      setFotoPreview(null);
      fetchPets();
      fetchDrafts();
    } catch (err) {
      console.error(err);
      
      try {
        let compressedBlob = imageFile ? await compressImage(imageFile) : null;
        await dbLocal.mascotasDrafts.add({
          especie_y_raza: formData.especie_y_raza.trim(),
          estado: formData.estado,
          ultima_ubicacion: formData.ultima_ubicacion.trim() || 'No especificada',
          contacto: formData.contacto.trim(),
          fotoBlob: compressedBlob,
          user_id: user?.id,
          created_at: new Date().toISOString()
        });
        alert('Error de conexión. Se guardó localmente de forma segura para reintento automático.');
        
        setShowAddForm(false);
        setFormData({ especie_y_raza: '', estado: 'perdida', ultima_ubicacion: '', contacto: user?.contacto || '' });
        setImageFile(null);
        setFotoPreview(null);
        fetchPets();
        fetchDrafts();
      } catch (backupErr) {
        alert('Error al guardar reporte localmente.');
      }
    } finally {
      setLoading(false);
      setCompressing(false);
    }
  };

  const handleDelete = async (id, isDraft) => {
    if (!window.confirm('¿Seguro que deseas eliminar este reporte?')) return;
    try {
      if (isDraft) {
        await dbLocal.mascotasDrafts.delete(id);
        fetchDrafts();
      } else {
        const { error } = await supabase.from('mascotas').delete().eq('id', id);
        if (error) throw error;
        fetchPets();
      }
      setSelected(null);
    } catch (err) {
      console.error(err);
      alert('Error al eliminar.');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    if (!user || (selected?.user_id !== user.id && user.rol !== 'admin' && user.rol !== 'staff')) {
      alert('No tienes permisos para realizar esta acción.');
      return;
    }
    try {
      const { error } = await supabase.from('mascotas').update({ estado: newStatus }).eq('id', id);
      if (error) throw error;
      setSelected(null);
      fetchPets();
    } catch (err) {
      console.error(err);
      alert('Error al actualizar estado.');
    }
  };

  const getImageUrl = (pet) => {
    if (pet.isDraft && pet.fotoBlob) {
      return URL.createObjectURL(pet.fotoBlob);
    }
    return pet.foto_principal;
  };

  const combinedPets = [
    ...drafts.map(d => ({ ...d, isDraft: true })),
    ...pets
  ];

  const filtered = combinedPets.filter(p => {
    // 1. Filter by Active Area
    const isDonation = p.estado?.startsWith('donacion_');
    if (activeArea === 'reportes' && isDonation) return false;
    if (activeArea === 'donaciones' && !isDonation) return false;

    // 2. Search Text
    const q = search.toLowerCase();
    const matchSearch = p.especie_y_raza?.toLowerCase().includes(q) || p.ultima_ubicacion?.toLowerCase().includes(q);
    if (!matchSearch) return false;

    // 3. Status Filter
    if (filterStatus === 'all') return true;
    return p.estado === filterStatus;
  });

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: '800' }}>
            {activeArea === 'reportes' ? 'Mascotas' : 'Donaciones'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {activeArea === 'reportes' 
              ? `${combinedPets.filter(p => p.estado === 'perdida').length} perdidas reportadas`
              : `${combinedPets.filter(p => p.estado?.startsWith('donacion_')).length} ofertas/pedidos de donación`
            }
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ padding: '0.625rem 1rem', borderRadius: '2rem', boxShadow: '0 4px 12px rgba(13,148,136,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }} 
          onClick={() => {
            if (!user) {
              if (onRequireLogin) onRequireLogin();
              return;
            }
            setFormData(prev => ({
              ...prev,
              estado: activeArea === 'reportes' ? 'perdida' : 'donacion_alimento'
            }));
            setShowAddForm(true);
          }}
        >
          <Plus size={18} /> Publicar
        </button>
      </div>

      {/* Area Selector Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '0.35rem', 
        marginBottom: '1.25rem', 
        backgroundColor: 'var(--bg-surface)', 
        padding: '0.35rem', 
        borderRadius: '1.25rem',
        border: '1px solid var(--border)'
      }}>
        <button
          onClick={() => {
            setActiveArea('reportes');
            setFilterStatus('all');
          }}
          style={{
            flex: 1,
            padding: '0.65rem',
            borderRadius: '1rem',
            border: 'none',
            backgroundColor: activeArea === 'reportes' ? 'var(--primary)' : 'transparent',
            color: activeArea === 'reportes' ? '#fff' : 'var(--text-secondary)',
            fontWeight: '700',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem'
          }}
        >
          🐾 Mascotas Perdidas
        </button>
        <button
          onClick={() => {
            setActiveArea('donaciones');
            setFilterStatus('all');
          }}
          style={{
            flex: 1,
            padding: '0.65rem',
            borderRadius: '1rem',
            border: 'none',
            backgroundColor: activeArea === 'donaciones' ? 'var(--primary)' : 'transparent',
            color: activeArea === 'donaciones' ? '#fff' : 'var(--text-secondary)',
            fontWeight: '700',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem'
          }}
        >
          🎁 Donaciones e Insumos
        </button>
      </div>

      {isOfflineData && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          backgroundColor: 'rgba(217,119,6,0.1)',
          border: '1px solid rgba(217,119,6,0.3)',
          color: '#d97706',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          fontSize: '0.85rem'
        }}>
          <AlertTriangle size={16} />
          <span>Estás en modo sin conexión. Mostrando datos guardados localmente.</span>
        </div>
      )}

      {/* Historias / Carousel (Instagram style) */}
      {combinedPets.length > 0 && (
        <div style={{ 
          display: 'flex', gap: '0.875rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem', scrollbarWidth: 'none' 
        }}>
          {combinedPets.map(p => (
            <div key={p.isDraft ? `draft-avatar-${p.id}` : p.id} onClick={() => setSelected(p)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '72px', cursor: 'pointer' }}>
              <div style={{ 
                width: '68px', height: '68px', borderRadius: '50%', padding: '3px',
                background: p.estado === 'encontrada' ? '#16a34a' : 'linear-gradient(45deg, #f59e0b, #dc2626)',
                marginBottom: '6px',
                position: 'relative'
              }}>
                <img 
                  src={getImageUrl(p) || AVATAR_PET} 
                  alt="Avatar" 
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--bg-primary)' }} 
                />
                {p.isDraft && (
                  <span style={{ position: 'absolute', bottom: '0', right: '0', fontSize: '0.75rem', background: '#eab308', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>⏳</span>
                )}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-primary)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', fontWeight: '500' }}>
                {p.especie_y_raza?.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Buscador y Filtros */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div className="search-bar" style={{ flex: 1, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar raza, especie, ubicación..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem', scrollbarWidth: 'none' }} className="hide-scrollbar">
          <button className={`filter-chip ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>Todas</button>
          {activeArea === 'reportes' ? (
            <>
              <button className={`filter-chip ${filterStatus === 'perdida' ? 'active' : ''}`} onClick={() => setFilterStatus('perdida')}>Perdidas</button>
              <button className={`filter-chip ${filterStatus === 'encontrada' ? 'active' : ''}`} onClick={() => setFilterStatus('encontrada')}>Encontradas</button>
              <button className={`filter-chip ${filterStatus === 'necesita_atencion' ? 'active' : ''}`} onClick={() => setFilterStatus('necesita_atencion')}>Auxilio</button>
            </>
          ) : (
            <>
              <button className={`filter-chip ${filterStatus === 'donacion_alimento' ? 'active' : ''}`} onClick={() => setFilterStatus('donacion_alimento')}>🥩 Alimento</button>
              <button className={`filter-chip ${filterStatus === 'donacion_medicina' ? 'active' : ''}`} onClick={() => setFilterStatus('donacion_medicina')}>💊 Medicina</button>
              <button className={`filter-chip ${filterStatus === 'donacion_otros' ? 'active' : ''}`} onClick={() => setFilterStatus('donacion_otros')}>📦 Otros</button>
            </>
          )}
        </div>
      </div>

      {/* Listado de Tarjetas */}
      {loading && pets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>No se encontraron mascotas con esos criterios.</div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {filtered.map(p => {
            const config = ESTADO_CONFIG[p.estado];
            return (
              <div 
                key={p.isDraft ? `draft-card-${p.id}` : p.id} 
                className="card" 
                onClick={() => setSelected(p)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', cursor: 'pointer',
                  borderLeft: `4px solid ${config.color}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  transition: 'transform 0.15s ease',
                  position: 'relative'
                }}
              >
                <img 
                  src={getImageUrl(p) || AVATAR_PET} 
                  alt="Foto" 
                  style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', backgroundColor: 'var(--bg-surface-soft)' }} 
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                    {p.especie_y_raza}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                    <MapPin size={12} /> {p.ultima_ubicacion || 'No especificada'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: '700', padding: '0.2rem 0.5rem', backgroundColor: config.bg, color: config.color, borderRadius: '0.25rem' }}>
                      {config.emoji} {config.label.toUpperCase()}
                    </div>
                    {p.isDraft && (
                      <span style={{ fontSize: '0.65rem', backgroundColor: '#fef08a', color: '#854d0e', padding: '0.2rem 0.4rem', borderRadius: '0.25rem', fontWeight: 'bold' }}>
                        ⏳ OFFLINE
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Formulario Bottom Sheet */}
      <BottomModal isOpen={showAddForm} onClose={() => setShowAddForm(false)} title="Reportar Mascota">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: 'var(--bg-surface)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
              {fotoPreview ? (
                <img src={fotoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
              ) : (
                <ImageIcon size={32} style={{ color: 'var(--text-muted)' }} />
              )}
              <input type="file" accept="image/*" onChange={handleImageSelect} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Toca para añadir foto (Opcional)</span>
          </div>

          <div className="input-group">
            <label className="input-label">Especie y Raza *</label>
            <input className="input-field" placeholder="Ej. Perro Golden Retriever" value={formData.especie_y_raza} onChange={e => setFormData({ ...formData, especie_y_raza: e.target.value })} />
            {formErrors.especie_y_raza && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{formErrors.especie_y_raza}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">Categoría / Estado</label>
            <select className="input-field select-field" value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value })}>
              {activeArea === 'reportes' ? (
                <>
                  <option value="perdida">Perdida — busco a mi mascota</option>
                  <option value="encontrada">Encontrada — encontré una mascota</option>
                  <option value="necesita_atencion">Necesita Atención Urgente / Auxilio</option>
                </>
              ) : (
                <>
                  <option value="donacion_alimento">🥩 Ofrecer/Solicitar Alimento</option>
                  <option value="donacion_medicina">💊 Ofrecer/Solicitar Medicina</option>
                  <option value="donacion_otros">📦 Ofrecer/Solicitar Otros Insumos</option>
                </>
              )}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Última Ubicación</label>
            <input className="input-field" placeholder="Ej. Petare, Caracas" value={formData.ultima_ubicacion} onChange={e => setFormData({ ...formData, ultima_ubicacion: e.target.value })} />
            {formErrors.ultima_ubicacion && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{formErrors.ultima_ubicacion}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">WhatsApp de Contacto *</label>
            <input className="input-field" type="tel" placeholder="04141234567" value={formData.contacto} onChange={e => setFormData({ ...formData, contacto: e.target.value })} />
            {formErrors.contacto && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.contacto}</span>}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem' }} disabled={loading || compressing}>
            {compressing ? 'Optimizando foto...' : loading ? 'Publicando...' : 'Publicar Reporte'}
          </button>
        </form>
      </BottomModal>

      {/* Detalle Bottom Sheet */}
      <BottomModal isOpen={!!selected} onClose={() => setSelected(null)} title="Detalle de Mascota">
        {selected && (() => {
          const config = ESTADO_CONFIG[selected.estado];
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <img src={getImageUrl(selected) || AVATAR_PET} alt="Foto" style={{ width: '90px', height: '90px', borderRadius: '1rem', objectFit: 'cover' }} />
                <div>
                  <h2 className="font-display" style={{ fontSize: '1.35rem', fontWeight: '800', lineHeight: 1.1 }}>{selected.especie_y_raza}</h2>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                    <MapPin size={14} /> {selected.ultima_ubicacion || 'No especificada'}
                  </div>
                  {selected.isDraft && (
                    <span style={{ display: 'inline-block', fontSize: '0.75rem', color: '#854d0e', backgroundColor: '#fef08a', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', marginTop: '0.5rem', fontWeight: 'bold' }}>
                      ⏳ Borrador en tu celular (sin sincronizar)
                    </span>
                  )}
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: config.bg, color: config.color, borderRadius: '0.75rem', textAlign: 'center', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {config.emoji} ESTADO: {config.label.toUpperCase()}
              </div>

              {!selected.isDraft && selected.estado !== 'encontrada' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <a 
                    href={`https://wa.me/${selected.contacto.replace(/[^0-9]/g, '')}?text=Hola,%20tengo%20información%20sobre%20la%20mascota%20${selected.especie_y_raza}`}
                    target="_blank" rel="noopener noreferrer"
                    className="btn btn-primary" style={{ backgroundColor: '#25D366', color: '#fff', padding: '0.875rem' }}
                  >
                    <MessageCircle size={18} /> WhatsApp
                  </a>
                  <a 
                    href={`tel:${selected.contacto}`}
                    className="btn btn-secondary" style={{ padding: '0.875rem' }}
                  >
                    <Phone size={18} /> Llamar
                  </a>
                  
                  {user && (selected.user_id === user.id || user.rol === 'admin' || user.rol === 'staff') && selected.estado === 'perdida' && (
                    <button 
                      onClick={() => handleUpdateStatus(selected.id, 'encontrada')}
                      style={{ gridColumn: '1 / -1', padding: '0.75rem', backgroundColor: 'rgba(22,163,74,0.1)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <CheckCircle size={18} /> Marcar como Encontrada
                    </button>
                  )}
                </div>
              ) : null}

              {(user?.rol === 'admin' || user?.rol === 'staff' || selected.user_id === user?.id || selected.isDraft) && (
                <button 
                  onClick={() => handleDelete(selected.id, selected.isDraft)}
                  className="btn btn-secondary"
                  style={{ color: '#ef4444', borderColor: '#fee2e2', backgroundColor: '#fef2f2', padding: '0.75rem', marginTop: '0.5rem', width: '100%' }}
                >
                  <Trash2 size={16} /> Eliminar Reporte
                </button>
              )}
            </div>
          );
        })()}
      </BottomModal>
    </div>
  );
}
