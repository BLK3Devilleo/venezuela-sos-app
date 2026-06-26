import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  User, Phone, MessageCircle, Camera, Edit2, Save, X, 
  ArrowLeft, Send, Sparkles, AlertCircle, Clock, Activity,
  Inbox, Download, Check, Trash2, ShieldAlert, MapPin, Heart, ShoppingBag, Folder
} from 'lucide-react';
import imageCompression from 'browser-image-compression';
import BottomModal from '../components/BottomModal';
import { dbLocal } from '../utils/dbLocal';

const phoneRegex = /^\d{7,15}$/;

const AVATAR_PRESETS = [
  { emoji: '🙋', label: 'Voluntario', color: '#0d9488' },
  { emoji: '🆘', label: 'Afectado', color: '#dc2626' },
  { emoji: '🤝', label: 'Apoyo', color: '#2563eb' },
  { emoji: '🩹', label: 'Médico', color: '#ea580c' },
  { emoji: '⚡', label: 'FILO', color: '#7c3aed' }
];

export default function ProfileView({ user, onUserUpdate, viewUserId, setView }) {
  // If viewUserId is provided and different from the logged-in user, we are in View-Only Mode
  const isOwnProfile = !viewUserId || viewUserId === user.id;
  const targetUserId = isOwnProfile ? user.id : viewUserId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form States
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [rol, setRol] = useState('afectado');
  const [fotoPerfil, setFotoPerfil] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [aporteDescripcion, setAporteDescripcion] = useState('');
  const [necesidadDescripcion, setNecesidadDescripcion] = useState('');
  
  // Social Media Handles
  const [instagram, setInstagram] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [telegram, setTelegram] = useState('');

  // User's Published Services (for view-only mode or listing own posts)
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [activeTab, setActiveTab] = useState('datos'); // 'datos' | 'buzon' | 'publicaciones'

  // Message Inbox states
  const [messages, setMessages] = useState([]);
  const [localMessageIds, setLocalMessageIds] = useState(new Set());
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // User's Published items (for "Mis Publicaciones" tab)
  const [userPublications, setUserPublications] = useState({
    desaparecidos: [],
    marketplace: [],
    servicios: [],
    recursos: []
  });
  const [loadingPubs, setLoadingPubs] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchUserServices();
    if (isOwnProfile) {
      fetchMessages();
      fetchUserPublications();
    }
  }, [targetUserId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', targetUserId)
        .single();
      
      if (error) throw error;

      if (data) {
        setProfile(data);
        
        // Initialize form fields
        setNombre(data.nombre || '');
        setContacto(data.contacto || '');
        setRol(data.rol || 'afectado');
        setFotoPerfil(data.foto_perfil || '');
        setDescripcion(data.descripcion || '');
        setAporteDescripcion(data.aporte_descripcion || '');
        setNecesidadDescripcion(data.necesidad_descripcion || '');
        
        // Social networks initialization
        const social = data.redes_sociales || {};
        setInstagram(social.instagram || '');
        setXHandle(social.x || '');
        setTelegram(social.telegram || '');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserServices = async () => {
    setServicesLoading(true);
    try {
      const { data } = await supabase
        .from('servicios')
        .select('*')
        .eq('creador_id', targetUserId)
        .order('created_at', { ascending: false });
      
      setServices(data || []);
    } catch (err) {
      console.error('Error fetching user services:', err);
    } finally {
      setServicesLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!isOwnProfile || !user) return;
    setLoadingMessages(true);
    try {
      let onlineMsgs = [];
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('mensajes_informacion')
          .select('*, desaparecidos(nombre_y_edad)')
          .eq('recibido_por', user.id)
          .order('created_at', { ascending: false });
        if (!error && data) {
          onlineMsgs = data;
        }
      }
      
      const localMsgs = await dbLocal.mensajesLocal.toArray();
      const localIds = new Set(localMsgs.map(m => m.id));
      setLocalMessageIds(localIds);

      const msgMap = {};
      localMsgs.forEach(m => {
        msgMap[m.id] = { ...m, isLocal: true };
      });
      onlineMsgs.forEach(m => {
        msgMap[m.id] = { ...msgMap[m.id], ...m, isOnline: true };
      });

      const combined = Object.values(msgMap).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setMessages(combined);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleOpenMessage = async (msg) => {
    setSelectedMessage(msg);
    if (!localMessageIds.has(msg.id)) {
      try {
        const toSave = {
          id: msg.id,
          persona_id: msg.persona_id,
          enviado_por: msg.enviado_por,
          recibido_por: msg.recibido_por,
          detalles: msg.detalles,
          foto: msg.foto,
          ubicacion_texto: msg.ubicacion_texto,
          created_at: msg.created_at,
          desaparecidos: msg.desaparecidos
        };
        await dbLocal.mensajesLocal.put(toSave);
        setLocalMessageIds(prev => {
          const next = new Set(prev);
          next.add(msg.id);
          return next;
        });
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isLocal: true } : m));
      } catch (err) {
        console.error('Error saving message locally:', err);
      }
    }
  };

  const handleBackupAllMessages = async () => {
    try {
      const toSave = messages.map(msg => ({
        id: msg.id,
        persona_id: msg.persona_id,
        enviado_por: msg.enviado_por,
        recibido_por: msg.recibido_por,
        detalles: msg.detalles,
        foto: msg.foto,
        ubicacion_texto: msg.ubicacion_texto,
        created_at: msg.created_at,
        desaparecidos: msg.desaparecidos
      }));
      if (toSave.length > 0) {
        await dbLocal.mensajesLocal.bulkPut(toSave);
        const newIds = new Set(toSave.map(m => m.id));
        setLocalMessageIds(newIds);
        setMessages(prev => prev.map(m => ({ ...m, isLocal: true })));
        window.showToast('Todos los mensajes han sido respaldados en tu dispositivo.', 'success');
      }
    } catch (err) {
      console.error('Error backing up all messages:', err);
      window.showToast('Error al respaldar los mensajes.', 'error');
    }
  };

  const fetchUserPublications = async () => {
    if (!isOwnProfile || !user) return;
    setLoadingPubs(true);
    try {
      const { data: desaparecidosData } = await supabase
        .from('desaparecidos')
        .select('*')
        .or(`creador_id.eq.${user.id},user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      const { data: marketplaceData } = await supabase
        .from('marketplace')
        .select('*')
        .eq('creador_id', user.id)
        .order('created_at', { ascending: false });

      const { data: serviciosData } = await supabase
        .from('servicios')
        .select('*')
        .eq('creador_id', user.id)
        .order('created_at', { ascending: false });

      const { data: recursosData } = await supabase
        .from('recursos')
        .select('*')
        .eq('creador_id', user.id)
        .order('created_at', { ascending: false });

      setUserPublications({
        desaparecidos: desaparecidosData || [],
        marketplace: marketplaceData || [],
        servicios: serviciosData || [],
        recursos: recursosData || []
      });
    } catch (err) {
      console.error('Error fetching user publications:', err);
    } finally {
      setLoadingPubs(false);
    }
  };

  const handleDeletePublication = async (type, id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta publicación?')) return;
    try {
      const { error } = await supabase.from(type).delete().eq('id', id);
      if (error) throw error;
      window.showToast('Publicación eliminada correctamente.', 'success');
      fetchUserPublications();
    } catch (err) {
      console.error('Error deleting publication:', err);
      window.showToast('Error al eliminar la publicación.', 'error');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const options = {
        maxSizeMB: 0.02, // Compress to < 20KB for fast database storage
        maxWidthOrHeight: 180,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = () => {
        setFotoPerfil(reader.result);
      };
    } catch (err) {
      console.error('Error compressing image:', err);
    }
  };

  const selectPresetAvatar = (preset) => {
    // Generate a simple SVG preset avatar based on emoji and color
    const svgAvatar = `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="${preset.color}"/>
        <text x="50" y="65" font-size="45" text-anchor="middle">${preset.emoji}</text>
      </svg>
    `)}`;
    setFotoPerfil(svgAvatar);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!nombre.trim()) {
      setFormError('El nombre es requerido');
      return;
    }

    if (contacto && !phoneRegex.test(contacto)) {
      setFormError('Teléfono inválido. Solo números y máximo 15 dígitos.');
      return;
    }

    setSaving(true);
    const redes_sociales = {
      instagram: instagram.trim(),
      x: xHandle.trim(),
      telegram: telegram.trim()
    };

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update({
          nombre: nombre.trim(),
          contacto: contacto.trim(),
          rol,
          foto_perfil: fotoPerfil,
          descripcion: descripcion.trim(),
          aporte_descripcion: rol === 'voluntario' ? aporteDescripcion.trim() : null,
          necesidad_descripcion: rol === 'afectado' ? necesidadDescripcion.trim() : null,
          redes_sociales
        })
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;

      if (data) {
        setProfile(data);
        setIsEditing(false);
        if (onUserUpdate) {
          onUserUpdate(data); // Sync main app state
        }
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setFormError('Error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-secondary)' }}>
        Cargando perfil...
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
        No se pudo cargar el perfil del usuario.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '2.5rem', width: '100%', animation: 'fadeIn 0.3s ease' }}>
      
      {/* Navigation header for details */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setView('dashboard')}
          style={{
            background: 'var(--bg-surface-soft)',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            width: '36px', height: '36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-secondary)'
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
          {isOwnProfile ? 'Mi Perfil' : `Perfil de ${profile.nombre}`}
        </span>
      </div>

      {isEditing ? (
        /* ================== EDIT FORM ================== */
        <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 className="font-display" style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.25rem' }}>
            Editar mis datos
          </h2>

          {formError && (
            <div style={{
              backgroundColor: 'rgba(220,38,38,0.15)',
              border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              color: '#f87171',
              fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              <AlertCircle size={16} />
              {formError}
            </div>
          )}

          {/* Profile Picture Upload & Presets */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', width: '90px', height: '90px' }}>
              {fotoPerfil ? (
                <img src={fotoPerfil} alt="Avatar Preview" style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
              ) : (
                <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-soft)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={36} style={{ color: 'var(--text-muted)' }} />
                </div>
              )}
              <label style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: 'var(--primary)', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                <Camera size={14} />
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
              </label>
            </div>
            
            <div style={{ textAlign: 'center', width: '100%' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                O elige un avatar rápido de FILO:
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                {AVATAR_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectPresetAvatar(p)}
                    title={p.label}
                    style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--bg-surface-soft)', border: '1px solid var(--border)',
                      cursor: 'pointer', transition: 'all 0.15s'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.15)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {p.emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Nombre Completo *</label>
            <input 
              type="text" 
              className="input-field" 
              value={nombre} 
              onChange={e => setNombre(e.target.value)} 
              required 
            />
          </div>

          <div className="input-group">
            <label className="input-label">WhatsApp de Contacto</label>
            <input 
              type="tel" 
              className="input-field" 
              placeholder="Ej. 04121234567" 
              value={contacto} 
              onChange={e => setContacto(e.target.value)} 
            />
          </div>

          <div className="input-group">
            <label className="input-label">Rol en la red</label>
            <select 
              className="input-field select-field" 
              value={rol} 
              onChange={e => setRol(e.target.value)}
            >
              <option value="afectado">🆘 Solicitante (necesito asistencia)</option>
              <option value="voluntario">🙋 Voluntario (puedo ofrecer ayuda)</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Biografía / Breve Descripción</label>
            <textarea 
              className="input-field" 
              style={{ height: '60px', resize: 'none' }}
              placeholder="Cuéntanos un poco sobre ti..."
              value={descripcion} 
              onChange={e => setDescripcion(e.target.value)} 
            />
          </div>

          {/* Conditional inputs based on selected role */}
          {rol === 'voluntario' ? (
            <div className="input-group" style={{ animation: 'fadeIn 0.2s' }}>
              <label className="input-label" style={{ color: 'var(--primary)' }}>¿Qué puedes aportar? *</label>
              <textarea 
                className="input-field" 
                style={{ height: '70px', resize: 'none', borderColor: 'rgba(13,148,136,0.3)' }}
                placeholder="Escribe el tipo de apoyo, recursos o servicios que pones a disposición de la comunidad..."
                value={aporteDescripcion} 
                onChange={e => setAporteDescripcion(e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="input-group" style={{ animation: 'fadeIn 0.2s' }}>
              <label className="input-label" style={{ color: '#ef4444' }}>¿Qué necesitas actualmente? *</label>
              <textarea 
                className="input-field" 
                style={{ height: '70px', resize: 'none', borderColor: 'rgba(239,68,68,0.3)' }}
                placeholder="Indica qué insumos, soporte médico, o recursos requieres con mayor urgencia..."
                value={necesidadDescripcion} 
                onChange={e => setNecesidadDescripcion(e.target.value)}
                required
              />
            </div>
          )}

          {/* Social Networks Handles */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Redes Sociales</span>
            
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Instagram</span>
              <input type="text" className="input-field" placeholder="@usuario" value={instagram} onChange={e => setInstagram(e.target.value)} style={{ padding: '0.4rem 0.8rem' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>X (Twitter)</span>
              <input type="text" className="input-field" placeholder="@usuario" value={xHandle} onChange={e => setXHandle(e.target.value)} style={{ padding: '0.4rem 0.8rem' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Telegram</span>
              <input type="text" className="input-field" placeholder="usuario" value={telegram} onChange={e => setTelegram(e.target.value)} style={{ padding: '0.4rem 0.8rem' }} />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button 
              type="button" 
              onClick={() => setIsEditing(false)} 
              className="btn btn-secondary" 
              style={{ flex: 1 }}
              disabled={saving}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ flex: 1, gap: '0.4rem' }}
              disabled={saving}
            >
              <Save size={16} />
              {saving ? 'Guardando...' : 'Guardar Perfil'}
            </button>
          </div>
        </form>
      ) : (
        /* ================== DISPLAY VIEW ================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Header Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* Background tricolor shine */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
              background: 'linear-gradient(to right, #ffcc00, #00247d, #cf142b)'
            }} />

            {/* Edit button (Only on own profile) */}
            {isOwnProfile && (
              <button
                onClick={() => setIsEditing(true)}
                title="Editar Perfil"
                style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  background: 'var(--bg-surface-soft)', border: '1px solid var(--border)',
                  borderRadius: '50%', width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--text-secondary)'
                }}
              >
                <Edit2 size={14} />
              </button>
            )}

            {/* Avatar */}
            <div style={{ width: '84px', height: '84px', position: 'relative' }}>
              {profile.foto_perfil ? (
                <img src={profile.foto_perfil} alt="Avatar" style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '2.5px solid var(--border-focus)' }} />
              ) : (
                <div style={{ width: '84px', height: '84px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2.5px solid var(--border)' }}>
                  <User size={32} style={{ color: 'var(--text-muted)' }} />
                </div>
              )}
            </div>

            {/* Names & Badges */}
            <div>
              <h2 className="font-display" style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fff', marginBottom: '0.4rem' }}>
                {profile.nombre}
              </h2>
              
              {/* Role badge */}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.7rem',
                fontWeight: '800',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                padding: '0.3rem 0.8rem',
                borderRadius: '2rem',
                backgroundColor: profile.rol === 'voluntario' ? 'rgba(13,148,136,0.15)' : 'rgba(220,38,38,0.12)',
                color: profile.rol === 'voluntario' ? 'var(--primary)' : '#f87171',
                border: `1px solid ${profile.rol === 'voluntario' ? 'rgba(13,148,136,0.3)' : 'rgba(220,38,38,0.25)'}`
              }}>
                {profile.rol === 'voluntario' ? '🙋 Voluntario' : '🆘 Solicitante'}
              </span>
            </div>

            {/* Description / Bio */}
            {profile.descripcion ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', maxWidth: '420px', margin: '0 auto' }}>
                "{profile.descripcion}"
              </p>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                Sin descripción añadida.
              </p>
            )}

            {/* Contact buttons (WhatsApp / Call) */}
            {profile.contacto ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
                <a
                  href={`https://wa.me/${profile.contacto.replace(/[^0-9]/g, '')}?text=Hola%20${profile.nombre},%20te%20escribo%20desde%20filoSOS.`}
                  target="_blank" rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ backgroundColor: '#25D366', color: '#fff', fontSize: '0.85rem', padding: '0.7rem' }}
                >
                  <MessageCircle size={16} /> WhatsApp
                </a>
                <a
                  href={`tel:${profile.contacto}`}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem', padding: '0.7rem' }}
                >
                  <Phone size={16} /> Llamar
                </a>
              </div>
            ) : (
              isOwnProfile && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '0.5rem', width: '100%' }}>
                  Agrega tu teléfono editando tu perfil para que la gente pueda contactarte.
                </div>
              )
            )}
          </div>

          {/* 3-Tab Selector (Only for own profile) */}
          {isOwnProfile && (
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '0.5rem', gap: '1rem' }}>
              <button 
                onClick={() => setActiveTab('datos')}
                style={{
                  padding: '0.75rem 0.5rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'datos' ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === 'datos' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Mis Datos
              </button>
              <button 
                onClick={() => setActiveTab('buzon')}
                style={{
                  padding: '0.75rem 0.5rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'buzon' ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === 'buzon' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Inbox size={16} />
                Buzón
                {messages.length > 0 && (
                  <span style={{ backgroundColor: 'var(--primary)', color: '#fff', borderRadius: '50%', padding: '1px 6px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                    {messages.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('publicaciones')}
                style={{
                  padding: '0.75rem 0.5rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'publicaciones' ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === 'publicaciones' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Folder size={16} />
                Mis Publicaciones
              </button>
            </div>
          )}

          {/* TAB CONTENT: MIS DATOS (OR VIEWING OTHER PROFILE) */}
          {(activeTab === 'datos' || !isOwnProfile) && (
            <>
              {/* Role specific description cards */}
              {profile.rol === 'voluntario' ? (
                profile.aporte_descripcion && (
                  <div className="card" style={{ borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <Sparkles size={14} /> Qué puede aportar:
                    </div>
                    <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                      {profile.aporte_descripcion}
                    </p>
                  </div>
                )
              ) : (
                profile.necesidad_descripcion && (
                  <div className="card" style={{ borderLeft: '4px solid #ef4444', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ef4444', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <AlertCircle size={14} /> Qué necesita con urgencia:
                    </div>
                    <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                      {profile.necesidad_descripcion}
                    </p>
                  </div>
                )
              )}

              {/* Social Media links */}
              {profile.redes_sociales && (profile.redes_sociales.instagram || profile.redes_sociales.x || profile.redes_sociales.telegram) && (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conexiones</span>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {profile.redes_sociales.instagram && (
                      <a 
                        href={`https://instagram.com/${profile.redes_sociales.instagram.replace('@', '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', gap: '0.4rem', borderRadius: '0.5rem' }}
                      >
                        <span>📸</span> {profile.redes_sociales.instagram}
                      </a>
                    )}
                    {profile.redes_sociales.x && (
                      <a 
                        href={`https://x.com/${profile.redes_sociales.x.replace('@', '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', gap: '0.4rem', borderRadius: '0.5rem' }}
                      >
                        <span>🐦</span> {profile.redes_sociales.x}
                      </a>
                    )}
                    {profile.redes_sociales.telegram && (
                      <a 
                        href={`https://t.me/${profile.redes_sociales.telegram.replace('@', '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', gap: '0.4rem', borderRadius: '0.5rem' }}
                      >
                        <Send size={12} /> {profile.redes_sociales.telegram}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* View only user publications */}
              {!isOwnProfile && (
                <div style={{ marginTop: '0.75rem' }}>
                  <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={18} className="text-primary" />
                    Publicaciones Activas ({services.length})
                  </h3>

                  {servicesLoading ? (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cargando publicaciones...</div>
                  ) : services.length === 0 ? (
                    <div style={{
                      background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border)',
                      borderRadius: '0.75rem', padding: '1.5rem', textAlign: 'center',
                      color: 'var(--text-muted)', fontSize: '0.85rem'
                    }}>
                      No tiene publicaciones de ayuda activas en este momento.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {services.map(serv => {
                        const isOffer = serv.rol_servicio === 'ofrece';
                        return (
                          <div 
                            key={serv.id}
                            className="card"
                            style={{ 
                              padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.875rem',
                              borderLeft: `4px solid ${isOffer ? 'var(--primary)' : '#ef4444'}`,
                              backgroundColor: 'var(--bg-surface-soft)'
                            }}
                          >
                            <div style={{ fontSize: '1.4rem' }}>
                              {serv.tipo_servicio === 'medico' ? '⚕️' : '🛠️'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.65rem', fontWeight: '800', color: isOffer ? 'var(--primary)' : '#ef4444', textTransform: 'uppercase' }}>
                                {isOffer ? 'Ofrece ayuda' : 'Necesita apoyo'}
                              </div>
                              <h4 style={{ fontSize: '0.9rem', fontWeight: '700', margin: '0.1rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {serv.subtipo}
                              </h4>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Clock size={10} /> {serv.disponibilidad || 'Inmediata'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Legal / Privacy Links */}
              {isOwnProfile && (
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                  <button 
                    onClick={() => setView('legal')}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: 'var(--text-muted)', 
                      fontSize: '0.8rem', 
                      textDecoration: 'underline',
                      cursor: 'pointer'
                    }}
                  >
                    Aviso Legal, Privacidad y Cookies
                  </button>
                </div>
              )}
            </>
          )}

          {/* TAB CONTENT: BUZON (ONLY OWN PROFILE) */}
          {isOwnProfile && activeTab === 'buzon' && (
            <div style={{ animation: 'fadeIn 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Inbox size={20} style={{ color: 'var(--primary)' }} />
                  <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>Buzón de Reportes Recibidos</h3>
                </div>
                {messages.length > 0 && (
                  <button 
                    onClick={handleBackupAllMessages}
                    className="btn"
                    style={{ 
                      backgroundColor: 'var(--bg-surface-soft)', 
                      border: '1px solid var(--border)', 
                      color: 'var(--text-primary)',
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      padding: '0.4rem 0.8rem', 
                      borderRadius: '2rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <Download size={12} />
                    Respaldar en Móvil
                  </button>
                )}
              </div>

              {loadingMessages && messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cargando buzón...</div>
              ) : messages.length === 0 ? (
                <div style={{ 
                  backgroundColor: 'var(--bg-surface)', 
                  borderRadius: '12px', 
                  padding: '2.5rem 1rem', 
                  textAlign: 'center', 
                  border: '1px solid var(--border)', 
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem'
                }}>
                  No has recibido ningún mensaje de información sobre tus reportes aún.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {messages.map(msg => {
                    const isLocal = localMessageIds.has(msg.id);
                    return (
                      <div 
                        key={msg.id} 
                        onClick={() => handleOpenMessage(msg)}
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderRadius: '12px',
                          border: '1px solid var(--border)',
                          padding: '1rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          transition: 'transform 0.1s'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase' }}>
                              Reporte: {msg.desaparecidos?.nombre_y_edad || 'Persona desaparecida'}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {msg.detalles}
                          </p>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          {isLocal ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                              <Check size={12} />
                              <span>En móvil</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: '12px', fontSize: '0.7rem' }}>
                              <span>Nube</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: MIS PUBLICACIONES (ONLY OWN PROFILE) */}
          {isOwnProfile && activeTab === 'publicaciones' && (
            <div style={{ animation: 'fadeIn 0.2s', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Folder size={20} style={{ color: 'var(--primary)' }} />
                <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>Gestión de Publicaciones Activas</h3>
              </div>

              {loadingPubs ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cargando tus publicaciones...</div>
              ) : (
                (() => {
                  const hasDesap = userPublications.desaparecidos.length > 0;
                  const hasMarket = userPublications.marketplace.length > 0;
                  const hasServ = userPublications.servicios.length > 0;
                  const hasRec = userPublications.recursos.length > 0;

                  if (!hasDesap && !hasMarket && !hasServ && !hasRec) {
                    return (
                      <div style={{ 
                        backgroundColor: 'var(--bg-surface)', 
                        borderRadius: '12px', 
                        padding: '2.5rem 1rem', 
                        textAlign: 'center', 
                        border: '1px solid var(--border)', 
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem'
                      }}>
                        No has creado ninguna publicación todavía.
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {/* Desaparecidos */}
                      {hasDesap && (
                        <div>
                          <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Personas Desaparecidas</h4>
                          <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {userPublications.desaparecidos.map(item => (
                              <div key={item.id} className="card" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-surface-soft)' }}>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>{item.nombre_y_edad}</span>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estado: {item.estado}</div>
                                </div>
                                <button 
                                  onClick={() => handleDeletePublication('desaparecidos', item.id)}
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                                  title="Eliminar Reporte"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Marketplace */}
                      {hasMarket && (
                        <div>
                          <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Mercado Solidario</h4>
                          <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {userPublications.marketplace.map(item => (
                              <div key={item.id} className="card" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-surface-soft)' }}>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>{item.titulo}</span>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tipo: {item.tipo} • Categoría: {item.categoria}</div>
                                </div>
                                <button 
                                  onClick={() => handleDeletePublication('marketplace', item.id)}
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                                  title="Eliminar Publicación"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Servicios */}
                      {hasServ && (
                        <div>
                          <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Servicios de Asistencia</h4>
                          <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {userPublications.servicios.map(item => (
                              <div key={item.id} className="card" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-surface-soft)' }}>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>{item.subtipo}</span>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tipo: {item.rol_servicio === 'ofrece' ? 'Ofrece' : 'Solicita'}</div>
                                </div>
                                <button 
                                  onClick={() => handleDeletePublication('servicios', item.id)}
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                                  title="Eliminar Servicio"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recursos */}
                      {hasRec && (
                        <div>
                          <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Recursos / Insumos</h4>
                          <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {userPublications.recursos.map(item => (
                              <div key={item.id} className="card" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-surface-soft)' }}>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>{item.nombre}</span>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Categoría: {item.categoria} • Cantidad: {item.cantidad}</div>
                                </div>
                                <button 
                                  onClick={() => handleDeletePublication('recursos', item.id)}
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                                  title="Eliminar Recurso"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* Message Viewer Bottom Sheet */}
          <BottomModal isOpen={!!selectedMessage} onClose={() => setSelectedMessage(null)} title="Detalle del Reporte de Información">
            {selectedMessage && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(13,148,136,0.1)',
                  border: '1px solid rgba(13,148,136,0.2)',
                  color: 'var(--primary)',
                  borderRadius: '8px',
                  fontSize: '0.8rem'
                }}>
                  <ShieldAlert size={16} />
                  <span>Este mensaje está guardado en tu móvil. Se borrará del servidor en 15 días.</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    Referencia de persona:
                  </span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {selectedMessage.desaparecidos?.nombre_y_edad || 'Desconocido'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Recibido el {new Date(selectedMessage.created_at).toLocaleString()}
                  </span>
                </div>

                <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Detalles del Avistamiento:
                  </span>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {selectedMessage.detalles}
                  </p>
                </div>

                {selectedMessage.ubicacion_texto && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <MapPin size={16} style={{ color: 'var(--primary)' }} />
                    <span>Ubicación descrita: <strong>{selectedMessage.ubicacion_texto}</strong></span>
                  </div>
                )}

                {selectedMessage.foto && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      Foto adjunta:
                    </span>
                    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', maxHeight: '300px', backgroundColor: 'var(--bg-primary)' }}>
                      <img 
                        src={selectedMessage.foto} 
                        alt="Evidencia adjunta" 
                        style={{ width: '100%', maxHeight: '300px', objectFit: 'contain' }} 
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </BottomModal>

        </div>
      )}
    </div>
  );
}
