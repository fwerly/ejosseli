import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StoryInput } from './components/StoryInput';
import { AnalysisResults } from './components/AnalysisResults';
import { analyzeStories } from './services/geminiService';
import { AnalysisResponse, StoryAnalysis } from './types';

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [results, setResults] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeStories(inputText);
      setResults(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze stories. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStory = (updatedStory: StoryAnalysis) => {
    if (!results) return;

    const updatedStories = results.stories.map(s => 
      s.id === updatedStory.id ? updatedStory : s
    );

    // Recalculate summary
    const summary = {
      totalStories: updatedStories.length,
      totalALI: updatedStories.filter(s => s.functionType === 'ALI').length,
      totalAIE: updatedStories.filter(s => s.functionType === 'AIE').length,
      totalEE: updatedStories.filter(s => s.functionType === 'EE').length,
      totalCE: updatedStories.filter(s => s.functionType === 'CE').length,
      totalSE: updatedStories.filter(s => s.functionType === 'SE').length,
    };

    setResults({
      stories: updatedStories,
      summary
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-black via-slate-950 to-blue-950">
      
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      
      {/* Header */}
      <header className="relative pt-12 pb-8 text-center">
        <div className="inline-block relative">
            <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 tracking-tighter mb-2">
              e-JOSSELI <span className="text-white">CYBER</span> ESTIMATOR
            </h1>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent absolute bottom-0"></div>
        </div>
        <p className="text-slate-400 mt-4 font-mono text-sm tracking-widest uppercase">
          Neural Network Function Point Analysis
        </p>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 md:px-8">
        <StoryInput 
          value={inputText}
          onChange={setInputText}
          onAnalyze={handleAnalyze}
          isLoading={loading}
        />

        {error && (
          <div className="max-w-4xl mx-auto mb-8 p-4 bg-red-900/20 border border-red-500/50 rounded text-red-200 text-center font-mono text-sm">
            <span className="font-bold">SYSTEM ERROR:</span> {error}
          </div>
        )}

        <AnalysisResults data={results} onUpdateStory={handleUpdateStory} />
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-slate-600 text-xs font-mono">
        SYSTEM VERSION 3.3 // POWERED BY GEMINI 3 PRO // SECURE CONNECTION ESTABLISHED
      </footer>
    </div>
  );
};

export default App;