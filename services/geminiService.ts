import { WordDetails, AiHelperResult, AiHelperMode, ChapterContent } from "../types";

const API_KEY = import.meta.env.VITE_API_KEY;
const MODEL_ID = "gemini-2.5-flash";

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
  
  // Clean up the response text
  let cleanedText = text.trim();
  
  // Remove markdown code blocks if present
  cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  // Try to extract JSON if it's embedded in other text
  const jsonMatch = cleanedText.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanedText = jsonMatch[0];
  }
  
  return cleanedText;
}

export const lookupSwedishWord = async (word: string, targetLanguage: string): Promise<WordDetails[]> => {
  return withRetry(async () => {
    const prompt = `You are a Swedish-English dictionary. Generate a dictionary entry for the Swedish word "${word}".

Instructions:
- Provide definitions in both English and ${targetLanguage}
- Return ONLY valid JSON, nothing else
- Use proper JSON escaping for quotes and special characters
- Format as a JSON array

Required JSON structure:
[
  {
    "word": "string",
    "partOfSpeech": "string",
    "definitions": {
      "english": "string",
      "${targetLanguage.toLowerCase()}": "string"
    },
    "examples": [
      {
        "swedish": "string",
        "english": "string",
        "${targetLanguage.toLowerCase()}": "string"
      }
    ]
  }
]

Return ONLY the JSON array, no markdown, no explanations.`;
    
    const text = await callGemini(prompt, 0.1);
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse JSON:", text);
      console.error("Parse error:", parseError);
      throw new Error("Invalid response format from API");
    }
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
