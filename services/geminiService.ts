import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { WordDetails, AiHelperResult, AiHelperMode, ChapterContent } from "../types";

// Initialize the API outside functions to avoid repeated setup
// Using the modern GoogleGenerativeAI class
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY);

// Use the stable model alias to avoid 404s
const MODEL_NAME = "gemini-1.5-flash";

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
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      }
    });

    const prompt = `Return a JSON array for the Swedish word: "${word}". Translate secondary definitions to ${targetLanguage}. 
    Follow this schema: [{ word, ipa, gender, partOfSpeech, definitions: { english, secondary }, examples: [{ swedish, english, secondary }], compounds: [], inflections: {} }]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  });
};

export const getAiTextHelp = async (inputText: string, mode: AiHelperMode, targetLanguage: string): Promise<AiHelperResult> => {
  return withRetry(async () => {
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig: { responseMimeType: "application/json" }
    });

    let modeInst = mode === 'translate' ? `Translate to English and ${targetLanguage}` : 
                   mode === 'correct' ? `Correct grammar and explain in English and ${targetLanguage}` : 
                   `Compose text in Swedish with English and ${targetLanguage} translations`;

    const prompt = `${modeInst}: "${inputText}". Return JSON: { "output": "string", "explanation": "string" }`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  });
};

export const getRivstartChapter = async (chapterNumber: number, title: string, targetLanguage: string): Promise<ChapterContent> => {
  return withRetry(async () => {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `Rivstart Chapter ${chapterNumber}: ${title}. Provide summary and vocabulary in JSON. Secondary lang: ${targetLanguage}.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  });
};
