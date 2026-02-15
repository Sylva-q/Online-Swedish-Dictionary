
import { GoogleGenAI, Type } from "@google/genai";
import { WordDetails, AiHelperResult, AiHelperMode, ChapterContent } from "../types";

// Faster retry utility with lower initial delay for snappier feel
async function withRetry<T>(fn: () => Promise<T>, retries = 2, initialDelay = 500): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message || "";
      const isRateLimit = errorMessage.includes("429") || errorMessage.toLowerCase().includes("quota");
      
      if (isRateLimit && i < retries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error; 
    }
  }
  throw lastError;
}

const wordItemSchema = {
  type: Type.OBJECT,
  properties: {
    word: { type: Type.STRING },
    ipa: { type: Type.STRING },
    gender: { type: Type.STRING, enum: ["en", "ett", "n/a"] },
    partOfSpeech: { type: Type.STRING },
    definitions: {
      type: Type.OBJECT,
      properties: { english: { type: Type.STRING }, secondary: { type: Type.STRING } },
      required: ["english", "secondary"],
    },
    examples: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { swedish: { type: Type.STRING }, english: { type: Type.STRING }, secondary: { type: Type.STRING } },
        required: ["swedish", "english", "secondary"],
      },
    },
    compounds: { type: Type.ARRAY, items: { type: Type.STRING } },
    inflections: {
      type: Type.OBJECT,
      properties: {
        noun: {
          type: Type.OBJECT,
          properties: { indefiniteSingular: { type: Type.STRING }, definiteSingular: { type: Type.STRING }, indefinitePlural: { type: Type.STRING }, definitePlural: { type: Type.STRING } },
          required: ["indefiniteSingular", "definiteSingular", "indefinitePlural", "definitePlural"],
        },
        verb: {
          type: Type.OBJECT,
          properties: { imperative: { type: Type.STRING }, infinitive: { type: Type.STRING }, present: { type: Type.STRING }, past: { type: Type.STRING }, supine: { type: Type.STRING } },
        },
        adjective: {
          type: Type.OBJECT,
          properties: { positive: { type: Type.STRING }, comparative: { type: Type.STRING }, superlative: { type: Type.STRING }, indefiniteEn: { type: Type.STRING }, indefiniteEtt: { type: Type.STRING }, indefinitePlural: { type: Type.STRING }, definite: { type: Type.STRING } },
        }
      },
    },
    grammarNotes: { type: Type.STRING }
  },
  required: ["word", "ipa", "gender", "partOfSpeech", "definitions", "examples", "compounds"],
};

const wordSchema = { type: Type.ARRAY, items: wordItemSchema };

// Optimized lookup for maximum speed using systemInstruction
export const lookupSwedishWord = async (word: string, targetLanguage: string): Promise<WordDetails[]> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI(import.meta.env.VITE_API_KEY);
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", 
      contents: `Entry for: "${word}". Translate secondary to ${targetLanguage}.`,
      config: {
        systemInstruction: "You are a Swedish-English dictionary. Provide concise entries. NO conversational text. Strictly follow JSON schema. IMPORTANT: JSON values must contain ONLY the word/form, NOT the key name or labels like 'Singular: word'. IPA is phonetic only. Inflections are single words.",
        responseMimeType: "application/json",
        responseSchema: wordSchema,
        temperature: 0, 
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    return JSON.parse(text);
  });
};

export const getAiTextHelp = async (inputText: string, mode: AiHelperMode, targetLanguage: string): Promise<AiHelperResult> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI(import.meta.env.VITE_API_KEY);
    let modeInstruction = "";
    if (mode === 'translate') modeInstruction = `Translate to English and ${targetLanguage}.`;
    else if (mode === 'correct') modeInstruction = `Correct Swedish text and explain grammar in English and ${targetLanguage}.`;
    else if (mode === 'compose') modeInstruction = `Write a Swedish paragraph about the topic. Provide English and ${targetLanguage} translations.`;
    else if (mode === 'read') modeInstruction = `Break text into sentences for TTS using ||| separator.`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: inputText,
      config: {
        systemInstruction: `You are a Swedish tutor. ${modeInstruction} Strictly JSON output with 'output' and 'explanation' keys.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { output: { type: Type.STRING }, explanation: { type: Type.STRING } },
          required: ["output", "explanation"]
        },
        temperature: 0,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    return JSON.parse(text);
  });
};

export const getRivstartChapter = async (chapterNumber: number, title: string, targetLanguage: string): Promise<ChapterContent> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI(import.meta.env.VITE_API_KEY);
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Rivstart Chapter ${chapterNumber}: ${title}. Secondary lang: ${targetLanguage}.`,
      config: {
        systemInstruction: "You are a Swedish teacher. Summarize chapters from Rivstart A1+A2. Provide vocabulary with English and secondary translations.",
        responseMimeType: "application/json",
        temperature: 0,
      },
    });
    const text = response.text;
    if (!text) throw new Error("Empty response");
    return JSON.parse(text);
  });
};
