import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { BookOpen, Calendar, Building2, GraduationCap, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import StudyDashboard from './StudyDashboard';
import PremiumCard from './PremiumCard';

type Exam = {
  id: string;
  esame_scelto: string;
  facolta: string;
  anno_universita: string;
  universita: string;
  libri_supporto: string[];
  link_supporto: string[];
  created_at: string;
};

export default function ExamHistoryView() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('web_research_exams')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching exams:', error);
    } else if (data) {
      setExams(data);
    }
    setLoading(false);
  };

  if (selectedExam) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedExam(null)}
          className="flex items-center gap-2 bg-white border border-zinc-200 px-4 py-2 rounded-xl text-zinc-900 hover:bg-zinc-50 font-medium transition-colors shadow-sm"
        >
          <ChevronRight className="rotate-180" size={20} strokeWidth={1.5} />
          Torna alla Cronologia
        </button>
        <StudyDashboard exam={selectedExam} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="mb-10">
        <h1 className="text-4xl font-medium text-zinc-900 tracking-tight">Cronologia Esami</h1>
        <p className="text-zinc-500 mt-2 font-light text-lg">Seleziona un esame per visualizzare o generare il suo piano di studio.</p>
      </header>

      {exams.length === 0 && !loading ? (
        <div className="text-center py-20 text-zinc-500 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
          Nessun esame trovato. Creane uno nuovo nella sezione "Sviluppo Esami".
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam, index) => (
            <div key={exam.id} onClick={() => setSelectedExam(exam)} className="cursor-pointer">
              <PremiumCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm hover:border-zinc-400 transition-all group"
              >
                <div style={{ transform: "translateZ(30px)" }} className="flex items-start justify-between mb-6">
                  <div className="p-3 bg-zinc-100 text-zinc-900 rounded-xl group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                    <BookOpen size={24} strokeWidth={1.5} />
                  </div>
                  <ChevronRight className="text-zinc-400 group-hover:text-zinc-900 transition-colors" strokeWidth={1.5} />
                </div>
                
                <div style={{ transform: "translateZ(40px)" }}>
                  <h3 className="text-xl font-medium text-zinc-900 mb-4 tracking-tight line-clamp-2">{exam.esame_scelto}</h3>
                  
                  <div className="space-y-3 text-sm text-zinc-500 font-light">
                    <div className="flex items-center gap-3">
                      <Building2 size={18} className="shrink-0 text-zinc-400" strokeWidth={1.5} />
                      <span className="truncate">{exam.universita || 'Università non specificata'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <GraduationCap size={18} className="shrink-0 text-zinc-400" strokeWidth={1.5} />
                      <span className="truncate">{exam.facolta || 'Facoltà non specificata'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="shrink-0 text-zinc-400" strokeWidth={1.5} />
                      <span>{exam.anno_universita || 'Anno non specificato'}</span>
                    </div>
                  </div>
                </div>
              </PremiumCard>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
