import { GoogleGenAI } from "@google/genai";
import { WordDetails, AiHelperResult, AiHelperMode, ChapterContent } from "../types";

// Initialize the client once using the Vercel variable
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

// The current stable model for dictionary tasks
const MODEL_ID = "gemini-1.5-flash";

async function withRetry<T>(fn: () => Promise<T>, retries = 2, initialDelay = 500): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (error?.message?.includes("429") && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, initialDelay * Math.pow(2, i)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const lookupSwedishWord = async (word: string, targetLanguage: string): Promise<WordDetails[]> => {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: `Generate a Swedish-English dictionary entry for "${word}". Translate secondary definitions and examples to ${targetLanguage}. Return as a JSON array following the WordDetails schema.`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    if (!response.text) throw new Error("Empty response from AI");
    return JSON.parse(response.text);
  });
};

export const getAiTextHelp = async (inputText: string, mode: AiHelperMode, targetLanguage: string): Promise<AiHelperResult> => {
  return withRetry(async () => {
    let prompt = mode === 'translate' ? `Translate to English and ${targetLanguage}:` :
                 mode === 'correct' ? `Correct Swedish grammar and explain in English and ${targetLanguage}:` :
                 `Write a Swedish paragraph about:`;

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: `${prompt} "${inputText}". Return JSON: { "output": "string", "explanation": "string" }`,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text);
  });
};

export const getRivstartChapter = async (chapterNumber: number, title: string, targetLanguage: string): Promise<ChapterContent> => {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: `Summarize Rivstart Chapter ${chapterNumber}: ${title}. Provide vocabulary with English and ${targetLanguage} translations in JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text);
  });
};
