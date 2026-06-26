import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  Heart, Search, Plus, Trash2, ShieldAlert, Phone, AlertTriangle, 
  MapPin, CheckCircle, Smile, HelpCircle, User, FileText, Bell, X, Volume2, VolumeX 
} from 'lucide-react';
import BottomModal from '../components/BottomModal';
import { compressImage } from '../utils/imageCompression';

const AVATAR_CHILD = '/avatar_person.png'; // Fallback avatar

const ESTADO_REENCUENTRO_CONFIG = {
  busqueda: { label: 'Madre/Padre Buscando', color: '#fb7185', bg: 'rgba(251, 113, 133, 0.15)', border: 'rgba(251, 113, 133, 0.3)', icon: Heart },
  supervision: { label: 'Niño/a Solo / Bajo Supervisión', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', icon: ShieldAlert },
  reencontrado: { label: 'Reencuentro Confirmado', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', icon: CheckCircle }
};

export default function FamilyReunificationView({ user, onRequireLogin }) {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);
  
  // Disclaimer modal state (visible on first load of the module per session)
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    return !sessionStorage.getItem('filoSOS_families_disclaimer_accepted');
  });

  // Amber alert modal state
  const [amberAlertMinor, setAmberAlertMinor] = useState(null);
  const [amberSirenActive, setAmberSirenActive] = useState(false);
  const [audioCtx, setAudioCtx] = useState(null);
  const [sirenOsc, setSirenOsc] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    nombre_menor: '',
    edad: '',
    senas_particulares: '',
    estado_reencuentro: 'busqueda',
    validador_info: '',
    nombre_adulto: user?.nombre || '',
    documento_adulto: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('desaparecidos_infancia')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setChildren(data || []);
    } catch (e) {
      console.error('Error cargando reencuentros familiares:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDisclaimerAccept = () => {
    sessionStorage.setItem('filoSOS_families_disclaimer_accepted', 'true');
    setShowDisclaimer(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setFotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const startSirenSynthesizer = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      
      // Siren sweep modulation
      let time = ctx.currentTime;
      for (let i = 0; i < 60; i++) {
        osc.frequency.linearRampToValueAtTime(1000, time + 0.3);
        osc.frequency.linearRampToValueAtTime(600, time + 0.6);
        time += 0.6;
      }
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      
      setAudioCtx(ctx);
      setSirenOsc(osc);
      setAmberSirenActive(true);
    } catch (e) {
      console.error('AudioContext not supported or blocked:', e);
    }
  };

  const stopSirenSynthesizer = () => {
    if (sirenOsc) {
      try { sirenOsc.stop(); } catch(e){}
    }
    if (audioCtx) {
      try { audioCtx.close(); } catch(e){}
    }
    setSirenOsc(null);
    setAudioCtx(null);
    setAmberSirenActive(false);
  };

  const handleTriggerAmberAlert = (minor) => {
    setAmberAlertMinor(minor);
    startSirenSynthesizer();
  };

  const handleCloseAmberAlert = () => {
    stopSirenSynthesizer();
    setAmberAlertMinor(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormErrors({});

    // Validaciones estrictas de seguridad de adultos e información del menor
    const errors = {};
    if (!formData.nombre_menor.trim()) errors.nombre_menor = 'Nombre del menor es requerido';
    if (!formData.edad.trim()) errors.edad = 'Edad o tiempo estimado es requerido';
    if (!formData.nombre_adulto.trim()) errors.nombre_adulto = 'Nombre completo del adulto reportante es obligatorio';
    if (!formData.documento_adulto.trim()) errors.documento_adulto = 'Documento de identidad del adulto es obligatorio para trazabilidad';
    
    if (formData.estado_reencuentro === 'supervision' && !formData.validador_info.trim()) {
      errors.validador_info = 'Debes ingresar el nombre y contacto del voluntario/autoridad a cargo del menor';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      let imageUrls = [];
      if (imageFile) {
        setCompressing(true);
        const compressedBlob = await compressImage(imageFile);
        setCompressing(false);

        const fileName = `infancia-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
        const uploadRes = await fetch(`https://venezuelasos-media-api.filocentraldemando.workers.dev/upload?file=${fileName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'image/jpeg' },
          body: compressedBlob
        });

        if (uploadRes.ok) {
          const resData = await uploadRes.json();
          imageUrls.push(resData.url);
        } else {
          throw new Error('Error al subir la imagen del menor a Cloudflare R2.');
        }
      }

      const { error } = await supabase.from('desaparecidos_infancia').insert({
        creador_id: user?.id || null,
        user_id: user?.id || null,
        nombre_menor: formData.nombre_menor.trim(),
        edad: formData.edad.trim(),
        senas_particulares: formData.senas_particulares.trim(),
        estado_reencuentro: formData.estado_reencuentro,
        validador_info: formData.estado_reencuentro === 'supervision' ? formData.validador_info.trim() : null,
        nombre_adulto: formData.nombre_adulto.trim(),
        documento_adulto: formData.documento_adulto.trim(),
        fotos: imageUrls
      });

      if (error) throw error;

      setShowForm(false);
      setImageFile(null);
      setFotoPreview(null);
      setFormData({
        nombre_menor: '',
        edad: '',
        senas_particulares: '',
        estado_reencuentro: 'busqueda',
        validador_info: '',
        nombre_adulto: user?.nombre || '',
        documento_adulto: ''
      });
      fetchChildren();
      window.showToast('Reporte infantil registrado de forma segura', 'success');
    } catch (e) {
      console.error(e);
      alert('Error al publicar el reporte infantil. Por favor, intente de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este reporte de menor? Esta acción requiere privilegios de administración.')) return;
    try {
      const { error } = await supabase.from('desaparecidos_infancia').delete().eq('id', id);
      if (error) throw error;
      setChildren(children.filter(c => c.id !== id));
      setSelected(null);
      window.showToast('Reporte infantil eliminado', 'info');
    } catch (e) {
      console.error(e);
      alert('No tienes permisos de borrado para este reporte.');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('desaparecidos_infancia')
        .update({ estado_reencuentro: newStatus })
        .eq('id', id);
      if (error) throw error;
      setSelected(null);
      fetchChildren();
      window.showToast('Estado de reencuentro actualizado', 'success');
    } catch (e) {
      console.error(e);
      alert('Error al actualizar el estado de reencuentro.');
    }
  };

  const filtered = children.filter(c => {
    const matchSearch = !search || c.nombre_menor.toLowerCase().includes(search.toLowerCase()) || (c.senas_particulares || '').toLowerCase().includes(search.toLowerCase());
    const matchEstado = filterEstado === 'all' || c.estado_reencuentro === filterEstado;
    return matchSearch && matchEstado;
  });

  return (
    <div style={{ paddingBottom: '2.5rem', paddingTop: '0.5rem' }}>
      
      {/* 1. Header del Módulo con branding en rosa suave */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.6rem' }}>🧸</span>
            <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: '#fff' }}>Reuniendo Familias</h1>
          </div>
          <p style={{ color: '#fb7185', fontSize: '0.85rem', fontWeight: '600', margin: '4px 0 0 0' }}>Búsqueda y Localización Segura de Menores</p>
        </div>
        <button 
          className="btn" 
          style={{ 
            padding: '0.625rem 1rem', 
            borderRadius: '2rem', 
            backgroundColor: '#fb7185',
            color: '#fff',
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            border: 'none',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(251, 113, 133, 0.4)',
            cursor: 'pointer'
          }} 
          onClick={() => setShowForm(true)}
        >
          <Plus size={18} /> Reportar Menor
        </button>
      </div>

      {/* ── Aviso de seguridad sobre menores (Accordion) ────────────── */}
      <details style={{
        backgroundColor: 'rgba(220, 38, 38, 0.06)',
        border: '1.5px solid rgba(220, 38, 38, 0.25)',
        borderRadius: '1rem',
        marginBottom: '1.25rem',
        overflow: 'hidden',
      }}>
        <summary style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          padding: '0.875rem 1.1rem',
          cursor: 'pointer', userSelect: 'none', outline: 'none',
          fontWeight: '800', fontSize: '0.9rem', color: '#f87171',
          listStyle: 'none',
        }}>
          <ShieldAlert size={17} style={{ flexShrink: 0 }} />
          🛑 Aviso de seguridad sobre menores — Léelo antes de continuar
        </summary>
        <div style={{ padding: '0 1.1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
            <strong>La entrega de menores a desconocidos está absolutamente prohibida.</strong> Esta sección existe para <em>facilitar el reencuentro seguro</em> con sus familias, nunca para intermediar en transferencias no verificadas.
          </p>
          <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6, borderLeft: '3px solid #f87171', paddingLeft: '0.75rem' }}>
            ⚠️ <strong>Recordatorio histórico — Tragedia de Vargas (1999):</strong> Tras la catástrofe, decenas de niños fueron separados de sus familias en el caos y entregados a personas desconocidas que alegaban ser familiares. Muchos no pudieron reencontrarse jamás. <strong>No repitamos ese error.</strong>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>Protocolo obligatorio al encontrar un menor solo:</p>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <li>📍 Mantenerlo en un lugar público y seguro bajo tu supervisión directa.</li>
              <li>🆔 Exigir identificación verificada del adulto que reclama parentesco.</li>
              <li>🚓 Notificar siempre a las autoridades competentes (CICPC, Protección Civil, CECODAP).</li>
              <li>🤍 No presionar al menor si está en estado de shock. Darle agua, abrigo y calma.</li>
              <li>📵 No publicar datos completos (nombre, foto, ubicación exacta) en redes sociales abiertas.</li>
            </ul>
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            FiloSOS no valida la identidad de los adultos que contactan a través de esta plataforma. Toda entrega debe realizarse en presencia de autoridades.
          </p>
        </div>
      </details>

      {/* 2. Buscador y Filtros */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div className="search-bar" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar menor por nombre o señas..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem', scrollbarWidth: 'none' }} className="hide-scrollbar">
          <button className={`filter-chip ${filterEstado === 'all' ? 'active' : ''}`} onClick={() => setFilterEstado('all')} style={{ borderColor: filterEstado === 'all' ? '#fb7185' : 'var(--border)' }}>Todos</button>
          <button className={`filter-chip ${filterEstado === 'busqueda' ? 'active' : ''}`} onClick={() => setFilterEstado('busqueda')} style={{ borderColor: filterEstado === 'busqueda' ? '#fb7185' : 'var(--border)' }}>Buscando Familia</button>
          <button className={`filter-chip ${filterEstado === 'supervision' ? 'active' : ''}`} onClick={() => setFilterEstado('supervision')} style={{ borderColor: filterEstado === 'supervision' ? '#fb7185' : 'var(--border)' }}>Niño/a Solo</button>
          <button className={`filter-chip ${filterEstado === 'reencontrado' ? 'active' : ''}`} onClick={() => setFilterEstado('reencontrado')} style={{ borderColor: filterEstado === 'reencontrado' ? '#fb7185' : 'var(--border)' }}>Reencontrados</button>
        </div>
      </div>

      {/* 3. Asistente y Tips de Seguridad */}
      <div style={{ 
        backgroundColor: 'rgba(251, 113, 133, 0.05)', 
        border: '1.5px dashed rgba(251, 113, 133, 0.3)', 
        borderRadius: '1.25rem', 
        padding: '1.25rem', 
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fb7185', fontWeight: '800', fontSize: '0.95rem' }}>
          <HelpCircle size={18} />
          <span>Asistente de Seguridad: Protocolo Infantil</span>
        </div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          <strong>🛡️ Regla de oro:</strong> Nunca entregue a un menor encontrado a un desconocido. Exija identificación verificada y mantenga supervisión de las autoridades responsables.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-surface-soft)', padding: '0.3rem 0.6rem', borderRadius: '1rem', color: 'var(--text-secondary)' }}>
            📍 Mantener en lugar público seguro
          </span>
          <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-surface-soft)', padding: '0.3rem 0.6rem', borderRadius: '1rem', color: 'var(--text-secondary)' }}>
            🤝 Validar identidad del adulto
          </span>
          <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-surface-soft)', padding: '0.3rem 0.6rem', borderRadius: '1rem', color: 'var(--text-secondary)' }}>
            🤍 No presionar en shock
          </span>
        </div>
      </div>

      {/* 4. Listado de Menores */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando información segura...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>No se encontraron reportes.</div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {filtered.map(child => {
            const config = ESTADO_REENCUENTRO_CONFIG[child.estado_reencuentro] || ESTADO_REENCUENTRO_CONFIG.busqueda;
            const ChildIcon = config.icon;
            return (
              <div 
                key={child.id}
                className="card"
                onClick={() => setSelected(child)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  border: `1.5px solid ${config.color}`,
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '1.25rem',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                  position: 'relative'
                }}
              >
                <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '0.75rem', overflow: 'hidden' }}>
                  <img 
                    src={child.fotos?.[0] || AVATAR_CHILD} 
                    alt={child.nombre_menor}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                    <span style={{
                      padding: '0.25rem 0.6rem', borderRadius: '2rem',
                      backgroundColor: config.bg, color: config.color,
                      fontSize: '0.65rem', fontWeight: '800', backdropFilter: 'blur(8px)',
                      border: `1px solid ${config.border}`
                    }}>
                      {config.label.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="font-display" style={{ fontWeight: '800', fontSize: '1.15rem', color: '#fff', margin: 0 }}>
                    {child.nombre_menor}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#fb7185', fontWeight: 'bold' }}>{child.edad}</span>
                </div>

                {child.senas_particulares && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {child.senas_particulares}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <span>Reportante: <strong>{child.nombre_adulto}</strong></span>
                  <span>🕐 {new Date(child.created_at).toLocaleDateString()}</span>
                </div>

                {/* Emergencia comunitaria Amber Button */}
                {child.estado_reencuentro !== 'reencontrado' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTriggerAmberAlert(child);
                    }}
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)'
                    }}
                    title="Activar Emergencia Alerta Amber"
                  >
                    <Bell size={15} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Disclaimer Emergente Obligatorio */}
      {showDisclaimer && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(6, 13, 26, 0.9)',
          backdropFilter: 'blur(15px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '2.5px solid #fb7185',
            borderRadius: '1.5rem',
            padding: '2.25rem 1.5rem',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '3rem' }}>🛡️</span>
              <h3 className="font-display" style={{ fontSize: '1.35rem', fontWeight: '800', color: '#fff', margin: 0 }}>
                Aviso de Seguridad Obligatorio
              </h3>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'left', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ margin: 0, borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <strong>🧸 Protocolo de Protección Infantil:</strong> Por seguridad de los niños, FILO: SOS exige que cualquier niño encontrado quede bajo la tutela de una autoridad civil o voluntario identificado en el formulario.
              </p>
              <p style={{ margin: 0 }}>
                <strong>⚠️ NUNCA</strong> entregue a un menor de edad a ninguna persona que no haya pasado por los canales oficiales y verifique fehacientemente su identidad e ID de validación del reencuentro.
              </p>
            </div>

            <button
              onClick={handleDisclaimerAccept}
              style={{
                backgroundColor: '#fb7185',
                color: '#fff',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.875rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(251, 113, 133, 0.3)',
                marginTop: '0.5rem'
              }}
            >
              Entiendo y Acepto el Protocolo
            </button>
          </div>
        </div>
      )}

      {/* 6. Simulador de Alerta Amber de Emergencia */}
      {amberAlertMinor && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(239, 68, 68, 0.95)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1.5rem',
          animation: 'pulse 1.5s infinite alternate'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '4px solid #ef4444',
            borderRadius: '2rem',
            padding: '2rem 1.5rem',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                <Bell className="animate-bounce" size={24} />
                <strong style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alerta Amber Comunal</strong>
              </div>
              <button 
                onClick={handleCloseAmberAlert}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <img 
                src={amberAlertMinor.fotos?.[0] || AVATAR_CHILD} 
                alt={amberAlertMinor.nombre_menor}
                style={{ width: '90px', height: '90px', borderRadius: '1rem', objectFit: 'cover', border: '2px solid #ef4444' }} 
              />
              <div style={{ textAlign: 'left' }}>
                <h3 className="font-display" style={{ fontSize: '1.35rem', fontWeight: '800', color: '#fff', margin: 0 }}>
                  {amberAlertMinor.nombre_menor}
                </h3>
                <p style={{ color: '#ef4444', margin: '4px 0 0 0', fontSize: '0.9rem', fontWeight: 'bold' }}>Edad: {amberAlertMinor.edad}</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Registrado el {new Date(amberAlertMinor.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem', color: '#fff' }}>Señas particulares:</span>
              <p style={{ margin: 0, lineHeight: '1.5' }}>{amberAlertMinor.senas_particulares || 'No especificadas.'}</p>
            </div>

            <div style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.05)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              borderRadius: '0.75rem', 
              padding: '0.75rem',
              fontSize: '0.75rem',
              color: '#fca5a5',
              lineHeight: '1.4'
            }}>
              🚨 Notificación de emergencia enviada en tiempo real a los coordinadores civiles del sector. Si tienes alguna información de su ubicación, repórtala de inmediato.
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                onClick={stopSirenSynthesizer}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                disabled={!amberSirenActive}
              >
                <VolumeX size={16} /> Silenciar Sirena
              </button>
              <button
                onClick={startSirenSynthesizer}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                disabled={amberSirenActive}
              >
                <Volume2 size={16} /> Activar Sirena
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Detalle Bottom Sheet */}
      <BottomModal isOpen={!!selected} onClose={() => setSelected(null)} title="Detalle del Menor">
        {selected && (() => {
          const config = ESTADO_REENCUENTRO_CONFIG[selected.estado_reencuentro] || ESTADO_REENCUENTRO_CONFIG.busqueda;
          const ChildIcon = config.icon;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ position: 'relative', width: '100%', height: '260px', borderRadius: '1rem', overflow: 'hidden' }}>
                <img 
                  src={selected.fotos?.[0] || AVATAR_CHILD} 
                  alt={selected.nombre_menor} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <h2 className="font-display" style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                    {selected.nombre_menor}
                  </h2>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: config.bg,
                    border: `1px solid ${config.border}`,
                    color: config.color,
                    borderRadius: '2rem',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap'
                  }}>
                    <ChildIcon size={14} />
                    <span>{config.label}</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Edad / Tiempo: <strong>{selected.edad}</strong>
                </div>
              </div>

              {selected.senas_particulares && (
                <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <span style={{ fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                    Señas Particulares (Ropa, Marcas, etc.):
                  </span>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    {selected.senas_particulares}
                  </p>
                </div>
              )}

              {selected.validador_info && (
                <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <span style={{ fontWeight: '700', color: '#f59e0b', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                    Autoridad o Voluntario a Cargo:
                  </span>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    {selected.validador_info}
                  </p>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                  Información del Adulto Informante (Trazabilidad):
                </span>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>Nombre: <strong>{selected.nombre_adulto}</strong></span>
                  <span>Documento: <strong>{selected.documento_adulto}</strong></span>
                </div>
              </div>

              {/* Botones de Moderación y Estado */}
              {user && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {selected.estado_reencuentro !== 'reencontrado' && (
                    <button
                      onClick={() => handleUpdateStatus(selected.id, 'reencontrado')}
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
                        gap: '0.5rem'
                      }}
                    >
                      <CheckCircle size={18} /> Confirmar Reencuentro con su Familia
                    </button>
                  )}
                  {selected.estado_reencuentro === 'busqueda' && (
                    <button
                      onClick={() => {
                        const contactVal = window.prompt("Ingresa el Nombre y Teléfono del voluntario o autoridad responsable:");
                        if (contactVal) handleUpdateStatus(selected.id, 'supervision');
                      }}
                      style={{ 
                        padding: '0.875rem', 
                        backgroundColor: 'rgba(245,158,11,0.1)', 
                        color: '#f59e0b', 
                        border: '1px solid rgba(245,158,11,0.3)', 
                        borderRadius: '0.75rem', 
                        fontWeight: '700', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        gap: '0.5rem'
                      }}
                    >
                      <ShieldAlert size={18} /> Marcar "Bajo Supervisión / Niño Solo"
                    </button>
                  )}

                  {(user.rol === 'admin' || user.rol === 'staff' || selected.creador_id === user.id) && (
                    <button 
                      onClick={() => handleDelete(selected.id)}
                      className="btn"
                      style={{ 
                        color: '#ef4444', 
                        border: '1px solid rgba(239,68,68,0.2)', 
                        backgroundColor: 'rgba(239,68,68,0.05)', 
                        padding: '0.75rem', 
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
                      <Trash2 size={16} /> Eliminar Reporte Infantil
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </BottomModal>

      {/* 8. Formulario de Registro Modal */}
      <BottomModal isOpen={showForm} onClose={() => setShowForm(false)} title="🧸 Registrar Reporte de Menor">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label className="input-label">Nombre del Menor *</label>
              <input 
                className="input-field" 
                type="text" 
                placeholder="Nombre o alias" 
                value={formData.nombre_menor} 
                onChange={e => setFormData({ ...formData, nombre_menor: e.target.value })} 
              />
              {formErrors.nombre_menor && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{formErrors.nombre_menor}</span>}
            </div>

            <div className="input-group">
              <label className="input-label">Edad *</label>
              <input 
                className="input-field" 
                type="text" 
                placeholder="Ej. 4 años" 
                value={formData.edad} 
                onChange={e => setFormData({ ...formData, edad: e.target.value })} 
              />
              {formErrors.edad && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{formErrors.edad}</span>}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Señas Particulares (ropa que llevaba, marcas) *</label>
            <textarea 
              className="input-field" 
              placeholder="Ej. Camiseta azul, lunar en el brazo, cicatriz en frente..." 
              value={formData.senas_particulares} 
              onChange={e => setFormData({ ...formData, senas_particulares: e.target.value })}
              style={{ height: '70px', resize: 'none' }}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Estado del Menor *</label>
            <select 
              className="input-field" 
              value={formData.estado_reencuentro} 
              onChange={e => setFormData({ ...formData, estado_reencuentro: e.target.value })}
              style={{ padding: '0.75rem' }}
            >
              <option value="busqueda">Madre/Padre Buscando</option>
              <option value="supervision">Niño solo / Bajo Supervisión</option>
            </select>
          </div>

          {formData.estado_reencuentro === 'supervision' && (
            <div className="input-group">
              <label className="input-label">Voluntario o Autoridad a Cargo *</label>
              <input 
                className="input-field" 
                type="text" 
                placeholder="Nombre de la persona/refugio y su teléfono" 
                value={formData.validador_info} 
                onChange={e => setFormData({ ...formData, validador_info: e.target.value })} 
              />
              {formErrors.validador_info && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{formErrors.validador_info}</span>}
            </div>
          )}

          {/* Adult validation section - MANDATORY FOR TRACEABILITY */}
          <div style={{ 
            backgroundColor: 'var(--bg-surface-soft)', 
            border: '1px solid var(--border)', 
            borderRadius: '1rem', 
            padding: '1rem', 
            marginTop: '0.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              👤 Validación del Adulto Informante (Obligatoria)
            </span>
            <div className="input-group">
              <label className="input-label" style={{ fontSize: '0.75rem' }}>Nombre Completo del Adulto *</label>
              <input 
                className="input-field" 
                type="text" 
                placeholder="Tu nombre completo" 
                value={formData.nombre_adulto} 
                onChange={e => setFormData({ ...formData, nombre_adulto: e.target.value })} 
              />
              {formErrors.nombre_adulto && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{formErrors.nombre_adulto}</span>}
            </div>
            <div className="input-group">
              <label className="input-label" style={{ fontSize: '0.75rem' }}>Cédula de Identidad / Documento *</label>
              <input 
                className="input-field" 
                type="text" 
                placeholder="V-12345678" 
                value={formData.documento_adulto} 
                onChange={e => setFormData({ ...formData, documento_adulto: e.target.value })} 
              />
              {formErrors.documento_adulto && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{formErrors.documento_adulto}</span>}
            </div>
          </div>

          {/* Image selection */}
          <div className="input-group">
            <label className="input-label">Foto del menor (Recomendado)</label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem' }}>
              {fotoPreview ? (
                <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                  <img src={fotoPreview} alt="Preview" style={{ width: '100%', height: '100%', borderRadius: '0.5rem', objectFit: 'cover' }} />
                  <button type="button" onClick={() => { setImageFile(null); setFotoPreview(null); }} style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', fontSize: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ) : (
                <label style={{ width: '60px', height: '60px', borderRadius: '0.5rem', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <Plus size={20} />
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                </label>
              )}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {compressing ? 'Comprimiendo...' : 'Imagen JPEG optimizada automáticamente'}
              </span>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn" 
            style={{ width: '100%', padding: '0.875rem', backgroundColor: '#fb7185', color: '#fff', border: 'none', fontWeight: 'bold', borderRadius: '0.75rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(251, 113, 133, 0.3)', marginTop: '0.5rem' }} 
            disabled={submitting || compressing}
          >
            {submitting ? 'Registrando Reporte...' : '🧸 Publicar Reporte Infantil'}
          </button>
        </form>
      </BottomModal>
      
    </div>
  );
}
