import React from 'react';

interface StoryInputProps {
  value: string;
  onChange: (val: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

export const StoryInput: React.FC<StoryInputProps> = ({ value, onChange, onAnalyze, isLoading }) => {
  return (
    <div className="w-full max-w-6xl mx-auto mb-8 animate-fade-in-up">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg p-6">
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-cyan-400 font-mono tracking-wider flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
              INPUT_DATA_STREAM
            </h2>
            <div className="flex gap-2">
               <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">Awaiting Text Input</span>
            </div>
          </div>
          
          <textarea
            className="w-full h-48 bg-slate-900/50 text-cyan-50 border border-slate-700 rounded-md p-4 font-mono text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-y placeholder-slate-600"
            placeholder="Cole as histórias aqui...&#10;Exemplo: [SPRINT 23] - [COJES] - Implementar nova tabela de usuários..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
          />

          <div className="mt-4 flex justify-between items-center">
            <p className="text-[10px] text-slate-500 font-mono">
              * Para anexar documentos de contexto (.docx), realize a análise inicial primeiro.
            </p>
            <button
              onClick={onAnalyze}
              disabled={isLoading || !value.trim()}
              className={`
                relative px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded overflow-hidden transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                group
              `}
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <span className="relative flex items-center gap-2">
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    PROCESSING...
                  </>
                ) : (
                  <>
                    INITIATE_ANALYSIS
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
