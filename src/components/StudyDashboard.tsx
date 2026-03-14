import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, ChevronRight, MessageSquare, FileText, Link as LinkIcon, Book, Mic, BrainCircuit, Send, Calendar, Clock, Target, Loader2, AlertCircle, Database, X, Square, Volume2, Pause, Video, RefreshCw } from 'lucide-react';
import GlowWrapper from './GlowWrapper';
import { supabase } from '../supabase';
import { GoogleGenAI, Type } from '@google/genai';
import ProgressDashboard from './ProgressDashboard';
import StudyPlanMindMap from './StudyPlanMindMap';

// Initialize Gemini with the provided API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

type StudyPlan = {
  macroInventory: { name: string; type: string; details: string }[];
  mediumBlocks: {
    blockName: string;
    durationDays: number;
    assignedMaterial: { material: string; type: string }[];
    dailyBlocks?: {
      day: number;
      dateLabel: string;
      tasks: { phase: string; material: string; deadline: string; status: string }[];
    }[];
  }[];
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
  const [fetchedNotes, setFetchedNotes] = useState<string[]>([]);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [activeDeliverable, setActiveDeliverable] = useState<{ type: 'video' | 'flashcard' | 'quiz' | 'audio', data: any, title: string } | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [generatingVisuals, setGeneratingVisuals] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [podcastImages, setPodcastImages] = useState<string[]>([]);
  const [sceneTimings, setSceneTimings] = useState<number[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
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

    if (exam?.id && !exam.id.startsWith('mock-')) {
      const channel = supabase
        .channel(`materials-channel-${exam.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'exam_professor_materials',
          filter: `exam_id=eq.${exam.id}`
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setFetchedNotes(prev => [...prev, payload.new.filename]);
          } else if (payload.eventType === 'DELETE') {
            setFetchedNotes(prev => prev.filter(f => f !== payload.old.filename));
          } else if (payload.eventType === 'UPDATE') {
            // Assuming filename is the identifier for now, might need to be more robust
            setFetchedNotes(prev => prev.map(f => f === payload.old.filename ? payload.new.filename : f));
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [exam]);

  // Parse data for materials based on limits
  const books = exam?.libri_supporto?.map((l: string) => {
    try {
      const parsed = JSON.parse(l);
      return {
        name: parsed.nome || l,
        files: parsed.suddivisioni || [],
        pdfUrls: parsed.fileUrls || (parsed.fileUrl ? [parsed.fileUrl] : [])
      };
    } catch (e) {
      return {
        name: l,
        files: [],
        pdfUrls: []
      };
    }
  }) || [];

  const links = exam?.link_supporto || [];
  const notes = fetchedNotes.length > 0 ? fetchedNotes : ['Nessun appunto collegato'];

  const getApiKey = () => {
    return process.env.GEMINI_API_KEY!;
  };

  useEffect(() => {
    let interval: any;
    if (isPlaying && audioRef.current && podcastImages.length > 0 && sceneTimings.length > 0) {
      interval = setInterval(() => {
        if (audioRef.current) {
          const currentTime = audioRef.current.currentTime;
          // Find the current scene based on timings
          let nextIndex = 0;
          for (let i = 0; i < sceneTimings.length; i++) {
            if (currentTime >= sceneTimings[i]) {
              nextIndex = i;
            } else {
              break;
            }
          }
          setCurrentImageIndex(nextIndex);
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, podcastImages, sceneTimings]);

  const handleGenerateAudio = async (dialogue: string) => {
    setGeneratingAudio(true);
    setGeneratingVisuals(true);
    setAudioUrl(null);
    setPodcastImages([]);
    setSceneTimings([]);
    setCurrentImageIndex(0);

    // Parse scenes from dialogue
    // Dialogue format: [SCENE 1] text [SCENE 2] text ...
    const sceneRegex = /\[SCENE \d+\]/g;
    const sceneMarkers = dialogue.match(sceneRegex) || [];
    const sceneTexts = dialogue.split(sceneRegex).filter(t => t.trim().length > 0);
    
    // Clean dialogue for TTS (remove markers)
    const cleanDialogue = dialogue.replace(sceneRegex, "").trim();
    
    // Calculate timings based on character position
    // We estimate speaking rate: ~15 characters per second
    const CHARS_PER_SEC = 15;
    let currentPos = 0;
    const timings: number[] = [];
    
    // The split dialogue might have text before the first marker if not starting with [SCENE 1]
    // But we'll assume the model follows instructions.
    const fullText = dialogue;
    let accumulatedTime = 0;
    
    sceneMarkers.forEach((marker, idx) => {
      const markerPos = fullText.indexOf(marker, currentPos);
      const textBeforeMarker = fullText.substring(currentPos, markerPos);
      accumulatedTime += textBeforeMarker.length / CHARS_PER_SEC;
      timings.push(accumulatedTime);
      currentPos = markerPos + marker.length;
    });

    // Start Image Generation in parallel
    const generateImagesPromise = (async () => {
      try {
        const imageAi = new GoogleGenAI({ apiKey: getApiKey() });
        const images: string[] = [];
        
        // Use the text of each scene to generate a relevant image
        for (let i = 0; i < Math.min(sceneTexts.length, 6); i++) {
          const sceneText = sceneTexts[i].substring(0, 300); // Limit prompt length
          const prompt = `A cinematic, high-quality educational illustration representing this concept: "${sceneText}". Style: Modern, clean, professional, 4k, elegant lighting.`;
          
          const response = await imageAi.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: [{ text: prompt }],
            config: {
              imageConfig: { aspectRatio: "16:9" }
            }
          });
          
          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              images.push(`data:image/png;base64,${part.inlineData.data}`);
              break;
            }
          }
        }
        return images;
      } catch (err) {
        console.error("Errore generazione immagini:", err);
        return [];
      }
    })();

    try {
      const ttsAi = new GoogleGenAI({ apiKey: getApiKey() });
      const ttsPrompt = `Genera un podcast audio basato su questo dialogo tra Joe e Jane. Joe ha una voce profonda e Jane una voce chiara. Mantieni il ritmo naturale:
      ${cleanDialogue}`;

      const response = await ttsAi.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: ttsPrompt }] }],
        config: {
          // @ts-ignore
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: 'Joe',
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' }
                  }
                },
                {
                  speaker: 'Jane',
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Puck' }
                  }
                }
              ]
            }
          }
        }
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBlob = await fetch(`data:audio/mp3;base64,${base64Audio}`).then(res => res.blob());
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      }
      
      // Wait for images to finish
      const generatedImages = await generateImagesPromise;
      if (generatedImages.length > 0) {
        setPodcastImages(generatedImages);
        setSceneTimings(timings);
      }
    } catch (err) {
      console.error("Errore generazione audio:", err);
      alert("Errore durante la generazione dell'audio NotebookLM.");
    } finally {
      setGeneratingAudio(false);
      setGeneratingVisuals(false);
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

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
    // Assuming books.pdfUrls represents PDFs per book
    for (const book of books) {
      if (book.pdfUrls.length > 20) {
        setSystemError(`Limite superato: massimo 20 PDF per il libro "${book.name}".`);
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
        - Genera una tabella dati intermedia per ogni blocco (mediumBlocks), specificando la durata in giorni (durationDays).
        - SOLO PER IL PRIMO BLOCCO MEDIO (es. Giorni 1-5), genera il dettaglio per OGNI SINGOLO GIORNO (es. 5 giorni = 5 blocchi giornalieri in dailyBlocks). Per gli altri blocchi medi, lascia l'array dailyBlocks vuoto.

        Fase 3: Gestione Area Piccola (Deliverables del Giorno 1)
        - SOLO PER IL GIORNO 1, genera i CONTENUTI REALI per i deliverables: 
          - 1 Set di Flashcard: Genera un set di 3 flashcard (fronte/retro) sui concetti chiave.
          - 1 Quiz di verifica: Genera un quiz a risposta multipla di 3 domande (con 4 opzioni e la risposta corretta).
          - 1 Traccia Audio: Genera 1 script per podcast a due voci (stile NotebookLM Audio Overview) dove due host discutono i concetti di oggi in modo colloquiale e approfondito. Dividi lo script in esattamente 6 scene inserendo i marcatori [SCENE 1], [SCENE 2], ..., [SCENE 6] all'inizio di ogni cambio di argomento nel dialogo.
        - Definisci il contesto di memoria per il Copilot (solo materiale del Giorno 1).

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
                    durationDays: { type: Type.NUMBER, description: "Numero di giorni in questo blocco (es. 5)" },
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
                    },
                    dailyBlocks: {
                      type: Type.ARRAY,
                      description: "Dettaglio giornaliero per ogni giorno di questo blocco (es. 5 elementi per il primo blocco, vuoto per gli altri)",
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          day: { type: Type.NUMBER, description: "Numero del giorno (es. 1, 2, 3...)" },
                          dateLabel: { type: Type.STRING, description: "Etichetta del giorno (es. Giorno 1)" },
                          tasks: {
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
                          }
                        },
                        required: ["day", "dateLabel", "tasks"]
                      }
                    }
                  },
                  required: ["blockName", "durationDays", "assignedMaterial", "dailyBlocks"]
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
                        dialogue: { type: Type.STRING, description: "Script di un podcast a due voci (Host 1 e Host 2) con marcatori [SCENE 1]...[SCENE 6] inseriti nel testo per sincronizzare le immagini." }
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
            required: ["macroInventory", "mediumBlocks", "dailyDeliverables", "copilotContext"]
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
        const parsedPlan = JSON.parse(jsonText);

        // Save generated blocks to Supabase and populate placeholders
        try {
          if (parsedPlan.mediumBlocks && parsedPlan.mediumBlocks.length > 0) {
            let allBlocksToInsert: any[] = [];
            let currentDay = 1;

            parsedPlan.mediumBlocks.forEach((block: any) => {
              // If AI provided daily blocks for this medium block, use them
              if (block.dailyBlocks && block.dailyBlocks.length > 0) {
                block.dailyBlocks.forEach((db: any) => {
                  allBlocksToInsert.push({
                    exam_id: exam.id,
                    medium_block_name: block.blockName,
                    day_number: db.day || currentDay,
                    date_label: db.dateLabel || `Giorno ${currentDay}`,
                    tasks: db.tasks || [],
                    status: 'pending'
                  });
                  currentDay++;
                });
              } else {
                // Otherwise, generate placeholder daily blocks for this medium block
                // using durationDays
                block.dailyBlocks = [];
                const daysToGenerate = block.durationDays || 5;
                for (let i = 0; i < daysToGenerate; i++) {
                  const newBlock = {
                    day: currentDay,
                    dateLabel: `Giorno ${currentDay}`,
                    tasks: [{ phase: "Pianificazione Futura", material: "Da definire", deadline: "-", status: "pending" }]
                  };
                  block.dailyBlocks.push(newBlock);
                  allBlocksToInsert.push({
                    exam_id: exam.id,
                    medium_block_name: block.blockName,
                    day_number: currentDay,
                    date_label: `Giorno ${currentDay}`,
                    tasks: newBlock.tasks,
                    status: 'pending'
                  });
                  currentDay++;
                }
              }
            });

            if (allBlocksToInsert.length > 0) {
              const { error: insertError } = await supabase
                .from('study_plan_blocks')
                .insert(allBlocksToInsert);
                
              if (insertError) {
                console.error("Error saving blocks to Supabase:", insertError);
              } else {
                console.log("Blocks saved to Supabase successfully.");
              }
            }
          }
        } catch (dbError) {
          console.error("Error saving to db:", dbError);
        }

        setStudyPlan(parsedPlan);
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

  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([]);
  const chatRef = useRef<any>(null);

  const initChat = (context: string) => {
    chatRef.current = ai.chats.create({
      model: 'gemini-3.1-pro-preview',
      config: {
        systemInstruction: `Sei il Copilot Giornaliero. Hai un blocco di memoria rigoroso: puoi rispondere SOLO basandoti su questo contesto del materiale di oggi: "${context}". Se l'utente chiede qualcosa fuori da questo perimetro, rifiuta gentilmente dicendo che non fa parte del materiale di oggi.`,
      },
    });
  };

  const refreshCopilot = () => {
    setChatMessages([]);
    if (studyPlan) {
      initChat(studyPlan.copilotContext);
    }
  };

  useEffect(() => {
    if (studyPlan && !chatRef.current) {
      initChat(studyPlan.copilotContext);
    }
  }, [studyPlan]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatRef.current) return;

    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');

    try {
      const response = await chatRef.current.sendMessage({ message: userMessage });
      
      if (response.text) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: response.text || '' }]);
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Errore di connessione al Copilot.' }]);
    }
  };


  const examName = exam?.esame_scelto || "Nessun Esame Selezionato";
  const examUni = exam?.universita || "Università non specificata";

  const getGlowColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'libro': return '#3b82f6'; // blue-500
      case 'link': return '#22c55e'; // green-500
      case 'appunto': return '#eab308'; // yellow-500
      case 'video': return '#ef4444'; // red-500
      case 'flashcard': return '#f472b6'; // pink-400
      case 'quiz': return '#fb923c'; // orange-400
      case 'audio': return '#818cf8'; // indigo-400
      default: return '#a855f7'; // purple-500
    }
  };
  const examFac = exam?.facolta || "Facoltà non specificata";
  const examYear = exam?.anno_universita || "-";

  const displayPlan = studyPlan || {
    macroInventory: [
      { name: "In attesa di generazione...", type: "-", details: "-" }
    ],
    mediumBlocks: [
      {
        blockName: "Blocco 1: Giorni 1-5 (Esempio)",
        durationDays: 5,
        assignedMaterial: [
          { material: "In attesa di generazione...", type: "-" }
        ],
        dailyBlocks: [
          {
            day: 1,
            dateLabel: "Giorno 1",
            tasks: [
              { phase: "In attesa di generazione...", material: "-", deadline: "-", status: "-" }
            ]
          }
        ]
      },
      {
        blockName: "Blocco 2: Giorni 6-10 (Esempio)",
        durationDays: 5,
        assignedMaterial: [
          { material: "In attesa di generazione...", type: "-" }
        ]
      }
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
          <GlowWrapper opacity={0.6} glowColor="black">
            <button
              onClick={handleStart}
              disabled={!exam}
              className="flex items-center gap-2 bg-brand-primary hover:bg-brand-hover text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-elevation-card disabled:opacity-50 btn-3d"
            >
              <Play fill="currentColor" size={20} />
              {systemError ? 'Riprova Generazione' : 'Genera Piano di Studio Verticale'}
            </button>
          </GlowWrapper>
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

          {/* Progress Dashboard Section */}
          <div className="glass-panel rounded-3xl p-8 shadow-elevation-card">
            <ProgressDashboard />
          </div>

          <StudyPlanMindMap plan={displayPlan} examName={examName} onDeliverableClick={setActiveDeliverable} />

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
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshCopilot}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  title="Aggiorna contesto Copilot"
                >
                  <RefreshCw size={20} />
                </button>
                <div className="px-3 py-1 bg-status-danger-bg text-status-danger border border-status-danger rounded-button text-xs font-bold tracking-wider uppercase">
                  Blocco Memoria Attivo
                </div>
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
                  {activeDeliverable.type === 'video' && <div className="p-2 bg-red-100 text-red-600 rounded-button"><Video size={24} /></div>}
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
                {activeDeliverable.type === 'audio' && (
                  <div className="space-y-8">
                    <div className="bg-bg-base border border-border-subtle rounded-2xl overflow-hidden shadow-sm">
                      {/* Dynamic Slideshow Background */}
                      <div className="relative h-80 bg-black flex items-center justify-center overflow-hidden">
                        <AnimatePresence mode="wait">
                          {podcastImages.length > 0 ? (
                            <motion.img
                              key={currentImageIndex}
                              src={podcastImages[currentImageIndex]}
                              initial={{ opacity: 0, scale: 1.1 }}
                              animate={{ opacity: 0.6, scale: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 1.5, ease: "easeInOut" }}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex flex-col items-center justify-center">
                              {generatingVisuals ? (
                                <>
                                  <Loader2 className="animate-spin text-brand-primary mb-2" size={32} />
                                  <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">Generazione Visuals IA...</span>
                                </>
                              ) : (
                                <div className="flex flex-col items-center gap-2 opacity-30">
                                  <Volume2 size={48} className="text-brand-primary" />
                                  <span className="text-xs font-bold uppercase tracking-widest">In attesa di generazione</span>
                                </div>
                              )}
                            </div>
                          )}
                        </AnimatePresence>
                        
                        {/* Audio Overlay UI */}
                        <div className="relative z-10 text-center space-y-4 p-6">
                          <div className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center justify-center mx-auto shadow-xl">
                            <Mic size={32} />
                          </div>
                          <div>
                            <h4 className="text-2xl font-bold text-white drop-shadow-md">NotebookLM Audio Overview</h4>
                            <p className="text-white/80 text-sm drop-shadow-sm font-medium">Joe & Jane • Podcast Didattico</p>
                          </div>
                          {podcastImages.length > 0 && (
                            <div className="flex justify-center gap-1 mt-4">
                              {podcastImages.map((_, i) => (
                                <div 
                                  key={i} 
                                  className={`h-1 rounded-full transition-all duration-500 ${i === currentImageIndex ? 'w-8 bg-brand-primary' : 'w-2 bg-white/30'}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-8 text-center space-y-6">
                        <div className="pt-2">
                          {audioUrl ? (
                            <div className="space-y-4">
                              <audio 
                                ref={audioRef} 
                                src={audioUrl} 
                                onEnded={() => setIsPlaying(false)}
                                className="hidden"
                              />
                              <div className="flex items-center justify-center gap-6">
                                <button 
                                  onClick={toggleAudio}
                                  className="w-20 h-20 bg-brand-primary text-white rounded-full flex items-center justify-center hover:bg-brand-hover transition-all shadow-elevation-floating hover:scale-105 active:scale-95"
                                >
                                  {isPlaying ? <Pause size={40} /> : <Play size={40} fill="currentColor" className="ml-1" />}
                                </button>
                              </div>
                              <div className="flex flex-col items-center gap-1">
                                <div className="text-sm font-bold text-brand-primary animate-pulse uppercase tracking-wider">
                                  {isPlaying ? 'In Riproduzione' : 'Pronto per l\'ascolto'}
                                </div>
                                <p className="text-xs text-text-secondary italic">L'audio e le immagini cambieranno automaticamente durante la lezione.</p>
                              </div>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleGenerateAudio(activeDeliverable.data.dialogue)}
                              disabled={generatingAudio || generatingVisuals}
                              className="flex items-center gap-3 bg-brand-primary hover:bg-brand-hover text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all disabled:opacity-50 shadow-elevation-card mx-auto hover:scale-[1.02] active:scale-[0.98]"
                            >
                              {generatingAudio || generatingVisuals ? <Loader2 className="animate-spin" size={28} /> : <Volume2 size={28} />}
                              {generatingAudio || generatingVisuals ? 'Generazione Esperienza NotebookLM...' : 'Genera Podcast con Slideshow IA'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="prose prose-zinc max-w-none">
                      <h5 className="text-lg font-bold text-text-primary mb-4 border-b pb-2 flex items-center gap-2">
                        <FileText size={20} className="text-brand-primary" />
                        Trascrizione del Dialogo
                      </h5>
                      <div className="whitespace-pre-wrap font-medium text-text-primary leading-relaxed bg-bg-base p-8 rounded-2xl border border-border-subtle italic shadow-inner">
                        {activeDeliverable.data.dialogue}
                      </div>
                    </div>
                  </div>
                )}
                
                {activeDeliverable.type === 'video' && (
                  <div className="space-y-6">
                    <div className="bg-bg-base border border-border-subtle rounded-2xl overflow-hidden shadow-sm p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-inner">
                          <Video size={32} />
                        </div>
                        <div>
                          <h4 className="text-2xl font-bold text-text-primary">{activeDeliverable.data.title}</h4>
                          <p className="text-text-secondary font-medium">Script Video</p>
                        </div>
                      </div>
                      <div className="prose prose-zinc max-w-none">
                        <div className="whitespace-pre-wrap font-medium text-text-primary leading-relaxed bg-surface-primary p-6 rounded-xl border border-border-subtle shadow-inner">
                          {activeDeliverable.data.script}
                        </div>
                      </div>
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
