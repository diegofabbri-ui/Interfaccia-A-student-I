import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { BookOpen, FileText, Link as LinkIcon, GraduationCap, Building2, Calendar, FilePlus, Plus, X, Database, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { mockExams } from '../mockData/testExams';

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

export default function DevelopExamView() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [successNotification, setSuccessNotification] = useState(false);

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
    const newExams = [...exams];
    let added = false;
    mockExams.forEach(mock => {
      if (!newExams.find(e => e.id === mock.id)) {
        newExams.push(mock as Exam);
        added = true;
      }
    });
    
    if (added) {
      setExams(newExams);
      setMessage('Dati di test (Mock) caricati con successo! Seleziona un esame di test dal menu a tendina.');
    } else {
      setMessage('I dati di test sono già stati caricati.');
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-text-primary">Sviluppo Esami</h1>
        <p className="text-text-secondary mt-2">Configura la ricerca web per l'esame e collega i file del professore o il materiale didattico.</p>
      </header>

      {successNotification && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-status-success-bg text-status-success rounded-widget flex items-center gap-3 font-medium border border-status-success shadow-elevation-card"
        >
          <CheckCircle2 size={24} className="text-status-success" />
          <div>
            <p className="font-bold">Esame sviluppato con successo!</p>
            <p className="text-sm opacity-90">Il materiale è stato collegato. Puoi trovare l'esame nella sezione "Cronologia Esami".</p>
          </div>
        </motion.div>
      )}

      {message && !successNotification && (
        <div className="p-4 bg-brand-secondary text-brand-primary rounded-widget font-medium border border-border-subtle">
          {message}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Section 1: Web Research Form */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 rounded-widget shadow-elevation-card"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-brand-secondary text-brand-primary rounded-button">
              <BookOpen size={24} />
            </div>
            <h2 className="text-xl font-semibold">1. Ricerca Web Esame</h2>
          </div>

          <form onSubmit={handleCreateExam} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Esame Scelto</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-3 text-text-secondary" size={18} />
                <input 
                  required
                  type="text" 
                  value={esameScelto}
                  onChange={e => setEsameScelto(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border-subtle rounded-widget focus:ring-2 focus:ring-brand-secondary focus:border-brand-primary outline-none transition-all"
                  placeholder="es. Analisi Matematica 1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Facoltà</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-3 text-text-secondary" size={18} />
                  <input 
                    type="text" 
                    value={facolta}
                    onChange={e => setFacolta(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border-subtle rounded-widget focus:ring-2 focus:ring-brand-secondary focus:border-brand-primary outline-none"
                    placeholder="es. Ingegneria"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Anno</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-text-secondary" size={18} />
                  <input 
                    type="text" 
                    value={annoUniversita}
                    onChange={e => setAnnoUniversita(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border-subtle rounded-widget focus:ring-2 focus:ring-brand-secondary focus:border-brand-primary outline-none"
                    placeholder="es. 1° Anno"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Università</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 text-text-secondary" size={18} />
                <input 
                  type="text" 
                  value={universita}
                  onChange={e => setUniversita(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border-subtle rounded-widget focus:ring-2 focus:ring-brand-secondary focus:border-brand-primary outline-none"
                  placeholder="es. Politecnico di Milano"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-text-primary">Libri di Supporto (Multi-livello)</label>
                <button type="button" onClick={addLibro} className="text-brand-primary hover:text-brand-primary text-sm font-medium flex items-center gap-1">
                  <Plus size={14} /> Aggiungi Libro
                </button>
              </div>
              <div className="space-y-4">
                {libriSupporto.map((libro, bIndex) => (
                  <div key={bIndex} className="p-4 border border-border-subtle rounded-widget bg-bg-base/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <BookOpen className="absolute left-3 top-3 text-text-secondary" size={18} />
                        <input 
                          type="text" 
                          value={libro.nome}
                          onChange={e => updateLibroNome(bIndex, e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-border-subtle rounded-widget focus:ring-2 focus:ring-brand-secondary focus:border-brand-primary outline-none bg-surface-primary"
                          placeholder="Nome del Libro (es. Analisi 1)"
                        />
                      </div>
                      {libriSupporto.length > 1 && (
                        <button type="button" onClick={() => removeLibro(bIndex)} className="p-2 text-text-secondary hover:text-status-danger transition-colors">
                          <X size={20} />
                        </button>
                      )}
                    </div>
                    
                    {/* Suddivisioni */}
                    <div className="pl-6 space-y-2 border-l-2 border-border-subtle ml-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Suddivisione (Capitoli/Sezioni)</label>
                        <button type="button" onClick={() => addSuddivisione(bIndex)} className="text-brand-primary hover:text-brand-primary text-xs font-medium flex items-center gap-1">
                          <Plus size={12} /> Aggiungi
                        </button>
                      </div>
                      {libro.suddivisioni.map((sud, sIndex) => (
                        <div key={sIndex} className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <FileText className="absolute left-3 top-2.5 text-text-secondary" size={14} />
                            <input 
                              type="text" 
                              value={sud}
                              onChange={e => updateSuddivisione(bIndex, sIndex, e.target.value)}
                              className="w-full pl-9 pr-3 py-1.5 text-sm border border-border-subtle rounded-button focus:ring-2 focus:ring-brand-secondary focus:border-brand-primary outline-none bg-surface-primary"
                              placeholder="es. Capitolo 1"
                            />
                          </div>
                          {libro.suddivisioni.length > 1 && (
                            <button type="button" onClick={() => removeSuddivisione(bIndex, sIndex)} className="p-1.5 text-text-secondary hover:text-status-danger transition-colors">
                              <X size={16} />
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-text-primary">Link di Supporto</label>
                <button type="button" onClick={addLink} className="text-brand-primary hover:text-brand-primary text-sm font-medium flex items-center gap-1">
                  <Plus size={14} /> Aggiungi
                </button>
              </div>
              <div className="space-y-2">
                {linkSupporto.map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-3 top-3 text-text-secondary" size={18} />
                      <input 
                        type="url" 
                        value={link}
                        onChange={e => updateLink(index, e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border-subtle rounded-widget focus:ring-2 focus:ring-brand-secondary focus:border-brand-primary outline-none"
                        placeholder="https://..."
                      />
                    </div>
                    {linkSupporto.length > 1 && (
                      <button type="button" onClick={() => removeLink(index)} className="p-2 text-text-secondary hover:text-status-danger transition-colors">
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 bg-brand-primary hover:bg-brand-hover text-white font-medium py-3 px-4 rounded-widget transition-colors disabled:opacity-50 btn-3d"
            >
              {loading ? 'Salvataggio...' : 'Crea Esame'}
            </button>
          </form>
        </motion.section>

        {/* Section 2: File Upload (Metadata) */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-8 rounded-widget shadow-elevation-card flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-status-success-bg text-status-success rounded-button">
                <FilePlus size={24} />
              </div>
              <h2 className="text-xl font-semibold">2. Assorbimento File Prof</h2>
            </div>
            <button 
              type="button" 
              onClick={loadMockData} 
              className="text-sm bg-brand-secondary text-brand-primary px-3 py-1.5 rounded-button font-medium hover:bg-brand-secondary transition-colors flex items-center gap-1.5 border border-border-subtle"
            >
              <Database size={14} />
              Carica Dati di Test
            </button>
          </div>

          <form onSubmit={handleLinkFiles} className="space-y-6 flex-1 flex flex-col">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Seleziona Esame</label>
              <select 
                required
                value={selectedExamId}
                onChange={e => setSelectedExamId(e.target.value)}
                className="w-full px-4 py-2 border border-border-subtle rounded-widget focus:ring-2 focus:ring-status-success-bg focus:border-status-success outline-none bg-surface-primary"
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
              <label className="block text-sm font-medium text-text-primary mb-1">Tipo di Materiale</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMaterialType('professor_description')}
                  className={`py-2 px-3 rounded-widget border text-sm font-medium transition-colors ${
                    materialType === 'professor_description' 
                      ? 'bg-status-success-bg border-status-success text-status-success' 
                      : 'bg-surface-primary border-border-subtle text-text-secondary hover:bg-bg-base'
                  }`}
                >
                  Descrizione Prof
                </button>
                <button
                  type="button"
                  onClick={() => setMaterialType('professor_material')}
                  className={`py-2 px-3 rounded-widget border text-sm font-medium transition-colors ${
                    materialType === 'professor_material' 
                      ? 'bg-status-success-bg border-status-success text-status-success' 
                      : 'bg-surface-primary border-border-subtle text-text-secondary hover:bg-bg-base'
                  }`}
                >
                  Materiale Prof
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">ID Sezione Frontend</label>
              <input 
                type="text" 
                value={frontendSectionId}
                onChange={e => setFrontendSectionId(e.target.value)}
                className="w-full px-4 py-2 border border-border-subtle rounded-widget focus:ring-2 focus:ring-status-success-bg focus:border-status-success outline-none bg-bg-base"
                placeholder="es. section_prof_materials"
              />
              <p className="text-xs text-text-secondary mt-1">Identificativo della sezione da cui provengono i file.</p>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-text-primary">Nomi dei File da Collegare</label>
                <button type="button" onClick={addFileName} className="text-status-success hover:text-status-success text-sm font-medium flex items-center gap-1">
                  <Plus size={14} /> Aggiungi
                </button>
              </div>
              <div className="space-y-2">
                {fileNames.map((filename, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <FileText className="absolute left-3 top-3 text-text-secondary" size={18} />
                      <input 
                        type="text" 
                        value={filename}
                        onChange={e => updateFileName(index, e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border-subtle rounded-widget focus:ring-2 focus:ring-status-success-bg focus:border-status-success outline-none"
                        placeholder="es. appunti_lezione.pdf"
                      />
                    </div>
                    {fileNames.length > 1 && (
                      <button type="button" onClick={() => removeFileName(index)} className="p-2 text-text-secondary hover:text-status-danger transition-colors">
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-secondary mt-2">
                Inserisci i nomi dei file (con estensione) che sono stati caricati in un'altra sezione.
              </p>
            </div>

            <button 
              type="submit" 
              disabled={loading || !selectedExamId || fileNames.filter(f => f.trim() !== '').length === 0}
              className="w-full mt-auto bg-status-success hover:bg-status-success text-white font-medium py-3 px-4 rounded-widget transition-colors disabled:opacity-50 flex justify-center items-center gap-2 btn-3d"
            >
              {loading && <Loader2 className="animate-spin" size={20} />}
              {loading ? 'Collegamento in corso...' : "Collega File all'Esame"}
            </button>
          </form>
        </motion.section>
      </div>
    </div>
  );
}
