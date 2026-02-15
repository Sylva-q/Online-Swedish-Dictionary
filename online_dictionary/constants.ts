import { LanguageOption } from './types';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'Chinese (Simplified)', label: 'Chinese (中文)' },
  { code: 'Spanish', label: 'Spanish (Español)' },
  { code: 'French', label: 'French (Français)' },
  { code: 'German', label: 'German (Deutsch)' },
  { code: 'Arabic', label: 'Arabic (العربية)' },
  { code: 'Japanese', label: 'Japanese (日本語)' },
  { code: 'Hindi', label: 'Hindi (हिन्दी)' },
  { code: 'Russian', label: 'Russian (Русский)' },
  { code: 'Portuguese', label: 'Portuguese (Português)' },
  { code: 'Turkish', label: 'Turkish (Türkçe)' },
];

export const DEFAULT_TARGET_LANGUAGE = 'Chinese (Simplified)';

export const POS_COLORS: Record<string, string> = {
  'noun': '#0f766e', // Rivstart Green
  'verb': '#b91c1c', // Deep Red
  'adjective': '#ca8a04', // Dark Yellow/Gold
  'adverb': '#d97706',
  'pronoun': '#7c3aed',
  'preposition': '#db2777',
  'conjunction': '#4b5563',
  'other': '#64748b'
};
