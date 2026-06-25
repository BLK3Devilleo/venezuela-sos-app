import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Plus, Search, Phone, MessageCircle, AlertTriangle, CheckCircle, MapPin, Trash2, Smile, Image as ImageIcon, X } from 'lucide-react';
import BottomModal from '../components/BottomModal';
import { z } from 'zod';
import { compressImage } from '../utils/imageCompression';
import { dbLocal } from '../utils/dbLocal';

const AVATAR_PERSON = '/avatar_person.png';

const phoneRegex = /^(0414|0424|0412|0416|0426|0212)\d{7}$/;
const formSchema = z.object({
  nombre: z.string().min(3, "Mínimo 3 letras").max(60, "Nombre muy largo"),
  edad: z.string().max(3, "Edad inválida").optional(),
  descripcion: z.string().max(255, "Máximo 255 caracteres").optional(),
  ultima_ubicacion: z.string().max(100, "Ubicación muy larga").optional(),
  contacto: z.string().regex(phoneRegex, "Teléfono inválido. Ej: 04141234567"),
  instagram: z.string().max(50, "Muy largo").optional(),
  facebook: z.string().max(50, "Muy largo").optional()
});

export default function MissingPersonsView({ user }) {
  const [people, setPeople] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOfflineData, setIsOfflineData] = useState(!navigator.onLine);
  const [compressing, setCompressing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selected, setSelected] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '', edad: '', descripcion: '', ultima_ubicacion: '',
    contacto: user?.contacto || '', instagram: '', facebook: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchPeople();
    fetchDrafts();

    if (navigator.onLine) {
      syncOfflineDrafts();
    }

    const handleOnline = () => {
      console.log('[Red] Conectado a internet. Sincronizando personas offline...');
      syncOfflineDrafts();
      fetchPeople();
    };

    const handleOffline = () => {
      console.log('[Red] Dispositivo offline. Cargando personas desde caché...');
      fetchPeople();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchPeople = async () => {
    setLoading(true);
    try {
      if (navigator.onLine) {
        const { data, error } = await supabase.from('desaparecidos').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        
        await dbLocal.personasCache.clear();
        if (data && data.length > 0) {
          await dbLocal.personasCache.bulkAdd(data);
        }
        setPeople(data || []);
        setIsOfflineData(false);
      } else {
        const cached = await dbLocal.personasCache.toArray();
        setPeople(cached || []);
        setIsOfflineData(true);
      }
    } catch (err) {
      console.error('Error fetching people, usando caché local:', err);
      const cached = await dbLocal.personasCache.toArray();
      setPeople(cached || []);
      setIsOfflineData(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrafts = async () => {
    try {
      const localDrafts = await dbLocal.personasDrafts.toArray();
      setDrafts(localDrafts || []);
    } catch (err) {
      console.error('Error fetching local drafts:', err);
    }
  };

  const syncOfflineDrafts = async () => {
    if (!navigator.onLine) return;

    try {
      const localDrafts = await dbLocal.personasDrafts.toArray();
      if (localDrafts.length === 0) return;

      console.log(`[Sync] Sincronizando ${localDrafts.length} reportes de personas guardados offline...`);

      for (const draft of localDrafts) {
        let imageUrls = [];

        if (draft.fotoBlob) {
          try {
            const fileName = `persona-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
            const uploadRes = await fetch(`https://venezuelasos-media-api.filocentraldemando.workers.dev/upload?file=${fileName}`, {
              method: 'POST',
              headers: { 'Content-Type': 'image/jpeg' },
              body: draft.fotoBlob
            });

            if (uploadRes.ok) {
              const resData = await uploadRes.json();
              imageUrls.push(resData.url);
            } else {
              continue;
            }
          } catch (picErr) {
            console.error('Error de red al subir foto del borrador:', picErr);
            continue;
          }
        }

        const { error } = await supabase.from('desaparecidos').insert({
          nombre_y_edad: draft.nombre.trim() + (draft.edad ? ` (${draft.edad} años)` : ''),
          descripcion: draft.descripcion,
          ultima_ubicacion: draft.ultima_ubicacion,
          contacto: draft.contacto,
          redes_sociales: { instagram: draft.instagram, facebook: draft.facebook },
          fotos: imageUrls
        });

        if (error) {
          console.error('Error al guardar borrador en Supabase:', error);
          continue;
        }

        await dbLocal.personasDrafts.delete(draft.id);
      }

      fetchPeople();
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
        let imageUrls = [];
        if (compressedBlob) {
          const fileName = `persona-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
          const uploadRes = await fetch(`https://venezuelasos-media-api.filocentraldemando.workers.dev/upload?file=${fileName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'image/jpeg' },
            body: compressedBlob
          });

          if (uploadRes.ok) {
            const resData = await uploadRes.json();
            imageUrls.push(resData.url);
          } else {
            throw new Error('Error al subir imagen a Cloudflare.');
          }
        }

        const { error } = await supabase.from('desaparecidos').insert({
          nombre_y_edad: formData.nombre.trim() + (formData.edad ? ` (${formData.edad} años)` : ''),
          descripcion: formData.descripcion.trim(),
          ultima_ubicacion: formData.ultima_ubicacion.trim() || 'No especificada',
          contacto: formData.contacto.trim(),
          redes_sociales: { instagram: formData.instagram.trim(), facebook: formData.facebook.trim() },
          fotos: imageUrls
        });

        if (error) throw error;
        alert('Reporte publicado exitosamente.');
      } else {
        await dbLocal.personasDrafts.add({
          nombre: formData.nombre.trim(),
          edad: formData.edad,
          descripcion: formData.descripcion.trim(),
          ultima_ubicacion: formData.ultima_ubicacion.trim() || 'No especificada',
          contacto: formData.contacto.trim(),
          instagram: formData.instagram.trim(),
          facebook: formData.facebook.trim(),
          fotoBlob: compressedBlob,
          created_at: new Date().toISOString()
        });
        alert('Sin conexión. Se guardó localmente y se sincronizará automáticamente al reconectar.');
      }

      setShowAddForm(false);
      setFormData({ nombre: '', edad: '', descripcion: '', ultima_ubicacion: '', contacto: user?.contacto || '', instagram: '', facebook: '' });
      setImageFile(null);
      setFotoPreview(null);
      fetchPeople();
      fetchDrafts();
    } catch (err) {
      console.error(err);
      try {
        let compressedBlob = imageFile ? await compressImage(imageFile) : null;
        await dbLocal.personasDrafts.add({
          nombre: formData.nombre.trim(),
          edad: formData.edad,
          descripcion: formData.descripcion.trim(),
          ultima_ubicacion: formData.ultima_ubicacion.trim() || 'No especificada',
          contacto: formData.contacto.trim(),
          instagram: formData.instagram.trim(),
          facebook: formData.facebook.trim(),
          fotoBlob: compressedBlob,
          created_at: new Date().toISOString()
        });
        alert('Error de conexión. Se guardó localmente de forma segura.');
        setShowAddForm(false);
        setFormData({ nombre: '', edad: '', descripcion: '', ultima_ubicacion: '', contacto: user?.contacto || '', instagram: '', facebook: '' });
        setImageFile(null);
        setFotoPreview(null);
        fetchPeople();
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
        await dbLocal.personasDrafts.delete(id);
        fetchDrafts();
      } else {
        const { error } = await supabase.from('desaparecidos').delete().eq('id', id);
        if (error) throw error;
        fetchPeople();
      }
      setSelected(null);
    } catch (err) {
      console.error(err);
      alert('Error al eliminar.');
    }
  };

  const isLocated = (p) => {
    const d = p.descripcion?.toLowerCase() || '';
    const n = p.nombre_y_edad?.toLowerCase() || '';
    return d.includes('localizado') || d.includes('salvo') || n.includes('salvo');
  };

  const handleUpdateStatus = async (id) => {
    await supabase.from('desaparecidos').update({ descripcion: 'ESTADO: Localizado a salvo.' }).eq('id', id);
    setSelected(null);
    fetchPeople();
  };

  const getImageUrl = (p) => {
    if (p.isDraft && p.fotoBlob) {
      return URL.createObjectURL(p.fotoBlob);
    }
    return p.fotos?.[0];
  };

  const combinedPeople = [
    ...drafts.map(d => ({ 
      ...d, 
      isDraft: true,
      nombre_y_edad: d.nombre + (d.edad ? ` (${d.edad} años)` : '')
    })),
    ...people
  ];

  const filtered = combinedPeople.filter(p => {
    const q = search.toLowerCase();
    const match = p.nombre_y_edad?.toLowerCase().includes(q) ||
                  p.descripcion?.toLowerCase().includes(q) ||
                  p.ultima_ubicacion?.toLowerCase().includes(q);
    if (filterStatus === 'sin_contacto') return match && !isLocated(p);
    if (filterStatus === 'localizado') return match && isLocated(p);
    return match;
  });

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: '800' }}>Buscar Personas</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Red comunitaria de búsqueda y contacto.</p>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ padding: '0.625rem 1rem', borderRadius: '2rem', boxShadow: '0 4px 12px rgba(13,148,136,0.3)' }} 
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={18} /> Reportar
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
      {combinedPeople.length > 0 && (
        <div style={{ 
          display: 'flex', gap: '0.875rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem', scrollbarWidth: 'none' 
        }}>
          {combinedPeople.map(p => (
            <div key={p.isDraft ? `draft-avatar-${p.id}` : p.id} onClick={() => setSelected(p)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '72px', cursor: 'pointer' }}>
              <div style={{ 
                width: '68px', height: '68px', borderRadius: '50%', padding: '3px',
                background: isLocated(p) ? '#16a34a' : 'linear-gradient(45deg, #f59e0b, #dc2626)',
                marginBottom: '6px',
                position: 'relative'
              }}>
                <img 
                  src={getImageUrl(p) || AVATAR_PERSON} 
                  alt="Avatar" 
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--bg-primary)' }} 
                />
                {p.isDraft && (
                  <span style={{ position: 'absolute', bottom: '0', right: '0', fontSize: '0.75rem', background: '#eab308', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>⏳</span>
                )}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-primary)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', fontWeight: '500' }}>
                {p.nombre_y_edad?.split(' ')[0]}
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
            placeholder="Buscar por nombre, lugar..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem', scrollbarWidth: 'none' }}>
          <button className={`filter-chip ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>Todos</button>
          <button className={`filter-chip ${filterStatus === 'sin_contacto' ? 'active' : ''}`} onClick={() => setFilterStatus('sin_contacto')}>Sin Contacto</button>
          <button className={`filter-chip ${filterStatus === 'localizado' ? 'active' : ''}`} onClick={() => setFilterStatus('localizado')}>A Salvo</button>
        </div>
      </div>

      {/* Listado de Tarjetas */}
      {loading && people.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>No se encontraron personas con esos criterios.</div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {filtered.map(p => {
            const located = isLocated(p);
            return (
              <div 
                key={p.isDraft ? `draft-card-${p.id}` : p.id} 
                className="card" 
                onClick={() => setSelected(p)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', cursor: 'pointer',
                  borderLeft: `4px solid ${located ? '#16a34a' : '#ef4444'}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  transition: 'transform 0.15s ease',
                  position: 'relative'
                }}
              >
                <img 
                  src={getImageUrl(p) || AVATAR_PERSON} 
                  alt="Foto" 
                  style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', backgroundColor: 'var(--bg-surface-soft)' }} 
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                    {p.nombre_y_edad}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                    <MapPin size={12} /> {p.ultima_ubicacion || 'No especificada'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {located && (
                      <div style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: '700', padding: '0.2rem 0.5rem', backgroundColor: 'rgba(22,163,74,0.1)', color: '#16a34a', borderRadius: '0.25rem' }}>
                        ✓ LOCALIZADO A SALVO
                      </div>
                    )}
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
      <BottomModal isOpen={showAddForm} onClose={() => setShowAddForm(false)} title="Reportar Desaparecido">
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label className="input-label">Nombre Completo *</label>
              <input className="input-field" placeholder="Ej. Carmen Guzmán" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
              {formErrors.nombre && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{formErrors.nombre}</span>}
            </div>
            <div className="input-group">
              <label className="input-label">Edad</label>
              <input className="input-field" type="number" placeholder="Ej. 45" value={formData.edad} onChange={e => setFormData({ ...formData, edad: e.target.value })} />
              {formErrors.edad && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{formErrors.edad}</span>}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Última Ubicación Conocida</label>
            <input className="input-field" placeholder="Ej. Plaza Bolívar, Centro" value={formData.ultima_ubicacion} onChange={e => setFormData({ ...formData, ultima_ubicacion: e.target.value })} />
            {formErrors.ultima_ubicacion && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{formErrors.ultima_ubicacion}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">Descripción (Ropa, señas particulares)</label>
            <textarea className="input-field" style={{ height: '70px', resize: 'none' }} placeholder="Llevaba camisa azul..." value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} />
            {formErrors.descripcion && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{formErrors.descripcion}</span>}
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
      <BottomModal isOpen={!!selected} onClose={() => setSelected(null)} title="Detalle de Persona">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <img src={getImageUrl(selected) || AVATAR_PERSON} alt="Foto" style={{ width: '90px', height: '90px', borderRadius: '1rem', objectFit: 'cover' }} />
              <div>
                <h2 className="font-display" style={{ fontSize: '1.35rem', fontWeight: '800', lineHeight: 1.1 }}>{selected.nombre_y_edad}</h2>
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

            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <span style={{ fontWeight: '700', display: 'block', marginBottom: '0.25rem' }}>Descripción:</span>
              {selected.descripcion || 'Sin descripción adicional.'}
            </div>

            {isLocated(selected) ? (
              <div style={{ padding: '1rem', backgroundColor: 'rgba(22,163,74,0.1)', color: '#16a34a', borderRadius: '0.75rem', textAlign: 'center', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <CheckCircle size={20} /> ESTA PERSONA FUE LOCALIZADA A SALVO
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                {!selected.isDraft && (
                  <>
                    <a 
                      href={`https://wa.me/${selected.contacto.replace(/[^0-9]/g, '')}?text=Hola,%20tengo%20información%20sobre%20${selected.nombre_y_edad}`}
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
                  </>
                )}
                
                {user && !selected.isDraft && (
                  <button 
                    onClick={() => handleUpdateStatus(selected.id)}
                    style={{ gridColumn: '1 / -1', padding: '0.75rem', backgroundColor: 'rgba(22,163,74,0.1)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <Smile size={18} /> Marcar como "Localizado a Salvo"
                  </button>
                )}
              </div>
            )}

            {(user?.rol === 'admin' || selected.isDraft) && (
              <button 
                onClick={() => handleDelete(selected.id, selected.isDraft)}
                className="btn btn-secondary"
                style={{ color: '#ef4444', borderColor: '#fee2e2', backgroundColor: '#fef2f2', padding: '0.75rem', marginTop: '0.5rem', width: '100%' }}
              >
                <Trash2 size={16} /> Eliminar Reporte
              </button>
            )}
          </div>
        )}
      </BottomModal>
    </div>
  );
}
