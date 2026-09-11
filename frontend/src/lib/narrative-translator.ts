export type NarrativeLanguage = "en" | "hi" | "te";

type Narrative = Record<string, any>;

type PuterChatResponse = {
  message?: { content?: string };
  text?: string;
};

declare global {
  interface Window {
    puter?: {
      ai?: {
        chat: (prompt: string, options?: { model?: string }) => Promise<PuterChatResponse | string>;
      };
    };
  }
}

const cache = new Map<string, Narrative>();
const inFlight = new Map<string, Promise<Narrative>>();

const LANGUAGE_NAMES: Record<Exclude<NarrativeLanguage, "en">, string> = {
  hi: "Hindi (हिन्दी)",
  te: "Telugu (తెలుగు)",
};

function responseText(response: PuterChatResponse | string) {
  if (typeof response === "string") return response;
  return response.message?.content || response.text || "";
}

function parseJson(text: string): Narrative {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(cleaned);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid translation response");
  return parsed;
}

export async function translateNarrative(source: Narrative, language: NarrativeLanguage): Promise<Narrative> {
  if (language === "en") return source;

  const key = `${language}:${JSON.stringify(source)}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const pending = inFlight.get(key);
  if (pending) return pending;

  const task = (async () => {
    const puter = window.puter;
    if (!puter?.ai?.chat) throw new Error("Puter.js is not ready");

    const prompt = [
      `Translate the following GramIntel business feasibility narrative into ${LANGUAGE_NAMES[language]}.`,
      "Return only valid JSON, with exactly the same keys as the input.",
      "Translate every human-readable value, including SWOT, opportunity insight, threats note, pricing note, and summary.",
      "Preserve all numbers, currency values, percentages, proper nouns, business names, and JSON structure.",
      "Do not leave English sentences in the translated values. Do not add explanations or markdown.",
      JSON.stringify(source),
    ].join("\n\n");

    const response = await puter.ai.chat(prompt, { model: "gpt-5-nano" });
    const translated = { ...source, ...parseJson(responseText(response)), _model: "puter.js", _source: "client-translation" };
    cache.set(key, translated);
    return translated;
  })();

  inFlight.set(key, task);
  try {
    return await task;
  } finally {
    inFlight.delete(key);
  }
}
