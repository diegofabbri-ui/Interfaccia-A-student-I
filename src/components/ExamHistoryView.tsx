import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { BookOpen, Calendar, Building2, GraduationCap, ChevronRight, ChevronLeft, Loader2, Users, Clock } from 'lucide-react';
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
  professore_id?: string;
  giorni_mancanti?: number;
  created_at: string;
};

export default function ExamHistoryView() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalExams, setTotalExams] = useState(0);
  const [professors, setProfessors] = useState<Record<string, string>>({});
  const itemsPerPage = 6;

  useEffect(() => {
    fetchExams(currentPage);
    fetchProfessors();

    const channel = supabase
      .channel('exams-history-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'web_research_exams' }, (payload) => {
        fetchExams(currentPage);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPage]);

  const fetchProfessors = async () => {
    const { data } = await supabase.from('professors').select('id, name');
    if (data) {
      const profMap = data.reduce((acc, p) => ({ ...acc, [p.id]: p.name }), {});
      setProfessors(profMap);
    }
  };

  const fetchExams = async (page: number) => {
    setLoading(true);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage - 1;
    
    const { data, error, count } = await supabase
      .from('web_research_exams')
      .select('*', { count: 'exact' })
      .range(startIndex, endIndex)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching exams:', error);
    } else if (data) {
      setExams(data);
      setTotalExams(count || 0);
    }
    setLoading(false);
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalExams / itemsPerPage);
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam, index) => (
              <div key={exam.id} onClick={() => setSelectedExam(exam)} className="cursor-pointer">
                <PremiumCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:border-2 hover:border-zinc-900 transition-all group h-full flex flex-col"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="p-3 bg-zinc-100 text-zinc-900 rounded-xl group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                      <BookOpen size={24} strokeWidth={1.5} />
                    </div>
                    <ChevronRight className="text-zinc-400 group-hover:text-zinc-900 transition-colors" strokeWidth={1.5} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-zinc-950 mb-4 tracking-tight line-clamp-2">{exam.esame_scelto}</h3>
                    
                    <div className="space-y-2 text-sm text-zinc-600 font-light">
                      <div className="flex items-center gap-3">
                        <Building2 size={16} className="shrink-0 text-zinc-400" strokeWidth={1.5} />
                        <span className="truncate">{exam.universita || 'Università non specificata'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <GraduationCap size={16} className="shrink-0 text-zinc-400" strokeWidth={1.5} />
                        <span className="truncate">{exam.facolta || 'Facoltà non specificata'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar size={16} className="shrink-0 text-zinc-400" strokeWidth={1.5} />
                        <span>{exam.anno_universita || 'Anno non specificato'}</span>
                      </div>
                      {exam.professore_id && (
                        <div className="flex items-center gap-3">
                          <Users size={16} className="shrink-0 text-zinc-400" strokeWidth={1.5} />
                          <span className="truncate">{professors[exam.professore_id] || 'Professore non trovato'}</span>
                        </div>
                      )}
                      {exam.giorni_mancanti !== undefined && exam.giorni_mancanti !== null && (
                        <div className="flex items-center gap-3">
                          <Clock size={16} className="shrink-0 text-zinc-400" strokeWidth={1.5} />
                          <span>{exam.giorni_mancanti} giorni all'esame</span>
                        </div>
                      )}
                    </div>
                  </div>
                </PremiumCard>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} strokeWidth={1.5} />
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                      currentPage === i + 1
                        ? 'bg-zinc-900 text-white shadow-md'
                        : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={20} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
