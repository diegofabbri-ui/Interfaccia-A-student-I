import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { UserPlus, Users, Trash2, Loader2, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import PremiumCard from './PremiumCard';

type Professor = {
  id: string;
  name: string;
  description: string;
  created_at: string;
};

import GlowWrapper from './GlowWrapper';

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
      <header className="mb-10">
        <h1 className="text-4xl font-medium text-zinc-900 tracking-tight">Gestione Professori</h1>
        <p className="text-zinc-500 mt-2 font-light text-lg">Aggiungi e gestisci i profili dei tuoi professori.</p>
      </header>

      {message && (
        <div className="p-4 bg-zinc-100 text-zinc-900 rounded-2xl font-medium border border-zinc-200">
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Form Aggiunta */}
        <GlowWrapper opacity={0.2} glowColor="black" className="rounded-2xl" alwaysOn>
          <PremiumCard 
            noTilt
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-1 bg-white p-6 sm:p-10 lg:p-14 rounded-2xl border border-zinc-200 shadow-sm h-fit"
          >
            <div style={{ transform: "translateZ(30px)" }} className="flex items-center gap-4 mb-6 scale-[0.95] origin-left">
              <div className="p-3 bg-zinc-100 text-zinc-900 rounded-xl">
                <UserPlus size={24} strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-medium text-zinc-900 tracking-tight">Nuovo Professore</h2>
            </div>

            <form onSubmit={handleAddProfessor} className="space-y-6 scale-[0.95] origin-top" style={{ transform: "translateZ(40px)" }}>
              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-2">Nome Professore</label>
                <GlowWrapper className="rounded-xl" opacity={0.15}>
                  <input 
                    required
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all bg-white"
                    placeholder="es. Mario Rossi"
                  />
                </GlowWrapper>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-2">Descrizione / Note</label>
                <GlowWrapper className="rounded-xl" opacity={0.15}>
                  <textarea 
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none resize-none transition-all bg-white"
                    placeholder="Inserisci una descrizione, stile di insegnamento, argomenti preferiti..."
                  />
                </GlowWrapper>
              </div>

              <GlowWrapper className="rounded-xl" opacity={0.3} alwaysOn>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-4 px-4 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} strokeWidth={1.5} /> : <UserPlus size={20} strokeWidth={1.5} />}
                  {loading ? 'Salvataggio...' : 'Aggiungi Professore'}
                </button>
              </GlowWrapper>
            </form>
          </PremiumCard>
        </GlowWrapper>

        {/* Lista Professori */}
        <PremiumCard 
          noTilt
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 bg-white p-6 sm:p-10 lg:p-14 rounded-2xl border border-zinc-200 shadow-sm"
        >
          <div style={{ transform: "translateZ(30px)" }} className="flex items-center gap-4 mb-6 scale-[0.95] origin-left">
            <div className="p-3 bg-zinc-100 text-zinc-900 rounded-xl">
              <Users size={24} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-medium text-zinc-900 tracking-tight">Professori Salvati</h2>
          </div>

          <div style={{ transform: "translateZ(40px)" }} className="scale-[0.95] origin-top">
            {professors.length === 0 && !fetching ? (
              <div className="text-center py-12 text-zinc-500 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                Nessun professore inserito. Aggiungine uno usando il modulo a sinistra.
              </div>
            ) : (
              <div className="space-y-4">
                {professors.map(prof => (
                  <GlowWrapper key={prof.id} opacity={0.1} glowColor="black" className="rounded-2xl">
                    <div className="group relative bg-white border border-zinc-200 rounded-2xl p-6 hover:border-zinc-400 hover:bg-zinc-50/50 transition-all duration-300 shadow-sm hover:shadow-md">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg text-zinc-950 tracking-tight">{prof.name}</h3>
                          <div className="flex items-start gap-3 mt-3 text-zinc-600 text-sm font-light">
                            <FileText size={16} className="mt-0.5 shrink-0 text-zinc-400" strokeWidth={1.5} />
                            <p className="whitespace-pre-wrap leading-relaxed">{prof.description}</p>
                          </div>
                        </div>
                        <GlowWrapper opacity={0.2} glowColor="black" className="rounded-lg">
                          <button 
                            onClick={() => handleDelete(prof.id)}
                            className="p-2 text-zinc-400 group-hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-40 group-hover:opacity-100"
                            title="Elimina"
                          >
                            <Trash2 size={18} strokeWidth={1.5} />
                          </button>
                        </GlowWrapper>
                      </div>
                    </div>
                  </GlowWrapper>
                ))}
              </div>
            )}
          </div>
        </PremiumCard>
      </div>
    </div>
  );
}
