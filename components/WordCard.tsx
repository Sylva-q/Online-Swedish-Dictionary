
import React from 'react';
import { Volume2, BookOpen, Tag, Share2, PlayCircle, Layers, Info, Heart, CheckCircle } from 'lucide-react';
import { WordDetails } from '../types';

interface WordCardProps {
  data: WordDetails;
  targetLanguageLabel: string;
  isSaved?: boolean;
  onToggleSave?: (word: WordDetails) => void;
}

const WordCard: React.FC<WordCardProps> = ({ data, targetLanguageLabel, isSaved = false, onToggleSave }) => {
  const pos = data.partOfSpeech.toLowerCase();
  
  // Advanced sanitization: strip hallucinations, meta-notes, and key-prefix leakage
  const sanitize = (val: string | undefined) => {
    if (!val) return '—';
    
    // 1. Detect if the value contains a key-prefix like "indefiniteSingular: word"
    let clean = val;
    if (clean.includes(':')) {
      const parts = clean.split(':');
      if (parts[0].trim().length > 3 && /^[a-z]+[A-Z]/.test(parts[0].trim())) {
        clean = parts[1];
      } else {
        clean = parts[parts.length - 1];
      }
    }

    // 2. Remove parentheticals and common AI meta-talk
    clean = clean.replace(/\(Note:.*?\)/gi, '')
                 .replace(/\(see.*?\)/gi, '')
                 .replace(/\(.*?form.*?\)/gi, '')
                 .replace(/\bLightspeed\b/gi, '')
                 .replace(/\[.*?\]/g, '')
                 .replace(/;/g, '');

    return clean.trim() || '—';
  };

  // For nouns, always prefer the indefinite singular as the "Display Title" 
  // to avoid "en regler" (plural) when it should be "en regel" (singular)
  const baseForm = (pos.includes('noun') && data.inflections?.noun?.indefiniteSingular)
    ? data.inflections.noun.indefiniteSingular
    : data.word;

  const displayTitle = (pos.includes('noun') && data.gender !== 'n/a')
    ? `${data.gender} ${sanitize(baseForm)}`
    : sanitize(baseForm);
  
  const isDualRole = pos.includes('adjective') && pos.includes('adverb');

  const speakText = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'sv-SE';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const renderVerbTable = () => {
    if (!data.inflections?.verb || !pos.includes('verb')) return null;
    const forms = data.inflections.verb;
    return (
      <div className="overflow-x-auto rounded-xl border border-rivstart-lightGreen shadow-sm -mx-2 sm:mx-0">
        <table className="w-full text-sm text-left min-w-[500px]">
          <thead className="bg-rivstart-green/5 text-rivstart-green font-medium uppercase tracking-wider">
            <tr>
              <th className="p-3">Imperativ</th>
              <th className="p-3">Infinitiv</th>
              <th className="p-3">Presens</th>
              <th className="p-3">Preteritum</th>
              <th className="p-3">Supinum</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-rivstart-lightGreen">
            <tr className="text-slate-700 font-medium">
              <td className="p-3 border-b-2 border-red-200 bg-red-50/30">{sanitize(forms.imperative)}</td>
              <td className="p-3">att {sanitize(forms.infinitive)}</td>
              <td className="p-3">{sanitize(forms.present)}</td>
              <td className="p-3">{sanitize(forms.past)}</td>
              <td className="p-3">{sanitize(forms.supine)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderNounTable = () => {
    if (!data.inflections?.noun || !pos.includes('noun')) return null;
    const forms = data.inflections.noun;
    return (
      <div className="overflow-hidden rounded-xl border border-rivstart-lightGreen shadow-sm">
        <table className="w-full text-sm text-center table-fixed">
          <thead className="bg-rivstart-green/5 text-rivstart-green font-semibold">
            <tr>
              <th className="p-2 sm:p-3 w-1/4"></th>
              <th className="p-2 sm:p-3 w-[37.5%] text-xs sm:text-sm">Obestämd</th>
              <th className="p-2 sm:p-3 w-[37.5%] text-xs sm:text-sm">Bestämd</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rivstart-lightGreen bg-white">
            <tr>
              <td className="p-2 sm:p-3 font-bold text-rivstart-green text-[10px] sm:text-xs uppercase tracking-wider text-left pl-3 sm:pl-4">Singular</td>
              <td className="p-2 sm:p-3 text-slate-700 font-medium break-words">{sanitize(forms.indefiniteSingular)}</td>
              <td className="p-2 sm:p-3 text-slate-700 font-medium bg-rivstart-lightGreen/10 break-words">{sanitize(forms.definiteSingular)}</td>
            </tr>
            <tr>
              <td className="p-2 sm:p-3 font-bold text-rivstart-green text-[10px] sm:text-xs uppercase tracking-wider text-left pl-3 sm:pl-4">Plural</td>
              <td className="p-2 sm:p-3 text-slate-700 font-medium break-words">{sanitize(forms.indefinitePlural)}</td>
              <td className="p-2 sm:p-3 text-slate-700 font-medium bg-rivstart-lightGreen/10 break-words">{sanitize(forms.definitePlural)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderAdjectiveTables = () => {
    if (!data.inflections?.adjective || !pos.includes('adjective')) return null;
    const forms = data.inflections.adjective;
    return (
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="overflow-hidden rounded-xl border border-rivstart-lightGreen shadow-sm">
           <div className="bg-rivstart-green/5 px-4 py-2 text-xs font-bold text-rivstart-green uppercase tracking-wider">Declension</div>
           <table className="w-full text-sm text-left">
             <tbody className="divide-y divide-rivstart-lightGreen bg-white">
               <tr><td className="p-3 text-slate-400 text-xs font-semibold uppercase">En-form</td><td className="p-3 text-slate-700 font-medium">{sanitize(forms.indefiniteEn)}</td></tr>
               <tr><td className="p-3 text-slate-400 text-xs font-semibold uppercase">Ett-form</td><td className="p-3 text-slate-700 font-medium">{sanitize(forms.indefiniteEtt)}</td></tr>
               <tr><td className="p-3 text-slate-400 text-xs font-semibold uppercase">Plural</td><td className="p-3 text-slate-700 font-medium">{sanitize(forms.indefinitePlural)}</td></tr>
               <tr><td className="p-3 text-slate-400 text-xs font-semibold uppercase">Bestämd</td><td className="p-3 text-slate-700 font-medium">{sanitize(forms.definite)}</td></tr>
             </tbody>
           </table>
        </div>
        <div className="overflow-hidden rounded-xl border border-rivstart-lightGreen shadow-sm">
          <div className="bg-rivstart-green/5 px-4 py-2 text-xs font-bold text-rivstart-green uppercase tracking-wider">Comparison</div>
           <table className="w-full text-sm text-left">
             <tbody className="divide-y divide-rivstart-lightGreen bg-white">
               <tr><td className="p-3 text-slate-400 text-xs font-semibold uppercase">Positiv</td><td className="p-3 text-slate-700 font-medium">{sanitize(forms.positive)}</td></tr>
               <tr><td className="p-3 text-slate-400 text-xs font-semibold uppercase">Komparativ</td><td className="p-3 text-slate-700 font-medium">{sanitize(forms.comparative)}</td></tr>
               <tr><td className="p-3 text-slate-400 text-xs font-semibold uppercase">Superlativ</td><td className="p-3 text-slate-700 font-medium">{sanitize(forms.superlative)}</td></tr>
             </tbody>
           </table>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-xl shadow-rivstart-mist border border-rivstart-mist overflow-hidden animate-fade-in-up">
      <div className="bg-gradient-to-r from-rivstart-green to-rivstart-darkGreen p-5 sm:p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3 flex-wrap">
                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight drop-shadow-sm font-serif truncate break-words sm:whitespace-normal">{displayTitle}</h2>
                <div className="flex gap-2">
                  {data.gender !== 'n/a' && (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wide shadow-sm w-fit ${
                      data.gender === 'en' ? 'bg-rivstart-pink text-red-900' : 'bg-rivstart-lightGreen text-green-900'
                    }`}>
                      {data.gender}
                    </span>
                  )}
                  {isDualRole && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wide shadow-sm w-fit bg-amber-200 text-amber-900 border border-amber-300">
                      Dual Role (Adj/Adv)
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 text-teal-50">
                <span className="text-lg sm:text-xl font-mono opacity-90 bg-white/10 px-2 rounded">/{sanitize(data.ipa)}/</span>
                <span className="flex items-center gap-1 text-xs sm:text-sm uppercase tracking-wider border border-white/20 px-2 py-0.5 rounded-md bg-black/20 whitespace-nowrap">
                  <Tag size={12} className="sm:w-3.5 sm:h-3.5" /> {sanitize(data.partOfSpeech)}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
              <button onClick={(e) => speakText(data.word, e)} className="p-2 sm:p-3 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-md transition-all duration-300 group shadow-lg">
                <Volume2 className="w-5 h-5 sm:w-7 sm:h-7 text-white group-hover:scale-110 transition-transform" />
              </button>
              {onToggleSave && (
                <button onClick={() => onToggleSave(data)} className={`p-2 sm:p-3 rounded-full backdrop-blur-md transition-all duration-300 group shadow-lg ${isSaved ? 'bg-rivstart-pink text-red-800 hover:bg-red-200' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                  {isSaved ? <CheckCircle className="w-5 h-5 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform" /> : <Heart className="w-5 h-5 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-8 grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-rivstart-green mb-2">
            <BookOpen className="w-5 h-5" />
            <h3 className="font-semibold text-lg uppercase tracking-wide">Definitions</h3>
          </div>
          <div className="bg-rivstart-mist/30 p-5 sm:p-6 rounded-2xl border border-rivstart-mist hover:border-rivstart-lightGreen transition-colors">
            <div className="mb-5">
              <span className="text-xs font-bold text-rivstart-green uppercase block mb-1 tracking-wider">English</span>
              <p className="text-lg sm:text-xl text-slate-800 font-medium leading-relaxed">{sanitize(data.definitions.english)}</p>
            </div>
            <div className="pt-5 border-t border-rivstart-mist">
              <span className="text-xs font-bold text-rivstart-green uppercase block mb-1 tracking-wider">{targetLanguageLabel}</span>
              <p className="text-lg sm:text-xl text-slate-800 font-medium leading-relaxed">{sanitize(data.definitions.secondary)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="flex items-center gap-2 text-rivstart-green mb-2">
            <Share2 className="w-5 h-5" />
            <h3 className="font-semibold text-lg uppercase tracking-wide">Context Usage</h3>
          </div>
          <div className="space-y-4">
            {data.examples.map((ex, idx) => (
              <div key={idx} className="group relative pl-4 sm:pl-5 border-l-[3px] border-rivstart-mist hover:border-rivstart-lightGreen transition-colors duration-300 py-1">
                <div className="flex items-start justify-between gap-2">
                   <p className="text-base sm:text-lg font-medium text-slate-800 italic mb-1">"{sanitize(ex.swedish)}"</p>
                   <button onClick={(e) => speakText(ex.swedish, e)} className="text-slate-400 hover:text-rivstart-green transition-colors p-1.5 rounded-full hover:bg-rivstart-lightGreen/30 shrink-0">
                     <PlayCircle className="w-5 h-5" />
                   </button>
                </div>
                <p className="text-slate-600 text-sm">{sanitize(ex.english)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(data.inflections || data.grammarNotes) && (
        <div className="bg-rivstart-mist/30 border-t border-rivstart-mist p-5 sm:p-8">
          <div className="flex items-center gap-2 text-rivstart-green mb-6">
            <Layers className="w-5 h-5" />
            <h3 className="font-semibold text-lg uppercase tracking-wide">Grammar & Inflections</h3>
          </div>
          {data.grammarNotes && (
            <div className="bg-rivstart-blue/20 border border-rivstart-blue/40 rounded-xl p-5 mb-8 flex items-start gap-3 shadow-sm">
              <Info className="w-5 h-5 text-slate-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-slate-800 font-bold text-sm mb-1 uppercase tracking-wide">Grammar Note</h4>
                <p className="text-slate-700 text-sm leading-relaxed">{sanitize(data.grammarNotes)}</p>
              </div>
            </div>
          )}
          <div className="w-full">
            {renderNounTable()}
            {renderVerbTable()}
            {renderAdjectiveTables()}
          </div>
        </div>
      )}
    </div>
  );
};

export default WordCard;
