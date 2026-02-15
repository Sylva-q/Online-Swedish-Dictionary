import { WordDetails, AiHelperResult, AiHelperMode, ChapterContent } from "../types";

const API_KEY = import.meta.env.VITE_API_KEY;
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
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

async function callGemini(prompt: string, temperature = 0.7): Promise<string> {
  const response = await fetch(`${API_BASE}/${MODEL_ID}:generateContent?key=${API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: temperature,
        responseMimeType: "application/json",
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

export const lookupSwedishWord = async (word: string, targetLanguage: string): Promise<WordDetails[]> => {
  return withRetry(async () => {
    const prompt = `Generate a Swedish-English dictionary entry for "${word}". Translate secondary definitions and examples to ${targetLanguage}. Return as a JSON array.`;
    const text = await callGemini(prompt, 0.1);
    return JSON.parse(text);
  });
};

export const getAiTextHelp = async (inputText: string, mode: AiHelperMode, targetLanguage: string): Promise<AiHelperResult> => {
  return withRetry(async () => {
    let prompt = mode === 'translate' ? `Translate to English and ${targetLanguage}:` :
                 mode === 'correct' ? `Correct Swedish grammar and explain in English and ${targetLanguage}:` :
                 `Write a Swedish paragraph about:`;
    
    prompt += ` "${inputText}". Return JSON: { "output": "string", "explanation": "string" }`;
    const text = await callGemini(prompt);
    return JSON.parse(text);
  });
};

export const getRivstartChapter = async (chapterNumber: number, title: string, targetLanguage: string): Promise<ChapterContent> => {
  return withRetry(async () => {
    const prompt = `Summarize Rivstart Chapter ${chapterNumber}: ${title}. Provide vocabulary with English and ${targetLanguage} translations in JSON.`;
    const text = await callGemini(prompt);
    return JSON.parse(text);
  });
};
