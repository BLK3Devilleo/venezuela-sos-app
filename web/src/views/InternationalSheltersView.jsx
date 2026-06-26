import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { ArrowLeft, Home, MapPin, Clock, User, Phone, Package, Heart, Calendar } from 'lucide-react';
import { z } from 'zod';

const formSchema = z.object({
  pais: z.string().min(2, 'País es requerido'),
  ciudad: z.string().min(2, 'Ciudad es requerida'),
  direccion: z.string().min(5, 'Dirección exacta requerida'),
  horarios: z.string().min(2, 'Horarios de atención requeridos'),
  responsable: z.string().min(2, 'Responsable requerido'),
  contacto: z.string().min(5, 'Contacto requerido'),
  entregas: z.string().min(2, 'Especifique qué están entregando'),
  necesidades: z.string().optional(),
  tiempo_estadia: z.string().min(2, 'Tiempo de estadía requerido')
});

export default function InternationalSheltersView({ user, onRequireLogin, onBack }) {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    pais: '', ciudad: '', direccion: '', horarios: '', responsable: user?.nombre || '',
    contacto: user?.contacto || '', entregas: '', necesidades: '', tiempo_estadia: 'Solo pasar el día'
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchShelters();
  }, []);

  const fetchShelters = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('puntos_acogida')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setShelters(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.responsable || !formData.contacto) {
      window.showToast('Debes indicar un responsable y contacto.', 'error');
      return;
    }

    setFormErrors({});
    const result = formSchema.safeParse(formData);
    
    if (!result.success) {
      const errors = {};
      result.error.issues.forEach(err => {
        errors[err.path[0]] = err.message;
      });
      setFormErrors(errors);
      window.showToast(`${result.error.issues[0].path[0].toUpperCase()}: ${result.error.issues[0].message}`, 'error');
      return;
    }

    try {
      const { error } = await supabase.from('puntos_acogida').insert({
        creador_id: user ? user.id : null,
        ...formData,
        ubicacion_lat: 10.4806, // Default Caracas/Latam center for MVP
        ubicacion_lng: -66.9036
      });

      if (error) throw error;
      
      window.showToast('Punto de acogida registrado exitosamente', 'success');
      setShowForm(false);
      setFormData({
        pais: '', ciudad: '', direccion: '', horarios: '', responsable: user?.nombre || '',
        contacto: user?.contacto || '', entregas: '', necesidades: '', tiempo_estadia: 'Solo pasar el día'
      });
      fetchShelters();
    } catch (err) {
      window.showToast('Error al registrar: ' + err.message, 'error');
    }
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '3rem', paddingTop: '0.5rem' }}>
      <button 
        onClick={onBack}
        style={{
          background: 'none', border: 'none', color: 'var(--primary)', 
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem',
          fontSize: '0.85rem', fontWeight: '700', marginBottom: '1.25rem', padding: 0
        }}
      >
        <ArrowLeft size={16} /> Volver al Inicio
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: '42px', height: '42px', borderRadius: '12px', 
            backgroundColor: 'rgba(13,148,136,0.1)', color: '#0d9488',
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <Home size={22} />
          </div>
          <div>
            <h1 className="font-display" style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0, color: '#fff' }}>Puntos de Acogida</h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Red Internacional de Refugios</span>
          </div>
        </div>
        {!showForm && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
            style={{ fontSize: '0.85rem', padding: '0.6rem 1rem' }}
          >
            Agregar Punto
          </button>
        )}
      </div>

      {showForm ? (
        <div className="card" style={{ animation: 'slideUp 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>Registrar Nuevo Punto</h3>
            <button 
              onClick={() => setShowForm(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="input-label">País</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} className="input-icon" />
                  <input type="text" className="input-field" placeholder="Ej. Colombia" value={formData.pais} onChange={e => setFormData({...formData, pais: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="input-label">Ciudad</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} className="input-icon" />
                  <input type="text" className="input-field" placeholder="Ej. Cúcuta" value={formData.ciudad} onChange={e => setFormData({...formData, ciudad: e.target.value})} />
                </div>
              </div>
            </div>

            <div>
              <label className="input-label">Dirección Exacta</label>
              <input type="text" className="input-field" style={{ paddingLeft: '1rem' }} placeholder="Calle, Avenida, Punto de referencia..." value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
            </div>

            <div>
              <label className="input-label">Horarios de Atención</label>
              <div style={{ position: 'relative' }}>
                <Clock size={16} className="input-icon" />
                <input type="text" className="input-field" placeholder="Ej. Lunes a Viernes 8am - 6pm" value={formData.horarios} onChange={e => setFormData({...formData, horarios: e.target.value})} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="input-label">Responsable o Entidad</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} className="input-icon" />
                  <input type="text" className="input-field" placeholder="Tu nombre u ONG" value={formData.responsable} onChange={e => setFormData({...formData, responsable: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="input-label">Contacto (Enlace o Telf)</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} className="input-icon" />
                  <input type="text" className="input-field" placeholder="+57 300..." value={formData.contacto} onChange={e => setFormData({...formData, contacto: e.target.value})} />
                </div>
              </div>
            </div>

            <div>
              <label className="input-label">¿Qué están entregando?</label>
              <div style={{ position: 'relative' }}>
                <Package size={16} className="input-icon" />
                <input type="text" className="input-field" placeholder="Comida, asesoría legal, abrigo..." value={formData.entregas} onChange={e => setFormData({...formData, entregas: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="input-label">¿Qué donaciones necesitan? (Opcional)</label>
              <div style={{ position: 'relative' }}>
                <Heart size={16} className="input-icon" />
                <input type="text" className="input-field" placeholder="Agua, medicinas, pañales..." value={formData.necesidades} onChange={e => setFormData({...formData, necesidades: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="input-label">Tiempo de Estadía Permitido</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} className="input-icon" />
                <select className="input-field" value={formData.tiempo_estadia} onChange={e => setFormData({...formData, tiempo_estadia: e.target.value})}>
                  <option value="Solo pasar el día">Solo pasar el día (Sin pernocta)</option>
                  <option value="Alojamiento temporal (1-3 noches)">Alojamiento temporal (1-3 noches)</option>
                  <option value="Alojamiento prolongado">Alojamiento prolongado</option>
                  <option value="Permanente / Indefinido">Permanente / Indefinido</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem', fontSize: '1rem' }}>
              Publicar Punto de Acogida
            </button>
          </form>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando red de acogida...</div>
          ) : shelters.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Aún no hay puntos de acogida internacionales registrados.
            </div>
          ) : (
            shelters.map(s => {
              const isRegisteredUser = !!s.creador_id;
              return (
              <div 
                key={s.id} 
                className="card" 
                style={{ 
                  display: 'flex', flexDirection: 'column', gap: '0.75rem',
                  border: isRegisteredUser ? '2.5px solid var(--primary)' : '1px solid var(--border)',
                  boxShadow: isRegisteredUser ? '0 8px 24px rgba(13,148,136,0.15)' : 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.25rem' }}>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '0.25rem',
                    textTransform: 'uppercase',
                    backgroundColor: isRegisteredUser ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.06)',
                    color: isRegisteredUser ? 'var(--primary)' : 'var(--text-secondary)',
                    border: isRegisteredUser ? '1px solid var(--primary)' : '1px solid var(--border)'
                  }}>
                    {isRegisteredUser ? '👤 Perfil Registrado' : '📢 Reporte Ciudadano'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', padding: '0.1rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                        {s.pais}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.ciudad}</span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>{s.direccion}</h3>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: '#fff', display: 'block', marginBottom: '2px' }}>Atención:</strong>
                    {s.horarios}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: '#fff', display: 'block', marginBottom: '2px' }}>Estadía:</strong>
                    {s.tiempo_estadia}
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '0.5rem', marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    <strong style={{ color: '#fff' }}>Se entrega:</strong> {s.entregas}
                  </div>
                  {s.necesidades && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <strong style={{ color: '#f87171' }}>Se necesita:</strong> {s.necesidades}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <User size={14} color="var(--text-muted)" />
                    <span style={{ color: 'var(--text-secondary)' }}>{s.responsable}</span>
                  </div>
                  {s.contacto && (
                    <a href={`tel:${s.contacto.replace(/[^0-9]/g, '')}`} className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={12} /> Contactar
                    </a>
                  )}
                </div>
              </div>
            );
          })
          )}
        </div>
      )}
    </div>
  );
}
