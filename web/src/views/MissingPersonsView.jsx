import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  Plus, Search, Phone, MessageCircle, AlertTriangle, CheckCircle, MapPin, 
  Trash2, Smile, Image as ImageIcon, X, List, Grid, AlertCircle, 
  Send, Globe, MessageSquare, Hash
} from 'lucide-react';

const InstagramIcon = ({ size = 18, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);
import BottomModal from '../components/BottomModal';
import { z } from 'zod';
import { compressImage } from '../utils/imageCompression';
import { dbLocal } from '../utils/dbLocal';

const AVATAR_PERSON = '/avatar_person.png';

const formSchema = z.object({
  nombre: z.string().min(3, "Mínimo 3 letras").max(60, "Nombre muy largo"),
  edad: z.string().max(3, "Edad inválida").optional(),
  descripcion: z.string().max(255, "Máximo 255 caracteres").optional(),
  ultima_ubicacion: z.string().max(100, "Ubicación muy larga").optional(),
  estado: z.enum(['buscan_a', 'peligro', 'emergencia'])
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
  const [viewMode, setViewMode] = useState('list');
  
  const [formData, setFormData] = useState({
    nombre: '', edad: '', descripcion: '', ultima_ubicacion: '', estado: 'buscan_a'
  });
  const [formContacts, setFormContacts] = useState([
    { tipo: 'whatsapp', valor: '' }
  ]);
  const [imageFile, setImageFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (user?.contacto && !prefilled) {
      setFormContacts([{ tipo: 'whatsapp', valor: user.contacto }]);
      setPrefilled(true);
    }
  }, [user, prefilled]);

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
          contacto: draft.contacto || '',
          redes_sociales: draft.redes_sociales || {},
          estado: draft.estado || 'buscan_a',
          canales_contacto: draft.canales_contacto || [],
          fotos: imageUrls,
          user_id: draft.user_id,
          creador_id: draft.creador_id || draft.user_id
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

  const addContactChannel = () => {
    if (formContacts.length >= 4) return;
    setFormContacts([...formContacts, { tipo: 'whatsapp', valor: '' }]);
  };

  const removeContactChannel = (index) => {
    if (formContacts.length <= 1) return;
    const updated = formContacts.filter((_, i) => i !== index);
    setFormContacts(updated);
  };

  const updateContactChannel = (index, field, val) => {
    const updated = [...formContacts];
    updated[index][field] = val;
    setFormContacts(updated);
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

    // Validate dynamic contacts
    let contactsValid = true;
    let contactsErrorMsg = "";
    
    for (let i = 0; i < formContacts.length; i++) {
      const c = formContacts[i];
      const val = c.valor.trim();
      if (!val) {
        contactsValid = false;
        contactsErrorMsg = "Todos los canales de contacto agregados deben tener un valor.";
        break;
      }
      if (c.tipo === 'whatsapp' || c.tipo === 'call') {
        const cleaned = val.replace(/[^0-9]/g, '');
        if (cleaned.length < 7 || cleaned.length > 15) {
          contactsValid = false;
          contactsErrorMsg = "Los campos de teléfono/WhatsApp deben tener entre 7 y 15 dígitos.";
          break;
        }
      }
    }

    if (!contactsValid) {
      setFormErrors(prev => ({ ...prev, contacts: contactsErrorMsg }));
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

      const firstPhoneContact = formContacts.find(c => c.tipo === 'whatsapp' || c.tipo === 'call')?.valor || '';
      const firstInstagram = formContacts.find(c => c.tipo === 'instagram')?.valor || '';
      const firstFacebook = formContacts.find(c => c.tipo === 'facebook')?.valor || '';

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
          contacto: firstPhoneContact,
          redes_sociales: { instagram: firstInstagram, facebook: firstFacebook },
          estado: formData.estado,
          canales_contacto: formContacts,
          fotos: imageUrls,
          user_id: user?.id,
          creador_id: user?.id
        });

        if (error) throw error;
        alert('Reporte publicado exitosamente.');
      } else {
        await dbLocal.personasDrafts.add({
          nombre: formData.nombre.trim(),
          edad: formData.edad,
          descripcion: formData.descripcion.trim(),
          ultima_ubicacion: formData.ultima_ubicacion.trim() || 'No especificada',
          contacto: firstPhoneContact,
          redes_sociales: { instagram: firstInstagram, facebook: firstFacebook },
          estado: formData.estado,
          canales_contacto: formContacts,
          fotoBlob: compressedBlob,
          user_id: user?.id,
          creador_id: user?.id,
          created_at: new Date().toISOString()
        });
        alert('Sin conexión. Se guardó localmente y se sincronizará automáticamente al reconectar.');
      }

      setShowAddForm(false);
      setFormData({ nombre: '', edad: '', descripcion: '', ultima_ubicacion: '', estado: 'buscan_a' });
      setFormContacts([{ tipo: 'whatsapp', valor: user?.contacto || '' }]);
      setImageFile(null);
      setFotoPreview(null);
      fetchPeople();
      fetchDrafts();
    } catch (err) {
      console.error(err);
      try {
        let compressedBlob = imageFile ? await compressImage(imageFile) : null;
        const firstPhoneContact = formContacts.find(c => c.tipo === 'whatsapp' || c.tipo === 'call')?.valor || '';
        const firstInstagram = formContacts.find(c => c.tipo === 'instagram')?.valor || '';
        const firstFacebook = formContacts.find(c => c.tipo === 'facebook')?.valor || '';

        await dbLocal.personasDrafts.add({
          nombre: formData.nombre.trim(),
          edad: formData.edad,
          descripcion: formData.descripcion.trim(),
          ultima_ubicacion: formData.ultima_ubicacion.trim() || 'No especificada',
          contacto: firstPhoneContact,
          redes_sociales: { instagram: firstInstagram, facebook: firstFacebook },
          estado: formData.estado,
          canales_contacto: formContacts,
          fotoBlob: compressedBlob,
          user_id: user?.id,
          creador_id: user?.id,
          created_at: new Date().toISOString()
        });
        alert('Error de conexión. Se guardó localmente de forma segura.');
        setShowAddForm(false);
        setFormData({ nombre: '', edad: '', descripcion: '', ultima_ubicacion: '', estado: 'buscan_a' });
        setFormContacts([{ tipo: 'whatsapp', valor: user?.contacto || '' }]);
        setImageFile(null);
        setFotoPreview(null);
        fetchPeople();
      } catch {
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

  const handleUpdateStatus = async (id) => {
    if (!user || (selected?.user_id !== user.id && selected?.creador_id !== user.id && user.rol !== 'admin')) {
      alert('No tienes permisos para realizar esta acción.');
      return;
    }
    const { error } = await supabase.from('desaparecidos').update({ estado: 'localizado' }).eq('id', id);
    if (error) {
      console.error(error);
      alert('Error al actualizar estado.');
    } else {
      setSelected(null);
      fetchPeople();
    }
  };

  const getImageUrl = (p) => {
    if (p.isDraft && p.fotoBlob) {
      return URL.createObjectURL(p.fotoBlob);
    }
    return p.fotos?.[0];
  };

  const getPersonEstado = (p) => {
    if (p.estado) return p.estado;
    const d = p.descripcion?.toLowerCase() || '';
    const n = p.nombre_y_edad?.toLowerCase() || '';
    if (d.includes('localizado') || d.includes('salvo') || n.includes('salvo')) {
      return 'localizado';
    }
    return 'buscan_a';
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'buscan_a':
        return { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', label: 'Buscan a' };
      case 'localizado':
        return { color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', label: 'Localizado' };
      case 'peligro':
        return { color: '#a855f7', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)', label: 'Peligro' };
      case 'emergencia':
        return { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', label: 'Emergencia' };
      default:
        return { color: 'var(--text-primary)', bg: 'var(--bg-surface-soft)', border: 'var(--border)', label: 'Todos' };
    }
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
    
    const pEstado = getPersonEstado(p);

    if (filterStatus === 'all') return match;
    return match && pEstado === filterStatus;
  });

  const filterOptions = [
    { id: 'all', label: 'Todos' },
    { id: 'buscan_a', label: 'Buscan a' },
    { id: 'localizado', label: 'Localizados' },
    { id: 'peligro', label: 'Peligro' },
    { id: 'emergencia', label: 'Emergencia' }
  ];

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>Buscar Personas</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Red de búsqueda y contacto.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Toggle View */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--bg-surface)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <button 
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex', padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                backgroundColor: viewMode === 'list' ? 'var(--bg-surface-soft)' : 'transparent',
                color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)'
              }}
              title="Vista Lista"
            >
              <List size={16} />
            </button>
            <button 
              type="button"
              onClick={() => setViewMode('gallery')}
              style={{
                display: 'flex', padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                backgroundColor: viewMode === 'gallery' ? 'var(--bg-surface-soft)' : 'transparent',
                color: viewMode === 'gallery' ? 'var(--text-primary)' : 'var(--text-muted)'
              }}
              title="Vista Galería"
            >
              <Grid size={16} />
            </button>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ padding: '0.625rem 1rem', borderRadius: '2rem', boxShadow: '0 4px 12px rgba(13,148,136,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }} 
            onClick={() => setShowAddForm(true)}
          >
            <Plus size={18} /> Reportar
          </button>
        </div>
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

      {/* Stories / Carousel */}
      {combinedPeople.length > 0 && (
        <div style={{ 
          display: 'flex', gap: '0.875rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem', scrollbarWidth: 'none' 
        }}>
          {combinedPeople.map(p => {
            const estado = getPersonEstado(p);
            const statusGradient = estado === 'localizado' ? 'linear-gradient(45deg, #10b981, #059669)' :
                                   estado === 'peligro' ? 'linear-gradient(45deg, #a855f7, #7c3aed)' :
                                   estado === 'emergencia' ? 'linear-gradient(45deg, #ef4444, #dc2626)' :
                                   'linear-gradient(45deg, #f59e0b, #d97706)';
            return (
              <div key={p.isDraft ? `draft-avatar-${p.id}` : p.id} onClick={() => setSelected(p)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '72px', cursor: 'pointer' }}>
                <div style={{ 
                  width: '68px', height: '68px', borderRadius: '50%', padding: '3px',
                  background: statusGradient,
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
            );
          })}
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
          {filterOptions.map(opt => {
            const isActive = filterStatus === opt.id;
            const styles = getStatusStyles(opt.id);
            return (
              <button 
                key={opt.id}
                onClick={() => setFilterStatus(opt.id)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '2rem',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  border: isActive ? `1.5px solid ${styles.color}` : '1.5px solid var(--border)',
                  backgroundColor: isActive ? styles.bg : 'var(--bg-surface)',
                  color: isActive ? styles.color : 'var(--text-secondary)'
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid or List content */}
      {loading && people.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>No se encontraron personas con esos criterios.</div>
      ) : viewMode === 'list' ? (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {filtered.map(p => {
            const estado = getPersonEstado(p);
            const styles = getStatusStyles(estado);
            return (
              <div 
                key={p.isDraft ? `draft-card-${p.id}` : p.id} 
                className="card" 
                onClick={() => setSelected(p)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', cursor: 'pointer',
                  borderLeft: `5px solid ${styles.color}`,
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transition: 'transform 0.15s ease',
                  position: 'relative',
                  border: '1px solid var(--border)',
                  borderLeftWidth: '5px'
                }}
              >
                <img 
                  src={getImageUrl(p) || AVATAR_PERSON} 
                  alt="Foto" 
                  style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', backgroundColor: 'var(--bg-surface-soft)', border: '2px solid var(--border)' }} 
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)', margin: 0 }}>
                      {p.nombre_y_edad}
                    </h3>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      color: styles.color,
                      backgroundColor: styles.bg,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap'
                    }}>
                      {styles.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                    <MapPin size={12} /> {p.ultima_ubicacion || 'No especificada'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
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
      ) : (
        /* Gallery View */
        <div className="gallery-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginTop: '0.5rem'
        }}>
          {filtered.map(p => {
            const estado = getPersonEstado(p);
            const styles = getStatusStyles(estado);
            return (
              <div 
                key={p.isDraft ? `draft-gallery-${p.id}` : p.id} 
                className="gallery-item"
                onClick={() => setSelected(p)}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: `2px solid ${p.isDraft ? '#eab308' : 'transparent'}`,
                  backgroundColor: 'var(--bg-surface)'
                }}
              >
                <img 
                  src={getImageUrl(p) || AVATAR_PERSON} 
                  alt={p.nombre_y_edad} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <div style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: styles.color,
                  boxShadow: '0 0 6px rgba(0,0,0,0.5)'
                }} />
                
                {p.isDraft && (
                  <div style={{
                    position: 'absolute',
                    top: '6px',
                    left: '6px',
                    backgroundColor: '#eab308',
                    color: '#854d0e',
                    fontSize: '0.55rem',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}>
                    ⏳ OFFLINE
                  </div>
                )}

                {/* Gradient Overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(to top, rgba(11, 15, 25, 0.95) 0%, rgba(11, 15, 25, 0.5) 60%, transparent 100%)',
                  padding: '8px 6px 6px 6px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  pointerEvents: 'none'
                }}>
                  <span className="font-display" style={{
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'block'
                  }}>
                    {p.nombre_y_edad}
                  </span>
                  <span style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    marginTop: '2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    <MapPin size={8} style={{ flexShrink: 0 }} /> {p.ultima_ubicacion || 'No especificada'}
                  </span>
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
            
            <div className="input-group">
              <label className="input-label">Estado de Emergencia *</label>
              <select 
                className="input-field" 
                value={formData.estado} 
                onChange={e => setFormData({ ...formData, estado: e.target.value })}
                style={{ padding: '0.75rem', fontSize: '0.95rem' }}
              >
                <option value="buscan_a">Buscan a</option>
                <option value="peligro">Peligro</option>
                <option value="emergencia">Emergencia</option>
              </select>
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

          {/* Dynamic contact builder */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="input-label" style={{ margin: 0 }}>Canales de Contacto (1 a 4) *</label>
              {formContacts.length < 4 && (
                <button 
                  type="button" 
                  onClick={addContactChannel}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} /> Añadir Canal
                </button>
              )}
            </div>

            {formContacts.map((c, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select 
                  className="input-field" 
                  value={c.tipo} 
                  onChange={e => updateContactChannel(idx, 'tipo', e.target.value)}
                  style={{ width: '120px', padding: '0.5rem', fontSize: '0.85rem' }}
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="call">Llamar</option>
                  <option value="instagram">Instagram</option>
                  <option value="x">X / Twitter</option>
                  <option value="telegram">Telegram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="discord">Discord</option>
                  <option value="slack">Slack</option>
                </select>

                <div style={{ flex: 1, position: 'relative' }}>
                  <input 
                    type={c.tipo === 'whatsapp' || c.tipo === 'call' ? 'tel' : 'text'}
                    className="input-field"
                    placeholder={
                      c.tipo === 'whatsapp' || c.tipo === 'call' ? 'Ej. 04141234567' : 
                      c.tipo === 'instagram' || c.tipo === 'x' || c.tipo === 'telegram' || c.tipo === 'tiktok' ? 'Ej. @usuario' : 
                      'Ej. usuario#1234 o link'
                    }
                    value={c.valor}
                    onChange={e => updateContactChannel(idx, 'valor', e.target.value)}
                    style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                  />
                </div>

                {formContacts.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeContactChannel(idx)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
            
            {formErrors.contacts && (
              <span style={{ color: '#ef4444', fontSize: '0.7rem', display: 'block' }}>
                {formErrors.contacts}
              </span>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem' }} disabled={loading || compressing}>
            {compressing ? 'Optimizando foto...' : loading ? 'Publicando...' : 'Publicar Reporte'}
          </button>
        </form>
      </BottomModal>

      {/* Detalle Bottom Sheet */}
      <BottomModal isOpen={!!selected} onClose={() => setSelected(null)} title="Detalle de Persona">
        {selected && (() => {
          const estado = getPersonEstado(selected);
          const styles = getStatusStyles(estado);
          const StatusIcon = estado === 'localizado' ? CheckCircle : 
                             estado === 'peligro' ? AlertTriangle : 
                             estado === 'emergencia' ? AlertCircle : Search;

          let contacts = [...(selected.canales_contacto || [])];
          
          if (selected.contacto && selected.contacto.trim()) {
            const hasPhone = contacts.some(c => c.tipo === 'call' && c.valor === selected.contacto);
            const hasWhatsApp = contacts.some(c => c.tipo === 'whatsapp' && c.valor === selected.contacto);
            if (!hasPhone && !hasWhatsApp) {
              contacts.unshift(
                { tipo: 'whatsapp', valor: selected.contacto },
                { tipo: 'call', valor: selected.contacto }
              );
            }
          }

          if (selected.redes_sociales) {
            if (selected.redes_sociales.instagram && !contacts.some(c => c.tipo === 'instagram')) {
              contacts.push({ tipo: 'instagram', valor: selected.redes_sociales.instagram });
            }
            if (selected.redes_sociales.facebook && !contacts.some(c => c.tipo === 'facebook')) {
              contacts.push({ tipo: 'facebook', valor: selected.redes_sociales.facebook });
            }
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ position: 'relative', width: '100%', height: '280px', borderRadius: '1rem', overflow: 'hidden' }}>
                <img 
                  src={getImageUrl(selected) || AVATAR_PERSON} 
                  alt={selected.nombre_y_edad} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                {selected.isDraft && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: '#eab308',
                    color: '#854d0e',
                    fontSize: '0.75rem',
                    padding: '4px 8px',
                    borderRadius: '2rem',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    ⏳ Borrador sin sincronizar
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <h2 className="font-display" style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                    {selected.nombre_y_edad}
                  </h2>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: styles.bg,
                    border: `1px solid ${styles.border}`,
                    color: styles.color,
                    borderRadius: '2rem',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap'
                  }}>
                    <StatusIcon size={14} />
                    <span>{styles.label}</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={16} style={{ color: 'var(--primary)' }} /> 
                  <span>Última ubicación: <strong>{selected.ultima_ubicacion || 'No especificada'}</strong></span>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                  Descripción y Señas Particulares:
                </span>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  {selected.descripcion || 'Sin descripción adicional.'}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                  Canales de Contacto Directo:
                </span>
                
                {contacts.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No hay canales de contacto especificados.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {contacts.map((c, idx) => {
                      const value = c.valor || '';
                      const type = c.tipo;
                      
                      let label = '';
                      let href = '';
                      let bgColor = 'var(--bg-surface-soft)';
                      let textColor = 'var(--text-primary)';
                      let Icon = Globe;

                      if (type === 'whatsapp') {
                        const cleaned = value.replace(/[^0-9]/g, '');
                        label = 'WhatsApp';
                        href = `https://wa.me/${cleaned}?text=Hola,%20tengo%20información%20sobre%20${encodeURIComponent(selected.nombre_y_edad)}`;
                        bgColor = '#25D366';
                        textColor = '#ffffff';
                        Icon = MessageCircle;
                      } else if (type === 'call') {
                        label = 'Llamar';
                        href = `tel:${value}`;
                        bgColor = 'var(--primary)';
                        textColor = '#ffffff';
                        Icon = Phone;
                      } else if (type === 'instagram') {
                        const username = value.startsWith('@') ? value.substring(1) : value;
                        label = `Instagram`;
                        href = `https://instagram.com/${username}`;
                        bgColor = 'linear-gradient(45deg, #f9ce34, #ee2a7b, #6228d7)';
                        textColor = '#ffffff';
                        Icon = InstagramIcon;
                      } else if (type === 'x') {
                        const username = value.startsWith('@') ? value.substring(1) : value;
                        label = `X/Twitter`;
                        href = `https://x.com/${username}`;
                        bgColor = '#000000';
                        textColor = '#ffffff';
                        Icon = X;
                      } else if (type === 'telegram') {
                        const username = value.startsWith('@') ? value.substring(1) : value;
                        label = `Telegram`;
                        href = `https://t.me/${username}`;
                        bgColor = '#0088cc';
                        textColor = '#ffffff';
                        Icon = Send;
                      } else if (type === 'tiktok') {
                        const username = value.startsWith('@') ? value.substring(1) : value;
                        label = `TikTok`;
                        href = `https://tiktok.com/@${username}`;
                        bgColor = '#000000';
                        textColor = '#ffffff';
                        Icon = Globe;
                      } else if (type === 'discord') {
                        label = `Discord`;
                        href = value.startsWith('http') ? value : `https://discord.com/users/${value}`;
                        Icon = MessageSquare;
                      } else if (type === 'slack') {
                        label = `Slack`;
                        href = value.startsWith('http') ? value : `#`;
                        Icon = Hash;
                      } else if (type === 'facebook') {
                        label = `Facebook`;
                        href = value.startsWith('http') ? value : `https://facebook.com/${value}`;
                        Icon = Globe;
                      }

                      const isLink = href && href !== '#';

                      return isLink ? (
                        <a
                          key={`channel-${idx}`}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn"
                          style={{
                            background: bgColor,
                            color: textColor,
                            padding: '0.75rem',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            borderRadius: '0.5rem',
                            textDecoration: 'none',
                            border: 'none',
                            fontWeight: 'bold',
                            gridColumn: (type === 'whatsapp' || type === 'call') ? 'auto' : '1 / -1',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        >
                          <Icon size={18} />
                          <span>{label}</span>
                        </a>
                      ) : (
                        <div
                          key={`channel-${idx}`}
                          style={{
                            background: bgColor,
                            color: textColor,
                            padding: '0.75rem',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            borderRadius: '0.5rem',
                            gridColumn: '1 / -1',
                            border: '1px solid var(--border)'
                          }}
                        >
                          <Icon size={18} style={{ color: 'var(--text-secondary)' }} />
                          <span style={{ fontWeight: '500' }}>{label}:</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{value}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {user && !selected.isDraft && (selected.user_id === user.id || selected.creador_id === user.id || user.rol === 'admin') && estado !== 'localizado' && (
                <button 
                  onClick={() => handleUpdateStatus(selected.id)}
                  style={{ 
                    padding: '0.875rem', 
                    backgroundColor: 'rgba(16,185,129,0.1)', 
                    color: '#10b981', 
                    border: '1px solid rgba(16,185,129,0.3)', 
                    borderRadius: '0.75rem', 
                    fontWeight: '700', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    marginTop: '0.5rem',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <Smile size={18} /> Marcar como "Localizado a Salvo"
                </button>
              )}

              {(user?.rol === 'admin' || user?.rol === 'staff' || selected.user_id === user?.id || selected.creador_id === user?.id || selected.isDraft) && (
                <button 
                  onClick={() => handleDelete(selected.id, selected.isDraft)}
                  className="btn"
                  style={{ 
                    color: '#ef4444', 
                    border: '1px solid rgba(239,68,68,0.2)', 
                    backgroundColor: 'rgba(239,68,68,0.05)', 
                    padding: '0.75rem', 
                    marginTop: '0.5rem', 
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    borderRadius: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
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
