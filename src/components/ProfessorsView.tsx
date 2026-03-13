import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { UserPlus, Users, Trash2, Loader2, FileText, Database } from 'lucide-react';
import { motion } from 'motion/react';
import PremiumCard from './PremiumCard';
import { AnimatedTestimonials } from './ui/animated-testimonials';
import GlowWrapper from './GlowWrapper';

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

  const testimonials = professors.map(prof => ({
    quote: prof.description,
    name: prof.name,
    designation: 'Professore',
    src: `https://api.dicebear.com/7.x/avataaars/svg?seed=${prof.name}`,
  }));

  useEffect(() => {
    fetchProfessors();

    const channel = supabase
      .channel('professors-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'professors' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProfessors(prev => [payload.new as Professor, ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setProfessors(prev => prev.filter(p => p.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          setProfessors(prev => prev.map(p => p.id === payload.new.id ? payload.new as Professor : p));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProfessors = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from('professors')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching professors:', error);
      if (error.code === '42P01') {
        setMessage('Errore: La tabella "professors" non è stata trovata. Assicurati di averla creata nel database.');
      } else {
        setMessage(`Errore nel caricamento dei professori: ${error.message}`);
      }
    } else if (data) {
      setProfessors(data);
    }
    setFetching(false);
  };

  const getSupabaseErrorMessage = (error: any): string => {
    switch (error.code) {
      case '23505':
        return 'Errore: Questo elemento esiste già (violazione di unicità).';
      case '42501':
        return 'Errore: Permessi insufficienti per eseguire questa operazione.';
      case '42P01':
        return 'Errore: La tabella richiesta non esiste nel database.';
      case 'PGRST301':
        return 'Errore: Violazione della policy di sicurezza (RLS).';
      case '23503':
        return 'Errore: Violazione di chiave esterna (riferimento non valido).';
      default:
        return `Errore: ${error.message || 'Si è verificato un errore sconosciuto.'}`;
    }
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
      setMessage(getSupabaseErrorMessage(error));
    } else {
      setMessage('Professore aggiunto con successo!');
      setName('');
      setDescription('');
      setTimeout(() => setMessage(''), 3000);
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
      setMessage(getSupabaseErrorMessage(error));
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('Professore eliminato.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const loadMockProfessors = async () => {
    setLoading(true);
    setMessage('');
    
    const mockProfessors = [
      {
        name: "Prof. Alessandro Barbero",
        description: "Docente di Storia Medievale. Lezioni estremamente narrative e coinvolgenti. Richiede una conoscenza approfondita degli eventi storici e delle loro cause. All'esame apprezza i collegamenti interdisciplinari e la capacità di argomentare in modo fluido."
      },
      {
        name: "Prof.ssa Maria Chiara Carrozza",
        description: "Docente di Bioingegneria e Biorobotica. Approccio molto pragmatico e orientato al problem-solving. Il materiale didattico è denso di formule e casi studio reali. All'esame orale chiede spesso di risolvere un problema pratico alla lavagna."
      },
      {
        name: "Prof. Roberto Burioni",
        description: "Docente di Microbiologia e Virologia. Estremamente rigoroso sul metodo scientifico. Non tollera approssimazioni o terminologia inesatta. Le slide sono essenziali, bisogna studiare molto dai libri di testo consigliati e prestare attenzione ai dettagli."
      },
      {
        name: "Prof. Vincenzo Schettini",
        description: "Docente di Fisica. Stile di insegnamento dinamico, utilizza molti esperimenti pratici e analogie con la vita quotidiana. L'esame scritto è standard, ma all'orale valuta molto l'intuito fisico oltre alla mera formula matematica."
      }
    ];

    const { error } = await supabase
      .from('professors')
      .insert(mockProfessors);

    if (error) {
      console.error('Error loading mock professors:', error);
      setMessage(getSupabaseErrorMessage(error));
    } else {
      setMessage('Dati di test caricati con successo! Le card si aggiorneranno in tempo reale.');
      setTimeout(() => setMessage(''), 5000);
    }
    setLoading(false);
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
          <div style={{ transform: "translateZ(30px)" }} className="flex items-center justify-between mb-6 scale-[0.95] origin-left">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-100 text-zinc-900 rounded-xl">
                <Users size={24} strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-medium text-zinc-900 tracking-tight">Professori Salvati</h2>
            </div>
            <button 
              type="button" 
              onClick={loadMockProfessors} 
              disabled={loading}
              className="text-sm bg-white text-zinc-900 px-4 py-2 rounded-xl font-medium hover:bg-zinc-50 transition-colors flex items-center gap-2 border border-zinc-200 shadow-sm disabled:opacity-50"
            >
              <Database size={16} strokeWidth={1.5} />
              Carica Dati di Test
            </button>
          </div>

          <div style={{ transform: "translateZ(40px)" }} className="scale-[0.95] origin-top">
            {professors.length === 0 && !fetching ? (
              <div className="text-center py-12 text-zinc-500 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                Nessun professore inserito. Aggiungine uno usando il modulo a sinistra.
              </div>
            ) : (
              <AnimatedTestimonials className="!max-w-none !px-0 !py-0" testimonials={testimonials} />
            )}
          </div>
        </PremiumCard>
      </div>
    </div>
  );
}
