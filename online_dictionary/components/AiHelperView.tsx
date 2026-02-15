import React, { useState } from 'react';
import { Bot, PenTool, CheckCircle, Languages, ArrowRight, Loader2, Copy, AlertCircle, Volume2, PlayCircle, PauseCircle } from 'lucide-react';
import { getAiTextHelp } from '../services/geminiService';
import { AiHelperResult, AiHelperMode, LoadingState } from '../types';

interface AiHelperViewProps {
  targetLanguageLabel: string;
}

const AiHelperView: React.FC<AiHelperViewProps> = ({ targetLanguageLabel }) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<AiHelperMode>('translate');
  const [result, setResult] = useState<AiHelperResult | null>(null);
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [playingSentence, setPlayingSentence] = useState<string | null>(null);

  const handleAction = async () => {
    if (!input.trim()) return;
    setStatus(LoadingState.LOADING);
    setResult(null);
    try {
      const data = await getAiTextHelp(input, mode, targetLanguageLabel);
      setResult(data);
      setStatus(LoadingState.SUCCESS);
    } catch (e) {
      console.error(e);
      setStatus(LoadingState.ERROR);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'sv-SE';
      utterance.rate = 0.85; 

      utterance.onstart = () => setPlayingSentence(text);
      utterance.onend = () => setPlayingSentence(null);
      utterance.onerror = () => setPlayingSentence(null);

      window.speechSynthesis.speak(utterance);
    }
  };

  const renderReaderOutput = (output: string) => {
    const sentences = output.split('|||').filter(s => s.trim().length > 0);
    
    return (
      <div className="flex flex-col h-full bg-white rounded-3xl shadow-lg border border-rivstart-mist overflow-hidden">
        <div className="bg-rivstart-green/5 border-b border-rivstart-mist p-4 flex justify-between items-center">
           <span className="text-xs font-bold uppercase tracking-widest text-rivstart-green flex items-center gap-2">
             <Volume2 className="w-4 h-4" />
             Reader Playlist
           </span>
           <span className="text-xs font-medium text-slate-500">{sentences.length} sentences</span>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-grow max-h-[500px]">
          {sentences.map((sentence, idx) => {
            const isPlaying = playingSentence === sentence;
            return (
              <div 
                key={idx}
                onClick={() => speakText(sentence)}
                className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex items-center gap-4 group hover:shadow-md ${
                  isPlaying 
                    ? 'bg-rivstart-lightGreen/20 border-rivstart-green ring-1 ring-rivstart-green' 
                    : 'bg-white border-rivstart-mist hover:border-rivstart-lightGreen'
                }`}
              >
                <button 
                  className={`flex-shrink-0 p-3 rounded-full transition-colors ${
                    isPlaying 
                      ? 'bg-rivstart-green text-white' 
                      : 'bg-slate-100 text-slate-400 group-hover:bg-rivstart-green/10 group-hover:text-rivstart-green'
                  }`}
                >
                  {isPlaying ? (
                    <Volume2 className="w-6 h-6 animate-pulse" />
                  ) : (
                    <PlayCircle className="w-6 h-6" />
                  )}
                </button>
                <p className={`text-lg leading-relaxed font-medium ${isPlaying ? 'text-rivstart-green' : 'text-slate-700'}`}>
                  {sentence}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up pb-12 px-4 sm:px-6">
      
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 font-serif">AI Language Helper</h2>
        <p className="text-base sm:text-lg text-slate-600 mt-3 max-w-2xl mx-auto">
          Translate, check grammar, compose text, or practice listening.
        </p>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-3xl mx-auto bg-white p-2 rounded-2xl shadow-sm border border-rivstart-mist mb-8">
        <button
          onClick={() => setMode('translate')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 px-1 sm:px-2 rounded-xl text-xs sm:text-base font-bold transition-all ${
            mode === 'translate' 
              ? 'bg-rivstart-green text-white shadow-md' 
              : 'text-slate-500 hover:bg-rivstart-mist hover:text-rivstart-green'
          }`}
        >
          <Languages className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Translate</span>
        </button>
        <button
          onClick={() => setMode('correct')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 px-1 sm:px-2 rounded-xl text-xs sm:text-base font-bold transition-all ${
            mode === 'correct' 
              ? 'bg-rivstart-green text-white shadow-md' 
              : 'text-slate-500 hover:bg-rivstart-mist hover:text-rivstart-green'
          }`}
        >
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Check</span>
        </button>
        <button
          onClick={() => setMode('compose')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 px-1 sm:px-2 rounded-xl text-xs sm:text-base font-bold transition-all ${
            mode === 'compose' 
              ? 'bg-rivstart-green text-white shadow-md' 
              : 'text-slate-500 hover:bg-rivstart-mist hover:text-rivstart-green'
          }`}
        >
          <PenTool className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Write</span>
        </button>
        <button
          onClick={() => setMode('read')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 px-1 sm:px-2 rounded-xl text-xs sm:text-base font-bold transition-all ${
            mode === 'read' 
              ? 'bg-rivstart-green text-white shadow-md' 
              : 'text-slate-500 hover:bg-rivstart-mist hover:text-rivstart-green'
          }`}
        >
          <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Reader</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-start">
        
        {/* Input Section */}
        <div className="space-y-4 flex flex-col h-full">
          <div className="bg-white p-1 rounded-3xl border-2 border-rivstart-mist focus-within:border-rivstart-green focus-within:ring-4 focus-within:ring-rivstart-lightGreen/30 transition-all shadow-sm flex-grow">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === 'translate' ? "Enter text to translate..." :
                mode === 'correct' ? "Enter Swedish text to check..." :
                mode === 'compose' ? "Topic: e.g., 'Email to boss about being sick'..." :
                "Enter Swedish text to listen to..."
              }
              className="w-full h-48 sm:h-72 p-5 sm:p-6 rounded-2xl resize-none outline-none text-lg sm:text-xl text-slate-700 placeholder-slate-400 bg-transparent leading-relaxed"
            />
          </div>
          
          <button
            onClick={handleAction}
            disabled={!input.trim() || status === LoadingState.LOADING}
            className="w-full py-4 bg-rivstart-green text-white rounded-2xl font-bold text-lg hover:bg-teal-800 focus:ring-4 focus:ring-rivstart-lightGreen/50 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2 transform active:scale-[0.98]"
          >
            {status === LoadingState.LOADING ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Generate</span>
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </button>
        </div>

        {/* Output Section */}
        <div className="space-y-4 h-full min-h-[300px]">
          
          {status === LoadingState.IDLE && (
            <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 bg-rivstart-mist/30 rounded-3xl border border-dashed border-rivstart-mist/50 p-10 min-h-[360px]">
               <Bot className="w-20 h-20 mb-4 opacity-50" />
               <p className="text-center font-medium text-lg">AI results will appear here</p>
            </div>
          )}

          {status === LoadingState.ERROR && (
             <div className="h-full flex items-center justify-center p-8 bg-red-50 border border-red-100 rounded-3xl text-red-700 min-h-[360px]">
                <div className="flex flex-col items-center gap-3 text-center">
                  <AlertCircle className="w-10 h-10" />
                  <p className="font-medium text-lg">Something went wrong.<br/>Please try again.</p>
                </div>
             </div>
          )}

          {status === LoadingState.SUCCESS && result && (
            <div className="animate-fade-in-up h-full flex flex-col">
              {mode === 'read' ? (
                renderReaderOutput(result.output)
              ) : (
                /* Main Result for other modes */
                <div className="bg-white rounded-3xl shadow-lg border border-rivstart-mist overflow-hidden flex-grow flex flex-col h-full min-h-[360px]">
                  <div className="bg-rivstart-green/5 border-b border-rivstart-mist p-4 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-rivstart-green">Result</span>
                    <button 
                      onClick={() => copyToClipboard(result.output)}
                      className="p-2 text-slate-400 hover:text-rivstart-green hover:bg-rivstart-green/10 rounded-full transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6 sm:p-8 flex-grow overflow-auto">
                     <p className="text-xl sm:text-2xl leading-relaxed text-slate-800 font-medium whitespace-pre-wrap font-serif">{result.output}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full Width Explanation Section */}
      {status === LoadingState.SUCCESS && result && (
        <div className="animate-fade-in-up mt-8">
           <div className="bg-rivstart-cream rounded-3xl p-6 sm:p-10 border border-rivstart-lightGreen/50 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
               <div className="bg-white p-2.5 rounded-full shadow-sm border border-rivstart-mist">
                  <Bot className="w-6 h-6 text-rivstart-green" />
               </div>
               <h4 className="text-2xl font-bold text-slate-800 font-serif">
                 {mode === 'read' ? 'Summary & Context' : 'Explanation & Notes'}
               </h4>
             </div>
             <div className="bg-white/50 rounded-2xl p-6 sm:p-8 border border-rivstart-mist/50">
                <p className="text-slate-700 leading-loose text-lg whitespace-pre-wrap">{result.explanation}</p>
             </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default AiHelperView;