import { NextRequest } from "next/server";
export const runtime = "edge";
export async function POST(req: NextRequest) {
  let requestedCode: "en" | "hi" | "te" = "en";
  try {
    const { lang } = await req.json();
    const code = lang === "hi" || lang === "Hindi" ? "hi" : lang === "te" || lang === "Telugu" ? "te" : "en";
    requestedCode = code;
    const fallback = {
      en: "This business keeps about ₹13,972 each month after expenses and loan repayment.",
      hi: "खर्च और ऋण की किस्त के बाद यह व्यवसाय हर महीने लगभग ₹13,972 बचाता है।",
      te: "ఖర్చులు మరియు రుణ వాయిదా తర్వాత ఈ వ్యాపారం ప్రతి నెలా సుమారు ₹13,972 మిగులుస్తుంది।",
    }[code];
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ text: fallback }), { status: 200, headers: {"Content-Type":"application/json"} });
    const languageName = code === "hi" ? "Hindi" : code === "te" ? "Telugu" : "English";
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
    const text = requestedCode === "hi"
      ? "खर्च और ऋण की किस्त के बाद यह व्यवसाय हर महीने लगभग ₹13,972 बचाता है। (ऑफ़लाइन फ़ॉलबैक)"
      : requestedCode === "te"
        ? "ఖర్చులు మరియు రుణ వాయిదా తర్వాత ఈ వ్యాపారం ప్రతి నెలా సుమారు ₹13,972 మిగులుస్తుంది। (ఆఫ్‌లైన్ ఫాల్‌బ్యాక్)"
        : "This business keeps about ₹13,972 each month after expenses and loan repayment. (offline fallback)";
    return new Response(JSON.stringify({ text }), { status: 200, headers: {"Content-Type":"application/json"} });
  }
}
