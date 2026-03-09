import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { BookOpen, Calendar, Building2, GraduationCap, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import StudyDashboard from './StudyDashboard';

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
          className="flex items-center gap-2 bg-surface-primary px-4 py-2 rounded-button text-brand-primary hover:text-brand-hover font-medium transition-colors btn-3d"
        >
          <ChevronRight className="rotate-180" size={20} />
          Torna alla Cronologia
        </button>
        <StudyDashboard exam={selectedExam} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-text-primary">Cronologia Esami</h1>
        <p className="text-text-secondary mt-2">Seleziona un esame per visualizzare o generare il suo piano di studio.</p>
      </header>

      {exams.length === 0 && !loading ? (
        <div className="text-center py-20 text-text-secondary bg-surface-primary rounded-widget border border-dashed border-border-subtle">
          Nessun esame trovato. Creane uno nuovo nella sezione "Nuovo Esame".
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam, index) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedExam(exam)}
              className="glass-panel p-6 rounded-widget shadow-elevation-card hover:border-brand-primary hover:shadow-elevation-floating transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-brand-secondary text-brand-primary rounded-widget group-hover:bg-brand-primary group-hover:text-white transition-colors">
                  <BookOpen size={24} />
                </div>
                <ChevronRight className="text-text-secondary group-hover:text-brand-primary transition-colors" />
              </div>
              
              <h3 className="text-xl font-bold text-text-primary mb-2 line-clamp-2">{exam.esame_scelto}</h3>
              
              <div className="space-y-2 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="shrink-0" />
                  <span className="truncate">{exam.universita || 'Università non specificata'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap size={16} className="shrink-0" />
                  <span className="truncate">{exam.facolta || 'Facoltà non specificata'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="shrink-0" />
                  <span>{exam.anno_universita || 'Anno non specificato'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
