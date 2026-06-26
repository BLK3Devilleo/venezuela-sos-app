import React, { useState } from 'react';
import ServicesView from './ServicesView';
import ResourcesView from './ResourcesView';

export default function DirectoryView({ user, onViewProfile }) {
  const [activeTab, setActiveTab] = useState('services');

  return (
    <div className="fade-in" style={{ paddingBottom: '2rem', paddingTop: '1rem' }}>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: '800' }}>Directorio</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
          Encuentra ayuda, ofrece servicios y comparte recursos.
        </p>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '1.5rem', 
        backgroundColor: 'var(--bg-surface)', 
        padding: '0.35rem', 
        borderRadius: '1.25rem',
        border: '1px solid var(--border)'
      }}>
        <button 
          style={{ 
            flex: 1, 
            padding: '0.75rem', 
            borderRadius: '1rem', 
            border: 'none', 
            backgroundColor: activeTab === 'services' ? 'var(--primary)' : 'transparent', 
            color: activeTab === 'services' ? 'white' : 'var(--text-secondary)', 
            fontWeight: activeTab === 'services' ? '600' : '500', 
            transition: 'all 0.2s',
            fontSize: '0.95rem'
          }}
          onClick={() => setActiveTab('services')}
        >
          Servicios y Apoyo
        </button>
        <button 
          style={{ 
            flex: 1, 
            padding: '0.75rem', 
            borderRadius: '1rem', 
            border: 'none', 
            backgroundColor: activeTab === 'resources' ? 'var(--ve-blue)' : 'transparent', 
            color: activeTab === 'resources' ? 'white' : 'var(--text-secondary)', 
            fontWeight: activeTab === 'resources' ? '600' : '500', 
            transition: 'all 0.2s',
            fontSize: '0.95rem'
          }}
          onClick={() => setActiveTab('resources')}
        >
          Suministros y Refugios
        </button>
      </div>

      {activeTab === 'services' ? (
        <ServicesView user={user} onViewProfile={onViewProfile} isChild />
      ) : (
        <ResourcesView user={user} isChild />
      )}
    </div>
  );
}
