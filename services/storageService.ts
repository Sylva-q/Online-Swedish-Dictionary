
import { WordDetails, SearchHistoryItem } from '../types';

const KEYS = {
  HISTORY: 'svenskalar_history',
  SAVED_WORDS: 'svenskalar_flashcards',
};

export const storageService = {
  // HISTORY ACTIONS
  saveHistory: (history: SearchHistoryItem[]) => {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  },

  getHistory: (): SearchHistoryItem[] => {
    const data = localStorage.getItem(KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  },

  // WORD ACTIONS (Personal Ordbok)
  saveWords: (words: WordDetails[]) => {
    localStorage.setItem(KEYS.SAVED_WORDS, JSON.stringify(words));
  },

  getWords: (): WordDetails[] => {
    const data = localStorage.getItem(KEYS.SAVED_WORDS);
    return data ? JSON.parse(data) : [];
  }
};
