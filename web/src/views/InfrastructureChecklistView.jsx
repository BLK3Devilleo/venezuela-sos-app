import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function InfrastructureChecklistView({ onBack }) {
  // Initial state is false (unmarked). Remember:
  // User should mark ONLY if the problem does NOT exist (No hay inclinación, etc.)
  // If a checkbox is false (unmarked), it means the problem EXISTS (danger is present).
  const [checkedItems, setCheckedItems] = useState({
    ext_inclinacion: false,
    ext_grietas: false,
    ext_techo_hundido: false,
    ext_columnas_diagonal: false,
    ext_caida_cornisas: false,
    ext_piso_hundido: false,
    
    int_puertas_traban: false,
    int_grietas_diagonales: false,
    int_piso_separado: false,
    int_paredes_grietas: false,
    int_olor_gas: false,
    int_sonidos_crujidos: false,
    int_muebles_caidos: false,
    
    serv_fuga_agua: false,
    serv_olor_gas: false,
    serv_cables_caidos: false,
    serv_tablero_danos: false,
    
    ent_deslizamiento: false,
    ent_edificios_vecinos: false,
    ent_acceso_bloqueado: false
  });

  const sections = [
    {
      title: '1. EXTERIOR DE LA VIVIENDA',
      color: '#dc2626',
      items: [
        { id: 'ext_inclinacion', label: 'No hay inclinación visible en paredes, columnas o esquinas', risk: 'ALTO RIESGO' },
        { id: 'ext_grietas', label: 'No hay grietas grandes en paredes (más de 5 mm / grosor de un lápiz)', risk: 'ALTO RIESGO' },
        { id: 'ext_techo_hundido', label: 'El techo no muestra hundimientos, separaciones o deformaciones', risk: 'ALTO RIESGO' },
        { id: 'ext_columnas_diagonal', label: 'Las columnas o pilares no tienen grietas diagonales o en X', risk: 'ALTO RIESGO' },
        { id: 'ext_caida_cornisas', label: 'No hay partes del techo, cornisas o balcones a punto de caer', risk: 'ALTO RIESGO' },
        { id: 'ext_piso_hundido', label: 'El piso alrededor de la casa no se hundió ni inclinó', risk: 'PRECAUCIÓN' }
      ]
    },
    {
      title: '2. INTERIOR DE LA VIVIENDA',
      color: '#1d4ed8',
      items: [
        { id: 'int_puertas_traban', label: 'Las puertas y ventanas abren/cierran sin trabarse (indica deformación)', risk: 'ALTO RIESGO' },
        { id: 'int_grietas_diagonales', label: 'No hay grietas en diagonal en esquinas de ventanas o puertas', risk: 'ALTO RIESGO' },
        { id: 'int_piso_separado', label: 'El piso no está hundido, separado o levantado en ninguna zona', risk: 'ALTO RIESGO' },
        { id: 'int_paredes_grietas', label: 'Las paredes interiores no tienen grietas que las atraviesen de lado a lado', risk: 'ALTO RIESGO' },
        { id: 'int_olor_gas', label: 'No hay olor a gas ni cables eléctricos caídos o quemados', risk: 'ALTO RIESGO' },
        { id: 'int_sonidos_crujidos', label: 'No escuchas sonidos de crujidos o estruendos continuos en la estructura', risk: 'PRECAUCIÓN' },
        { id: 'int_muebles_caidos', label: 'Los muebles pesados no cayeron por inclinación del piso o paredes', risk: 'PRECAUCIÓN' }
      ]
    },
    {
      title: '3. SERVICIOS BÁSICOS',
      color: '#16a34a',
      items: [
        { id: 'serv_fuga_agua', label: 'No hay fuga visible de agua en paredes, techos o tuberías', risk: 'PRECAUCIÓN' },
        { id: 'serv_olor_gas', label: 'No detectas olor a gas en ninguna parte de la vivienda', risk: 'ALTO RIESGO' },
        { id: 'serv_cables_caidos', label: 'No hay cables eléctricos caídos dentro o fuera de la casa', risk: 'ALTO RIESGO' },
        { id: 'serv_tablero_danos', label: 'El tablero eléctrico principal no muestra daños, quemaduras o chispas', risk: 'ALTO RIESGO' }
      ]
    },
    {
      title: '4. ENTORNO INMEDIATO',
      color: '#ea580c',
      items: [
        { id: 'ent_deslizamiento', label: 'No hay riesgo de deslizamiento de tierra o talud cerca de tu casa', risk: 'ALTO RIESGO' },
        { id: 'ent_edificios_vecinos', label: 'No hay edificios o muros vecinos que puedan caer sobre tu vivienda', risk: 'ALTO RIESGO' },
        { id: 'ent_acceso_bloqueado', label: 'El acceso para salir de la casa está libre (puertas y pasillos sin obstrucción)', risk: 'ALTO RIESGO' }
      ]
    }
  ];

  const handleToggle = (id) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Evaluate structural status
  let hasHighRisk = false;
  let hasWarning = false;
  let allOk = true;

  sections.forEach(sec => {
    sec.items.forEach(item => {
      const isOk = checkedItems[item.id];
      if (!isOk) {
        allOk = false;
        if (item.risk === 'ALTO RIESGO') {
          hasHighRisk = true;
        } else if (item.risk === 'PRECAUCIÓN') {
          hasWarning = true;
        }
      }
    });
  });

  return (
    <div style={{ paddingBottom: '3.5rem', animation: 'sos-fade-in 0.3s ease' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
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
            Checklist de Seguridad Post-Sismo
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '2px 0 0 0' }}>
            Criterios FEMA / ATC-20 para evaluación de viviendas
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div style={{
        backgroundColor: '#eab30815',
        border: '1.5px solid #eab30830',
        color: '#fef08a',
        borderRadius: '1rem',
        padding: '1rem',
        fontSize: '0.825rem',
        lineHeight: '1.5',
        marginBottom: '1.5rem'
      }}>
        ⚠️ <strong>IMPORTANTE:</strong> Este checklist NO reemplaza el juicio de un ingeniero estructural. Te asiste únicamente en la identificación de puntos de peligro evidente. <strong>Ante cualquier duda o crujido extraño, evacúa de inmediato.</strong>
      </div>

      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '1rem',
        padding: '0.75rem 1rem',
        fontSize: '0.8rem',
        color: 'var(--text-secondary)',
        marginBottom: '1.5rem',
        lineHeight: '1.4'
      }}>
        📝 <strong>INSTRUCCIONES:</strong> Marca cada casilla <strong>solo si el problema NO existe</strong> en tu vivienda.
      </div>

      {/* Checklist Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
        {sections.map(sec => (
          <div 
            key={sec.title} 
            style={{ 
              border: '1.5px solid var(--border)', 
              borderRadius: '1.25rem', 
              overflow: 'hidden',
              backgroundColor: 'var(--bg-surface)'
            }}
          >
            <div style={{ 
              backgroundColor: sec.color, 
              color: '#fff', 
              padding: '0.75rem 1rem', 
              fontWeight: '900', 
              fontSize: '0.85rem',
              letterSpacing: '0.03em'
            }}>
              {sec.title}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {sec.items.map(item => {
                const isChecked = checkedItems[item.id];
                return (
                  <div 
                    key={item.id} 
                    onClick={() => handleToggle(item.id)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem', 
                      padding: '0.85rem 1rem', 
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      backgroundColor: isChecked ? 'rgba(255,255,255,0.01)' : 'transparent',
                      transition: 'background 0.2s'
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => {}} // Controlled by div onClick
                      style={{ 
                        width: '18px', 
                        height: '18px', 
                        accentColor: 'var(--primary)',
                        cursor: 'pointer' 
                      }} 
                    />
                    <span style={{ 
                      flex: 1, 
                      fontSize: '0.85rem', 
                      color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: isChecked ? '600' : 'normal'
                    }}>
                      {item.label}
                    </span>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      fontWeight: '800', 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      backgroundColor: item.risk === 'ALTO RIESGO' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 88, 12, 0.15)',
                      color: item.risk === 'ALTO RIESGO' ? '#f87171' : '#fb923c',
                      border: `1px solid ${item.risk === 'ALTO RIESGO' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(234, 88, 12, 0.3)'}`,
                      whiteSpace: 'nowrap'
                    }}>
                      {item.risk}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Safety Result Boxes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {allOk ? (
          /* ALL OK BOX */
          <div style={{
            border: '2px solid #22c55e',
            borderRadius: '1.25rem',
            padding: '1.25rem',
            backgroundColor: 'rgba(34, 197, 94, 0.08)',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
            animation: 'sos-fade-in 0.3s ease'
          }}>
            <CheckCircle2 size={32} style={{ color: '#22c55e', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ margin: '0 0 0.4rem 0', color: '#22c55e', fontWeight: '900', fontSize: '1.1rem' }}>
                ✓ PUEDES QUEDARTE (por ahora)
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#bbf7d0', lineHeight: '1.5' }}>
                Todas las casillas marcadas. No se identifican señales obvias de peligro estructural. Mantente alerta a réplicas y busca una inspección técnica formal a la brevedad.
              </p>
            </div>
          </div>
        ) : hasHighRisk ? (
          /* HIGH RISK EVACUATION BOX */
          <div style={{
            border: '2px solid #ef4444',
            borderRadius: '1.25rem',
            padding: '1.25rem',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
            animation: 'pulse 2s infinite alternate'
          }}>
            <ShieldAlert size={32} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ margin: '0 0 0.4rem 0', color: '#ef4444', fontWeight: '900', fontSize: '1.1rem' }}>
                ❌ EVACÚA INMEDIATAMENTE
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#fca5a5', lineHeight: '1.5' }}>
                Al menos un ítem de <strong>ALTO RIESGO</strong> no pudo ser verificado o presenta fallas críticas. Sal de la estructura inmediatamente y no regreses bajo ninguna circunstancia sin la autorización por escrito de un ingeniero certificado.
              </p>
            </div>
          </div>
        ) : (
          /* WARNING/PRECAUTION BOX */
          <div style={{
            border: '2px solid #ea580c',
            borderRadius: '1.25rem',
            padding: '1.25rem',
            backgroundColor: 'rgba(234, 88, 12, 0.08)',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
            animation: 'sos-fade-in 0.3s ease'
          }}>
            <AlertTriangle size={32} style={{ color: '#ea580c', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ margin: '0 0 0.4rem 0', color: '#ea580c', fontWeight: '900', fontSize: '1.1rem' }}>
                ⚠️ PRECAUCIÓN / RIESGO LIMITADO
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#fed7aa', lineHeight: '1.5' }}>
                Se detectaron anomalías o puntos de precaución (daños en tuberías, desniveles de piso exteriores). Aunque la vivienda no muestre peligro inminente de colapso, restringe el uso de zonas afectadas y solicita apoyo técnico.
              </p>
            </div>
          </div>
        )}
      </div>

      <div style={{ 
        textAlign: 'center', 
        fontSize: '0.75rem', 
        color: 'var(--text-muted)', 
        marginTop: '1.5rem',
        lineHeight: '1.4'
      }}>
        * Aunque pases el checklist, una estructura dañada puede colapsar en réplicas. Busca evaluación profesional lo antes posible.
      </div>
      
    </div>
  );
}
