import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { UserPlus, Users, Trash2, Loader2, FileText } from 'lucide-react';
import { motion } from 'motion/react';

type Professor = {
  id: string;
  name: string;
  description: string;
  created_at: string;
};

export default function ProfessorsView() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState('');
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchProfessors();
  }, []);

  const fetchProfessors = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from('professors')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching professors:', error);
      // Se la tabella non esiste, mostriamo un messaggio amichevole
      if (error.code === '42P01') {
        setMessage('La tabella "professors" non esiste ancora su Supabase. Creala usando l\'editor SQL.');
      }
    } else if (data) {
      setProfessors(data);
    }
    setFetching(false);
  };

  const handleAddProfessor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    setLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('professors')
      .insert([{ name: name.trim(), description: description.trim() }])
      .select();

    if (error) {
      console.error('Error adding professor:', error);
      setMessage(`Errore: ${error.message}`);
    } else {
      setMessage('Professore aggiunto con successo!');
      setName('');
      setDescription('');
      if (data) {
        setProfessors([data[0], ...professors]);
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('professors')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting professor:', error);
      setMessage(`Errore durante l'eliminazione: ${error.message}`);
    } else {
      setProfessors(professors.filter(p => p.id !== id));
      setMessage('Professore eliminato.');
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-text-primary">Gestione Professori</h1>
        <p className="text-text-secondary mt-2">Aggiungi e gestisci i profili dei tuoi professori.</p>
      </header>

      {message && (
        <div className="p-4 bg-brand-secondary text-brand-primary rounded-widget font-medium border border-border-subtle">
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Form Aggiunta */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-1 glass-panel p-6 rounded-widget shadow-elevation-card h-fit"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-brand-secondary text-brand-primary rounded-button">
              <UserPlus size={20} />
            </div>
            <h2 className="text-lg font-semibold">Nuovo Professore</h2>
          </div>

          <form onSubmit={handleAddProfessor} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Nome Professore</label>
              <input 
                required
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2 border border-border-subtle rounded-widget focus:ring-2 focus:ring-brand-secondary focus:border-brand-primary outline-none"
                placeholder="es. Mario Rossi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Descrizione / Note</label>
              <textarea 
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-border-subtle rounded-widget focus:ring-2 focus:ring-brand-secondary focus:border-brand-primary outline-none resize-none"
                placeholder="Inserisci una descrizione, stile di insegnamento, argomenti preferiti..."
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-hover text-white font-medium py-3 px-4 rounded-widget transition-colors disabled:opacity-50 flex justify-center items-center gap-2 btn-3d"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
              {loading ? 'Salvataggio...' : 'Aggiungi Professore'}
            </button>
          </form>
        </motion.div>

        {/* Lista Professori */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 glass-panel p-6 rounded-widget shadow-elevation-card"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-status-success-bg text-status-success rounded-button">
              <Users size={20} />
            </div>
            <h2 className="text-lg font-semibold">Professori Salvati</h2>
          </div>

          {professors.length === 0 && !fetching ? (
            <div className="text-center py-12 text-text-secondary bg-bg-base rounded-widget border border-dashed border-border-subtle">
              Nessun professore inserito. Aggiungine uno usando il modulo a sinistra.
            </div>
          ) : (
            <div className="space-y-4">
              {professors.map(prof => (
                <div key={prof.id} className="p-4 border border-border-subtle rounded-widget hover:border-brand-secondary transition-colors group relative">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-bold text-lg text-text-primary">{prof.name}</h3>
                      <div className="flex items-start gap-2 mt-2 text-text-secondary text-sm">
                        <FileText size={16} className="mt-0.5 shrink-0 text-text-secondary" />
                        <p className="whitespace-pre-wrap">{prof.description}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(prof.id)}
                      className="p-2 text-text-secondary hover:text-status-danger hover:bg-status-danger-bg rounded-button transition-colors opacity-0 group-hover:opacity-100"
                      title="Elimina"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
