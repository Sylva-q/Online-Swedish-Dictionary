
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Globe, Search as SearchIcon, MessageSquare, Info, Layers, History as HistoryIcon, AlertTriangle, ChevronRight, Zap } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import SearchBar from './components/SearchBar';
import WordCard from './components/WordCard';
import HistoryStats from './components/HistoryStats';
import AiHelperView from './components/AiHelperView';
import FlashcardView from './components/FlashcardView';
import { lookupSwedishWord } from './services/geminiService';
import { storageService } from './services/storageService';
import { SUPPORTED_LANGUAGES, DEFAULT_TARGET_LANGUAGE } from './constants';
import { WordDetails, LoadingState, SearchHistoryItem } from './types';

type ViewMode = 'dictionary' | 'ai-helper' | 'flashcards';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('dictionary');
  const [targetLanguage, setTargetLanguage] = useState(DEFAULT_TARGET_LANGUAGE);
  const [searchResults, setSearchResults] = useState<WordDetails[]>([]);
  const [selectedSenseIndex, setSelectedSenseIndex] = useState(0);
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [savedWords, setSavedWords] = useState<WordDetails[]>([]);

  const sessionCache = useRef<Map<string, WordDetails[]>>(new Map());
  const isInitialMount = useRef(true);

  // Persistence management
  useEffect(() => {
    if (isInitialMount.current) {
      const savedHistory = storageService.getHistory();
      setHistory(savedHistory);
      setSavedWords(storageService.getWords());
      
      savedHistory.forEach(item => {
        const cacheKey = `${item.word.toLowerCase()}:${item.targetLanguage}`;
        if (!sessionCache.current.has(cacheKey)) {
          const relatedSenses = savedHistory.filter(h => 
            h.word.toLowerCase() === item.word.toLowerCase() && h.targetLanguage === item.targetLanguage
          );
          sessionCache.current.set(cacheKey, relatedSenses);
        }
      });
      isInitialMount.current = false;
    }
  }, []);

  useEffect(() => { storageService.saveHistory(history); }, [history]);
  useEffect(() => { storageService.saveWords(savedWords); }, [savedWords]);

  const handleSearch = useCallback(async (word: string, langOverride?: string) => {
    const query = word.trim().toLowerCase();
    if (!query) return;

    const activeLang = langOverride || targetLanguage;
    const cacheKey = `${query}:${activeLang}`;

    if (sessionCache.current.has(cacheKey)) {
      setSearchResults(sessionCache.current.get(cacheKey)!);
      setSelectedSenseIndex(0);
      setStatus(LoadingState.SUCCESS);
      setErrorMsg(null);
      return;
    }

    setStatus(LoadingState.LOADING);
    setErrorMsg(null);
    setSelectedSenseIndex(0);

    try {
      const results = await lookupSwedishWord(word, activeLang);
      const resultsWithMeta = results.map(r => ({ ...r, targetLanguage: activeLang }));
      sessionCache.current.set(cacheKey, resultsWithMeta);
      setSearchResults(resultsWithMeta);
      setStatus(LoadingState.SUCCESS);
      
      if (resultsWithMeta.length > 0) {
        setHistory(prev => {
          const newHistoryItems = resultsWithMeta.map(res => ({ ...res, timestamp: Date.now() }));
          const filtered = prev.filter(item => !(item.word.toLowerCase() === query && item.targetLanguage === activeLang));
          return [...newHistoryItems, ...filtered].slice(0, 100);
        });
      }
    } catch (error: any) {
      console.error("Search error:", error);
      console.error("Error message:", error.message);
      setStatus(LoadingState.ERROR);
      setErrorMsg(error.message || "Failed to connect. Please try again.");
    }
  }, [targetLanguage]);

  // Reactive re-translate on language change
  useEffect(() => {
    if (searchResults.length > 0 && searchResults[0].targetLanguage !== targetLanguage) {
      handleSearch(searchResults[0].word);
    }
  }, [targetLanguage, handleSearch, searchResults]);

  const toggleSaveWord = (word: WordDetails) => {
    setSavedWords(prev => {
      const exists = prev.some(w => w.word.toLowerCase() === word.word.toLowerCase() && w.partOfSpeech.toLowerCase() === word.partOfSpeech.toLowerCase());
      if (exists) return prev.filter(w => !(w.word.toLowerCase() === word.word.toLowerCase() && w.partOfSpeech.toLowerCase() === word.partOfSpeech.toLowerCase()));
      return [word, ...prev];
    });
  };

  const getTargetLangLabel = () => SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)?.label || targetLanguage;
  const currentWordEntry = searchResults[selectedSenseIndex];

  return (
    <div className="min-h-screen bg-rivstart-cream text-rivstart-text font-sans pb-24 md:pb-10 selection:bg-rivstart-lightGreen selection:text-rivstart-green">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-rivstart-mist shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => { setView('dictionary'); setSearchResults([]); setStatus(LoadingState.IDLE); }}>
            <div className="w-9 h-9 bg-rivstart-green rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
              <span>Sv</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter leading-none">SvenskaLär</h1>
              <p className="text-[10px] text-rivstart-green font-bold uppercase tracking-widest mt-0.5">Din Ordbok</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-rivstart-mist/50 p-1 rounded-2xl border border-rivstart-mist">
            {['dictionary', 'ai-helper', 'flashcards'].map((id) => (
              <button
                key={id}
                onClick={() => setView(id as ViewMode)}
                className={`flex items-center gap-2 py-2 px-4 rounded-xl text-sm font-bold transition-all ${
                  view === id ? 'bg-white text-rivstart-green shadow-sm' : 'text-slate-500 hover:text-rivstart-text hover:bg-white/50'
                }`}
              >
                {id === 'dictionary' && <SearchIcon size={16} />}
                {id === 'ai-helper' && <MessageSquare size={16} />}
                {id === 'flashcards' && <Layers size={16} />}
                <span className="capitalize">{id.replace('-', ' ')}</span>
              </button>
            ))}
          </nav>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-rivstart-mist rounded-full hover:border-rivstart-green/30 transition-colors">
            <Globe size={14} className="text-rivstart-green" />
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer max-w-[100px] sm:max-w-none"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {view === 'dictionary' && (
          <div className="space-y-12 animate-fade-in-up">
            <div className={`transition-all duration-500 ${searchResults.length > 0 ? 'pt-2 pb-6' : 'py-20 text-center'}`}>
              {searchResults.length === 0 && status !== LoadingState.LOADING && (
                <h2 className="text-5xl sm:text-7xl font-black tracking-tight font-serif mb-10 leading-tight">
                  En bättre <br/><span className="text-rivstart-green">svensk ordbok</span>
                </h2>
              )}
              <SearchBar onSearch={handleSearch} isLoading={status === LoadingState.LOADING} autoFocus />
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-10 max-w-5xl mx-auto">
                {searchResults.length > 1 && (
                  <div className="bg-white/50 p-6 rounded-[2rem] border border-rivstart-mist">
                    <div className="flex items-center gap-2 mb-4 px-2">
                       <Info size={16} className="text-rivstart-green" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Multiple senses found:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {searchResults.map((sense, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedSenseIndex(idx)}
                          className={`px-6 py-4 rounded-2xl text-sm font-bold transition-all border-2 text-left ${
                            selectedSenseIndex === idx ? 'bg-rivstart-green text-white border-rivstart-green shadow-lg scale-[1.02]' : 'bg-white text-slate-600 border-rivstart-mist hover:border-rivstart-green/30'
                          }`}
                        >
                          <span className="uppercase text-[10px] tracking-widest block opacity-70 mb-1">{sense.partOfSpeech}</span>
                          <span className="truncate block font-serif">{sense.definitions.english}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {currentWordEntry && (
                  <WordCard 
                    key={`${currentWordEntry.word}-${targetLanguage}`}
                    data={currentWordEntry} 
                    targetLanguageLabel={getTargetLangLabel()}
                    isSaved={savedWords.some(w => w.word === currentWordEntry.word && w.partOfSpeech === currentWordEntry.partOfSpeech)}
                    onToggleSave={toggleSaveWord}
                  />
                )}
              </div>
            )}

            {status === LoadingState.IDLE && history.length > 0 && (
              <div className="max-w-5xl mx-auto pt-12 border-t border-rivstart-mist">
                 <div className="flex items-center justify-between mb-8">
                   <h3 className="text-2xl font-bold flex items-center gap-3"><HistoryIcon className="text-rivstart-green" /> Recent Activity</h3>
                   <div className="flex items-center gap-2 bg-rivstart-lightGreen/20 px-3 py-1 rounded-full border border-rivstart-lightGreen/30">
                      <Zap size={14} className="text-rivstart-green" />
                      <span className="text-[10px] font-black text-rivstart-green uppercase tracking-widest">Cache Optimized</span>
                   </div>
                 </div>
                 <HistoryStats history={history} />
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-12">
                   {Array.from(new Set(history.map(item => item.word.toLowerCase()))).slice(0, 10).map((word, idx) => (
                     <button
                       key={idx}
                       onClick={() => handleSearch(word)}
                       className="bg-white p-5 rounded-3xl shadow-sm border border-rivstart-mist hover:border-rivstart-green hover:shadow-xl transition-all text-left group flex flex-col justify-between h-32"
                     >
                       <span className="font-black text-lg group-hover:text-rivstart-green truncate capitalize">{word}</span>
                       <div className="flex items-center justify-between">
                         <span className="text-[8px] font-black text-rivstart-green/50 uppercase tracking-widest">
                           {history.find(h => h.word.toLowerCase() === word)?.targetLanguage?.slice(0, 3)}
                         </span>
                         <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                       </div>
                     </button>
                   ))}
                 </div>
              </div>
            )}
            {errorMsg && <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 max-w-2xl mx-auto flex items-center justify-center gap-3"><AlertTriangle size={20} /><p>{errorMsg}</p></div>}
          </div>
        )}

        {view === 'ai-helper' && <AiHelperView targetLanguageLabel={getTargetLangLabel()} />}
        {view === 'flashcards' && <FlashcardView savedWords={savedWords} onDelete={(word) => setSavedWords(prev => prev.filter(w => w.word !== word))} />}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-rivstart-mist z-50 pb-safe">
        <div className="flex justify-around items-center px-2 py-3">
          {['dictionary', 'ai-helper', 'flashcards'].map((id) => (
            <button
              key={id}
              onClick={() => setView(id as ViewMode)}
              className={`flex flex-col items-center justify-center p-2 min-w-[64px] rounded-2xl transition-all ${
                view === id ? 'text-rivstart-green bg-rivstart-green/5 font-black' : 'text-slate-400 font-bold'
              }`}
            >
              {id === 'dictionary' && <SearchIcon className="w-6 h-6 mb-1" />}
              {id === 'ai-helper' && <MessageSquare className="w-6 h-6 mb-1" />}
              {id === 'flashcards' && <Layers className="w-6 h-6 mb-1" />}
              <span className="text-[10px] capitalize">{id.split('-')[0]}</span>
            </button>
          ))}
        </div>
      </nav>
      <Analytics />
    </div>
  );
};

export default App;
