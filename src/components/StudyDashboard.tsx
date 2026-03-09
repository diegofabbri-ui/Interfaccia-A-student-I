import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, ChevronRight, MessageSquare, FileText, Link as LinkIcon, Book, Mic, Video, BrainCircuit, Send, Calendar, Clock, Target, Loader2, AlertCircle, Database, X, Square } from 'lucide-react';
import { supabase } from '../supabase';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize Gemini with the provided API key
const ai = new GoogleGenAI({ apiKey: 'AIzaSyBV--5uug0XI9jmJ3i5RiYgpPQWAgUtby8' });

type StudyPlan = {
  macroInventory: { name: string; type: string; details: string }[];
  mediumBlocks: {
    blockName: string;
    assignedMaterial: { material: string; type: string }[];
  }[];
  dailyTasks: { phase: string; material: string; deadline: string; status: string }[];
  dailyDeliverables: {
    videos: { title: string; script: string }[];
    flashcards: { front: string; back: string }[];
    quizzes: { question: string; options: string[]; correctAnswer: string }[];
    audios: { title: string; dialogue: string }[];
  };
  copilotContext: string;
};

export default function StudyDashboard({ exam }: { exam: any }) {
  const [started, setStarted] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([]);
  const [fetchedNotes, setFetchedNotes] = useState<string[]>([]);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [activeDeliverable, setActiveDeliverable] = useState<{ type: 'video' | 'flashcard' | 'quiz' | 'audio', data: any, title: string } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchMaterials = async () => {
      if (!exam?.id) return;
      
      // Bypass Supabase for mock exams
      if (exam.id.startsWith('mock-')) {
        setFetchedNotes(exam.mock_notes || []);
        return;
      }

      const { data, error } = await supabase
        .from('exam_professor_materials')
        .select('filename')
        .eq('exam_id', exam.id);
      
      if (data) {
        setFetchedNotes(data.map(d => d.filename));
      }
    };
    fetchMaterials();
  }, [exam]);

  // Parse data for materials based on limits
  const books = exam?.libri_supporto?.map((l: string) => {
    try {
      const parsed = JSON.parse(l);
      return {
        name: parsed.nome || l,
        files: parsed.suddivisioni || []
      };
    } catch (e) {
      return {
        name: l,
        files: []
      };
    }
  }) || [];

  const links = exam?.link_supporto || [];
  const notes = fetchedNotes.length > 0 ? fetchedNotes : ['Nessun appunto collegato'];

  const handleStart = async () => {
    // 1. Verifica rigorosa dei limiti di sistema
    const totalLinks = links.length;
    const totalNotes = notes.length;
    const totalItems = totalLinks + totalNotes + books.reduce((acc: number, b: any) => acc + b.files.length, 0);

    if (totalLinks > 30) {
      setSystemError("Limite superato: massimo 30 link consentiti.");
      return;
    }
    if (totalNotes > 50) {
      setSystemError("Limite superato: massimo 50 file di appunti consentiti.");
      return;
    }
    // Assuming books.files represents PDFs per book
    for (const book of books) {
      if (book.files.length > 20) {
        setSystemError(`Limite superato: massimo 20 PDF/suddivisioni per il libro "${book.name}".`);
        return;
      }
    }
    if (totalItems > 300) {
      setSystemError("Limite globale superato: massimo 300 elementi totali per sessione.");
      return;
    }

    setSystemError(null);
    setStarted(true);
    setLoadingPlan(true);

    abortControllerRef.current = new AbortController();

    try {
      const prompt = `
        Obiettivo: Esegui il frazionamento del carico didattico totale dell'utente, distribuendo il materiale in tre livelli temporali (Macro, Medio, Piccolo) e generando output multimediali vincolati.

        Dati in input:
        - Esame: "${exam.esame_scelto}" (${exam.facolta}, ${exam.universita})
        - Giorni all'esame: 60
        - Libri: ${JSON.stringify(books)}
        - Link: ${JSON.stringify(links)}
        - Appunti: ${JSON.stringify(notes)}

        Fase 1: Gestione Macro Area (Intero Periodo)
        - Genera una Tabella Dati globale (macroInventory) contenente l'inventario di tutti i file caricati. Usa "N/D" se autore/durata mancano.

        Fase 2: Gestione Aree Medie (Blocchi di 5 Giorni)
        - Fraziona i 60 giorni in blocchi di 5 giorni.
        - Distribuisci il carico di lettura dei libri in modo uniforme.
        - Associa i metadati {Appunti} e {Link} ai blocchi di 5 giorni con rigorosa pertinenza semantica.
        - Genera una tabella dati intermedia per ogni blocco (mediumBlocks).

        Fase 3: Gestione Area Piccola (Singolo Giorno - Giorno 1)
        - Isola il carico di studio per il giorno corrente (Giorno 1).
        - Genera i task operativi solo per oggi (dailyTasks).
        - Genera obbligatoriamente i CONTENUTI REALI per i deliverables per oggi: 
          - 1 Video: Genera il titolo e uno script dettagliato per un video riassuntivo (con indicazioni visive e testo narrato).
          - 1 Set di Flashcard: Genera un set di 3 flashcard (fronte/retro) sui concetti chiave.
          - 1 Quiz di verifica: Genera un quiz a risposta multipla di 3 domande (con 4 opzioni e la risposta corretta).
          - 1 Traccia Audio: Genera 1 script per podcast a due voci (stile NotebookLM Audio Overview) dove due host discutono i concetti di oggi in modo colloquiale e approfondito.
        - Definisci il contesto di memoria per il Copilot (solo materiale di oggi).

        Vincoli:
        - I deliverables non devono essere solo titoli, ma materiale reale e pronto all'uso come descritto.
        - Non omettere nessuno dei deliverables richiesti.
        - Non inventare argomenti non presenti nei file/link.
        - Usa "N/D" se un'informazione manca.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              macroInventory: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Nome del file/libro/link" },
                    type: { type: Type.STRING, description: "Tipo (Libro, Appunto, Link)" },
                    details: { type: Type.STRING, description: "Dettagli (Autore, Durata, ecc.) o N/D" }
                  },
                  required: ["name", "type", "details"]
                }
              },
              mediumBlocks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    blockName: { type: Type.STRING, description: "Nome del blocco (es. Blocco 1: Giorni 1-5)" },
                    assignedMaterial: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          material: { type: Type.STRING },
                          type: { type: Type.STRING }
                        },
                        required: ["material", "type"]
                      }
                    }
                  },
                  required: ["blockName", "assignedMaterial"]
                }
              },
              dailyTasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    phase: { type: Type.STRING },
                    material: { type: Type.STRING },
                    deadline: { type: Type.STRING },
                    status: { type: Type.STRING }
                  },
                  required: ["phase", "material", "deadline", "status"]
                }
              },
              dailyDeliverables: {
                type: Type.OBJECT,
                properties: {
                  videos: { 
                    type: Type.ARRAY, 
                    items: { 
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        script: { type: Type.STRING, description: "Script dettagliato del video con indicazioni visive e narrazione" }
                      },
                      required: ["title", "script"]
                    }, 
                    description: "Esattamente 1 video script" 
                  },
                  flashcards: { 
                    type: Type.ARRAY, 
                    items: { 
                      type: Type.OBJECT,
                      properties: {
                        front: { type: Type.STRING, description: "Domanda o concetto" },
                        back: { type: Type.STRING, description: "Risposta o spiegazione" }
                      },
                      required: ["front", "back"]
                    }, 
                    description: "Un set di 3 flashcard" 
                  },
                  quizzes: { 
                    type: Type.ARRAY, 
                    items: { 
                      type: Type.OBJECT,
                      properties: {
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctAnswer: { type: Type.STRING }
                      },
                      required: ["question", "options", "correctAnswer"]
                    }, 
                    description: "Un quiz di 3 domande a risposta multipla" 
                  },
                  audios: { 
                    type: Type.ARRAY, 
                    items: { 
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        dialogue: { type: Type.STRING, description: "Script di un podcast a due voci (Host 1 e Host 2) che discutono l'argomento, in stile NotebookLM Audio Overview" }
                      },
                      required: ["title", "dialogue"]
                    }, 
                    description: "Esattamente 1 script per traccia audio/podcast" 
                  }
                },
                required: ["videos", "flashcards", "quizzes", "audios"]
              },
              copilotContext: { type: Type.STRING, description: "Contesto per il Copilot basato solo sul materiale di oggi" }
            },
            required: ["macroInventory", "mediumBlocks", "dailyTasks", "dailyDeliverables", "copilotContext"]
          }
        }
      });

      if (response.text && !abortControllerRef.current?.signal.aborted) {
        let jsonText = response.text;
        // Strip markdown code blocks if present
        if (jsonText.startsWith('```')) {
          const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (match && match[1]) {
            jsonText = match[1];
          }
        }
        setStudyPlan(JSON.parse(jsonText));
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
        console.log('Generazione annullata dall\'utente');
        // Error already handled in handleStop
      } else {
        console.error("Errore durante la generazione del piano:", error);
        setSystemError(`Errore durante la generazione: ${error.message || 'Errore sconosciuto'}`);
        setLoadingPlan(false);
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoadingPlan(false);
      }
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    console.log('Generazione annullata dall\'utente');
    setSystemError('Generazione annullata.');
    setStarted(false);
    setLoadingPlan(false);
    // We can't strictly abort the SDK call if it doesn't support signal, 
    // but we can reset the UI state.
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !studyPlan) return;

    setChatMessages([...chatMessages, { role: 'user', content: chatInput }]);
    const currentInput = chatInput;
    setChatInput('');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: currentInput,
        config: {
          systemInstruction: `Sei il Copilot Giornaliero. Hai un blocco di memoria rigoroso: puoi rispondere SOLO basandoti su questo contesto del materiale di oggi: "${studyPlan.copilotContext}". Se l'utente chiede qualcosa fuori da questo perimetro, rifiuta gentilmente dicendo che non fa parte del materiale di oggi.`,
        }
      });
      
      if (response.text) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: response.text || '' }]);
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Errore di connessione al Copilot.' }]);
    }
  };

  const examName = exam?.esame_scelto || "Nessun Esame Selezionato";
  const examUni = exam?.universita || "Università non specificata";
  const examFac = exam?.facolta || "Facoltà non specificata";
  const examYear = exam?.anno_universita || "-";

  const displayPlan = studyPlan || {
    macroInventory: [
      { name: "In attesa di generazione...", type: "-", details: "-" }
    ],
    mediumBlocks: [
      {
        blockName: "Blocco 1: Giorni 1-5 (Esempio)",
        assignedMaterial: [
          { material: "In attesa di generazione...", type: "-" }
        ]
      },
      {
        blockName: "Blocco 2: Giorni 6-10 (Esempio)",
        assignedMaterial: [
          { material: "In attesa di generazione...", type: "-" }
        ]
      }
    ],
    dailyTasks: [
      { phase: "In attesa di generazione...", material: "-", deadline: "-", status: "-" }
    ],
    dailyDeliverables: {
      videos: [{ title: "In attesa di generazione...", script: "..." }],
      flashcards: [{ front: "In attesa di generazione...", back: "..." }],
      quizzes: [{ question: "In attesa di generazione...", options: ["A", "B", "C", "D"], correctAnswer: "A" }],
      audios: [{ title: "In attesa di generazione...", dialogue: "..." }]
    },
    copilotContext: ''
  };

  return (
    <div className="mt-16 space-y-12 border-t border-border-subtle pt-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-text-primary">Dashboard di Studio: {examName}</h2>
        <p className="text-text-secondary mt-2">Gestione materiale, piano di studio e risorse giornaliere.</p>
      </div>

      {systemError && (
        <div className="bg-status-danger-bg border border-status-danger text-status-danger p-4 rounded-widget flex items-center gap-3">
          <AlertCircle size={20} />
          <span className="font-medium">{systemError}</span>
        </div>
      )}

      {/* Start Button */}
      {(!started || systemError) && !loadingPlan && (
        <div className="flex justify-center py-8">
          <button
            onClick={handleStart}
            disabled={!exam}
            className="flex items-center gap-2 bg-brand-primary hover:bg-brand-hover text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-elevation-card disabled:opacity-50 btn-3d"
          >
            <Play fill="currentColor" size={20} />
            {systemError ? 'Riprova Generazione' : 'Genera Piano di Studio Verticale'}
          </button>
        </div>
      )}

      {/* Loading State */}
      {started && loadingPlan && (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <Loader2 className="animate-spin text-brand-primary" size={48} />
          <div className="text-center max-w-md mx-auto">
            <h3 className="text-xl font-bold text-text-primary">Frazionamento del Carico in corso...</h3>
            <p className="text-text-secondary mt-2">L'IA sta elaborando le 3 fasi temporali e generando i contenuti reali (video, flashcard, quiz, audio).</p>
            <p className="text-status-warning font-medium mt-4 bg-status-warning-bg p-3 rounded-button border border-status-warning text-sm">
              Questa operazione richiede un'elaborazione complessa e potrebbe impiegare fino a 1-2 minuti. Ti preghiamo di attendere.
            </p>
            <button
              onClick={handleStop}
              className="mt-6 flex items-center gap-2 mx-auto bg-status-danger-bg hover:bg-status-danger text-status-danger px-6 py-2 rounded-full font-medium transition-colors btn-3d"
            >
              <Square fill="currentColor" size={16} />
              Ferma Generazione
            </button>
          </div>
        </div>
      )}

      {/* Vertical Presentation & Dashboard Area */}
      {!loadingPlan && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* 1. Info Esame */}
          <div className="bg-brand-primary text-white rounded-3xl p-10 shadow-elevation-floating relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_100%_0%,_#ffffff_0%,_transparent_50%)]"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h2 className="text-4xl font-bold tracking-tight text-white mb-2">{examName}</h2>
                <p className="text-xl text-text-secondary">{examUni} - {examFac}</p>
                <p className="text-text-secondary">{examYear}</p>
              </div>
              <div className="flex items-center gap-3 px-6 py-4 bg-surface-primary/10 rounded-widget border border-white/10 backdrop-blur-sm">
                <Calendar className="text-brand-primary" size={28} />
                <div>
                  <div className="text-2xl font-bold text-white">60 Giorni</div>
                  <div className="text-xs text-text-secondary uppercase tracking-wider">All'esame</div>
                </div>
              </div>
            </div>
          </div>

          {/* Fase 1: Macro Area */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel rounded-3xl p-8 shadow-elevation-card space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-brand-secondary text-brand-primary rounded-widget">
                <Database size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-primary">Fase 1: Macro Area</h2>
                <p className="text-text-secondary text-sm">Inventario Globale (60 Giorni)</p>
              </div>
            </div>
            
            <div className="overflow-x-auto border border-border-subtle rounded-widget">
              <table className="w-full text-sm text-left">
                <thead className="bg-bg-base text-text-secondary font-medium border-b border-border-subtle">
                  <tr>
                    <th className="px-6 py-4">Nome Elemento</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Dettagli (Autore/Durata)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {displayPlan.macroInventory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-bg-base transition-colors">
                      <td className="px-6 py-4 font-medium text-text-primary">{item.name}</td>
                      <td className="px-6 py-4 text-text-secondary">
                        <span className="inline-block bg-surface-interactive text-text-primary px-2.5 py-1 rounded-md text-xs font-medium">{item.type}</span>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{item.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Fase 2: Aree Medie */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel rounded-3xl p-8 shadow-elevation-card space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-brand-secondary text-brand-primary rounded-widget">
                <Calendar size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-primary">Fase 2: Aree Medie</h2>
                <p className="text-text-secondary text-sm">Mappa Mentale Verticale (Blocchi di 5 Giorni)</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {displayPlan.mediumBlocks.map((block) => (
                <div key={block.blockName} className="bg-bg-base border border-border-subtle rounded-widget overflow-hidden">
                  <div className="p-5 bg-brand-secondary border-b border-border-subtle">
                    <span className="font-semibold text-lg text-brand-primary">{block.blockName}</span>
                  </div>
                  <div className="p-6 bg-surface-primary">
                    <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Tabella Dati Intermedia</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-bg-base text-text-secondary font-medium border-b border-border-subtle">
                          <tr>
                            <th className="px-6 py-4">Materiale Assegnato</th>
                            <th className="px-6 py-4">Tipo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {block.assignedMaterial.map((mat, idx) => (
                            <tr key={idx} className="hover:bg-bg-base transition-colors">
                              <td className="px-6 py-4 font-medium text-text-primary">{mat.material}</td>
                              <td className="px-6 py-4 text-text-secondary">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                  mat.type.toLowerCase().includes('libro') ? 'bg-brand-secondary text-brand-primary' :
                                  mat.type.toLowerCase().includes('link') ? 'bg-status-success-bg text-status-success' :
                                  'bg-status-warning-bg text-status-warning'
                                }`}>{mat.type}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Fase 3: Area Piccola */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel rounded-3xl p-8 shadow-elevation-card space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-brand-secondary text-brand-primary rounded-widget">
                <Target size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-primary">Fase 3: Area Piccola</h2>
                <p className="text-text-secondary text-sm">Isolamento Oggi (Giorno 1)</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-text-primary mb-4">Task Operativi (Giorno 1)</h3>
              <div className="overflow-x-auto border border-border-subtle rounded-widget">
                <table className="w-full text-sm text-left">
                  <thead className="bg-bg-base text-text-secondary font-medium border-b border-border-subtle">
                    <tr>
                      <th className="px-6 py-4">Fase di Studio</th>
                      <th className="px-6 py-4">Materiale Isolato</th>
                      <th className="px-6 py-4">Scadenza</th>
                      <th className="px-6 py-4">Stato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {displayPlan.dailyTasks.map((task, idx) => (
                      <tr key={idx} className="hover:bg-bg-base transition-colors">
                        <td className="px-6 py-4 font-medium text-text-primary">{task.phase}</td>
                        <td className="px-6 py-4 text-text-secondary">{task.material}</td>
                        <td className="px-6 py-4 text-text-secondary">{task.deadline}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-status-warning-bg text-status-warning rounded-md text-xs font-medium">
                            {task.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-text-primary mb-4">Deliverables Obbligatori (Generati per Oggi)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-bg-base p-6 rounded-widget border border-border-subtle flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-status-danger-bg text-status-danger rounded-full flex items-center justify-center"><Video size={20} /></div>
                    <div className="font-bold text-text-primary">1 Video</div>
                  </div>
                  <ul className="text-sm text-text-secondary space-y-2 list-none">
                    {displayPlan.dailyDeliverables.videos.map((v, i) => (
                      <li key={i}>
                        <button onClick={() => setActiveDeliverable({ type: 'video', data: v, title: v.title })} className="text-left hover:text-status-danger transition-colors flex items-start gap-2">
                          <span className="text-status-danger mt-0.5">•</span>
                          <span className="font-medium">{v.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-bg-base p-6 rounded-widget border border-border-subtle flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-status-info-bg text-status-info rounded-full flex items-center justify-center"><FileText size={20} /></div>
                    <div className="font-bold text-text-primary">1 Set Flashcard</div>
                  </div>
                  <ul className="text-sm text-text-secondary space-y-2 list-none">
                    <li>
                      <button onClick={() => setActiveDeliverable({ type: 'flashcard', data: displayPlan.dailyDeliverables.flashcards, title: 'Set di Flashcard' })} className="text-left hover:text-status-info transition-colors flex items-start gap-2">
                        <span className="text-status-info mt-0.5">•</span>
                        <span className="font-medium">Apri Set ({displayPlan.dailyDeliverables.flashcards.length} carte)</span>
                      </button>
                    </li>
                  </ul>
                </div>
                <div className="bg-bg-base p-6 rounded-widget border border-border-subtle flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-status-success-bg text-status-success rounded-full flex items-center justify-center"><BrainCircuit size={20} /></div>
                    <div className="font-bold text-text-primary">1 Quiz</div>
                  </div>
                  <ul className="text-sm text-text-secondary space-y-2 list-none">
                    <li>
                      <button onClick={() => setActiveDeliverable({ type: 'quiz', data: displayPlan.dailyDeliverables.quizzes, title: 'Quiz di Verifica' })} className="text-left hover:text-status-success transition-colors flex items-start gap-2">
                        <span className="text-status-success mt-0.5">•</span>
                        <span className="font-medium">Avvia Quiz ({displayPlan.dailyDeliverables.quizzes.length} domande)</span>
                      </button>
                    </li>
                  </ul>
                </div>
                <div className="bg-bg-base p-6 rounded-widget border border-border-subtle flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-secondary text-brand-primary rounded-full flex items-center justify-center"><Mic size={20} /></div>
                    <div className="font-bold text-text-primary">1 Audio</div>
                  </div>
                  <ul className="text-sm text-text-secondary space-y-2 list-none">
                    {displayPlan.dailyDeliverables.audios.map((a, i) => (
                      <li key={i}>
                        <button onClick={() => setActiveDeliverable({ type: 'audio', data: a, title: a.title })} className="text-left hover:text-brand-primary transition-colors flex items-start gap-2">
                          <span className="text-brand-primary mt-0.5">•</span>
                          <span className="font-medium">{a.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 4. Copilot Giornaliero */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel rounded-3xl shadow-elevation-card overflow-hidden flex flex-col h-[500px]">
            <div className="bg-brand-primary text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-secondary rounded-widget border border-brand-primary">
                  <MessageSquare size={28} className="text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Copilot Giornaliero</h3>
                  <p className="text-sm text-text-secondary mt-1">Memoria isolata al materiale di oggi. Non rispondo su argomenti futuri/passati.</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-status-danger-bg text-status-danger border border-status-danger rounded-button text-xs font-bold tracking-wider uppercase">
                Blocco Memoria Attivo
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-bg-base">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary space-y-4">
                  <BrainCircuit size={64} className="text-text-secondary" />
                  <p className="text-base max-w-md">
                    Fai una domanda sul materiale assegnato per oggi.<br/>
                    L'IA rifiuterà di rispondere a domande fuori dal perimetro del Giorno 1.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-widget text-base leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand-primary text-white rounded-tr-sm shadow-elevation-card'
                        : 'bg-surface-primary border border-border-subtle text-text-primary rounded-tl-sm shadow-elevation-card'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleChatSubmit} className="p-5 bg-surface-primary border-t border-border-subtle flex gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Chiedi chiarimenti sui concetti di oggi..."
                className="flex-1 px-6 py-4 bg-surface-interactive border-transparent focus:bg-surface-primary focus:border-brand-primary focus:ring-2 focus:ring-brand-secondary rounded-widget outline-none transition-all text-base"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="px-8 py-4 bg-brand-primary text-white rounded-widget hover:bg-brand-hover disabled:opacity-50 transition-colors flex items-center justify-center shadow-elevation-card"
              >
                <Send size={24} />
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Deliverable Modal */}
      <AnimatePresence>
        {activeDeliverable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setActiveDeliverable(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel rounded-3xl shadow-elevation-floating w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-bg-base/50">
                <div className="flex items-center gap-3">
                  {activeDeliverable.type === 'video' && <div className="p-2 bg-status-danger-bg text-status-danger rounded-button"><Video size={24} /></div>}
                  {activeDeliverable.type === 'flashcard' && <div className="p-2 bg-status-info-bg text-status-info rounded-button"><FileText size={24} /></div>}
                  {activeDeliverable.type === 'quiz' && <div className="p-2 bg-status-success-bg text-status-success rounded-button"><BrainCircuit size={24} /></div>}
                  {activeDeliverable.type === 'audio' && <div className="p-2 bg-brand-secondary text-brand-primary rounded-button"><Mic size={24} /></div>}
                  <h3 className="text-xl font-bold text-text-primary">{activeDeliverable.title}</h3>
                </div>
                <button
                  onClick={() => setActiveDeliverable(null)}
                  className="p-2 text-text-secondary hover:text-text-secondary hover:bg-surface-interactive rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-surface-primary">
                {activeDeliverable.type === 'video' && (
                  <div className="prose prose-zinc max-w-none">
                    <div className="whitespace-pre-wrap font-medium text-text-primary leading-relaxed">
                      {activeDeliverable.data.script}
                    </div>
                  </div>
                )}
                
                {activeDeliverable.type === 'audio' && (
                  <div className="prose prose-zinc max-w-none">
                    <div className="whitespace-pre-wrap font-medium text-text-primary leading-relaxed">
                      {activeDeliverable.data.dialogue}
                    </div>
                  </div>
                )}
                
                {activeDeliverable.type === 'flashcard' && (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {activeDeliverable.data.map((card: any, i: number) => (
                      <div key={i} className="group perspective-1000 h-64">
                        <div className="relative w-full h-full transition-transform duration-500 transform-style-3d group-hover:rotate-y-180">
                          <div className="absolute inset-0 bg-surface-primary border-2 border-status-info-bg rounded-widget p-6 flex flex-col items-center justify-center text-center backface-hidden shadow-elevation-card">
                            <span className="text-xs font-bold text-status-info uppercase tracking-wider mb-4">Fronte</span>
                            <p className="font-semibold text-text-primary text-lg">{card.front}</p>
                          </div>
                          <div className="absolute inset-0 bg-status-info text-white rounded-widget p-6 flex flex-col items-center justify-center text-center backface-hidden rotate-y-180 shadow-elevation-card">
                            <span className="text-xs font-bold text-status-info uppercase tracking-wider mb-4">Retro</span>
                            <p className="font-medium text-white text-lg">{card.back}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {activeDeliverable.type === 'quiz' && (
                  <div className="space-y-8">
                    {activeDeliverable.data.map((q: any, i: number) => (
                      <div key={i} className="bg-bg-base border border-border-subtle rounded-widget p-6">
                        <h4 className="font-bold text-lg text-text-primary mb-4">{i + 1}. {q.question}</h4>
                        <div className="space-y-3">
                          {q.options.map((opt: string, j: number) => (
                            <div key={j} className={`p-4 rounded-widget border ${opt === q.correctAnswer ? 'bg-status-success-bg border-status-success text-status-success' : 'bg-surface-primary border-border-subtle text-text-primary'}`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${opt === q.correctAnswer ? 'bg-status-success text-white' : 'bg-surface-interactive text-text-secondary'}`}>
                                  {String.fromCharCode(65 + j)}
                                </div>
                                <span className={opt === q.correctAnswer ? 'font-semibold' : ''}>{opt}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
