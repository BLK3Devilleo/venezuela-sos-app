import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  Building2, ShieldAlert, CheckCircle, AlertTriangle, ArrowLeft, Plus, 
  MapPin, Phone, Mail, FileText, Search, Star, Loader2, Sparkles 
} from 'lucide-react';

export default function StructuralDamageReportsView({ user, onRequireLogin, onBack }) {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'report' | 'inspector'
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos'); // 'todos' | 'pendiente' | 'seguro' | 'precaucion' | 'inseguro'
  
  // Form State
  const [formData, setFormData] = useState({
    nombre_edificio: '',
    direccion: '',
    ciudad: '',
    estado_region: '',
    pisos: '',
    descripcion_danos: '',
    correo_contacto: user?.email || '',
    telefono_contacto: '',
    lat: '',
    lng: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Inspector Modal State
  const [selectedReport, setSelectedReport] = useState(null);
  const [evaluation, setEvaluation] = useState({
    clasificacion_riesgo: 'seguro',
    comentarios_tecnicos: ''
  });
  const [submittingEval, setSubmittingEval] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('danos_estructurales')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
      alert('No se pudieron cargar los reportes de daños estructurales.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    if (!formData.nombre_edificio || !formData.direccion || !formData.ciudad || !formData.correo_contacto) {
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }

    setUploading(true);
    let imageUrls = [];

    try {
      if (selectedFile) {
        const fileName = `danos-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
        const uploadRes = await fetch(`https://venezuelasos-media-api.filocentraldemando.workers.dev/upload?file=${fileName}`, {
          method: 'POST',
          headers: { 'Content-Type': selectedFile.type || 'image/jpeg' },
          body: selectedFile
        });

        if (uploadRes.ok) {
          const resData = await uploadRes.json();
          imageUrls.push(resData.url);
        } else {
          throw new Error('Error al subir la imagen.');
        }
      }

      const { error } = await supabase.from('danos_estructurales').insert({
        creador_id: user?.id || null,
        nombre_edificio: formData.nombre_edificio.trim(),
        direccion: formData.direccion.trim(),
        ciudad: formData.ciudad.trim(),
        estado_region: formData.estado_region.trim(),
        pisos: formData.pisos ? parseInt(formData.pisos) : null,
        descripcion_danos: formData.descripcion_danos.trim(),
        fotos: imageUrls,
        correo_contacto: formData.correo_contacto.trim(),
        telefono_contacto: formData.telefono_contacto.trim(),
        ubicacion_lat: formData.lat ? parseFloat(formData.lat) : 10.5000,
        ubicacion_lng: formData.lng ? parseFloat(formData.lng) : -66.9000
      });

      if (error) throw error;

      alert('Reporte de edificación enviado con éxito. Un ingeniero revisará los daños pronto.');
      setFormData({
        nombre_edificio: '',
        direccion: '',
        ciudad: '',
        estado_region: '',
        pisos: '',
        descripcion_danos: '',
        correo_contacto: user?.email || '',
        telefono_contacto: '',
        lat: '',
        lng: ''
      });
      setSelectedFile(null);
      setActiveTab('list');
      fetchReports();
    } catch (err) {
      console.error(err);
      alert('Error al crear el reporte de edificación.');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateEvaluation = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;

    setSubmittingEval(true);
    try {
      const { error } = await supabase
        .from('danos_estructurales')
        .update({
          clasificacion_riesgo: evaluation.clasificacion_riesgo,
          comentarios_tecnicos: evaluation.comentarios_tecnicos,
          inspector_id: user?.id || null,
          evaluado_at: new Date().toISOString()
        })
        .eq('id', selectedReport.id);

      if (error) throw error;

      alert('Evaluación técnica actualizada exitosamente.');
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      console.error(err);
      alert('Error al actualizar la evaluación estructural.');
    } finally {
      setSubmittingEval(false);
    }
  };

  // Filtered reports
  const filteredReports = reports.filter(r => {
    const matchesSearch = 
      r.nombre_edificio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ciudad.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.direccion.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'todos' || r.clasificacion_riesgo === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'seguro':
        return {
          label: '🟢 Inspeccionado: Seguro (ATC-20)',
          color: '#22c55e',
          bg: 'rgba(34, 197, 94, 0.1)',
          border: 'rgba(34, 197, 94, 0.3)'
        };
      case 'precaucion':
        return {
          label: '🟡 Precaución: Acceso Limitado',
          color: '#eab308',
          bg: 'rgba(234, 179, 8, 0.1)',
          border: 'rgba(234, 179, 8, 0.3)'
        };
      case 'inseguro':
        return {
          label: '🔴 Inseguro: Peligro de Colapso',
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.1)',
          border: 'rgba(239, 68, 68, 0.3)'
        };
      default:
        return {
          label: '⚪ Pendiente de Inspección',
          color: '#94a3b8',
          bg: 'rgba(148, 163, 184, 0.1)',
          border: 'rgba(148, 163, 184, 0.3)'
        };
    }
  };

  return (
    <div style={{ paddingBottom: '3.5rem', animation: 'sos-fade-in 0.3s ease' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            onClick={onBack}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fff', margin: 0 }}>
              🏢 Edificaciones Afectadas
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '2px 0 0 0' }}>
              Base de datos y evaluaciones estructurales post-sismo
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab(activeTab === 'report' ? 'list' : 'report')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: '2rem',
            fontWeight: '700',
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          {activeTab === 'report' ? <FileText size={14} /> : <Plus size={14} />}
          {activeTab === 'report' ? 'Ver Edificios' : 'Reportar Edificio'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '0.25rem',
        marginBottom: '1.25rem'
      }}>
        <button
          onClick={() => setActiveTab('list')}
          style={{
            flex: 1,
            padding: '0.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            backgroundColor: activeTab === 'list' ? 'var(--bg-surface-soft)' : 'transparent',
            color: activeTab === 'list' ? '#fff' : 'var(--text-secondary)',
            fontWeight: '700',
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          📊 Edificios Reportados
        </button>
        <button
          onClick={() => setActiveTab('report')}
          style={{
            flex: 1,
            padding: '0.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            backgroundColor: activeTab === 'report' ? 'var(--bg-surface-soft)' : 'transparent',
            color: activeTab === 'report' ? '#fff' : 'var(--text-secondary)',
            fontWeight: '700',
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          📝 Reportar Daño
        </button>
      </div>

      {activeTab === 'list' && (
        <>
          {/* Filters & Search */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative' }}>
              <Search 
                size={16} 
                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
              />
              <input
                type="text"
                className="input-field"
                placeholder="Buscar por edificio, ciudad o calle..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'pendiente', label: '⚪ Pendientes' },
                { id: 'seguro', label: '🟢 Seguros' },
                { id: 'precaucion', label: '🟡 Precaución' },
                { id: 'inseguro', label: '🔴 Inseguros' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFilterStatus(opt.id)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '2rem',
                    border: '1px solid',
                    borderColor: filterStatus === opt.id ? 'var(--primary)' : 'var(--border)',
                    background: filterStatus === opt.id ? 'var(--primary-glow)' : 'var(--bg-surface)',
                    color: filterStatus === opt.id ? 'var(--primary)' : 'var(--text-secondary)',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* List display */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '0.5rem' }}>
              <Loader2 className="animate-spin" size={24} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cargando reportes de edificios...</span>
            </div>
          ) : filteredReports.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1.5rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px dashed var(--border)',
              borderRadius: '1rem',
              color: 'var(--text-muted)',
              fontSize: '0.85rem'
            }}>
              🏢 No se encontraron edificaciones registradas.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredReports.map(r => {
                const badge = getStatusBadge(r.clasificacion_riesgo);
                return (
                  <div
                    key={r.id}
                    onClick={() => {
                      setSelectedReport(r);
                      setEvaluation({
                        clasificacion_riesgo: r.clasificacion_riesgo || 'seguro',
                        comentarios_tecnicos: r.comentarios_tecnicos || ''
                      });
                    }}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '1rem',
                      padding: '1rem',
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                  >
                    <div style={{
                      backgroundColor: badge.bg,
                      border: `1px solid ${badge.border}`,
                      borderRadius: '0.75rem',
                      padding: '0.6rem',
                      color: badge.color,
                      display: 'flex'
                    }}>
                      <Building2 size={24} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#fff' }}>
                          {r.nombre_edificio}
                        </h3>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: '800',
                          color: badge.color,
                          backgroundColor: badge.bg,
                          border: `1px solid ${badge.border}`,
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          {badge.label}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        <MapPin size={12} />
                        <span>{r.direccion}, {r.ciudad} ({r.estado_region})</span>
                      </div>

                      {r.descripcion_danos && (
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          {r.descripcion_danos.length > 90 ? `${r.descripcion_danos.substring(0, 90)}...` : r.descripcion_danos}
                        </p>
                      )}

                      {r.comentarios_tecnicos && (
                        <div style={{ 
                          marginTop: '0.6rem', 
                          padding: '0.5rem', 
                          backgroundColor: 'rgba(255,255,255,0.02)', 
                          borderLeft: `2.5px solid ${badge.color}`,
                          borderRadius: '4px',
                          fontSize: '0.725rem', 
                          color: 'var(--text-muted)' 
                        }}>
                          <strong>Dictamen del Inspector:</strong> {r.comentarios_tecnicos}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'report' && (
        <form onSubmit={handleCreateReport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="input-group">
            <label className="input-label">Nombre del Edificio o Residencia *</label>
            <input
              type="text"
              className="input-field"
              placeholder="Ej. Residencia La Cordillera / Torre Altamira"
              value={formData.nombre_edificio}
              onChange={e => setFormData({ ...formData, nombre_edificio: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label className="input-label">Ciudad *</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ej. Caracas / La Guaira"
                value={formData.ciudad}
                onChange={e => setFormData({ ...formData, ciudad: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Estado / Región *</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ej. Miranda / Vargas"
                value={formData.estado_region}
                onChange={e => setFormData({ ...formData, estado_region: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label className="input-label">Dirección Exacta *</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ej. Calle B, entre Av. 3 y 4"
                value={formData.direccion}
                onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Número de Pisos</label>
              <input
                type="number"
                className="input-field"
                placeholder="Ej. 12"
                value={formData.pisos}
                onChange={e => setFormData({ ...formData, pisos: e.target.value })}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Descripción de Daños Estructurales Obvios</label>
            <textarea
              className="input-field"
              placeholder="Describa si hay grietas en columnas, inclinación de muros, vigas expuestas, etc."
              value={formData.descripcion_danos}
              onChange={e => setFormData({ ...formData, descripcion_danos: e.target.value })}
              style={{ height: '80px', resize: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label className="input-label">Correo de Contacto *</label>
              <input
                type="email"
                className="input-field"
                placeholder="tu@email.com"
                value={formData.correo_contacto}
                onChange={e => setFormData({ ...formData, correo_contacto: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Teléfono / WhatsApp</label>
              <input
                type="tel"
                className="input-field"
                placeholder="+584121234567"
                value={formData.telefono_contacto}
                onChange={e => setFormData({ ...formData, telefono_contacto: e.target.value })}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Foto de los Daños Estructurales</label>
            <input
              type="file"
              accept="image/*"
              className="input-field"
              onChange={handleFileChange}
              style={{ padding: '0.5rem' }}
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '0.5rem' }}
          >
            {uploading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <Loader2 className="animate-spin" size={16} /> Enviando reporte...
              </span>
            ) : 'Enviar Reporte para Evaluación'}
          </button>
        </form>
      )}

      {/* Detail / Evaluation sheet Modal */}
      {selectedReport && (
        <BottomModal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title={`Edificio: ${selectedReport.nombre_edificio}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {selectedReport.fotos && selectedReport.fotos.length > 0 && (
              <img
                src={selectedReport.fotos[0]}
                alt="Fotos del daño"
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  borderRadius: '1rem',
                  border: '1px solid var(--border)'
                }}
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                color: getStatusBadge(selectedReport.clasificacion_riesgo).color,
                backgroundColor: getStatusBadge(selectedReport.clasificacion_riesgo).bg,
                border: `1px solid ${getStatusBadge(selectedReport.clasificacion_riesgo).border}`,
                padding: '4px 10px',
                borderRadius: '4px'
              }}>
                {getStatusBadge(selectedReport.clasificacion_riesgo).label}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Reportado: {new Date(selectedReport.created_at).toLocaleDateString()}
              </span>
            </div>

            <div style={{ 
              backgroundColor: 'var(--bg-surface-soft)', 
              border: '1px solid var(--border)', 
              borderRadius: '0.75rem', 
              padding: '0.85rem',
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem'
            }}>
              <div><strong>📍 Ubicación:</strong> {selectedReport.direccion}, {selectedReport.ciudad} ({selectedReport.estado_region})</div>
              {selectedReport.pisos && <div><strong>🏢 Pisos:</strong> {selectedReport.pisos}</div>}
              <div><strong>📞 Contacto:</strong> {selectedReport.correo_contacto} {selectedReport.telefono_contacto && `| ${selectedReport.telefono_contacto}`}</div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', color: '#fff', fontSize: '0.85rem' }}>Descripción de daños reportados:</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {selectedReport.descripcion_danos || 'No se detallaron daños adicionales.'}
              </p>
            </div>

            {selectedReport.comentarios_tecnicos && (
              <div style={{
                border: '1.5px solid',
                borderColor: getStatusBadge(selectedReport.clasificacion_riesgo).border,
                borderRadius: '0.75rem',
                padding: '0.85rem',
                backgroundColor: 'rgba(255,255,255,0.01)'
              }}>
                <h4 style={{ margin: '0 0 0.25rem 0', color: getStatusBadge(selectedReport.clasificacion_riesgo).color, fontSize: '0.85rem', fontWeight: '800' }}>
                  📋 Diagnóstico Técnico de Inspector:
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {selectedReport.comentarios_tecnicos}
                </p>
                {selectedReport.evaluado_at && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
                    Evaluado el {new Date(selectedReport.evaluado_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}

            {/* Evaluation Form (Visible for Admin/Staff or generic professional toggling) */}
            {(user?.rol === 'admin' || user?.rol === 'staff') && (
              <form onSubmit={handleUpdateEvaluation} style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Sparkles size={16} /> Panel de Evaluación Técnica
                </h4>

                <div className="input-group">
                  <label className="input-label">Clasificación Estructural (ATC-20)</label>
                  <select
                    className="input-field select-field"
                    value={evaluation.clasificacion_riesgo}
                    onChange={e => setEvaluation({ ...evaluation, clasificacion_riesgo: e.target.value })}
                  >
                    <option value="seguro">🟢 Inspeccionado: Seguro (Habitable)</option>
                    <option value="precaucion">🟡 Precaución: Daño Limitado</option>
                    <option value="inseguro">🔴 Inseguro: Evacuación (Peligro de Colapso)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Comentarios Técnicos / Recomendaciones</label>
                  <textarea
                    className="input-field"
                    placeholder="Instrucciones de seguridad, apuntalamientos necesarios o nivel de daño..."
                    value={evaluation.comentarios_tecnicos}
                    onChange={e => setEvaluation({ ...evaluation, comentarios_tecnicos: e.target.value })}
                    style={{ height: '70px', resize: 'none' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingEval}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem' }}
                >
                  {submittingEval ? 'Actualizando Dictamen...' : 'Registrar Dictamen de Habitabilidad'}
                </button>
              </form>
            )}
          </div>
        </BottomModal>
      )}

    </div>
  );
}
