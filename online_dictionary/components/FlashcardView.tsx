import React, { useState } from 'react';
import { Trash2, RefreshCw, ArrowLeft, ArrowRight, RotateCw, Layers } from 'lucide-react';
import { WordDetails } from '../types';

interface FlashcardViewProps {
  savedWords: WordDetails[];
  onDelete: (word: string) => void;
}

const FlashcardView: React.FC<FlashcardViewProps> = ({ savedWords, onDelete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (savedWords.length === 0) {
    return (
      <div className="text-center py-24 max-w-lg mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-10">
          <div className="bg-rivstart-green/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Layers className="w-10 h-10 text-rivstart-green" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">No flashcards yet</h3>
          <p className="text-slate-500 leading-relaxed">
            Search for words in the Dictionary tab and click the <span className="font-bold text-red-400">Heart</span> icon to add them to your deck.
          </p>
        </div>
      </div>
    );
  }

  // Safe index check
  const safeIndex = currentIndex >= savedWords.length ? 0 : currentIndex;
  const currentCard = savedWords[safeIndex];
  
  // Pollinations AI image URL
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(currentCard.word + " " + currentCard.definitions.english)}%20minimalist%20vector%20illustration?width=600&height=400&nologo=true`;

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % savedWords.length);
    }, 200);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + savedWords.length) % savedWords.length);
    }, 200);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(currentCard.word);
    if (savedWords.length > 1) {
      // Adjust index if deleting last item
      if (currentIndex >= savedWords.length - 1) {
         setCurrentIndex(0);
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fade-in-up pb-12">
      
      <div className="flex justify-between items-end px-2">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Flashcards</h2>
          <p className="text-slate-500 font-medium">Card {safeIndex + 1} of {savedWords.length}</p>
        </div>
        <button 
          onClick={handleDelete}
          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-3 rounded-full transition-colors"
          title="Delete this card"
        >
          <Trash2 className="w-6 h-6" />
        </button>
      </div>

      {/* Card Container */}
      <div className="perspective-1000 h-[500px] group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* FRONT SIDE */}
          <div className="absolute w-full h-full backface-hidden bg-white rounded-3xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
             {/* Image Section */}
             <div className="h-full w-full bg-slate-100 relative overflow-hidden">
               <img 
                 src={imageUrl} 
                 alt={currentCard.word}
                 className="w-full h-full object-cover opacity-90"
                 loading="lazy"
               />
               {/* Overlay Gradient to ensure text readability if image fails or is busy */}
               <div className="absolute inset-0 bg-slate-900/40 flex flex-col items-center justify-center p-6 text-center backdrop-blur-[2px]">
                  <div className="mb-4">
                     <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-widest shadow-sm ${
                        currentCard.gender === 'en' ? 'bg-rivstart-yellow text-yellow-900' : 
                        currentCard.gender === 'ett' ? 'bg-rivstart-lightGreen text-green-900' : 'bg-white text-slate-800'
                      }`}>
                        {currentCard.gender === 'n/a' ? currentCard.partOfSpeech : currentCard.gender}
                      </span>
                  </div>
                  <h3 className="text-5xl font-extrabold text-white drop-shadow-md mb-2">{currentCard.word}</h3>
                  <p className="text-white/90 font-mono text-lg italic">/{currentCard.ipa}/</p>
               </div>
               
               <div className="absolute bottom-6 left-0 right-0 text-center">
                 <p className="text-white/60 text-xs font-medium uppercase tracking-widest">Click to flip</p>
               </div>
             </div>
          </div>

          {/* BACK SIDE */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-rivstart-green to-rivstart-darkGreen rounded-3xl shadow-xl flex flex-col p-10 text-white justify-between border border-teal-700">
             <div className="space-y-6 mt-4 text-center">
               <div>
                 <h4 className="text-xs font-bold uppercase text-rivstart-yellow tracking-widest mb-3">English Definition</h4>
                 <p className="text-3xl font-bold leading-tight">{currentCard.definitions.english}</p>
               </div>
               
               <div className="pt-6 border-t border-white/10">
                 <h4 className="text-xs font-bold uppercase text-teal-200 tracking-widest mb-2">Secondary Meaning</h4>
                 <p className="text-xl text-teal-50">{currentCard.definitions.secondary}</p>
               </div>
             </div>

             <div className="bg-black/20 rounded-2xl p-6 backdrop-blur-sm border border-white/5">
               <h5 className="text-xs font-bold text-rivstart-yellow uppercase mb-2 text-center">Example</h5>
               <p className="italic text-lg mb-2 text-center">"{currentCard.examples[0].swedish}"</p>
               <p className="text-sm text-teal-100 text-center">{currentCard.examples[0].english}</p>
             </div>
          </div>

        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-center gap-8 pt-2">
        <button 
          onClick={(e) => { e.stopPropagation(); prevCard(); }}
          className="p-5 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-rivstart-green hover:text-white hover:border-rivstart-green transition-all shadow-sm"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
          className="p-5 bg-rivstart-yellow text-yellow-900 rounded-full hover:bg-yellow-300 transition-all shadow-lg shadow-yellow-500/20 transform hover:scale-105"
        >
          <RotateCw className="w-6 h-6" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); nextCard(); }}
          className="p-5 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-rivstart-green hover:text-white hover:border-rivstart-green transition-all shadow-sm"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default FlashcardView;