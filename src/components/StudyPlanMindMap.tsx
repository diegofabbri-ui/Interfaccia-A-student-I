import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Database, FileText, Target, Zap, Link as LinkIcon, Calendar, Clock, Video, Mic, BrainCircuit, Book, Network, CheckCircle2 } from 'lucide-react';

export default function StudyPlanMindMap({ plan, examName, onDeliverableClick }: { plan: any, examName: string, onDeliverableClick: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<{id: string, path: string}[]>([]);

  useEffect(() => {
    const drawLines = () => {
      if (!containerRef.current) return;
      const container = containerRef.current.getBoundingClientRect();
      const newLines: {id: string, path: string}[] = [];

      const rootNode = document.getElementById('node-root-macro');
      if (!rootNode) return;
      const rootRect = rootNode.getBoundingClientRect();
      const rootX = rootRect.right - container.left;
      const rootY = rootRect.top + rootRect.height / 2 - container.top;

      plan.mediumBlocks.forEach((block: any, index: number) => {
        // Line from Root to Medium Block
        const catNode = document.getElementById(`node-medium-${index}`);
        if (catNode) {
          const catRect = catNode.getBoundingClientRect();
          const catX = catRect.left - container.left;
          const catY = catRect.top + catRect.height / 2 - container.top;
          
          const cp1x = rootX + (catX - rootX) / 2;
          const cp1y = rootY;
          const cp2x = rootX + (catX - rootX) / 2;
          const cp2y = catY;
          
          newLines.push({
            id: `line-root-${index}`,
            path: `M ${rootX} ${rootY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${catX} ${catY}`
          });
        }

        // Line from Medium Block to Daily Card
        const cardNode = document.getElementById(`node-daily-${index}`);
        if (catNode && cardNode) {
          const catRect = catNode.getBoundingClientRect();
          const cardRect = cardNode.getBoundingClientRect();
          
          const startX = catRect.right - container.left;
          const startY = catRect.top + catRect.height / 2 - container.top;
          const endX = cardRect.left - container.left;
          const endY = cardRect.top + cardRect.height / 2 - container.top;

          const cp1x = startX + (endX - startX) / 2;
          const cp1y = startY;
          const cp2x = startX + (endX - startX) / 2;
          const cp2y = endY;

          newLines.push({
            id: `line-cat-${index}`,
            path: `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`
          });
        }
      });

      setLines(newLines);
    };

    drawLines();
    window.addEventListener('resize', drawLines);
    const timeoutId = setTimeout(drawLines, 100);
    
    return () => {
      window.removeEventListener('resize', drawLines);
      clearTimeout(timeoutId);
    };
  }, [plan]);

  return (
    <div className="py-8 overflow-x-auto min-h-[800px] w-full">
      <div className="min-w-[1200px] relative" ref={containerRef}>
        
        {/* SVG Lines */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" style={{ minHeight: '1000px' }}>
          {lines.map(line => (
            <path
              key={line.id}
              d={line.path}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          ))}
        </svg>

        <div className="flex items-center gap-16 relative z-10 py-12 px-8">
          
          {/* Level 1: Root (Macro) */}
          <div className="shrink-0 w-72">
            <div 
              id="node-root-macro"
              className="bg-brand-primary text-white p-6 rounded-2xl shadow-elevation-card flex flex-col gap-4 relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_100%_0%,_#ffffff_0%,_transparent_50%)]"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 opacity-80">
                  <Database size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Macro Area</span>
                </div>
                <h2 className="text-xl font-bold leading-tight">{examName}</h2>
                <div className="mt-4 space-y-2">
                  {plan.macroInventory.slice(0, 3).map((item: any, idx: number) => (
                    <div key={idx} className="bg-white/10 rounded-lg p-2 text-xs backdrop-blur-sm border border-white/10">
                      <span className="font-semibold block truncate">{item.name}</span>
                      <span className="opacity-75 truncate block">{item.type}</span>
                    </div>
                  ))}
                  {plan.macroInventory.length > 3 && (
                    <div className="text-xs text-center opacity-75 italic">
                      + altri {plan.macroInventory.length - 3} elementi
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Levels 2 & 3 */}
          <div className="flex flex-col gap-10 flex-1">
            {plan.mediumBlocks.map((block: any, index: number) => {
              
              return (
                <div key={index} className="flex items-center gap-16">
                  
                  {/* Level 2: Category (Medio Termine) */}
                  <div className="shrink-0 w-64">
                    <div 
                      id={`node-medium-${index}`}
                      className="bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-xl font-medium shadow-sm flex items-center gap-3 text-sm relative"
                    >
                      <div className="p-2 bg-brand-secondary text-brand-primary rounded-lg">
                        <Calendar size={16} />
                      </div>
                      <span className="leading-tight">{block.blockName}</span>
                    </div>
                  </div>

                  {/* Level 3: Data Card (Daily) */}
                  <div className="flex-1" id={`node-daily-${index}`}>
                    {block.dailyBlocks && block.dailyBlocks.length > 0 ? (
                      <div className="flex flex-col gap-6">
                        {block.dailyBlocks.map((dailyBlock: any, dIdx: number) => (
                          <motion.div 
                            key={dIdx}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 + dIdx * 0.05 }}
                            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-elevation-card transition-shadow"
                          >
                            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                              <Target size={18} className="text-brand-primary" />
                              {dailyBlock.dateLabel}
                            </h3>
                            
                            <div className="grid grid-cols-12 gap-x-6 gap-y-6 text-sm">
                              
                              {/* Materiale Assegnato (dal blocco medio) */}
                              <div className="col-span-12 md:col-span-4">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                  <Book size={12} /> Materiale Assegnato
                                </span>
                                <div className="space-y-2">
                                  {block.assignedMaterial.map((mat: any, idx: number) => (
                                    <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                                      <span className="font-medium text-slate-700 block mb-1">{mat.material}</span>
                                      <span className="inline-block px-2 py-0.5 bg-brand-secondary/50 text-brand-primary rounded text-[10px] font-semibold">
                                        {mat.type}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Task Operativi */}
                              <div className="col-span-12 md:col-span-4">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                  <CheckCircle2 size={12} /> Task Operativi
                                </span>
                                <div className="space-y-2">
                                  {dailyBlock.tasks?.map((task: any, idx: number) => (
                                    <div key={idx} className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/50 text-xs">
                                      <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold text-indigo-900">{task.phase}</span>
                                        <span className="text-[10px] text-indigo-600 flex items-center gap-1"><Clock size={10}/> {task.deadline}</span>
                                      </div>
                                      <p className="text-indigo-800/80">{task.material}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Deliverables (Solo per il Giorno 1) */}
                              <div className="col-span-12 md:col-span-4">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                  <Zap size={12} /> Deliverables Generati
                                </span>
                                {index === 0 && dIdx === 0 ? (
                                  <div className="space-y-2">
                                    {/* Videos */}
                                    {plan.dailyDeliverables?.videos?.map((v: any, i: number) => (
                                      <button key={`v-${i}`} onClick={() => onDeliverableClick('video', v, v.title)} className="w-full text-left bg-red-50 hover:bg-red-100 p-2.5 rounded-lg border border-red-100 transition-colors flex items-center gap-2 text-xs">
                                        <Video size={14} className="text-red-500 shrink-0" />
                                        <span className="font-medium text-red-900 truncate">{v.title}</span>
                                      </button>
                                    ))}
                                    {/* Flashcards */}
                                    {plan.dailyDeliverables?.flashcards?.length > 0 && (
                                      <button onClick={() => onDeliverableClick('flashcard', plan.dailyDeliverables.flashcards, 'Set Flashcards')} className="w-full text-left bg-pink-50 hover:bg-pink-100 p-2.5 rounded-lg border border-pink-100 transition-colors flex items-center gap-2 text-xs">
                                        <BrainCircuit size={14} className="text-pink-500 shrink-0" />
                                        <span className="font-medium text-pink-900 truncate">{plan.dailyDeliverables.flashcards.length} Flashcards Generate</span>
                                      </button>
                                    )}
                                    {/* Quizzes */}
                                    {plan.dailyDeliverables?.quizzes?.length > 0 && (
                                      <button onClick={() => onDeliverableClick('quiz', plan.dailyDeliverables.quizzes, 'Test di Verifica')} className="w-full text-left bg-orange-50 hover:bg-orange-100 p-2.5 rounded-lg border border-orange-100 transition-colors flex items-center gap-2 text-xs">
                                        <Target size={14} className="text-orange-500 shrink-0" />
                                        <span className="font-medium text-orange-900 truncate">{plan.dailyDeliverables.quizzes.length} Domande Quiz</span>
                                      </button>
                                    )}
                                    {/* Audios */}
                                    {plan.dailyDeliverables?.audios?.map((a: any, i: number) => (
                                      <button key={`a-${i}`} onClick={() => onDeliverableClick('audio', a, a.title)} className="w-full text-left bg-indigo-50 hover:bg-indigo-100 p-2.5 rounded-lg border border-indigo-100 transition-colors flex items-center gap-2 text-xs">
                                        <Mic size={14} className="text-indigo-500 shrink-0" />
                                        <span className="font-medium text-indigo-900 truncate">{a.title}</span>
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-lg p-4 text-slate-400 text-xs italic text-center">
                                    I deliverables verranno generati il giorno stesso.
                                  </div>
                                )}
                              </div>

                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-elevation-card transition-shadow"
                      >
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                          <Target size={18} className="text-brand-primary" />
                          Pianificazione Futura
                        </h3>
                        
                        <div className="grid grid-cols-12 gap-x-6 gap-y-6 text-sm">
                          {/* Materiale Assegnato */}
                          <div className="col-span-12 md:col-span-4">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                              <Book size={12} /> Materiale Assegnato
                            </span>
                            <div className="space-y-2">
                              {block.assignedMaterial.map((mat: any, idx: number) => (
                                <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                                  <span className="font-medium text-slate-700 block mb-1">{mat.material}</span>
                                  <span className="inline-block px-2 py-0.5 bg-brand-secondary/50 text-brand-primary rounded text-[10px] font-semibold">
                                    {mat.type}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Task Operativi */}
                          <div className="col-span-12 md:col-span-4">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                              <CheckCircle2 size={12} /> Task Operativi
                            </span>
                            <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-lg p-4 text-slate-400 text-xs italic text-center">
                              I task verranno generati quando raggiungerai questo blocco.
                            </div>
                          </div>

                          {/* Deliverables */}
                          <div className="col-span-12 md:col-span-4">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                              <Zap size={12} /> Deliverables Generati
                            </span>
                            <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-lg p-4 text-slate-400 text-xs italic text-center">
                              Materiale sbloccato all'inizio del blocco.
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
