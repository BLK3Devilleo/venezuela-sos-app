import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  Plus, Search, Phone, MessageCircle, AlertTriangle, CheckCircle, MapPin, 
  Trash2, Smile, Image as ImageIcon, X, List, Grid, AlertCircle, 
  Send, Globe, MessageSquare, Hash, Inbox, Download, ShieldAlert, Check
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
  apellido: z.string().min(3, "Mínimo 3 letras").max(60, "Apellido muy largo"),
  cedula: z.string().max(20, "Cédula muy larga").optional(),
  edad_aproximada: z.string().max(3, "Edad inválida").optional(),
  genero: z.enum(['Masculino', 'Femenino', 'Otro']),
  ultimo_lugar_visto: z.string().max(100, "Ubicación muy larga").optional(),
  descripcion_adicional: z.string().max(500, "Máximo 500 caracteres").optional(),
  estado: z.enum(['buscan_a', 'peligro', 'emergencia'])
});

export default function MissingPersonsView({ user, onRequireLogin }) {
  const [people, setPeople] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOfflineData, setIsOfflineData] = useState(!navigator.onLine);
  const [compressing, setCompressing] = useState(false);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState('gallery');
  const [advSearchOpen, setAdvSearchOpen] = useState(false);
  const [advNombre, setAdvNombre] = useState('');
  const [advApellido, setAdvApellido] = useState('');
  const [advCedula, setAdvCedula] = useState('');
  const [advTelefono, setAdvTelefono] = useState('');
  const [randomSeed, setRandomSeed] = useState(() => Math.random());
  
  const handleShuffle = () => {
    setRandomSeed(Math.random());
  };
  
  // Extended form states
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    edad_aproximada: '',
    genero: 'Masculino',
    ultimo_lugar_visto: '',
    descripcion_adicional: '',
    estado: 'buscan_a',
    preferencia_contacto: 'telefono' // 'telefono' | 'privado'
  });
  
  const [formContacts, setFormContacts] = useState([
    { tipo: 'whatsapp', valor: '' }
  ]);
  const [imageFile, setImageFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [nombreAutor, setNombreAutor] = useState('');
  const [telefonoAutor, setTelefonoAutor] = useState('');
  const [prefilled, setPrefilled] = useState(false);

  // "Tengo Información" form states
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [infoFormData, setInfoFormData] = useState({
    detalles: '',
    fotoFile: null,
    fotoPreview: null,
    ubicacion_texto: ''
  });
  const [sendingInfo, setSendingInfo] = useState(false);

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
  }, [user]);

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

        let error = null;
        if (draft.isMinor) {
          const res = await supabase.from('desaparecidos_infancia').insert({
            creador_id: draft.creador_id || draft.user_id,
            user_id: draft.creador_id || draft.user_id,
            nombre_menor: (draft.nombre + " " + draft.apellido).trim(),
            edad: String(draft.edad_aproximada || ''),
            senas_particulares: draft.descripcion || '',
            estado_reencuentro: 'busqueda',
            nombre_adulto: draft.nombre_contacto || '',
            documento_adulto: draft.redes_sociales?.cedula || 'No provisto',
            fotos: imageUrls
          });
          error = res.error;
        } else {
          const res = await supabase.from('desaparecidos').insert({
            nombre_y_edad: draft.nombre.trim() + " " + draft.apellido.trim() + (draft.edad_aproximada ? ` (${draft.edad_aproximada} años)` : ''),
            descripcion: draft.descripcion,
            ultima_ubicacion: draft.ultima_ubicacion,
            contacto: draft.contacto || '',
            redes_sociales: draft.redes_sociales || {},
            estado: draft.estado || 'buscan_a',
            canales_contacto: draft.canales_contacto || [],
            fotos: imageUrls,
            user_id: draft.user_id,
            creador_id: draft.creador_id || draft.user_id,
            nombre_contacto: draft.nombre_contacto,
            contacto_whatsapp: draft.contacto_whatsapp
          });
          error = res.error;
        }

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
    
    const parsedData = {
      nombre: formData.nombre,
      apellido: formData.apellido,
      cedula: formData.cedula || undefined,
      edad_aproximada: formData.edad_aproximada || undefined,
      genero: formData.genero,
      ultimo_lugar_visto: formData.ultimo_lugar_visto || undefined,
      descripcion_adicional: formData.descripcion_adicional || undefined,
      estado: formData.estado
    };

    const result = formSchema.safeParse(parsedData);
    if (!result.success) {
      const errors = {};
      result.error.issues.forEach(err => {
        errors[err.path[0]] = err.message;
      });
      setFormErrors(errors);
      const firstErr = result.error.issues[0].message;
      window.showToast(`${result.error.issues[0].path[0].toUpperCase()}: ${firstErr}`, 'error');
      return;
    }

    if (!formData.ultimo_lugar_visto.trim()) {
      window.showToast("La última ubicación es obligatoria para el reporte.", "error");
      setFormErrors(prev => ({ ...prev, ultimo_lugar_visto: "Última ubicación requerida" }));
      return;
    }

    if (!imageFile && !fotoPreview) {
      window.showToast("La foto de la persona es obligatoria para el reporte.", "error");
      return;
    }

    // Validate dynamic contacts only if using telephone option
    let contactsValid = true;
    let contactsErrorMsg = "";
    const isPrivate = formData.preferencia_contacto === 'privado';

    if (!isPrivate) {
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
    }

    if (!contactsValid) {
      setFormErrors(prev => ({ ...prev, contacts: contactsErrorMsg }));
      window.showToast(contactsErrorMsg, 'error');
      return;
    }

    if (!user) {
      if (!nombreAutor.trim()) {
        window.showToast("Tu nombre completo es obligatorio para invitados.", "error");
        return;
      }
      if (!telefonoAutor.trim()) {
        window.showToast("Tu teléfono de contacto es obligatorio para invitados.", "error");
        return;
      }
    }

    setLoading(true);
    try {
      let compressedBlob = null;
      if (imageFile) {
        setCompressing(true);
        compressedBlob = await compressImage(imageFile);
        setCompressing(false);
      }

      const firstPhoneContact = isPrivate ? 'Privado' : (formContacts.find(c => c.tipo === 'whatsapp' || c.tipo === 'call')?.valor || '');
      const firstInstagram = isPrivate ? '' : (formContacts.find(c => c.tipo === 'instagram')?.valor || '');
      const firstFacebook = isPrivate ? '' : (formContacts.find(c => c.tipo === 'facebook')?.valor || '');
      const channels = isPrivate ? [] : formContacts;

      // Construct formatted description string
      const fullDescription = `Apellido: ${formData.apellido.trim()}
Cédula: ${formData.cedula.trim() || 'No especificada'}
Género: ${formData.genero}
Edad Aproximada: ${formData.edad_aproximada ? formData.edad_aproximada + ' años' : 'No especificada'}
Último lugar visto: ${formData.ultimo_lugar_visto.trim() || 'No especificado'}
Detalles: ${formData.descripcion_adicional.trim() || 'Sin detalles adicionales.'}`;

      const redes = {
        instagram: firstInstagram,
        facebook: firstFacebook,
        apellido: formData.apellido.trim(),
        cedula: formData.cedula.trim(),
        edad_aproximada: formData.edad_aproximada,
        genero: formData.genero,
        ultimo_lugar_visto: formData.ultimo_lugar_visto.trim(),
        descripcion_adicional: formData.descripcion_adicional.trim(),
        preferir_avisos_privados: isPrivate
      };

      const nombreCompleto = `${formData.nombre.trim()} ${formData.apellido.trim()}`.trim();

      const parsedAge = parseInt(formData.edad_aproximada, 10);
      const isMinor = !isNaN(parsedAge) && parsedAge < 18;

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

        if (isMinor) {
          const { error } = await supabase.from('desaparecidos_infancia').insert({
            creador_id: user?.id || null,
            user_id: user?.id || null,
            nombre_menor: nombreCompleto,
            edad: String(formData.edad_aproximada),
            senas_particulares: fullDescription,
            estado_reencuentro: 'busqueda',
            nombre_adulto: user ? user.nombre : nombreAutor.trim(),
            documento_adulto: formData.cedula.trim() || 'No provisto',
            fotos: imageUrls
          });

          if (error) throw error;
          alert('Reporte de menor registrado de forma segura en Protección de Menores.');
        } else {
          const { error } = await supabase.from('desaparecidos').insert({
            nombre_y_edad: nombreCompleto + (formData.edad_aproximada ? ` (${formData.edad_aproximada} años)` : ''),
            descripcion: fullDescription,
            ultima_ubicacion: formData.ultimo_lugar_visto.trim() || 'No especificada',
            contacto: firstPhoneContact,
            redes_sociales: redes,
            estado: formData.estado,
            canales_contacto: channels,
            fotos: imageUrls,
            user_id: user?.id || null,
            creador_id: user?.id || null,
            nombre_contacto: user ? user.nombre : nombreAutor.trim(),
            contacto_whatsapp: user ? user.contacto : telefonoAutor.trim()
          });

          if (error) throw error;
          alert('Reporte publicado exitosamente.');
        }
      } else {
        await dbLocal.personasDrafts.add({
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          edad_aproximada: formData.edad_aproximada,
          descripcion: fullDescription,
          ultima_ubicacion: formData.ultimo_lugar_visto.trim() || 'No especificada',
          contacto: firstPhoneContact,
          redes_sociales: redes,
          estado: formData.estado,
          canales_contacto: channels,
          fotoBlob: compressedBlob,
          user_id: user?.id || null,
          creador_id: user?.id || null,
          nombre_contacto: user ? user.nombre : nombreAutor.trim(),
          contacto_whatsapp: user ? user.contacto : telefonoAutor.trim(),
          isMinor: isMinor,
          created_at: new Date().toISOString()
        });
        alert('Sin conexión. Se guardó localmente y se sincronizará automáticamente al reconectar.');
      }

      setShowAddForm(false);
      setFormData({
        nombre: '', apellido: '', cedula: '', edad_aproximada: '',
        genero: 'Masculino', ultimo_lugar_visto: '', descripcion_adicional: '',
        estado: 'buscan_a', preferencia_contacto: 'telefono'
      });
      setFormContacts([{ tipo: 'whatsapp', valor: user?.contacto || '' }]);
      setImageFile(null);
      setFotoPreview(null);
      fetchPeople();
      fetchDrafts();
    } catch (err) {
      console.error(err);
      alert('Error al publicar el reporte.');
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
      nombre_y_edad: d.nombre + " " + d.apellido + (d.edad_aproximada ? ` (${d.edad_aproximada} años)` : '')
    })),
    ...people
  ];

  const isRecent = (createdAtStr) => {
    if (!createdAtStr) return false;
    const date = new Date(createdAtStr);
    const now = new Date();
    return (now - date) < 24 * 60 * 60 * 1000;
  };

  const recentPeople = combinedPeople.filter(p => {
    if (p.isDraft) return true;
    return isRecent(p.created_at);
  }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  const filtered = combinedPeople.filter(p => {
    const q = search.toLowerCase();
    const matchBasic = !search || 
                       p.nombre_y_edad?.toLowerCase().includes(q) ||
                       p.descripcion?.toLowerCase().includes(q) ||
                       p.ultima_ubicacion?.toLowerCase().includes(q);

    let matchAdvanced = true;
    if (advSearchOpen) {
      if (advNombre) {
        const namePart = p.nombre_y_edad?.split(' ')[0] || '';
        if (!namePart.toLowerCase().includes(advNombre.toLowerCase())) matchAdvanced = false;
      }
      if (advApellido) {
        const descMatch = p.descripcion?.toLowerCase().includes(`apellido: ${advApellido.toLowerCase()}`) || 
                          p.redes_sociales?.apellido?.toLowerCase().includes(advApellido.toLowerCase());
        if (!descMatch) matchAdvanced = false;
      }
      if (advCedula) {
        const descMatch = p.descripcion?.toLowerCase().includes(`cédula: ${advCedula.toLowerCase()}`) || 
                          p.redes_sociales?.cedula?.toLowerCase().includes(advCedula.toLowerCase());
        if (!descMatch) matchAdvanced = false;
      }
      if (advTelefono) {
        const telMatch = (p.contacto && p.contacto.includes(advTelefono)) || 
                         (p.canales_contacto && Array.isArray(p.canales_contacto) && p.canales_contacto.some(c => c.valor && c.valor.includes(advTelefono)));
        if (!telMatch) matchAdvanced = false;
      }
    }
    
    const pEstado = getPersonEstado(p);
    const totalMatch = matchBasic && matchAdvanced;

    if (filterStatus === 'all') return totalMatch;
    return totalMatch && pEstado === filterStatus;
  });

  const shuffledPeople = [...filtered].sort((a, b) => {
    const hashA = (a.id + randomSeed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hashB = (b.id + randomSeed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hashA % 100) - (hashB % 100);
  });

  const filterOptions = [
    { id: 'all', label: 'Todos' },
    { id: 'buscan_a', label: 'Buscan a' },
    { id: 'localizado', label: 'Localizados' },
    { id: 'peligro', label: 'Peligro' },
    { id: 'emergencia', label: 'Emergencia' }
  ];



  // Submit "Tengo Información"
  const handleSendInfo = async (e) => {
    e.preventDefault();
    if (!infoFormData.detalles.trim()) {
      alert('Por favor ingresa los detalles de lo que viste.');
      return;
    }
    if (!user) {
      alert('Debes iniciar sesión para enviar información.');
      return;
    }

    setSendingInfo(true);
    try {
      let fotoBase64 = null;
      if (infoFormData.fotoFile) {
        const compressed = await compressImage(infoFormData.fotoFile);
        fotoBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(compressed);
        });
      }

      const creatorId = selected.creador_id || selected.user_id;

      const { error } = await supabase.from('mensajes_informacion').insert({
        persona_id: selected.id,
        enviado_por: user.id,
        recibido_por: creatorId,
        detalles: infoFormData.detalles.trim(),
        foto: fotoBase64,
        ubicacion_texto: infoFormData.ubicacion_texto.trim() || null
      });

      if (error) throw error;
      alert('Mensaje enviado al creador del reporte de forma privada.');
      setShowInfoForm(false);
      setInfoFormData({ detalles: '', fotoFile: null, fotoPreview: null, ubicacion_texto: '' });
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Ocurrió un error al enviar el mensaje.');
    } finally {
      setSendingInfo(false);
    }
  };

  const handleInfoFotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setInfoFormData(prev => ({ ...prev, fotoFile: file }));
    const reader = new FileReader();
    reader.onloadend = () => setInfoFormData(prev => ({ ...prev, fotoPreview: reader.result }));
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ paddingBottom: '4rem', animation: 'sos-fade-in 0.3s ease' }}>
      
      {/* Cabecera Táctica */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: '900', margin: 0, color: '#fff' }}>
          Búsqueda de Personas
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
          Localización y reporte de ciudadanos en situaciones de emergencia.
        </p>
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
          <span>Modo sin conexión activo. Buscando en caché local del móvil.</span>
        </div>
      )}

      {/* Panel Principal de 2 Acciones */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1.25rem', 
        backgroundColor: 'var(--bg-surface)', 
        border: '1px solid var(--border)', 
        borderRadius: '1.5rem', 
        padding: '1.5rem',
        boxShadow: 'var(--shadow-lg)',
        marginBottom: '2rem'
      }}>
        
        {/* Acción 1: Buscador Global Táctico */}
        <form onSubmit={(e) => {
          e.preventDefault();
          setSearch(searchQuery);
          setHasSearched(true);
        }} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff' }}>
            🔍 Buscador Global
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="search-bar" style={{ flex: 1, backgroundColor: 'var(--bg-surface-soft)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={18} style={{ color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Buscar por Nombre, Cédula o Teléfono..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem' }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.5rem', borderRadius: '1rem', fontWeight: '800' }}
            >
              Buscar
            </button>
          </div>
        </form>

        <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '0.25rem 0' }} />

        {/* Acción 2: Reportar Persona */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff' }}>
            📢 ¿No lo encuentras?
          </label>
          <button 
            type="button"
            className="btn" 
            style={{ 
              width: '100%',
              padding: '1.1rem', 
              borderRadius: '1.25rem', 
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1.5px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontWeight: '900',
              fontSize: '1rem',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.08)'
            }} 
            onClick={() => {
              if (!user) {
                if (onRequireLogin) onRequireLogin();
                return;
              }
              setShowAddForm(true);
            }}
          >
            <Plus size={20} strokeWidth={2.5} /> Reportar Persona No Localizada
          </button>
        </div>
      </div>

      {/* Resultados de la búsqueda */}
      {hasSearched && (
        <div style={{ animation: 'sos-fade-in 0.25s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', margin: 0 }}>
              Resultados de Búsqueda
            </h3>
            
            {/* Vista control tab */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--bg-surface)', padding: '3px', borderRadius: '8px', border: '1.5px solid var(--border)' }}>
              <button 
                type="button"
                onClick={() => setViewMode('list')}
                style={{
                  display: 'flex', padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  backgroundColor: viewMode === 'list' ? 'var(--bg-surface-soft)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '0.75rem', fontWeight: '700', alignItems: 'center', gap: '0.25rem'
                }}
              >
                <List size={14} /> Lista
              </button>
              <button 
                type="button"
                onClick={() => setViewMode('gallery')}
                style={{
                  display: 'flex', padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  backgroundColor: viewMode === 'gallery' ? 'var(--bg-surface-soft)' : 'transparent',
                  color: viewMode === 'gallery' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '0.75rem', fontWeight: '700', alignItems: 'center', gap: '0.25rem'
                }}
              >
                <Grid size={14} /> Galería
              </button>
            </div>
          </div>

          {/* Filtros rápidos por estado */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.8rem', scrollbarWidth: 'none', marginBottom: '1rem' }} className="hide-scrollbar">
            {filterOptions.map(opt => {
              const isActive = filterStatus === opt.id;
              const styles = getStatusStyles(opt.id);
              return (
                <button 
                  key={opt.id}
                  onClick={() => setFilterStatus(opt.id)}
                  style={{
                    padding: '0.45rem 0.9rem',
                    borderRadius: '2rem',
                    fontSize: '0.8rem',
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
      )}

      {/* Grid or List content */}
      {hasSearched && (
        loading && people.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Cargando...</div>
        ) : shuffledPeople.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>No se encontraron personas con esos criterios.</div>
        ) : viewMode === 'list' ? (
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {shuffledPeople.map(p => {
              const estado = getPersonEstado(p);
              const styles = getStatusStyles(estado);
              const isRegisteredUser = !!p.creador_id || !!p.user_id;
              return (
                <div 
                  key={p.isDraft ? `draft-card-${p.id}` : p.id} 
                  className="card" 
                  onClick={() => setSelected(p)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', cursor: 'pointer',
                    border: isRegisteredUser ? '2.5px solid var(--primary)' : '1px solid var(--border)',
                    borderLeft: `5px solid ${styles.color}`,
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: '12px',
                    boxShadow: isRegisteredUser ? '0 8px 24px rgba(13,148,136,0.15)' : '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'transform 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.4rem', position: 'absolute', top: '0.25rem', right: '0.5rem' }}>
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
                        {estado === 'buscan_a' ? 'Buscan a' : estado}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} /> {p.ultima_ubicacion || 'No especificada'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Gallery View - Premium Vertical Poster Card Grid */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '1rem',
            marginTop: '0.5rem'
          }}>
            {shuffledPeople.map(p => {
              const estado = getPersonEstado(p);
              const styles = getStatusStyles(estado);
              const isRegisteredUser = !!p.creador_id || !!p.user_id;
              return (
                <div 
                  key={p.isDraft ? `draft-gallery-${p.id}` : p.id} 
                  className="card"
                  onClick={() => setSelected(p)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: isRegisteredUser ? '2.5px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: 'var(--bg-surface)',
                    boxShadow: isRegisteredUser ? '0 8px 24px rgba(13,148,136,0.15)' : 'var(--shadow-sm)',
                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                    padding: 0
                  }}
                >
                  {/* Photo container */}
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '1.05', overflow: 'hidden' }}>
                    <img 
                      src={getImageUrl(p) || AVATAR_PERSON} 
                      alt={p.nombre_y_edad} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    {p.isDraft && (
                      <div style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        backgroundColor: '#eab308',
                        color: '#854d0e',
                        fontSize: '0.55rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                      }}>
                        ⏳ OFFLINE
                      </div>
                    )}
                    {isRegisteredUser && (
                      <div style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        backgroundColor: 'rgba(13,148,136,0.9)',
                        color: '#fff',
                        fontSize: '0.55rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        backdropFilter: 'blur(4px)'
                      }}>
                        👤 REGISTRADO
                      </div>
                    )}
                  </div>
                  
                  {/* Body Details */}
                  <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                    {/* Status badge */}
                    <div>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        color: styles.color,
                        backgroundColor: styles.bg,
                        border: `1px solid ${styles.border}`,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        {estado === 'buscan_a' ? '🔍 Por localizar' : styles.label}
                      </span>
                    </div>
                    
                    {/* Name */}
                    <h3 className="font-display" style={{
                      fontSize: '0.95rem',
                      fontWeight: '800',
                      color: 'var(--text-primary)',
                      margin: 0,
                      lineHeight: '1.25',
                      wordBreak: 'break-word'
                    }}>
                      {p.nombre_y_edad}
                    </h3>
                    
                    {/* Age & Gender if available */}
                    {(p.edad_aproximada || p.genero) && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>👤 {p.edad_aproximada ? `${p.edad_aproximada} años` : ''} {p.genero ? `· ${p.genero}` : ''}</span>
                      </div>
                    )}
                    
                    {/* Location */}
                    <div style={{ 
                      fontSize: '0.7rem', 
                      color: 'var(--text-secondary)', 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '4px',
                      lineHeight: '1.3'
                    }}>
                      <MapPin size={10} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--primary)' }} />
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: '2',
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {p.ultima_ubicacion || 'No especificada'}
                      </span>
                    </div>
                    
                    {/* Date */}
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 'auto', paddingTop: '0.25rem', borderTop: '1px solid var(--border)' }}>
                      📅 {new Date(p.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label className="input-label">Nombre</label>
              <input className="input-field" placeholder="Ej. Carmen" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
              {formErrors.nombre && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{formErrors.nombre}</span>}
            </div>
            <div className="input-group">
              <label className="input-label">Apellido</label>
              <input className="input-field" placeholder="Ej. Guzmán" value={formData.apellido} onChange={e => setFormData({ ...formData, apellido: e.target.value })} />
              {formErrors.apellido && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{formErrors.apellido}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label className="input-label">Cédula (Opcional)</label>
              <input className="input-field" placeholder="Ej. V-12345678" value={formData.cedula} onChange={e => setFormData({ ...formData, cedula: e.target.value })} />
              {formErrors.cedula && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{formErrors.cedula}</span>}
            </div>
            <div className="input-group">
              <label className="input-label">Edad Aproximada</label>
              <input className="input-field" type="number" placeholder="Ej. 45" value={formData.edad_aproximada} onChange={e => setFormData({ ...formData, edad_aproximada: e.target.value })} />
              {formErrors.edad_aproximada && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{formErrors.edad_aproximada}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label className="input-label">Género</label>
              <select 
                className="input-field" 
                value={formData.genero} 
                onChange={e => setFormData({ ...formData, genero: e.target.value })}
                style={{ padding: '0.75rem', fontSize: '0.95rem' }}
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Estado de Emergencia</label>
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
            <label className="input-label">Último Lugar Visto</label>
            <input className="input-field" placeholder="Ej. Plaza Bolívar, Centro" value={formData.ultimo_lugar_visto} onChange={e => setFormData({ ...formData, ultimo_lugar_visto: e.target.value })} />
            {formErrors.ultimo_lugar_visto && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{formErrors.ultimo_lugar_visto}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">Descripción Adicional (Ropa, señas particulares)</label>
            <textarea className="input-field" style={{ height: '70px', resize: 'none' }} placeholder="Llevaba camisa azul..." value={formData.descripcion_adicional} onChange={e => setFormData({ ...formData, descripcion_adicional: e.target.value })} />
            {formErrors.descripcion_adicional && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{formErrors.descripcion_adicional}</span>}
          </div>

          {/* Privacy & Notification Toggle Option */}
          <div className="input-group" style={{ backgroundColor: 'var(--bg-surface-soft)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <label className="input-label" style={{ marginBottom: '6px', color: 'var(--text-primary)' }}>¿Cómo deseas recibir información sobre esta persona?</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input 
                  type="radio" 
                  name="preferencia_contacto" 
                  value="telefono" 
                  checked={formData.preferencia_contacto === 'telefono'} 
                  onChange={() => setFormData({ ...formData, preferencia_contacto: 'telefono' })}
                />
                <span>Mostrar mi número de teléfono / Redes sociales</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input 
                  type="radio" 
                  name="preferencia_contacto" 
                  value="privado" 
                  checked={formData.preferencia_contacto === 'privado'} 
                  onChange={() => setFormData({ ...formData, preferencia_contacto: 'privado' })}
                />
                <span>Recibir avisos privados en la aplicación (Ocultar teléfono)</span>
              </label>
            </div>
          </div>

          {/* Dynamic contact builder (only shown if not private) */}
          {formData.preferencia_contacto !== 'privado' && (
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
          )}

          {!user && (
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Datos del Reportante (Invitado)</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="input-group">
                  <label className="input-label">Tu Nombre Completo *</label>
                  <input className="input-field" placeholder="Ej. Juan Pérez" value={nombreAutor} onChange={e => setNombreAutor(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Tu Teléfono *</label>
                  <input className="input-field" type="tel" placeholder="Ej. 04121234567" value={telefonoAutor} onChange={e => setTelefonoAutor(e.target.value)} required />
                </div>
              </div>
            </div>
          )}

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

          const isPrivate = selected.contacto === 'Privado' || selected.redes_sociales?.preferir_avisos_privados;

          let contacts = [];
          if (!isPrivate) {
            contacts = [...(selected.canales_contacto || [])];
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
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ 
                position: 'relative', 
                width: '100%', 
                maxHeight: '400px', 
                borderRadius: '1rem', 
                overflow: 'hidden',
                backgroundColor: 'var(--bg-surface-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border)'
              }}>
                <img 
                  src={getImageUrl(selected) || AVATAR_PERSON} 
                  alt={selected.nombre_y_edad} 
                  style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} 
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
                <p style={{ margin: 0, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                  {selected.descripcion || 'Sin descripción adicional.'}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {isPrivate ? (
                  <div style={{ marginTop: '0.5rem' }}>
                    <button
                      onClick={() => {
                        setShowInfoForm(true);
                      }}
                      className="btn"
                      style={{
                        width: '100%',
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        padding: '0.875rem',
                        fontSize: '0.95rem',
                        fontWeight: '800',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                      }}
                    >
                      <MessageCircle size={20} />
                      Tengo Información
                    </button>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', marginTop: '6px', marginInline: 'auto', maxWidth: '90%' }}>
                      El creador ha elegido recibir reportes de forma privada y segura a través de la aplicación.
                    </p>
                  </div>
                ) : (
                  <>
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
                  </>
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

      {/* "Tengo Información" Form Modal */}
      <BottomModal isOpen={showInfoForm} onClose={() => setShowInfoForm(false)} title="Enviar Información Relevante">
        {selected && (
          <form onSubmit={handleSendInfo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ 
              backgroundColor: 'var(--bg-surface)', 
              padding: '0.75rem 1rem', 
              borderRadius: '8px', 
              border: '1px solid var(--border)',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)'
            }}>
              Estás reportando información sobre: <strong style={{ color: 'var(--text-primary)' }}>{selected.nombre_y_edad}</strong>
            </div>

            <div className="input-group">
              <label className="input-label">¿Qué viste? / Detalles de la información *</label>
              <textarea 
                className="input-field" 
                style={{ height: '100px', resize: 'none' }} 
                placeholder="Indica detalladamente la hora, ropa o estado de la persona..." 
                value={infoFormData.detalles} 
                onChange={e => setInfoFormData({ ...infoFormData, detalles: e.target.value })} 
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Ubicación o Lugar exacto (Opcional)</label>
              <input 
                className="input-field" 
                placeholder="Ej. Frente al supermercado, Av. Principal" 
                value={infoFormData.ubicacion_texto} 
                onChange={e => setInfoFormData({ ...infoFormData, ubicacion_texto: e.target.value })} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
              <div style={{ width: '100%', height: '120px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '2.5px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                {infoFormData.fotoPreview ? (
                  <img src={infoFormData.fotoPreview} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Preview" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <ImageIcon size={28} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Adjuntar Foto (Opcional)</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleInfoFotoSelect} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn" 
              style={{ 
                width: '100%', 
                padding: '0.875rem', 
                marginTop: '0.5rem', 
                backgroundColor: '#10b981', 
                color: '#ffffff',
                fontWeight: 'bold',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer'
              }} 
              disabled={sendingInfo}
            >
              {sendingInfo ? 'Enviando información...' : 'Enviar Información'}
            </button>
          </form>
        )}
      </BottomModal>

    </div>
  );
}
