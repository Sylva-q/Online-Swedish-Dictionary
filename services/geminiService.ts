import { WordDetails, AiHelperResult, AiHelperMode, ChapterContent } from "../types";

const API_KEY = import.meta.env.VITE_API_KEY;
const MODEL_ID = "gemini-pro";

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
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${API_KEY}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: 2048,
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("API Error:", errorText);
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  return text;
}

export const lookupSwedishWord = async (word: string, targetLanguage: string): Promise<WordDetails[]> => {
  return withRetry(async () => {
    const prompt = `Generate a Swedish-English dictionary entry for "${word}". Translate secondary definitions and examples to ${targetLanguage}. Return ONLY a valid JSON array with no markdown formatting or code blocks.`;
    const text = await callGemini(prompt, 0.1);
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanText);
  });
};

export const getAiTextHelp = async (inputText: string, mode: AiHelperMode, targetLanguage: string): Promise<AiHelperResult> => {
  return withRetry(async () => {
    let prompt = mode === 'translate' ? `Translate to English and ${targetLanguage}:` :
                 mode === 'correct' ? `Correct Swedish grammar and explain in English and ${targetLanguage}:` :
                 `Write a Swedish paragraph about:`;
    
    prompt += ` "${inputText}". Return ONLY a valid JSON object: { "output": "string", "explanation": "string" } with no markdown formatting.`;
    const text = await callGemini(prompt);
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanText);
  });
};

export const getRivstartChapter = async (chapterNumber: number, title: string, targetLanguage: string): Promise<ChapterContent> => {
  return withRetry(async () => {
    const prompt = `Summarize Rivstart Chapter ${chapterNumber}: ${title}. Provide vocabulary with English and ${targetLanguage} translations. Return ONLY valid JSON with no markdown formatting.`;
    const text = await callGemini(prompt);
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanText);
  });
};
