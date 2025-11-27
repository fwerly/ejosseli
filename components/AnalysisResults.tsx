import React, { useState, useRef } from 'react';
import { AnalysisResponse, FunctionType, ProjectType, StoryAnalysis } from '../types';
import { reanalyzeStoryWithContext } from '../services/geminiService';

interface AnalysisResultsProps {
  data: AnalysisResponse | null;
  onUpdateStory: (story: StoryAnalysis) => void;
}

const FunctionTypeBadge: React.FC<{ type: FunctionType }> = ({ type }) => {
  const colors: Record<string, string> = {
    [FunctionType.ALI]: 'bg-purple-900/50 text-purple-200 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]',
    [FunctionType.AIE]: 'bg-indigo-900/50 text-indigo-200 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]',
    [FunctionType.EE]: 'bg-green-900/50 text-green-200 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]',
    [FunctionType.CE]: 'bg-blue-900/50 text-blue-200 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]',
    [FunctionType.SE]: 'bg-yellow-900/50 text-yellow-200 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]',
    [FunctionType.UNKNOWN]: 'bg-gray-800 text-gray-400 border-gray-600',
  };

  return (
    <span className={`px-3 py-1 rounded text-xs font-mono font-bold border ${colors[type] || colors.UNKNOWN} backdrop-blur-sm`}>
      {type}
    </span>
  );
};

const ProjectTypeBadge: React.FC<{ type: ProjectType }> = ({ type }) => {
  let color = 'text-slate-300 bg-slate-800/50 border-slate-700';
  
  switch (type) {
    case ProjectType.DEVELOPMENT:
      color = 'text-emerald-300 bg-emerald-900/30 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.2)]';
      break;
    case ProjectType.IMPROVEMENT_INCLUSION:
      color = 'text-cyan-300 bg-cyan-900/30 border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.2)]';
      break;
    case ProjectType.IMPROVEMENT_ALTERATION:
      color = 'text-sky-300 bg-sky-900/30 border-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.2)]';
      break;
    case ProjectType.IMPROVEMENT_ALTERATION_REDOC:
      color = 'text-sky-200 bg-sky-900/40 border-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.2)]';
      break;
    case ProjectType.IMPROVEMENT_EXCLUSION:
      color = 'text-rose-300 bg-rose-900/30 border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.2)]';
      break;
    case ProjectType.CORRECTIVE_MAINTENANCE:
      color = 'text-orange-300 bg-orange-900/30 border-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.2)]';
      break;
    case ProjectType.DATA_MIGRATION:
      color = 'text-violet-300 bg-violet-900/30 border-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.2)]';
      break;
    case ProjectType.DEVOPS:
      color = 'text-pink-300 bg-pink-900/30 border-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.2)]';
      break;
    case ProjectType.ERROR_VERIFICATION:
      color = 'text-red-300 bg-red-900/30 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.2)]';
      break;
    default:
      break;
  }

  return (
    <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-semibold border ${color} backdrop-blur-sm`}>
      {type}
    </span>
  );
};

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ data, onUpdateStory }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  if (!data) return null;

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const triggerFileUpload = (id: string) => {
    if (fileInputRefs.current[id]) {
      fileInputRefs.current[id]?.click();
    }
  };

  const handleContextUpload = async (event: React.ChangeEvent<HTMLInputElement>, story: StoryAnalysis) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      alert('Apenas arquivos .docx são suportados.');
      return;
    }

    setAnalyzingIds(prev => new Set(prev).add(story.id));

    try {
      const arrayBuffer = await file.arrayBuffer();
      if (window.mammoth) {
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        const contextText = result.value;
        
        // Call service to re-analyze
        const updatedStory = await reanalyzeStoryWithContext(story, contextText);
        
        // Update state
        onUpdateStory(updatedStory);
        alert(`História "${story.shortName}" atualizada com sucesso baseado no contexto do documento!`);
      } else {
        alert("Erro: Módulo Mammoth.js não carregado.");
      }
    } catch (error) {
      console.error("Failed to analyze context", error);
      alert("Falha ao analisar o documento de contexto.");
    } finally {
      setAnalyzingIds(prev => {
        const next = new Set(prev);
        next.delete(story.id);
        return next;
      });
      // Clear input
      if (event.target) event.target.value = '';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-20 animate-fade-in">
      
      {/* HUD Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'TOTAL STORIES', value: data.summary.totalStories, color: 'text-white' },
          { label: 'ALI (Entities)', value: data.summary.totalALI, color: 'text-purple-400' },
          { label: 'AIE (Interface)', value: data.summary.totalAIE, color: 'text-indigo-400' },
          { label: 'EE (Inputs)', value: data.summary.totalEE, color: 'text-green-400' },
          { label: 'CE (Queries)', value: data.summary.totalCE, color: 'text-blue-400' },
          { label: 'SE (Outputs)', value: data.summary.totalSE, color: 'text-yellow-400' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg relative overflow-hidden group hover:border-cyan-500/50 transition-colors duration-300">
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50 ${stat.color}`}></div>
            <p className="text-[10px] text-slate-500 font-mono mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold font-mono ${stat.color} neon-text`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)] scanline relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/90 text-cyan-500 text-xs font-mono uppercase tracking-widest border-b border-cyan-900/30">
                <th className="p-4 w-12 text-center">ID</th>
                <th className="p-4 w-1/3">Story Name (Funcionalidade)</th>
                <th className="p-4 w-1/6">Function Type</th>
                <th className="p-4 w-1/6">Project Type</th>
                <th className="p-4">Warnings / Critiques</th>
                <th className="p-4 w-12">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {data.stories.map((story, idx) => {
                const isAnalyzing = analyzingIds.has(story.id);
                return (
                  <React.Fragment key={story.id}>
                    <tr 
                      className={`
                        transition-all duration-300
                        ${story.isDuplicate ? 'bg-red-950/10' : 'hover:bg-cyan-950/20'}
                        ${expandedRow === story.id ? 'bg-cyan-950/30 border-l-2 border-cyan-400' : 'border-l-2 border-transparent'}
                      `}
                    >
                      <td className="p-4 text-slate-600 font-mono text-xs align-top pt-5 text-center">{idx + 1}</td>
                      <td className="p-4 align-top">
                        {/* ENHANCED VISUALIZATION FOR STORY NAME */}
                        <div className="text-xl md:text-2xl font-bold text-cyan-50 neon-text tracking-wide mb-2 leading-tight drop-shadow-md">
                          {story.shortName}
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] text-slate-500 uppercase font-mono mt-0.5 shrink-0 px-1 border border-slate-800 rounded bg-slate-900">RAW</span>
                          <div className="text-xs text-slate-400 font-mono opacity-70 break-words font-light">
                            {story.originalText}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-top pt-5">
                        <FunctionTypeBadge type={story.functionType} />
                      </td>
                      <td className="p-4 align-top pt-5">
                        <ProjectTypeBadge type={story.projectType} />
                      </td>
                      <td className="p-4 align-top pt-5">
                        <div className="flex flex-col gap-2">
                          {story.isDuplicate && (
                            <div className="flex items-center gap-2 text-red-300 text-xs font-bold bg-red-950/50 p-2 rounded border border-red-900/50 shadow-[0_0_10px_rgba(220,38,38,0.2)] animate-pulse">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                              DUPLICIDADE
                            </div>
                          )}
                          {story.warnings && story.warnings.length > 0 ? (
                            story.warnings.map((warn, wIdx) => (
                              <div key={wIdx} className="flex items-start gap-2 text-yellow-200 text-sm bg-yellow-900/20 p-3 rounded border border-yellow-700/30">
                                  <svg className="mt-0.5 shrink-0 text-yellow-500" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                  <span className="leading-snug font-normal">{warn}</span>
                              </div>
                            ))
                          ) : (
                            !story.isDuplicate && <span className="text-slate-600 text-[10px] font-mono flex items-center gap-1 opacity-50 uppercase tracking-wider">
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              OK
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-top pt-5 text-center">
                        <button 
                          onClick={() => toggleRow(story.id)}
                          className={`
                            p-2 rounded-full transition-all duration-300 border
                            ${expandedRow === story.id 
                              ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)]' 
                              : 'bg-slate-800 text-cyan-400 border-slate-700 hover:bg-slate-700 hover:text-cyan-300'}
                          `}
                        >
                          {expandedRow === story.id ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                          )}
                        </button>
                      </td>
                    </tr>
                    
                    {/* EXPANDED DETAIL VIEW */}
                    {expandedRow === story.id && (
                      <tr className="bg-black/40">
                        <td colSpan={6} className="p-0">
                          <div className="p-6 border-y border-cyan-900/50 shadow-inner bg-slate-950 relative overflow-hidden">
                            {/* Animated scanline background for details */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(to_right,#0891b2_1px,transparent_1px),linear-gradient(to_bottom,#0891b2_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                            
                            {/* Upload Context Button */}
                            <div className="flex justify-end mb-6 relative z-20">
                               <input 
                                  type="file" 
                                  ref={(el) => { fileInputRefs.current[story.id] = el; }}
                                  onChange={(e) => handleContextUpload(e, story)} 
                                  className="hidden" 
                                  accept=".docx"
                                />
                                <button 
                                  onClick={() => triggerFileUpload(story.id)}
                                  disabled={isAnalyzing}
                                  className="group flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 px-4 py-2 rounded text-xs font-mono text-cyan-400 transition-all uppercase tracking-wider"
                                >
                                  {isAnalyzing ? (
                                    <>
                                       <svg className="animate-spin h-3 w-3 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                       ANALYZING DOCUMENT...
                                    </>
                                  ) : (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                                      UPLOAD .DOCX CONTEXT (DEEP ANALYSIS)
                                    </>
                                  )}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                              
                              {/* Function Type Reasoning */}
                              <div className="bg-slate-900/80 p-6 rounded-lg border border-purple-900/50 shadow-[0_0_20px_rgba(88,28,135,0.15)] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-20">
                                   <FunctionTypeBadge type={story.functionType} />
                                </div>
                                <h4 className="text-purple-400 font-mono text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-purple-900/50 pb-3">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                  Análise do Tipo de Função
                                </h4>
                                <p className="text-slate-300 text-lg leading-relaxed">
                                  {story.reasoningFunctionType || "Nenhuma explicação detalhada disponível."}
                                </p>
                              </div>

                              {/* Project Type Reasoning */}
                              <div className="bg-slate-900/80 p-6 rounded-lg border border-cyan-900/50 shadow-[0_0_20px_rgba(8,145,178,0.15)] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-20">
                                  <ProjectTypeBadge type={story.projectType} />
                                </div>
                                <h4 className="text-cyan-400 font-mono text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-cyan-900/50 pb-3">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
                                  Análise do Tipo de Projeto
                                </h4>
                                <p className="text-slate-300 text-lg leading-relaxed">
                                  {story.reasoningProjectType || "Nenhuma explicação detalhada disponível."}
                                </p>
                              </div>

                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
           <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             <span className="text-[10px] text-green-500 font-mono">SYSTEM READY</span>
           </div>
           <span className="text-[10px] text-slate-600 font-mono">AI CONFIDENCE METRICS ACTIVE // V3.1.0</span>
        </div>
      </div>
    </div>
  );
};
