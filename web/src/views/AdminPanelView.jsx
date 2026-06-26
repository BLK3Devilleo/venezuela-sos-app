import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Shield, Phone, Users, Trash2, UserCheck, AlertTriangle, MessageSquare, MapPin, Heart, Activity } from 'lucide-react';

export default function AdminPanelView({ user }) {
  const [loading, setLoading] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [groupedPhones, setGroupedPhones] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [activeTab, setActiveTab] = useState('phones'); // 'phones', 'users', 'moderation'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchGroupedPhones(),
        fetchUsers(),
        fetchRecentReports()
      ]);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('usuarios').select('*').order('created_at', { ascending: false });
    setUsersList(data || []);
  };

  const fetchGroupedPhones = async () => {
    // Obtener publicaciones de todas las tablas para agruparlas por teléfono
    const [desRes, masRes, recRes, serRes] = await Promise.all([
      supabase.from('desaparecidos').select('id, nombre_y_edad, contacto, created_at'),
      supabase.from('mascotas').select('id, especie_y_raza, contacto, estado, created_at'),
      supabase.from('recursos').select('id, nombre, contacto_whatsapp, created_at'),
      supabase.from('servicios').select('id, subtipo, contacto_whatsapp, created_at')
    ]);

    const allPosts = [];
    (desRes.data || []).forEach(d => allPosts.push({ ...d, type: 'Persona Desaparecida', title: d.nombre_y_edad, phone: d.contacto }));
    (masRes.data || []).forEach(m => allPosts.push({ ...m, type: 'Mascota', title: `${m.especie_y_raza} (${m.estado})`, phone: m.contacto }));
    (recRes.data || []).forEach(r => allPosts.push({ ...r, type: 'Recurso', title: r.nombre, phone: r.contacto_whatsapp }));
    (serRes.data || []).forEach(s => allPosts.push({ ...s, type: 'Servicio', title: s.subtipo, phone: s.contacto_whatsapp }));

    // Agrupar por teléfono
    const groups = {};
    allPosts.forEach(post => {
      if (!post.phone) return;
      const cleanPhone = post.phone.trim();
      if (!groups[cleanPhone]) {
        groups[cleanPhone] = [];
      }
      groups[cleanPhone].push(post);
    });

    // Convertir a array y ordenar por cantidad de publicaciones
    const sortedGroups = Object.keys(groups)
      .map(phone => ({
        phone,
        posts: groups[phone],
        count: groups[phone].length
      }))
      .sort((a, b) => b.count - a.count);

    setGroupedPhones(sortedGroups);
  };

  const fetchRecentReports = async () => {
    try {
      const [desRes, masRes, recRes, serRes, emeRes, mrkRes, hosRes] = await Promise.all([
        supabase.from('desaparecidos').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('mascotas').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('recursos').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('servicios').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('emergencias').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('marketplace').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('hospitalizados').select('*').order('created_at', { ascending: false }).limit(20)
      ]);

      const reports = [
        ...(desRes.data || []).map(d => ({ ...d, reportType: 'Persona', title: d.nombre_y_edad, contact: d.contacto, location: d.ultimo_lugar_visto || d.ultima_ubicacion || 'No especificada' })),
        ...(masRes.data || []).map(m => ({ ...m, reportType: 'Mascota', title: `${m.especie_y_raza} (${m.estado})`, contact: m.contacto, location: m.ultima_ubicacion || 'No especificada' })),
        ...(recRes.data || []).map(r => ({ ...r, reportType: 'Recurso', title: r.nombre, contact: r.contacto_whatsapp, location: r.direccion_texto || 'No especificada' })),
        ...(serRes.data || []).map(s => ({ ...s, reportType: 'Servicio', title: `${s.tipo} - ${s.subtipo}`, contact: s.contacto_whatsapp, location: s.zona || 'No especificada' })),
        ...(emeRes.data || []).map(e => ({ ...e, reportType: 'Emergencia', title: e.descripcion, contact: 'N/A', location: e.ubicacion_text || 'No especificada' })),
        ...(mrkRes.data || []).map(k => ({ ...k, reportType: 'Mercado', title: `${k.titulo} (${k.tipo})`, contact: k.contacto_whatsapp, location: k.ubicacion_text || 'No especificada' })),
        ...(hosRes.data || []).map(h => ({ ...h, reportType: 'Hospitalizado', title: h.nombre_completo, contact: h.contacto_reportante, location: h.hospital_clinica || 'No especificada' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setRecentReports(reports);
    } catch (err) {
      console.error('Error fetching recent reports:', err);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    if (!window.confirm(`¿Seguro que deseas cambiar el rol del usuario a ${newRole}?`)) return;
    try {
      const { error } = await supabase.from('usuarios').update({ rol: newRole }).eq('id', userId);
      if (error) throw error;
      alert('Rol actualizado con éxito.');
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Error al actualizar el rol.');
    }
  };

  const handleDeleteReport = async (reportId, reportType) => {
    if (!window.confirm(`¿Seguro que deseas eliminar este reporte de tipo ${reportType}?`)) return;
    try {
      let table = '';
      switch (reportType) {
        case 'Persona': table = 'desaparecidos'; break;
        case 'Mascota': table = 'mascotas'; break;
        case 'Recurso': table = 'recursos'; break;
        case 'Servicio': table = 'servicios'; break;
        case 'Emergencia': table = 'emergencias'; break;
        case 'Mercado': table = 'marketplace'; break;
        case 'Hospitalizado': table = 'hospitalizados'; break;
        default: return;
      }
      const { error } = await supabase.from(table).delete().eq('id', reportId);
      if (error) throw error;
      alert('Reporte eliminado.');
      fetchRecentReports();
      fetchGroupedPhones();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar.');
    }
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ 
          width: '42px', height: '42px', borderRadius: '12px', 
          backgroundColor: 'rgba(13,148,136,0.1)', color: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <Shield size={22} />
        </div>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.65rem', fontWeight: '800' }}>Panel de Control</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Administración, Roles y Monitoreo Interno</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('phones')}
          className={`filter-chip ${activeTab === 'phones' ? 'active' : ''}`}
          style={{ padding: '0.5rem 1rem' }}
        >
          <Phone size={15} style={{ marginRight: '0.3rem', display: 'inline' }} /> Agrupación de Teléfonos
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`filter-chip ${activeTab === 'users' ? 'active' : ''}`}
          style={{ padding: '0.5rem 1rem' }}
        >
          <Users size={15} style={{ marginRight: '0.3rem', display: 'inline' }} /> Roles de Usuarios
        </button>
        <button 
          onClick={() => setActiveTab('moderation')}
          className={`filter-chip ${activeTab === 'moderation' ? 'active' : ''}`}
          style={{ padding: '0.5rem 1rem' }}
        >
          <AlertTriangle size={15} style={{ marginRight: '0.3rem', display: 'inline' }} /> Moderación Rápida
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando datos del panel...</div>
      ) : (
        <>
          {/* TAB 1: Agrupación de Teléfonos */}
          {activeTab === 'phones' && (
            <div>
              <div style={{ backgroundColor: 'rgba(13,148,136,0.05)', border: '1px solid rgba(13,148,136,0.2)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  <strong>ℹ️ Monitoreo de Teléfonos:</strong> Las publicaciones están agrupadas por su número de contacto. Esto permite detectar números sospechosos que publican de forma masiva o fraudulenta.
                </p>
              </div>

              {groupedPhones.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No hay números registrados.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {groupedPhones.map(group => (
                    <div 
                      key={group.phone} 
                      style={{ 
                        backgroundColor: 'var(--bg-surface)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '1rem', 
                        padding: '1rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                          <Phone size={16} style={{ color: 'var(--primary)' }} />
                          <span>{group.phone}</span>
                        </div>
                        <span style={{ 
                          fontSize: '0.75rem', fontWeight: '800', 
                          backgroundColor: group.count > 2 ? 'rgba(239,68,68,0.12)' : 'var(--bg-surface-soft)', 
                          color: group.count > 2 ? '#ef4444' : 'var(--text-secondary)',
                          padding: '0.2rem 0.6rem', borderRadius: '1rem' 
                        }}>
                          {group.count} {group.count === 1 ? 'publicación' : 'publicaciones'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {group.posts.map((post, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>
                              <span style={{ fontWeight: '600', color: 'var(--primary)', marginRight: '0.5rem' }}>[{post.type}]</span>
                              {post.title}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Control de Roles */}
          {activeTab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {usersList.map(u => (
                <div 
                  key={u.id}
                  style={{ 
                    backgroundColor: 'var(--bg-surface)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '1rem', 
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>{u.nombre}</h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Contacto: {u.contacto || 'Sin teléfono'} | Rol: <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{u.rol.toUpperCase()}</span>
                    </p>
                  </div>

                  {user.id !== u.id && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select 
                        value={u.rol} 
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        style={{
                          padding: '0.4rem 0.6rem',
                          borderRadius: '0.5rem',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          fontSize: '0.8rem',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="afectado">Común (Afectado)</option>
                        <option value="voluntario">Voluntario</option>
                        <option value="staff">Staff (Moderador)</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Moderación Rápida */}
          {activeTab === 'moderation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentReports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No hay reportes recientes.</div>
              ) : (
                recentReports.map(r => (
                  <div 
                    key={r.id}
                    style={{ 
                      backgroundColor: 'var(--bg-surface)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '1rem', 
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem'
                    }}
                  >
                    <div>
                      <span style={{ 
                        fontSize: '0.7rem', fontWeight: '800', 
                        backgroundColor: 
                          r.reportType === 'Emergencia' || r.reportType === 'Persona' ? 'rgba(220,38,38,0.1)' :
                          r.reportType === 'Mascota' ? 'rgba(217,119,6,0.1)' :
                          r.reportType === 'Recurso' ? 'rgba(16,185,129,0.1)' :
                          r.reportType === 'Servicio' ? 'rgba(59,130,246,0.1)' :
                          r.reportType === 'Hospitalizado' ? 'rgba(59,130,246,0.15)' : 'rgba(168,85,247,0.1)', 
                        color: 
                          r.reportType === 'Emergencia' || r.reportType === 'Persona' ? '#dc2626' :
                          r.reportType === 'Mascota' ? '#d97706' :
                          r.reportType === 'Recurso' ? '#10b981' :
                          r.reportType === 'Servicio' ? '#3b82f6' :
                          r.reportType === 'Hospitalizado' ? '#2563eb' : '#a855f7',
                        padding: '0.2rem 0.5rem', borderRadius: '0.25rem',
                        marginRight: '0.5rem'
                      }}>
                        {r.reportType.toUpperCase()}
                      </span>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {r.title}
                      </strong>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Lugar: {r.location} | Contacto: {r.contact}
                      </p>
                    </div>

                    <button 
                      onClick={() => handleDeleteReport(r.id, r.reportType)}
                      style={{ 
                        background: 'none', border: 'none', color: '#ef4444', 
                        cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem',
                        backgroundColor: '#fef2f2'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
