import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { BookOpen, FileText, Link as LinkIcon, GraduationCap, Building2, Calendar, FilePlus, Plus, X, Database, CheckCircle2, Loader2, AlertCircle, UploadCloud, ExternalLink } from 'lucide-react';
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
  professore_id?: string;
  giorni_mancanti?: number;
  test_contenuto_libri?: string;
  test_contenuto_descrizione_prof?: string;
  test_contenuto_materiale_prof?: string;
};

type LibroState = { nome: string; suddivisioni: string[]; files: File[] };

import GlowWrapper from './GlowWrapper';

export default function DevelopExamView() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const showNotification = (text: string, type: 'success' | 'error') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Form 1 State
  const [esameScelto, setEsameScelto] = useState('');
  const [facolta, setFacolta] = useState('');
  const [annoUniversita, setAnnoUniversita] = useState('');
  const [universita, setUniversita] = useState('');
  const [professoreId, setProfessoreId] = useState('');
  const [giorniMancanti, setGiorniMancanti] = useState('');
  const [professors, setProfessors] = useState<{id: string, name: string}[]>([]);
  const [libriSupporto, setLibriSupporto] = useState<LibroState[]>([{ nome: '', suddivisioni: [''], files: [] }]);
  const [linkSupporto, setLinkSupporto] = useState<string[]>(['']);

  // Form 2 State
  const [selectedExamId, setSelectedExamId] = useState('');
  const [materialType, setMaterialType] = useState<'professor_material'>('professor_material');
  
  const [materialsData, setMaterialsData] = useState({
    professor_material: {
      frontendSectionId: '',
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
    fetchProfessors();

    const channel = supabase
      .channel('exams-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'web_research_exams' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setExams(prev => [payload.new as Exam, ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setExams(prev => prev.filter(e => e.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          setExams(prev => prev.map(e => e.id === payload.new.id ? payload.new as Exam : e));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  const fetchProfessors = async () => {
    const { data } = await supabase.from('professors').select('id, name');
    if (data) setProfessors(data);
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

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const filteredLibri = await Promise.all(
        libriSupporto
          .filter(l => l.nome.trim() !== '')
          .map(async (l) => {
            const fileUrls = await Promise.all(
              l.files.map(async (file) => {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `books/${fileName}`;
                
                const { error: uploadError } = await supabase.storage
                  .from('exam_materials')
                  .upload(filePath, file);
                  
                if (uploadError) {
                  console.error('Upload error:', uploadError);
                  throw new Error(`Errore caricamento file per ${l.nome}: ${uploadError.message}`);
                }
                
                const { data: publicUrlData } = supabase.storage
                  .from('exam_materials')
                  .getPublicUrl(filePath);
                  
                return publicUrlData.publicUrl;
              })
            );

            return JSON.stringify({
              nome: l.nome.trim(),
              suddivisioni: l.suddivisioni.filter(s => s.trim() !== ''),
              fileUrls: fileUrls
            });
          })
      );

      const filteredLink = linkSupporto.filter(l => l.trim() !== '');

      const isBio = esameScelto.toLowerCase().includes('bioingegneria');
      const testContenutoLibri = isBio ? 
        "CONTENUTO ESTRATTO DAI LIBRI DI BIOINGEGNERIA:\nLa bioingegneria applica i principi dell'ingegneria alle scienze della vita. La biorobotica si concentra sullo sviluppo di robot ispirati a sistemi biologici. Argomenti trattati: biomeccanica, segnali biomedici, organi artificiali, protesi cibernetiche, robot esoscheletrici." 
        : null;

      const { data, error } = await supabase
        .from('web_research_exams')
        .insert([
          {
            esame_scelto: esameScelto,
            facolta,
            anno_universita: annoUniversita,
            universita,
            professore_id: professoreId || null,
            giorni_mancanti: giorniMancanti ? parseInt(giorniMancanti) : null,
            libri_supporto: filteredLibri,
            link_supporto: filteredLink,
            test_contenuto_libri: testContenutoLibri
          }
        ])
        .select();

      if (error) {
        console.error('Supabase Error:', error);
        showNotification(getSupabaseErrorMessage(error), 'error');
      } else {
        showNotification('Esame creato con successo! Ora puoi collegare i file.', 'success');
        setEsameScelto('');
        setFacolta('');
        setAnnoUniversita('');
        setUniversita('');
        setLibriSupporto([{ nome: '', suddivisioni: [''], files: [] }]);
        setLinkSupporto(['']);
        if (data && data.length > 0) {
          setSelectedExamId(data[0].id);
          setCurrentStep(2);
        }
      }
    } catch (err: any) {
      showNotification(err.message || 'Errore durante il salvataggio', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkFiles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) {
      showNotification('Seleziona un esame prima di collegare i file.', 'error');
      return;
    }
    
    const validFiles = fileNames.filter(f => f.trim() !== '');
    if (validFiles.length === 0) {
      showNotification('Inserisci almeno un nome file.', 'error');
      return;
    }

    setLoading(true);

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
      console.error('Supabase Error:', error);
      showNotification(getSupabaseErrorMessage(error), 'error');
    } else {
      const selectedExam = exams.find(e => e.id === selectedExamId);
      const isBio = selectedExam?.esame_scelto.toLowerCase().includes('bioingegneria');
      
      if (isBio) {
        const updateField = materialType === 'professor_description' 
          ? { test_contenuto_descrizione_prof: "CONTENUTO ESTRATTO DESCRIZIONE PROF:\nIl corso di Bioingegneria si propone di fornire le basi per l'analisi dei sistemi fisiologici. Il docente richiede particolare attenzione all'elaborazione dei segnali e alla modellistica biomeccanica." }
          : { test_contenuto_materiale_prof: "CONTENUTO ESTRATTO MATERIALE PROF:\nSlide 1: Introduzione alla Biorobotica. Slide 2: Sensori e attuatori biomedici. Slide 3: Controllo di protesi robotiche tramite segnali EMG. Slide 4: Materiali biocompatibili per l'interazione uomo-macchina." };
          
        await supabase.from('web_research_exams').update(updateField).eq('id', selectedExamId);
      }

      showNotification('Materiale collegato con successo!', 'success');
      setFileNames(['']);
      setCurrentStep(1);
    }
    setLoading(false);
  };

  const addLibro = () => setLibriSupporto([...libriSupporto, { nome: '', suddivisioni: [''], files: [] }]);
  const updateLibroNome = (index: number, value: string) => {
    const newLibri = [...libriSupporto];
    newLibri[index].nome = value;
    setLibriSupporto(newLibri);
  };
  const handleFileUpload = (index: number, newFiles: FileList | null) => {
    if (!newFiles) return;
    const newLibri = [...libriSupporto];
    const currentFiles = newLibri[index].files;
    
    const filesToAdd = Array.from(newFiles).filter(f => f.type === 'application/pdf');
    
    if (currentFiles.length + filesToAdd.length > 20) {
      showNotification('Limite massimo di 20 file per libro raggiunto.', 'error');
      return;
    }

    newLibri[index].files = [...currentFiles, ...filesToAdd];
    setLibriSupporto(newLibri);
  };
  const removeFile = (libroIndex: number, fileIndex: number) => {
    const newLibri = [...libriSupporto];
    newLibri[libroIndex].files = newLibri[libroIndex].files.filter((_, i) => i !== fileIndex);
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
      showNotification('Limite massimo di 30 link raggiunto.', 'error');
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
      showNotification('Limite massimo di 50 appunti/file raggiunto.', 'error');
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
      showNotification(`Caricati ${newMockExams.length} nuovi esami di test! Seleziona un esame dal menu a tendina.`, 'success');
    } else {
      showNotification('Tutti i dati di test sono già presenti.', 'error');
    }
  };

  const loadBioingegneriaTest = async () => {
    setLoading(true);
    try {
      const { data: profs } = await supabase.from('professors').select('id').ilike('name', '%Carrozza%').limit(1);
      const profId = profs?.[0]?.id || '';

      setEsameScelto('Bioingegneria e Biorobotica');
      setFacolta('Ingegneria Biomedica');
      setAnnoUniversita('3° Anno');
      setUniversita('Politecnico di Milano');
      setProfessoreId(profId);
      setGiorniMancanti('45');

      const mockLibri = Array.from({ length: 4 }).map((_, bookIdx) => {
        const dummyFiles = Array.from({ length: 10 }).map((_, fileIdx) => {
          const content = `Titolo: Fondamenti di Bioingegneria e Biorobotica - Volume ${bookIdx + 1}, Parte ${fileIdx + 1}\n\n` +
            `La bioingegneria è una disciplina affascinante che unisce l'ingegneria con le scienze mediche e biologiche.\n` +
            `In questa sezione esploriamo i concetti avanzati di biomeccanica, l'elaborazione dei segnali biomedici (ECG, EEG, EMG) ` +
            `e la progettazione di organi artificiali.\n\n` +
            `La biorobotica, d'altra parte, si occupa della creazione di macchine che emulano il comportamento biologico. ` +
            `Esempi includono protesi cibernetiche, robot esoscheletrici per la riabilitazione e micro-robot per la chirurgia minimamente invasiva.\n\n` +
            `Ripetizione per riempire il file: ` + `Bioingegneria e Biorobotica. `.repeat(100);
          return new File([content], `bioingegneria_book${bookIdx + 1}_part${fileIdx + 1}.pdf`, { type: "application/pdf" });
        });
        return {
          nome: `Testo Bioingegneria Vol. ${bookIdx + 1}`,
          suddivisioni: ['Capitoli 1-5', 'Capitoli 6-10'],
          files: dummyFiles
        };
      });
      setLibriSupporto(mockLibri);

      setLinkSupporto([
        'https://www.polimi.it/corsi/bioingegneria',
        'https://it.wikipedia.org/wiki/Biorobotica',
        'https://www.nature.com/subjects/biomedical-engineering'
      ]);

      setMaterialsData({
        professor_material: {
          frontendSectionId: '',
          fileNames: Array.from({ length: 6 }).map((_, i) => `materiale_prof_slide_${i+1}.pdf`)
        }
      });

      showNotification('Campi del form compilati con i dati di test Bioingegneria! Ora puoi cliccare su "Crea Esame".', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Errore durante il caricamento', 'error');
    } finally {
      setLoading(false);
    }
  };

  const injectBioingegneriaDirectly = async () => {
    setLoading(true);
    try {
      const { data: profs } = await supabase.from('professors').select('id').ilike('name', '%Carrozza%').limit(1);
      const profId = profs?.[0]?.id || null;

      const mockLibriSupporto = Array.from({ length: 4 }).map((_, bookIdx) => {
        const fileUrls = Array.from({ length: 10 }).map((_, fileIdx) => 
          `https://example.com/bioingegneria_book${bookIdx + 1}_part${fileIdx + 1}.pdf`
        );
        return JSON.stringify({
          nome: `Testo Bioingegneria Vol. ${bookIdx + 1}`,
          suddivisioni: ['Capitoli 1-5', 'Capitoli 6-10'],
          fileUrls: fileUrls
        });
      });

      const mockLinkSupporto = [
        'https://www.polimi.it/corsi/bioingegneria',
        'https://it.wikipedia.org/wiki/Biorobotica',
        'https://www.nature.com/subjects/biomedical-engineering'
      ];

      const testContenutoLibri = "CONTENUTO ESTRATTO DAI LIBRI DI BIOINGEGNERIA:\nLa bioingegneria applica i principi dell'ingegneria alle scienze della vita. La biorobotica si concentra sullo sviluppo di robot ispirati a sistemi biologici. Argomenti trattati: biomeccanica, segnali biomedici, organi artificiali, protesi cibernetiche, robot esoscheletrici.";
      const testContenutoDescrizione = "CONTENUTO ESTRATTO DESCRIZIONE PROF:\nIl corso di Bioingegneria si propone di fornire le basi per l'analisi dei sistemi fisiologici. Il docente richiede particolare attenzione all'elaborazione dei segnali e alla modellistica biomeccanica.";
      const testContenutoMateriale = "CONTENUTO ESTRATTO MATERIALE PROF:\nSlide 1: Introduzione alla Biorobotica. Slide 2: Sensori e attuatori biomedici. Slide 3: Controllo di protesi robotiche tramite segnali EMG. Slide 4: Materiali biocompatibili per l'interazione uomo-macchina.";

      const { data: examData, error: examError } = await supabase
        .from('web_research_exams')
        .insert([{
          esame_scelto: 'Bioingegneria e Biorobotica (Mock Diretto)',
          facolta: 'Ingegneria Biomedica',
          anno_universita: '3° Anno',
          universita: 'Politecnico di Milano',
          professore_id: profId,
          giorni_mancanti: 45,
          libri_supporto: mockLibriSupporto,
          link_supporto: mockLinkSupporto,
          test_contenuto_libri: testContenutoLibri,
          test_contenuto_descrizione_prof: testContenutoDescrizione,
          test_contenuto_materiale_prof: testContenutoMateriale
        }])
        .select();

      if (examError) throw examError;
      const examId = examData[0].id;

      const descInserts = Array.from({ length: 6 }).map((_, i) => ({
        exam_id: examId,
        frontend_section_id: 'section_prof_description',
        material_type: 'professor_description',
        file_kind: 'pdf',
        scope: 'professor_description',
        filename: `descrizione_prof_parte_${i+1}.pdf`
      }));

      const matInserts = Array.from({ length: 6 }).map((_, i) => ({
        exam_id: examId,
        frontend_section_id: 'section_prof_materials',
        material_type: 'professor_material',
        file_kind: 'pdf',
        scope: 'professor_material',
        filename: `materiale_prof_slide_${i+1}.pdf`
      }));

      const { error: matError } = await supabase
        .from('exam_professor_materials')
        .insert([...descInserts, ...matInserts]);

      if (matError) throw matError;

      showNotification('Esame Bioingegneria iniettato direttamente nel Database con tutti i testi!', 'success');
      // fetchExams() is called by the realtime subscription automatically
    } catch (err: any) {
      showNotification(err.message || 'Errore durante l\'inserimento diretto', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-16 px-8">
      <header className="mb-16 flex justify-between items-start">
        <div>
          <h1 className="text-5xl font-medium text-zinc-950 tracking-tighter">Sviluppo Esami</h1>
          <p className="text-zinc-400 mt-4 font-light text-xl max-w-2xl">Configura la ricerca web e gestisci il materiale didattico in un unico hub accademico.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={loadBioingegneriaTest}
            disabled={loading}
            className="bg-zinc-50 text-zinc-700 hover:bg-zinc-100 px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 border border-zinc-200"
          >
            <FilePlus size={18} />
            Compila Form Bioingegneria
          </button>
          <button
            onClick={injectBioingegneriaDirectly}
            disabled={loading}
            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 border border-emerald-200"
          >
            <Database size={18} />
            Inietta Esame in DB
          </button>
        </div>
      </header>

      {notification && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`p-4 rounded-2xl flex items-center gap-3 font-medium shadow-sm border ${
            notification.type === 'success' ? 'bg-zinc-50 text-zinc-950 border-zinc-200' : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 size={24} className="text-zinc-900" strokeWidth={1.5} />
          ) : (
            <AlertCircle size={24} className="text-red-900" strokeWidth={1.5} />
          )}
          <p>{notification.text}</p>
        </motion.div>
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

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Professore di Riferimento</label>
                <select 
                  value={professoreId}
                  onChange={e => setProfessoreId(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none bg-white text-zinc-900"
                >
                  <option value="">-- Seleziona Professore --</option>
                  {professors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Giorni all'Esame</label>
                <input 
                  type="number" 
                  value={giorniMancanti}
                  onChange={e => setGiorniMancanti(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none bg-white text-zinc-900"
                  placeholder="es. 30"
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
                    
                    {/* File Upload */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">File PDF (Max 20)</label>
                        <label className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-50 transition-all text-xs font-medium text-zinc-700">
                          <Plus size={14} strokeWidth={1.5} />
                          <span>Aggiungi PDF</span>
                          <input 
                            type="file" 
                            accept=".pdf" 
                            multiple
                            className="hidden" 
                            onChange={e => handleFileUpload(bIndex, e.target.files)}
                          />
                        </label>
                      </div>
                      
                      {libro.files.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {libro.files.map((file, fIndex) => (
                            <div key={fIndex} className="flex items-center justify-between p-2 bg-white border border-zinc-100 rounded-lg group">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileText size={14} className="text-emerald-600 shrink-0" />
                                <span className="text-xs text-zinc-600 truncate">{file.name}</span>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => removeFile(bIndex, fIndex)}
                                className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400 italic">Nessun file caricato.</p>
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
                    {link && (
                      <a href={link} target="_blank" rel="noopener noreferrer" className="p-3 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-all bg-white border border-zinc-200 rounded-xl" title="Test Link">
                        <ExternalLink size={20} strokeWidth={1.5} />
                      </a>
                    )}
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
              <div className="grid grid-cols-1 gap-4">
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
              <label className="block text-sm font-medium text-zinc-900 mb-2">Nome della Sezione di Origine</label>
              <input 
                type="text" 
                value={frontendSectionId}
                onChange={e => setFrontendSectionId(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none bg-white transition-all text-zinc-900"
                placeholder="es. Slide Lezioni"
              />
              <p className="text-xs text-zinc-500 mt-2">Inserisci il nome della sezione o cartella da cui hai preso questi file.</p>
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
