import { NextRequest } from "next/server";
export const runtime = "edge";

type LangCode = "en" | "hi" | "te" | "bn" | "mr" | "ta";

const FALLBACKS: Record<LangCode, string> = {
  en: "This business keeps about ₹13,972 each month after expenses and loan repayment.",
  hi: "खर्च और ऋण की किस्त के बाद यह व्यवसाय हर महीने लगभग ₹13,972 बचाता है।",
  te: "ఖర్చులు మరియు రుణ వాయిదా తర్వాత ఈ వ్యాపారం ప్రతి నెలా సుమారు ₹13,972 మిగులుస్తుంది।",
  bn: "খরচ ও ঋণের কিস্তির পর এই ব্যবসা প্রতি মাসে প্রায় ₹13,972 বাঁচায়।",
  mr: "खर्च आणि कर्जाच्या हप्त्यानंतर हा व्यवसाय दर महिन्याला सुमारे ₹13,972 वाचवतो.",
  ta: "செலவுகள் மற்றும் கடன் தவணைக்குப் பிறகு இந்தத் தொழில் மாதந்தோறும் சுமார் ₹13,972 மிச்சப்படுத்துகிறது.",
};

const NAMES: Record<LangCode, string> = {
  en: "English",
  hi: "Hindi",
  te: "Telugu",
  bn: "Bengali",
  mr: "Marathi",
  ta: "Tamil",
};

const OFFLINE_SUFFIX: Record<LangCode, string> = {
  en: " (offline fallback)",
  hi: " (ऑफ़लाइन फ़ॉलबैक)",
  te: " (ఆఫ్‌లైన్ ఫాల్‌బ్యాక్)",
  bn: " (অফলাইন ফলব্যাক)",
  mr: " (ऑफलाइन फॉलबॅक)",
  ta: " (ஆஃப்லைன் மாற்று)",
};

function normalize(lang: unknown): LangCode {
  if (typeof lang !== "string") return "en";
  const v = lang.trim().toLowerCase();
  if (v === "hi" || v === "hindi" || v === "हिन्दी") return "hi";
  if (v === "te" || v === "telugu" || v === "తెలుగు") return "te";
  if (v === "bn" || v === "bengali" || v === "বাংলা") return "bn";
  if (v === "mr" || v === "marathi" || v === "मराठी") return "mr";
  if (v === "ta" || v === "tamil" || v === "தமிழ்") return "ta";
  return "en";
}

export async function POST(req: NextRequest) {
  let requestedCode: LangCode = "en";
  try {
    const { lang } = await req.json();
    const code = normalize(lang);
    requestedCode = code;
    const fallback = FALLBACKS[code];
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ text: fallback }), { status: 200, headers: {"Content-Type":"application/json"} });
    const languageName = NAMES[code];
    const prompt = `Explain this dairy EMI in ${languageName} in 2 short lines for a first-time rural entrepreneur, no jargon. Respond only in ${languageName}; do not mix languages. Context: revenue 85000, costs 57000, surplus 28000, EMI 14028 (8% 7yr, 6mo moratorium), buffer 13972. Use simple language.`;
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 120,
        stream: false,
      }),
    });
    if (!res.ok) throw new Error(`groq ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || fallback;
    return new Response(JSON.stringify({ text }), { headers: {"Content-Type":"application/json"} });
  } catch (e:any) {
    const text = FALLBACKS[requestedCode] + OFFLINE_SUFFIX[requestedCode];
    return new Response(JSON.stringify({ text }), { status: 200, headers: {"Content-Type":"application/json"} });
  }
}
