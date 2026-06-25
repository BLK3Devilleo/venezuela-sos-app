import React from 'react';
import { ShoppingBag, Search, Plus } from 'lucide-react';

export default function MarketplaceView({ user }) {
  return (
    <div style={{ padding: '1rem', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1 className="font-display" style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <ShoppingBag className="text-primary" size={24} />
          Marketplace Solidario
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Intercambia, dona o solicita artículos de primera necesidad.
        </p>
      </div>

      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        background: 'var(--bg-surface)',
        borderRadius: '1rem',
        border: '1px solid var(--border)'
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'rgba(13,148,136,0.1)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
        }}>
          <ShoppingBag size={32} className="text-primary" />
        </div>
        <h3 className="font-display" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Próximamente</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Estamos construyendo este espacio para facilitar el trueque y comercio solidario.
        </p>
      </div>
    </div>
  );
}
