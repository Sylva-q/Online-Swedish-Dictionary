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
    const targetLangKey = targetLanguage.toLowerCase().replace(/\s+/g, '_');
    
    const prompt = `You are a comprehensive Swedish dictionary. Generate a complete dictionary entry for "${word}".

Return a JSON array with this EXACT structure. Every field must be filled with accurate information:

[
  {
    "word": "${word}",
    "ipa": "IPA phonetic notation",
    "partOfSpeech": "verb|noun|adjective|adverb|etc",
    "gender": "en|ett|n/a",
    "definitions": {
      "english": "Primary English definition",
      "secondary": "${targetLanguage} translation"
    },
    "grammarNotes": "Detailed grammar note (e.g., 'Strong verb (class 5)' or 'Common gender noun')",
    "inflections": {
      "verb": {
        "imperative": "imperative form",
        "infinitive": "infinitive form", 
        "present": "present tense",
        "past": "past tense (preteritum)",
        "supine": "supine form"
      },
      "noun": {
        "indefiniteSingular": "singular indefinite",
        "definiteSingular": "singular definite",
        "indefinitePlural": "plural indefinite", 
        "definitePlural": "plural definite"
      },
      "adjective": {
        "indefiniteEn": "en-form",
        "indefiniteEtt": "ett-form",
        "indefinitePlural": "plural form",
        "definite": "definite form",
        "positive": "positive degree",
        "comparative": "comparative degree",
        "superlative": "superlative degree"
      }
    },
    "examples": [
      {
        "swedish": "Swedish example sentence 1",
        "english": "English translation 1",
        "${targetLangKey}": "${targetLanguage} translation 1"
      },
      {
        "swedish": "Swedish example sentence 2", 
        "english": "English translation 2",
        "${targetLangKey}": "${targetLanguage} translation 2"
      }
    ]
  }
]

CRITICAL RULES:
1. Include ALL inflection forms for the word's part of speech (verb/noun/adjective)
2. For nouns: MUST include gender ("en" or "ett", NOT "n/a" for actual nouns)
3. For verbs: include all 5 forms (imperative, infinitive, present, past, supine)
4. For adjectives: include all declension AND comparison forms
5. Provide at least 2-3 example sentences
6. IPA must use proper phonetic notation with slashes
7. Grammar notes should be informative (verb class, noun declension, etc.)
8. Return ONLY the JSON array - no markdown, no explanations, no code blocks`;
    
    const text = await callGemini(prompt, 0.4);
    
    try {
      const parsed = JSON.parse(text);
      console.log("Successfully parsed JSON:", parsed);
      return parsed;
    } catch (parseError) {
      console.error("Failed to parse JSON. Raw response:", text);
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
