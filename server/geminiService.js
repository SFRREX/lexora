import { GoogleGenAI, Type } from '@google/genai';

const TOOL_PROMPTS = {
  grammar: {
    instruction:
      'You are an elite, publication-grade copy editor for Lexora adhering strictly to the Chicago Manual of Style. Correct all grammatical errors, spelling mistakes, punctuation issues (commas, hyphens, em-dashes, apostrophes, colons, semicolons), capitalization, dangling modifiers, comma splices, and syntax flaws. Strictly preserve the original tone, intent, factual assertions, citations, and markdown/formatting. Do not add any introductory or explanatory text, notes, or surrounding quotes. Return ONLY the perfected, corrected text directly.',
    temperature: 0.1,
  },
  improve: {
    instruction:
      'You are a master writing coach for Lexora. Enhance the prose for dynamic sentence rhythm, cadence, clarity, and elegance while strictly preserving the author\'s original meaning and voice. Replace clumsy passive constructions with active, precise verbs. Eliminate repetitive sentence structures and robotic transitions. Preserve all names, facts, and citations. Return ONLY the improved text directly without notes or commentary.',
    temperature: 0.25,
  },
  replace: {
    instruction:
      'You are a master vocabulary specialist for Lexora. Upgrade weak, overused, or repetitive words with richer, contextually accurate, and vivid alternatives. Ensure the elevated vocabulary matches the tone and flows naturally without sounding pretentious or forced. Preserve all factual claims and citations. Return ONLY the revised text directly with no added commentary.',
    temperature: 0.25,
  },
  simplify: {
    instruction:
      'You are a plain-language editor for Lexora following the Federal Plain Language Guidelines. Simplify dense jargon, untangle convoluted clauses, and transform overly complex sentences into crisp, direct, and accessible prose. Maintain 100% of the core information, nuances, and factual accuracy. Return ONLY the simplified text directly.',
    temperature: 0.15,
  },
  professional: {
    instruction:
      'You are an executive communications editor for Lexora. Transform the draft into an authoritative, polished, articulate, and diplomatic professional register suitable for high-stakes business and leadership communications. Ensure the message is constructive, clear, and confident without being bureaucratic or overly stiff. Return ONLY the revised text directly.',
    temperature: 0.2,
  },
  casual: {
    instruction:
      'You are a conversational writing editor for Lexora. Adapt the text into a warm, natural, friendly, and engaging conversational tone with standard contractions and fluid cadence. Ensure the prose feels authentic and human while maintaining coherence and intelligence. Return ONLY the revised text directly.',
    temperature: 0.35,
  },
  shorten: {
    instruction:
      'You are an elite conciseness editor for Lexora. Eliminate wordiness, redundancies, throat-clearing prepositions, and deadwood phrases. Maximize the signal-to-noise ratio and make the text punchy and succinct while preserving 100% of the essential meaning, critical facts, and conclusions. Return ONLY the shortened text directly.',
    temperature: 0.15,
  },
};

const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];

/**
 * Creates a GoogleGenAI client if an API key is present.
 */
function getClient(apiKey) {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key || key.trim() === '' || key === 'your_gemini_api_key_here') {
    return null;
  }
  return new GoogleGenAI({ apiKey: key });
}

export function isGeminiConfigured(apiKey) {
  return Boolean(getClient(apiKey));
}

/**
 * Process text using Gemini API with tool-specific system instructions.
 */
export async function processWithGemini(text, toolId, apiKey) {
  const client = getClient(apiKey);
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const toolConfig = TOOL_PROMPTS[toolId] || TOOL_PROMPTS.grammar;
  let lastError = null;

  for (const model of GEMINI_MODELS) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: text,
        config: {
          systemInstruction: toolConfig.instruction,
          temperature: toolConfig.temperature,
        },
      });

      const output = response.text ? response.text.trim() : '';
      if (output) {
        return { text: output, model };
      }
    } catch (err) {
      lastError = err;
      console.info(`Model ${model} unavailable, trying fallback:`, err.message);
    }
  }

  throw lastError || new Error('All Gemini models were unavailable.');
}

/**
 * Generate context-aware word alternatives using structured JSON schema.
 */
export async function getAlternativesWithGemini(word, context, apiKey) {
  const client = getClient(apiKey);
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const prompt = `You are an expert lexicographer and context-aware thesaurus specialist. Suggest 3 to 4 distinct, highly natural alternatives for the word "${word}"${
    context && context.trim() ? ` as used in the following sentence context: "${context.trim()}"` : ''
  }. Every suggestion MUST match the grammatical part of speech, inflection, and syntactic function of the target word in context so it can be directly swapped into the sentence without causing grammatical errors. Provide alternatives for: professional, casual, stronger, and simpler.`;

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.25,
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: Type.OBJECT,
            properties: {
              professional: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Professional or formal alternatives matching grammatical context',
              },
              casual: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Casual or conversational alternatives matching grammatical context',
              },
              stronger: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'More impactful, vivid, or powerful alternatives matching grammatical context',
              },
              simpler: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Clear, direct, and simpler alternatives matching grammatical context',
              },
            },
            required: ['professional', 'casual', 'stronger', 'simpler'],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        parsed._model = model;
        return parsed;
      }
    } catch (err) {
      lastError = err;
      console.info(`Model ${model} unavailable for alternatives:`, err.message);
    }
  }

  throw lastError || new Error('All Gemini models were unavailable for word alternatives.');
}
