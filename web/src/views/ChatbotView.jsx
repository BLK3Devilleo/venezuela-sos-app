import React, { useState } from 'react';
import { emergencyPhones, redCrossContacts, firstAidGuides } from '../data/emergencyData';
import { HelpCircle, Send, MessageSquare, Phone, BookOpen, AlertTriangle } from 'lucide-react';

export default function ChatbotView() {
  const [activeTab, setActiveTab] = useState('chatbot'); // chatbot / directory / redcross
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: '¡Hola! Soy tu asistente de emergencia VenezuelaSOS. Estoy disponible 100% sin conexión a internet.\n\n¿En qué te puedo ayudar hoy? Puedes tocar alguna de las preguntas rápidas a continuación o escribir tu consulta.'
    }
  ]);
  const [inputText, setInputText] = useState('');

  const quickQuestions = [
    { label: '¿Qué hacer durante un sismo?', keyword: 'sismo' },
    { label: '¿Cómo tratar hemorragias?', keyword: 'hemorragias' },
    { label: 'Pasos para hacer RCP', keyword: 'rcp' },
    { label: '¿Qué hacer si estoy atrapado?', keyword: 'atrapado' },
    { label: 'Buscar Cruz Roja internacional', keyword: 'cruz' },
    { label: 'Teléfonos de Bomberos', keyword: 'bomberos' }
  ];

  const handleSend = (text) => {
    if (!text.trim()) return;

    const userMsg = { sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Responder
    setTimeout(() => {
      const botResponse = getBotResponse(text);
      setMessages((prev) => [...prev, { sender: 'bot', text: botResponse }]);
    }, 500);
  };

  const getBotResponse = (query) => {
    const q = query.toLowerCase();

    // Match sismo
    if (q.includes('sismo') || q.includes('temblor') || q.includes('terremoto')) {
      const guide = firstAidGuides.find(g => g.title.includes('Sismo'));
      return `🧭 **CONSEJOS DURANTE EL SISMO:**\n\n${guide.content}`;
    }
    // Match hemorragias
    if (q.includes('hemorragia') || q.includes('sangre') || q.includes('herida') || q.includes('sangrando')) {
      const guide = firstAidGuides.find(g => g.title.includes('Hemorragias'));
      return `🩸 **CÓMO TRATAR HEMORRAGIAS:**\n\n${guide.content}`;
    }
    // Match rcp
    if (q.includes('rcp') || q.includes('reanimacion') || q.includes('pecho') || q.includes('respirar')) {
      const guide = firstAidGuides.find(g => g.title.includes('RCP'));
      return `❤️ **PASOS PARA RCP:**\n\n${guide.content}`;
    }
    // Match atrapado
    if (q.includes('atrapado') || q.includes('escombros') || q.includes('derrumba')) {
      const guide = firstAidGuides.find(g => g.title.includes('Atrapado'));
      return `🆘 **SI QUEDAS ATRAPADO EN ESCOMBROS:**\n\n${guide.content}`;
    }
    // Match cruz roja
    if (q.includes('cruz roja') || q.includes('cruz') || q.includes('extranjero') || q.includes('exterior')) {
      let response = `🌍 **CANALES DE LA CRUZ ROJA INTERNACIONAL:**\n\nSi estás fuera de Venezuela, puedes contactar a las oficinas de búsqueda de la Cruz Roja de tu país:\n\n`;
      redCrossContacts.forEach(c => {
        response += `* **${c.country}** (${c.agency}): Correo/Web: *${c.contact}* | Teléfono: *${c.phone}*\n`;
      });
      return response;
    }
    // Match bomberos / ambulancias
    if (q.includes('bomberos') || q.includes('ambulancia') || q.includes('telefono') || q.includes('numero') || q.includes('contacto')) {
      return `📞 **DIRECTORIO DE EMERGENCIA RÁPIDO:**\n\n* **CANTV fijo:** 171\n* **Movistar:** 911\n* **Digitel:** 112\n* **Movilnet:** *1\n\n*Nota: Para ver la lista completa con más de 15 estaciones de Bomberos específicas por sector, haz click en la pestaña **"Directorio"** arriba.*`;
    }

    return 'Lo siento, no he entendido tu consulta. Puedes escribir palabras clave como "sismo", "rcp", "hemorragia", "atrapado" o "cruz roja" para brindarte guías de primeros auxilios inmediatas.';
  };

  return (
    <div style={{ padding: '2rem 0' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="font-display" style={{ fontSize: '2.25rem' }}>Asistente de Emergencia y Directorio</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          Consulta guías de primeros auxilios en tiempo real u obtén teléfonos de rescate (funciona sin internet).
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
        <button
          className="btn"
          style={{
            backgroundColor: activeTab === 'chatbot' ? 'var(--primary)' : 'var(--bg-surface-soft)',
            borderColor: activeTab === 'chatbot' ? 'var(--primary)' : 'var(--border)'
          }}
          onClick={() => setActiveTab('chatbot')}
        >
          <MessageSquare size={16} />
          <span>Chatbot de Auxilio</span>
        </button>
        <button
          className="btn"
          style={{
            backgroundColor: activeTab === 'directory' ? 'var(--primary)' : 'var(--bg-surface-soft)',
            borderColor: activeTab === 'directory' ? 'var(--primary)' : 'var(--border)'
          }}
          onClick={() => setActiveTab('directory')}
        >
          <Phone size={16} />
          <span>Directorio de Emergencia</span>
        </button>
        <button
          className="btn"
          style={{
            backgroundColor: activeTab === 'redcross' ? 'var(--primary)' : 'var(--bg-surface-soft)',
            borderColor: activeTab === 'redcross' ? 'var(--primary)' : 'var(--border)'
          }}
          onClick={() => setActiveTab('redcross')}
        >
          <BookOpen size={16} />
          <span>Cruz Roja Internacional</span>
        </button>
      </div>

      {/* Chatbot Tab */}
      {activeTab === 'chatbot' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem' }}>
          {/* Chat Window */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '480px', padding: '1rem' }}>
            <div style={{ flex: '1', overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: m.sender === 'user' ? 'end' : 'start',
                    backgroundColor: m.sender === 'user' ? 'var(--primary)' : 'var(--bg-surface-soft)',
                    color: 'var(--text-primary)',
                    padding: '0.75rem 1rem',
                    borderRadius: m.sender === 'user' ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0',
                    maxWidth: '80%',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {m.text}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="input-field"
                style={{ flex: '1' }}
                placeholder="Escribe tu consulta (ej. hemorragia, sismo)..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
              />
              <button className="btn btn-primary" onClick={() => handleSend(inputText)}>
                <Send size={16} />
              </button>
            </div>
          </div>

          {/* Quick Questions Sidebar */}
          <div className="card" style={{ height: '480px', overflowY: 'auto' }}>
            <h3 className="font-display" style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 'bold' }}>
              Consultas Rápidas
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'start', fontSize: '0.75rem', padding: '0.5rem 0.75rem', textAlign: 'left' }}
                  onClick={() => handleSend(q.label)}
                >
                  <span>{q.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Directory Tab */}
      {activeTab === 'directory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {emergencyPhones.map((cat, idx) => (
            <div key={idx} className="card">
              <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--primary)' }}>
                {cat.category}
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem'
              }}>
                {cat.items.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    backgroundColor: 'var(--bg-surface-soft)',
                    border: '1px solid var(--border)'
                  }}>
                    <div>
                      <p style={{ fontWeight: '600', fontSize: '0.875rem' }}>{item.name}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{item.number}</p>
                    </div>
                    <a href={item.tel} className="btn btn-primary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                      Llamar
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Red Cross Tab */}
      {activeTab === 'redcross' && (
        <div className="card">
          <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            🌍 Red de Restablecimiento de Contacto Familiar (RCF)
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Si resides en el extranjero y has perdido contacto con tus familiares en Venezuela tras el terremoto, 
            comunícate con la Cruz Roja de tu país de residencia para iniciar la reunificación familiar formal.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem'
          }}>
            {redCrossContacts.map((c, idx) => (
              <div key={idx} style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                backgroundColor: 'var(--bg-surface-soft)',
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--ve-red)' }}>
                  {c.country}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {c.agency}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Contacto: <strong>{c.contact}</strong>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Teléfono: <strong>{c.phone}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
