import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { BookOpen, FileText, Link as LinkIcon, GraduationCap, Building2, Calendar, FilePlus, Plus, X, Database, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { mockExams } from '../mockData/testExams';
import PremiumCard from './PremiumCard';

type Exam = {
  id: string;
  esame_scelto: string;
  facolta: string;
  anno_universita: string;
  universita: string;
  libri_supporto: string[];
  link_supporto: string[];
};

type LibroState = { nome: string; suddivisioni: string[] };

import GlowWrapper from './GlowWrapper';

export default function DevelopExamView() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [successNotification, setSuccessNotification] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form 1 State
  const [esameScelto, setEsameScelto] = useState('');
  const [facolta, setFacolta] = useState('');
  const [annoUniversita, setAnnoUniversita] = useState('');
  const [universita, setUniversita] = useState('');
  const [libriSupporto, setLibriSupporto] = useState<LibroState[]>([{ nome: '', suddivisioni: [''] }]);
  const [linkSupporto, setLinkSupporto] = useState<string[]>(['']);

  // Form 2 State
  const [selectedExamId, setSelectedExamId] = useState('');
  const [materialType, setMaterialType] = useState<'professor_description' | 'professor_material'>('professor_description');
  
  const [materialsData, setMaterialsData] = useState({
    professor_description: {
      frontendSectionId: 'section_prof_description',
      fileNames: ['']
    },
    professor_material: {
      frontendSectionId: 'section_prof_materials',
      fileNames: ['']
    }
  });

  const frontendSectionId = materialsData[materialType].frontendSectionId;
  const fileNames = materialsData[materialType].fileNames;

  const setFrontendSectionId = (value: string) => {
    setMaterialsData(prev => ({
      ...prev,
      [materialType]: {
        ...prev[materialType],
        frontendSectionId: value
      }
    }));
  };

  const setFileNames = (value: string[]) => {
    setMaterialsData(prev => ({
      ...prev,
      [materialType]: {
        ...prev[materialType],
        fileNames: value
      }
    }));
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    const { data, error } = await supabase
      .from('web_research_exams')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setExams(data);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const filteredLibri = libriSupporto
      .filter(l => l.nome.trim() !== '')
      .map(l => JSON.stringify({
        nome: l.nome.trim(),
        suddivisioni: l.suddivisioni.filter(s => s.trim() !== '')
      }));
    const filteredLink = linkSupporto.filter(l => l.trim() !== '');

    const { data, error } = await supabase
      .from('web_research_exams')
      .insert([
        {
          esame_scelto: esameScelto,
          facolta,
          anno_universita: annoUniversita,
          universita,
          libri_supporto: filteredLibri,
          link_supporto: filteredLink,
        }
      ])
      .select();

    if (error) {
      console.error('Supabase Error:', error);
      setMessage(`Errore: ${error.message}`);
    } else {
      setMessage('Esame creato con successo! Ora puoi collegare i file.');
      setEsameScelto('');
      setFacolta('');
      setAnnoUniversita('');
      setUniversita('');
      setLibriSupporto([{ nome: '', suddivisioni: [''] }]);
      setLinkSupporto(['']);
      fetchExams();
      if (data && data.length > 0) {
        setSelectedExamId(data[0].id);
        setCurrentStep(2);
      }
    }
    setLoading(false);
  };

  const handleLinkFiles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) {
      setMessage('Seleziona un esame prima di collegare i file.');
      return;
    }
    
    const validFiles = fileNames.filter(f => f.trim() !== '');
    if (validFiles.length === 0) {
      setMessage('Inserisci almeno un nome file.');
      return;
    }

    setLoading(true);
    setMessage('');

    const inserts = validFiles.map(filename => {
      const ext = filename.split('.').pop() || 'unknown';
      
      return {
        exam_id: selectedExamId,
        frontend_section_id: frontendSectionId,
        material_type: materialType,
        file_kind: ext,
        scope: materialType,
        filename: filename.trim()
      };
    });

    const { error } = await supabase
      .from('exam_professor_materials')
      .insert(inserts);

    if (error) {
      setMessage(`Errore collegamento file: ${error.message}`);
    } else {
      setSuccessNotification(true);
      setTimeout(() => setSuccessNotification(false), 5000);
      setFileNames(['']);
      setCurrentStep(1);
    }
    setLoading(false);
  };

  const addLibro = () => setLibriSupporto([...libriSupporto, { nome: '', suddivisioni: [''] }]);
  const updateLibroNome = (index: number, value: string) => {
    const newLibri = [...libriSupporto];
    newLibri[index].nome = value;
    setLibriSupporto(newLibri);
  };
  const removeLibro = (index: number) => {
    setLibriSupporto(libriSupporto.filter((_, i) => i !== index));
  };

  const addSuddivisione = (libroIndex: number) => {
    const newLibri = [...libriSupporto];
    newLibri[libroIndex].suddivisioni.push('');
    setLibriSupporto(newLibri);
  };
  const updateSuddivisione = (libroIndex: number, sudIndex: number, value: string) => {
    const newLibri = [...libriSupporto];
    newLibri[libroIndex].suddivisioni[sudIndex] = value;
    setLibriSupporto(newLibri);
  };
  const removeSuddivisione = (libroIndex: number, sudIndex: number) => {
    const newLibri = [...libriSupporto];
    newLibri[libroIndex].suddivisioni = newLibri[libroIndex].suddivisioni.filter((_, i) => i !== sudIndex);
    setLibriSupporto(newLibri);
  };

  const addLink = () => {
    if (linkSupporto.length >= 30) {
      setMessage('Limite massimo di 30 link raggiunto.');
      return;
    }
    setLinkSupporto([...linkSupporto, '']);
  };
  const updateLink = (index: number, value: string) => {
    const newLink = [...linkSupporto];
    newLink[index] = value;
    setLinkSupporto(newLink);
  };
  const removeLink = (index: number) => {
    setLinkSupporto(linkSupporto.filter((_, i) => i !== index));
  };

  const addFileName = () => {
    if (fileNames.length >= 50) {
      setMessage('Limite massimo di 50 appunti/file raggiunto.');
      return;
    }
    setFileNames([...fileNames, '']);
  };
  const updateFileName = (index: number, value: string) => {
    const newFiles = [...fileNames];
    newFiles[index] = value;
    setFileNames(newFiles);
  };
  const removeFileName = (index: number) => {
    setFileNames(fileNames.filter((_, i) => i !== index));
  };

  const loadMockData = () => {
    const newMockExams = mockExams.filter(mock => !exams.find(e => e.id === mock.id));
    
    if (newMockExams.length > 0) {
      setExams([...exams, ...newMockExams as Exam[]]);
      setMessage(`Caricati ${newMockExams.length} nuovi esami di test! Seleziona un esame dal menu a tendina.`);
    } else {
      setMessage('Tutti i dati di test sono già presenti.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-16 px-8">
      <header className="mb-16">
        <h1 className="text-5xl font-medium text-zinc-950 tracking-tighter">Sviluppo Esami</h1>
        <p className="text-zinc-400 mt-4 font-light text-xl max-w-2xl">Configura la ricerca web e gestisci il materiale didattico in un unico hub accademico.</p>
      </header>

      {successNotification && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-zinc-50 text-zinc-950 rounded-2xl flex items-center gap-3 font-medium shadow-sm"
        >
          <CheckCircle2 size={24} className="text-zinc-900" strokeWidth={1.5} />
          <div>
            <p className="font-medium tracking-tight">Esame sviluppato con successo!</p>
            <p className="text-sm text-zinc-600 font-light">Il materiale è stato collegato. Puoi trovare l'esame nella sezione "Cronologia Esami".</p>
          </div>
        </motion.div>
      )}

      {message && !successNotification && (
        <div className="p-4 bg-zinc-800 text-zinc-50 rounded-2xl font-medium border border-zinc-700">
          {message}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Section 1: Web Research Form */}
        <PremiumCard 
          noTilt
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-3xl border border-zinc-200 shadow-sm"
        >
          <div style={{ transform: "translateZ(30px)" }} className="flex items-center gap-4 mb-8 scale-[0.98] origin-left">
            <div className="p-3 bg-zinc-100 text-zinc-900 rounded-2xl shadow-inner border border-zinc-200">
              <BookOpen size={24} strokeWidth={1.5} className="drop-shadow-sm" />
            </div>
            <h2 className="text-2xl font-medium text-zinc-900 tracking-tight">1. Ricerca Web Esame</h2>
          </div>

          <form onSubmit={handleCreateExam} className="space-y-8 scale-[0.98] origin-top" style={{ transform: "translateZ(40px)" }}>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Esame Scelto</label>
              <div className="relative">
                <BookOpen className="absolute left-4 top-3.5 text-zinc-400" size={18} strokeWidth={1.5} />
                <input 
                  required
                  type="text" 
                  value={esameScelto}
                  onChange={e => setEsameScelto(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all bg-white text-zinc-900"
                  placeholder="es. Analisi Matematica 1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Facoltà</label>
                <div className="relative">
                  <GraduationCap className="absolute left-4 top-3.5 text-zinc-400" size={18} strokeWidth={1.5} />
                  <input 
                    type="text" 
                    value={facolta}
                    onChange={e => setFacolta(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all bg-white text-zinc-900"
                    placeholder="es. Ingegneria"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Anno</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-3.5 text-zinc-400" size={18} strokeWidth={1.5} />
                  <input 
                    type="text" 
                    value={annoUniversita}
                    onChange={e => setAnnoUniversita(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all bg-white text-zinc-900"
                    placeholder="es. 1° Anno"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Università</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-3.5 text-zinc-400" size={18} strokeWidth={1.5} />
                <input 
                  type="text" 
                  value={universita}
                  onChange={e => setUniversita(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all bg-white text-zinc-900"
                  placeholder="es. Politecnico di Milano"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-zinc-300">Libri di Supporto (Multi-livello)</label>
                <GlowWrapper opacity={0.6}>
                  <button type="button" onClick={addLibro} className="bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] text-sm font-medium flex items-center gap-1 transition-all px-3 py-1.5 rounded-lg">
                    <Plus size={16} strokeWidth={1.5} /> Aggiungi Libro
                  </button>
                </GlowWrapper>
              </div>
              <div className="space-y-4">
                {libriSupporto.map((libro, bIndex) => (
                  <div key={bIndex} className="p-5 border border-zinc-200 rounded-xl bg-zinc-50 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <BookOpen className="absolute left-4 top-3.5 text-zinc-400" size={18} strokeWidth={1.5} />
                        <input 
                          type="text" 
                          value={libro.nome}
                          onChange={e => updateLibroNome(bIndex, e.target.value)}
                          className="w-full pl-12 pr-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none bg-white text-zinc-900 transition-all"
                          placeholder="Nome del Libro (es. Analisi 1)"
                        />
                      </div>
                      {libriSupporto.length > 1 && (
                        <button type="button" onClick={() => removeLibro(bIndex)} className="p-3 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all bg-white border border-zinc-200 rounded-xl hover:shadow-[0_0_10px_rgba(220,38,38,0.2)]">
                          <X size={20} strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                    
                    {/* Suddivisioni */}
                    <div className="pl-6 space-y-3 border-l-2 border-zinc-200 ml-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Suddivisione (Capitoli/Sezioni)</label>
                        <GlowWrapper opacity={0.6} glowColor="black">
                          <button type="button" onClick={() => addSuddivisione(bIndex)} className="bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] text-xs font-medium flex items-center gap-1 transition-all px-2 py-1 rounded-lg">
                            <Plus size={14} strokeWidth={1.5} /> Aggiungi
                          </button>
                        </GlowWrapper>
                      </div>
                      {libro.suddivisioni.map((sud, sIndex) => (
                        <div key={sIndex} className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <FileText className="absolute left-3 top-2.5 text-zinc-400" size={16} strokeWidth={1.5} />
                            <input 
                              type="text" 
                              value={sud}
                              onChange={e => updateSuddivisione(bIndex, sIndex, e.target.value)}
                              className="w-full pl-10 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none bg-white text-zinc-900 transition-all"
                              placeholder="es. Capitolo 1"
                            />
                          </div>
                          {libro.suddivisioni.length > 1 && (
                            <button type="button" onClick={() => removeSuddivisione(bIndex, sIndex)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all hover:shadow-[0_0_10px_rgba(220,38,38,0.2)] rounded-lg">
                              <X size={18} strokeWidth={1.5} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-zinc-300">Link di Supporto</label>
                <GlowWrapper opacity={0.6} glowColor="white">
                  <button type="button" onClick={addLink} className="bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] text-sm font-medium flex items-center gap-1 transition-all px-3 py-1.5 rounded-lg">
                    <Plus size={16} strokeWidth={1.5} /> Aggiungi
                  </button>
                </GlowWrapper>
              </div>
              <div className="space-y-3">
                {linkSupporto.map((link, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-4 top-3.5 text-zinc-400" size={18} strokeWidth={1.5} />
                      <input 
                        type="url" 
                        value={link}
                        onChange={e => updateLink(index, e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all bg-white text-zinc-900"
                        placeholder="https://..."
                      />
                    </div>
                    {linkSupporto.length > 1 && (
                      <button type="button" onClick={() => removeLink(index)} className="p-3 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all bg-white border border-zinc-200 rounded-xl hover:shadow-[0_0_10px_rgba(220,38,38,0.2)]">
                        <X size={20} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <GlowWrapper opacity={0.6} glowColor="black" className="w-full" alwaysOn>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-4 px-4 rounded-xl transition-all hover:shadow-lg hover:shadow-zinc-500/20 disabled:opacity-50"
              >
                {loading ? 'Salvataggio...' : 'Crea Esame'}
              </button>
            </GlowWrapper>
          </form>
        </PremiumCard>

        {/* Section 2: File Upload (Metadata) */}
        <GlowWrapper opacity={0.2} glowColor="black" className="rounded-2xl" alwaysOn>
        <PremiumCard 
          noTilt
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 sm:p-10 lg:p-14 rounded-2xl border border-zinc-200 shadow-sm flex flex-col"
        >
          <div style={{ transform: "translateZ(30px)" }} className="flex items-center justify-between mb-6 scale-[0.95] origin-left">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-100 text-zinc-900 rounded-xl shadow-inner border border-zinc-200">
                <FilePlus size={24} strokeWidth={1.5} className="drop-shadow-sm" />
              </div>
              <h2 className="text-2xl font-medium text-zinc-900 tracking-tight">2. Assorbimento File Prof</h2>
            </div>
            <button 
              type="button" 
              onClick={loadMockData} 
              className="text-sm bg-white text-zinc-900 px-4 py-2 rounded-xl font-medium hover:bg-zinc-50 transition-colors flex items-center gap-2 border border-zinc-200 shadow-sm"
            >
              <Database size={16} strokeWidth={1.5} />
              Carica Dati di Test
            </button>
          </div>

          <form onSubmit={handleLinkFiles} className="space-y-6 flex-1 flex flex-col scale-[0.95] origin-top" style={{ transform: "translateZ(40px)" }}>
            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-2">Seleziona Esame</label>
              <select 
                required
                value={selectedExamId}
                onChange={e => setSelectedExamId(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none bg-white appearance-none text-zinc-900"
              >
                <option value="">-- Scegli un esame --</option>
                {exams.map(exam => (
                  <option key={exam.id} value={exam.id}>
                    {exam.esame_scelto} ({exam.universita})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-2">Tipo di Materiale</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setMaterialType('professor_description')}
                  className={`w-full py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                    materialType === 'professor_description' 
                      ? 'bg-zinc-900 border-zinc-900 text-white shadow-md' 
                      : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  Descrizione Prof
                </button>
                <button
                  type="button"
                  onClick={() => setMaterialType('professor_material')}
                  className={`w-full py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                    materialType === 'professor_material' 
                      ? 'bg-zinc-900 border-zinc-900 text-white shadow-md' 
                      : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  Materiale Prof
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-2">ID Sezione Frontend</label>
              <input 
                type="text" 
                value={frontendSectionId}
                onChange={e => setFrontendSectionId(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none bg-white transition-all text-zinc-900"
                placeholder="es. section_prof_materials"
              />
              <p className="text-xs text-zinc-500 mt-2">Identificativo della sezione da cui provengono i file.</p>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-zinc-900">Nomi dei File da Collegare</label>
                <GlowWrapper opacity={0.8} glowColor="black" className="rounded-lg" alwaysOn>
                  <button type="button" onClick={addFileName} className="bg-zinc-900 text-white hover:bg-zinc-700 hover:shadow-[0_0_15px_rgba(0,0,0,0.3)] text-sm font-medium flex items-center gap-1 transition-all px-4 py-2 rounded-lg shadow-sm">
                    <Plus size={16} strokeWidth={1.5} /> Aggiungi File
                  </button>
                </GlowWrapper>
              </div>
              <div className="space-y-3">
                {fileNames.map((filename, index) => (
                  <div key={index} className="flex items-center gap-3 group hover:translate-x-1 transition-all duration-200 p-2 -mx-2 rounded-xl hover:bg-zinc-50">
                    <GlowWrapper opacity={0.4} className="flex-1 rounded-xl">
                      <div className="relative group-hover:border-zinc-400 group-hover:shadow-sm transition-all border border-zinc-200 rounded-xl bg-white">
                        <FileText className="absolute left-4 top-3.5 text-zinc-400" size={18} strokeWidth={1.5} />
                        <input 
                          type="text" 
                          value={filename}
                          onChange={e => updateFileName(index, e.target.value)}
                          className="w-full pl-12 pr-4 py-3 border-none rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none bg-transparent transition-all text-zinc-900"
                          placeholder="es. appunti_lezione.pdf"
                        />
                      </div>
                    </GlowWrapper>
                    {fileNames.length > 1 && (
                      <GlowWrapper opacity={0.5} glowColor="red" className="rounded-xl">
                        <button type="button" onClick={() => removeFileName(index)} className="p-3 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-[0_0_10px_rgba(220,38,38,0.2)]">
                          <X size={20} strokeWidth={1.5} />
                        </button>
                      </GlowWrapper>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-500 mt-3">
                Inserisci i nomi dei file (con estensione) che sono stati caricati in un'altra sezione.
              </p>
            </div>

            <GlowWrapper opacity={0.8} glowColor="black" className="w-full" alwaysOn>
              <button 
                type="submit" 
                disabled={loading || !selectedExamId || fileNames.filter(f => f.trim() !== '').length === 0}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-4 px-4 rounded-xl transition-all hover:shadow-lg hover:shadow-zinc-500/20 disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading && <Loader2 className="animate-spin" size={20} strokeWidth={1.5} />}
                {loading ? 'Collegamento in corso...' : "Collega File all'Esame"}
              </button>
            </GlowWrapper>
          </form>
        </PremiumCard>
        </GlowWrapper>
    </div>
    </div>
  );
}
