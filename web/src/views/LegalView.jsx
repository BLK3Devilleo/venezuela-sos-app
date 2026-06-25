import React, { useState } from 'react';
import { ArrowLeft, Shield, FileText, AlertTriangle } from 'lucide-react';

export default function LegalView({ setView }) {
  const [activeTab, setActiveTab] = useState('aviso_legal');

  const tabs = [
    { id: 'aviso_legal', label: 'Aviso Legal', icon: AlertTriangle },
    { id: 'privacidad', label: 'Privacidad', icon: Shield },
    { id: 'cookies', label: 'Cookies', icon: FileText }
  ];

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setView('dashboard')}
          style={{ 
            background: 'var(--bg-surface-soft)', 
            border: '1px solid var(--border)', 
            borderRadius: '50%', 
            width: '40px', 
            height: '40px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer',
            color: 'var(--text-primary)'
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>Legal y Privacidad</h2>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '1.5rem', 
        overflowX: 'auto', 
        paddingBottom: '0.5rem',
        scrollbarWidth: 'none' 
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1rem',
                borderRadius: '2rem',
                border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                backgroundColor: isActive ? 'var(--primary-glow)' : 'var(--bg-surface-soft)',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? '700' : '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
        
        {activeTab === 'aviso_legal' && (
          <div style={{ lineHeight: '1.6', color: 'var(--text-primary)' }}>
            <h3 style={{ marginTop: 0, color: 'var(--primary)' }}>Aviso Legal</h3>
            
            <h4>1. Información General</h4>
            <p>En cumplimiento con los deberes de información generales propios de las plataformas y servicios digitales, se hace constar que el presente sitio web y la aplicación informática (en adelante, "Filo:SOS") son una iniciativa tecnológica desarrollada bajo la marca Filo Digital Solutions (en adelante, "Filo DS"), con el único propósito de servir como canal de resiliencia comunitaria y enlace de recursos humanitarios ante la situación de emergencia por sismos en el territorio de Venezuela.</p>
            
            <h4>2. Objeto y Alcance</h4>
            <p>Filo:SOS funciona de manera exclusiva como un directorio y mapa colaborativo abierto en tiempo real. Su fin fundamental es poner en contacto a ciudadanos, voluntarios, organizaciones no gubernamentales y agrupaciones civiles locales para coordinar la entrega de recursos, alimentos, material de rescate, medicinas y asistencia de emergencia de forma ágil y descentralizada.</p>

            <h4>3. Condiciones de Uso y Responsabilidad del Usuario</h4>
            <p>El acceso y uso de Filo:SOS confiere la condición de Usuario. Al utilizar las herramientas de geolocalización, reporte e interacción, el Usuario se compromete a:</p>
            <ul>
              <li style={{marginBottom: '0.5rem'}}>Proporcionar información fidedigna, veraz, actualizada y exacta respecto a las necesidades reportadas o recursos disponibles.</li>
              <li style={{marginBottom: '0.5rem'}}>No publicar información falsa, alarmista, duplicada o malintencionada que pueda desviar los esfuerzos de rescate y asistencia.</li>
              <li style={{marginBottom: '0.5rem'}}>Hacer un uso exclusivamente humanitario y solidario de la herramienta, quedando terminantemente prohibido cualquier fin comercial, lucrativo, político o de propaganda.</li>
            </ul>

            <h4>4. Exención de Responsabilidad Absoluta</h4>
            <p>Filo DS proporciona la infraestructura técnica de Filo:SOS "tal cual está" y según su disponibilidad técnica en zonas afectadas. Debido a la naturaleza del servicio y al contexto de crisis:</p>
            <ul>
              <li style={{marginBottom: '0.5rem'}}>Filo DS no realiza validaciones previas en el terreno sobre la identidad de los Usuarios ni sobre la veracidad o estado físico de los recursos ofrecidos (alimentos, medicinas o herramientas).</li>
              <li style={{marginBottom: '0.5rem'}}>Filo DS queda completamente exento de cualquier responsabilidad derivada de la pérdida de conectividad, mal funcionamiento del software, o inexactitud de los mapas cartográficos o datos de ubicación satelital aportados por terceros.</li>
            </ul>

            <hr style={{ margin: '2rem 0', borderColor: 'var(--border)' }} />

            <h3 style={{ color: 'var(--ve-red)' }}>Medidas de Precaución y Disclaimers</h3>
            
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--ve-red)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--ve-red)', marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} /> Disclaimer de Interacciones Físicas
              </h4>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>Dado que Filo:SOS actúa únicamente como un puente digital de enlace entre particulares y desconocidos, es fundamental que priorices tu integridad física al momento de realizar la entrega o recepción de recursos y suministros de emergencia. Se establecen las siguientes directrices de obligado cumplimiento:</p>
              <ul style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
                <li style={{marginBottom: '0.5rem'}}><strong>Lugares Públicos y Concurrentes:</strong> Todos los encuentros físicos orientados al traspaso de medicinas, ropa o alimentos deben acordarse y ejecutarse estrictamente en zonas públicas, concurridas, iluminadas o en las inmediaciones de puntos oficiales de control.</li>
                <li style={{marginBottom: '0.5rem'}}><strong>Prohibición de Domicilios Privados:</strong> Queda terminantemente desaconsejado y prohibido acudir en solitario a viviendas particulares de usuarios desconocidos.</li>
                <li style={{marginBottom: '0.5rem'}}><strong>Acompañamiento:</strong> No acudas nunca solo a un punto de encuentro acordado. Desplázate siempre en compañía.</li>
              </ul>
            </div>

            <div style={{ backgroundColor: 'var(--bg-surface-soft)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '0.5rem' }}>
              <h4 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={18} /> Aviso sobre Viviendas Privadas y Refugios
              </h4>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>En caso de que un reporte involucre el ofrecimiento voluntario de uso de instalaciones sanitarias o alojamiento provisional dentro de inmuebles de propiedad privada: <em>"Estás ingresando o interactuando con la propiedad de un posible desconocido. Toma extremas precauciones personales y evalúa el entorno antes de acceder. Los creadores y administradores de Filo:SOS no validamos la seguridad estructural de los inmuebles ni la idoneidad moral de sus ocupantes..."</em></p>
            </div>
          </div>
        )}

        {activeTab === 'cookies' && (
          <div style={{ lineHeight: '1.6', color: 'var(--text-primary)' }}>
            <h3 style={{ marginTop: 0, color: 'var(--primary)' }}>Política de Cookies</h3>
            
            <h4>1. Definición y Uso Técnico de las Tecnologías de Rastreo</h4>
            <p>Filo:SOS utiliza "cookies" y tecnologías de almacenamiento local equivalentes. Debido al contexto de infraestructura degradada y baja conectividad que impera en las regiones afectadas por los sismos, el almacenamiento local se utiliza de forma estratégica para disminuir el consumo de datos móviles, agilizar los tiempos de carga de los mapas y evitar la descarga repetitiva de datos estáticos en el dispositivo del usuario.</p>
            
            <h4>2. Tipología de Cookies Empleadas</h4>
            <ul>
              <li style={{marginBottom: '0.5rem'}}><strong>Cookies Estrictamente Necesarias (Técnicas):</strong> Requeridas para mantener la sesión del usuario, almacenar las coordenadas temporales de búsqueda y asegurar la transmisión del formulario de ayuda. No pueden ser desactivadas ya que la aplicación no funcionará sin ellas.</li>
              <li style={{marginBottom: '0.5rem'}}><strong>Cookies de Rendimiento y Optimización (Estadísticas):</strong> Almacenan de forma anónima métricas sobre fallos de carga o latencia de red, con el único fin de permitir al equipo de Filo DS optimizar el rendimiento del código fuente de la app bajo conexiones limitadas a internet. (Clarity y Analytics).</li>
            </ul>

            <h4>3. Mecanismo de Consentimiento y Configuración</h4>
            <p>Al acceder por primera vez a Filo:SOS, se desplegará de forma obligatoria un aviso o banner informativo. El usuario podrá de forma transparente aceptar la totalidad de las cookies, rechazar las de Optimización, o gestionar las preferencias del sistema. La desactivación de las cookies técnicas puede perjudicar drásticamente la capacidad de la aplicación para guardar reportes en el mapa.</p>
          </div>
        )}

        {activeTab === 'privacidad' && (
          <div style={{ lineHeight: '1.6', color: 'var(--text-primary)' }}>
            <h3 style={{ marginTop: 0, color: 'var(--primary)' }}>Política de Privacidad</h3>
            
            <h4>1. Responsable del Tratamiento de Datos</h4>
            <p>El responsable de la recogida y tratamiento de sus datos personales a través de la infraestructura digital es el equipo de desarrollo tecnológico de la iniciativa Filo DS.</p>
            
            <h4>2. Tipos de Datos Objeto de Tratamiento</h4>
            <ul>
              <li><strong>Datos de Identificación Básica:</strong> Nombre, alias o seudónimo del Usuario.</li>
              <li><strong>Datos de Contacto:</strong> Número de teléfono celular, credenciales de mensajería instantánea o correo electrónico.</li>
              <li><strong>Datos de Geolocalización:</strong> Ubicación exacta en coordenadas geográficas.</li>
              <li><strong>Datos Sensibles y de Vulnerabilidad:</strong> Información estrictamente necesaria sobre condiciones críticas reportadas por el propio usuario (discapacidad, requerimientos médicos, etc).</li>
            </ul>

            <h4>3. Finalidad del Tratamiento</h4>
            <p>Los datos suministrados serán tratados de manera única y exclusiva para la gestión, canalización y optimización de ayuda humanitaria post-terremoto en Venezuela, permitiendo el enlace directo entre personas que necesitan recursos y aquellas que desean aportarlos.</p>

            <h4>4. Base Legal y Legitimación</h4>
            <p>La legitimación para llevar a cabo el tratamiento de los datos es el consentimiento inequívoco y expreso que el Usuario otorga al completar y enviar de forma voluntaria cualquiera de los formularios digitales integrados en la aplicación.</p>

            <h4>5. Confidencialidad y Seguridad</h4>
            <p>Filo:SOS implementa medidas técnicas de seguridad informática orientadas a restringir el acceso a bases de datos únicamente a entidades aliadas autorizadas.</p>

            <h4>6. Destinatarios y Cesión de Datos</h4>
            <p>Los datos de contacto y localización se publicarán de forma abierta dentro del mapa interactivo de la app para permitir que la comunidad civil asista de manera inmediata. Fuera de esta finalidad, Filo DS no comercializará, transferirá ni cederá las bases de datos a terceras empresas o corporaciones.</p>

            <h4>7. Plazo de Conservación y Eliminación</h4>
            <p>Los datos serán conservados de forma activa exclusivamente durante el periodo que dure la presente contingencia humanitaria derivada de los movimientos sísmicos. Una vez estabilizada la crisis, todas las bases de datos serán eliminadas y destruidas de forma segura y permanente.</p>

            <h4>8. Derechos del Usuario (ARCO)</h4>
            <p>Cualquier Usuario puede ejercer en cualquier instante sus derechos de acceso, rectificación, supresión ("derecho al olvido") u oposición sobre sus datos publicados, enviando una comunicación interna o utilizando el botón automático de baja de reporte integrado en la misma aplicación.</p>
          </div>
        )}

      </div>
    </div>
  );
}
