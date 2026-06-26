import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { MessageSquare, ArrowLeft, Send, Hash, ShieldAlert, Heart, Truck, Users, Trash2 } from 'lucide-react';

const ROOMS = [
  { id: 'emergencias', name: 'Emergencias 171', icon: ShieldAlert, color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
  { id: 'medicamentos', name: 'Medicamentos', icon: Heart, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { id: 'rescates', name: 'Rescates y Apoyo', icon: Users, color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
  { id: 'donaciones', name: 'Donaciones y Ropa', icon: Truck, color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
  { id: 'general', name: 'Chat General', icon: Hash, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' }
];

const EMOJIS = ['😀', '😅', '😂', '😊', '👍', '😭', '🆘', '🙏', '❤️', '🏥', '🍲', '💧', '🔋', '🔌'];

const getHSLColor = (userId) => {
  if (!userId) return 'hsl(210, 30%, 25%)';
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 45%, 28%)`;
};

const renderMessageContent = (text) => {
  if (!text) return '';
  const parts = text.split(/(\s+)/);
  return parts.map((part, index) => {
    if (part.startsWith('@') && part.length > 1) {
      return (
        <span key={index} style={{ color: '#60a5fa', fontWeight: '800', backgroundColor: 'rgba(96,165,250,0.15)', padding: '1px 4px', borderRadius: '4px' }}>
          {part}
        </span>
      );
    }
    return part;
  });
};

export default function ChatRoomsView({ user, onViewProfile, onRequireLogin }) {
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!activeRoom) return;

    fetchMessages();

    const channel = supabase
      .channel(`room:${activeRoom.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `room_id=eq.${activeRoom.id}`
      }, (payload) => {
        fetchUserForNewMessage(payload.new);
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'chat_messages'
      }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRoom]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, sender:usuarios(*)')
        .eq('room_id', activeRoom.id)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      setMessages(data.reverse());
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserForNewMessage = async (newMsg) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', newMsg.user_id)
        .single();
      
      if (!error && data) {
        setMessages(prev => [...prev, { ...newMsg, sender: data }]);
      }
    } catch (err) {
      console.error('Error fetching user for message:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!user) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    if (!newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage(''); 

    try {
      const { error } = await supabase.from('chat_messages').insert({
        room_id: activeRoom.id,
        user_id: user.id,
        content: content
      });
      if (error) throw error;
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Error al enviar el mensaje');
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('¿Seguro que deseas borrar este mensaje?')) return;
    try {
      const { error } = await supabase.from('chat_messages').delete().eq('id', msgId);
      if (error) throw error;
    } catch (err) {
      console.error('Error deleting message:', err);
      alert('Error al borrar el mensaje');
    }
  };

  if (activeRoom) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderBottom: '1px solid var(--border)' }}>
          <button 
            onClick={() => setActiveRoom(null)}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={24} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: activeRoom.bg, color: activeRoom.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <activeRoom.icon size={20} />
            </div>
            <div>
              <h2 className="font-display" style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>{activeRoom.name}</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sala Pública</span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-primary)' }}>
          {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando mensajes...</div>}
          
          {messages.map((msg, index) => {
            const isMe = msg.user_id === user.id;
            const isFirstInGroup = index === 0 || messages[index - 1].user_id !== msg.user_id;
            
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                {!isMe && isFirstInGroup && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', marginLeft: '2.5rem', fontWeight: '600', cursor: 'pointer' }}
                       onClick={() => onViewProfile && onViewProfile(msg.sender?.id)}>
                    {msg.sender?.nombre || 'Usuario Anónimo'}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '85%', alignItems: 'flex-end', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                  {!isMe && isFirstInGroup ? (
                    <img 
                      src={msg.sender?.foto_perfil || '/avatar_person.png'} 
                      alt="Avatar" 
                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} 
                      onClick={() => onViewProfile && onViewProfile(msg.sender?.id)}
                    />
                  ) : !isMe ? (
                    <div style={{ width: '28px' }} />
                  ) : null}
                  
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: isMe ? '1.25rem 1.25rem 0.25rem 1.25rem' : '1.25rem 1.25rem 1.25rem 0.25rem',
                    backgroundColor: isMe ? 'var(--primary)' : getHSLColor(msg.user_id),
                    color: '#ffffff',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                    fontSize: '0.9375rem',
                    lineHeight: '1.4',
                    wordBreak: 'break-word'
                  }}>
                    {renderMessageContent(msg.content)}
                    <div style={{ fontSize: '0.65rem', textAlign: 'right', marginTop: '0.25rem', opacity: 0.8 }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {(isMe || user.rol === 'admin' || user.rol === 'staff') && (
                    <button 
                      onClick={() => handleDeleteMessage(msg.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        alignSelf: 'center',
                        opacity: 0.3,
                        transition: 'opacity 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                      onMouseOut={(e) => e.currentTarget.style.opacity = 0.3}
                    >
                      <Trash2 size={14} style={{ color: '#ef4444' }} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Emoji Selector Panel */}
        <div 
          className="hide-scrollbar"
          style={{ 
            display: 'flex', 
            gap: '0.45rem', 
            overflowX: 'auto', 
            padding: '0.45rem 1rem', 
            borderTop: '1px solid var(--border)', 
            backgroundColor: 'var(--bg-surface)' 
          }}
        >
          {EMOJIS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => setNewMessage(prev => prev + emoji)}
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '1.25rem', 
                padding: '0.15rem 0.35rem', 
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'transform 0.1s'
              }}
              onMouseDown={e => e.preventDefault()}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {emoji}
            </button>
          ))}
        </div>

         <form onSubmit={handleSendMessage} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={user ? "Escribe un mensaje..." : "Inicia sesión con Google para escribir..."}
            onClick={() => {
              if (!user) {
                if (onRequireLogin) onRequireLogin();
              }
            }}
            readOnly={!user}
            style={{
              flex: 1,
              padding: '0.875rem 1.25rem',
              borderRadius: '2rem',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.95rem'
            }}
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: newMessage.trim() ? 'var(--primary)' : 'var(--bg-surface-soft)',
              color: newMessage.trim() ? '#fff' : 'var(--text-muted)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: newMessage.trim() ? 'pointer' : 'default',
              transition: 'all 0.2s'
            }}
          >
            <Send size={20} style={{ marginLeft: '2px' }} />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem 0', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>Salas de Chat 📡</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Conéctate en tiempo real con otros ciudadanos. Respeta las normas y enfócate en ayudar.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {ROOMS.map(room => (
          <button
            key={room.id}
            onClick={() => setActiveRoom(room)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.25rem',
              borderRadius: '1.25rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
            }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: room.bg, color: room.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <room.icon size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{room.name}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Haz clic para unirte a la conversación</p>
            </div>
            <div style={{ color: 'var(--text-muted)' }}>
              <MessageSquare size={20} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
