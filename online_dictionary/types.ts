
export interface ExampleSentence {
  swedish: string;
  english: string;
  secondary: string;
}

export interface NounForms {
  indefiniteSingular: string;
  definiteSingular: string;
  indefinitePlural: string;
  definitePlural: string;
}

export interface VerbForms {
  imperative: string;
  infinitive: string;
  present: string;
  past: string;
  supine: string;
}

export interface AdjectiveForms {
  positive: string;
  comparative: string;
  superlative: string;
  indefiniteEn: string;
  indefiniteEtt: string;
  indefinitePlural: string;
  definite: string;
}

export interface WordDetails {
  word: string;
  ipa: string;
  gender: 'en' | 'ett' | 'n/a';
  partOfSpeech: string;
  targetLanguage?: string; // Metadata for caching/tracking
  definitions: {
    english: string;
    secondary: string;
  };
  examples: ExampleSentence[];
  compounds: string[];
  inflections?: {
    noun?: NounForms;
    verb?: VerbForms;
    adjective?: AdjectiveForms;
  };
  grammarNotes?: string;
}

export interface SearchHistoryItem extends WordDetails {
  timestamp: number;
}

export interface LanguageOption {
  code: string;
  label: string;
}

export type AiHelperMode = 'translate' | 'correct' | 'compose' | 'read';

export interface AiHelperResult {
  output: string;
  explanation: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface GrammarPoint {
  topic: string;
  explanationSv: string;
  explanationEn: string;
}

export interface VocabularyItem {
  swedish: string;
  english: string;
  secondary: string;
}

export interface ChapterContent {
  chapterNumber: number;
  title: string;
  summarySv: string;
  summaryEn: string;
  grammar: GrammarPoint[];
  vocabulary: VocabularyItem[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  photoURL: string;
}
