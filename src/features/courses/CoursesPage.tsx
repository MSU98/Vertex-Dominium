import React, { useState } from 'react';
import BrandPageShell from '../../components/ui/BrandPageShell';
import { useAuth } from '../../hooks/useAuth';

const CreateCoursePage = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    // Här lägger du din logik för att spara till databasen
    console.log("Sparar ny kurs:", { title, description });
    
    // Reset formulär efter skickat (valfritt)
    setTitle('');
    setDescription('');
    alert('Kursen har skapats!');
  };

  // Om användaren inte är admin kan vi visa ett meddelande eller redirecta
  if (!isAdmin) {
    return (
      <BrandPageShell title="ÅTKOMST NEKAD" subtitle="Du har inte behörighet att se denna sida.">
        <article className="brand-panel">
          <p>Endast administratörer kan skapa nya kurser.</p>
        </article>
      </BrandPageShell>
    );
  }

  return (
    <BrandPageShell 
      title="SKAPA KURS" 
      subtitle="Fyll i detaljerna nedan för att publicera ett nytt lärpaket."
      memberNav
    >
      <article className="brand-panel">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', letterSpacing: '1px', opacity: 0.7 }}>KURSTITEL</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.2)', 
                color: 'white', 
                padding: '12px',
                outline: 'none'
              }} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', letterSpacing: '1px', opacity: 0.7 }}>BESKRIVNING</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.2)', 
                color: 'white', 
                padding: '12px',
                minHeight: '150px',
                outline: 'none',
                resize: 'vertical'
              }} 
            />
          </div>

          <button 
            type="submit" 
            style={{ 
              background: 'white', 
              color: 'black', 
              border: 'none', 
              padding: '12px', 
              fontWeight: 'bold', 
              letterSpacing: '2px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            SPARA OCH PUBLICERA
          </button>
        </form>
      </article>
    </BrandPageShell>
  );
};

export default CreateCoursePage;