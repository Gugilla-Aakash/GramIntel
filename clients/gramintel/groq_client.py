from typing import Any, Dict, Optional
import httpx
from .base import BaseAPIClient, APIError

DEFAULT_MODEL = "openai/gpt-oss-20b"

FALLBACK_TEMPLATES = {
    "en": "This business keeps about ₹{buffer} each month after expenses and loan. The {scheme} scheme ({rate}% for {years} years) fits your project. Start small near {village} and grow steadily.",
    "hi": "यह व्यवसाय खर्च और क़िस्त के बाद हर महीने लगभग ₹{buffer} बचाता है। {scheme} योजना ({rate}% {years} साल) आपकी परियोजना के लिए उपयुक्त है। {village} के पास छोटे स्तर से शुरू करें और धीरे-धीरे बढ़ें।",
    "te": "ఈ వ్యాపారం ఖర్చులు మరియు లోన్ తర్వాత నెలకు సుమారు ₹{buffer} మిగులుస్తుంది. {scheme} పథకం ({rate}% {years} సంవత్సరాలు) మీ ప్రాజెక్ట్‌కు సరిపోతుంది. {village} దగ్గర చిన్నగా ప్రారంభించి క్రమంగా పెరగండి।",
}


class GroqClient(BaseAPIClient):
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = DEFAULT_MODEL,
        base_url: str = "https://api.groq.com/openai/v1",
        timeout: float = 8.0,
        transport: Optional[httpx.BaseTransport] = None,
    ):
        super().__init__(base_url=base_url, timeout=timeout, max_retries=2, transport=transport)
        self.api_key = api_key
        self.model = model
        if api_key:
            self.headers["Authorization"] = f"Bearer {api_key}"
        self.headers["Content-Type"] = "application/json"

    def _build_prompt(
        self,
        business_category: str,
        village: str,
        margin: int,
        project_cost: int,
        loan: int,
        scheme: str,
        language: str,
        signals: Dict[str, Any],
    ) -> str:
        code = language[:2].lower() if language else "en"
        language_name = "Hindi" if code == "hi" else "Telugu" if code == "te" else "English"
        return (
            f"Explain this {business_category} feasibility in {language_name} in plain language for a first-time rural entrepreneur. "
            f"Context: village {village}, margin {margin}, project {project_cost}, loan {loan}, scheme {scheme}, signals {signals}. "
            f"Return JSON with keys: swot, opportunity_insight, threats_note, pricing_note, vernacular_summary. "
            f"Each value should be 2-3 short paragraphs/lines, simple language, no jargon. Respond only in {language_name}; do not mix languages."
        )

    def generate_sync(
        self,
        business_category: str,
        village: str,
        margin: int,
        project_cost: int,
        loan: int,
        scheme: str,
        language: str = "en",
        signals: Optional[Dict[str, Any]] = None,
        interest_rate: float = 8.0,
        tenure_years: int = 7,
        buffer: int = 0,
    ) -> Dict[str, Any]:
        signals = signals or {}
        lang_code = language[:2].lower() if language else "en"
        if lang_code not in ("en", "hi", "te"):
            lang_code = "en"

        if not self.api_key:
            return self._fallback(lang_code, village, scheme, interest_rate, tenure_years, buffer, business_category)

        prompt = self._build_prompt(business_category, village, margin, project_cost, loan, scheme, language, signals)
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.6,
            "max_tokens": 800,
            "response_format": {"type": "json_object"},
        }
        try:
            resp = self._request_sync_with_retry("POST", "/chat/completions", json=payload)
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            import json as _json
            parsed = _json.loads(content)
            expected = {"swot", "opportunity_insight", "threats_note", "pricing_note", "vernacular_summary"}
            if not expected.issubset(parsed.keys()):
                raise ValueError("Missing keys in Groq JSON")
            parsed["_model"] = self.model
            parsed["_source"] = "groq"
            return parsed
        except Exception:
            return self._fallback(lang_code, village, scheme, interest_rate, tenure_years, buffer, business_category)

    async def generate(
        self,
        business_category: str,
        village: str,
        margin: int,
        project_cost: int,
        loan: int,
        scheme: str,
        language: str = "en",
        signals: Optional[Dict[str, Any]] = None,
        interest_rate: float = 8.0,
        tenure_years: int = 7,
        buffer: int = 0,
    ) -> Dict[str, Any]:
        signals = signals or {}
        lang_code = language[:2].lower() if language else "en"
        if lang_code not in ("en", "hi", "te"):
            lang_code = "en"
        if not self.api_key:
            return self._fallback(lang_code, village, scheme, interest_rate, tenure_years, buffer, business_category)
        prompt = self._build_prompt(business_category, village, margin, project_cost, loan, scheme, language, signals)
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.6,
            "max_tokens": 800,
            "response_format": {"type": "json_object"},
        }
        try:
            resp = await self._request_with_retry("POST", "/chat/completions", json=payload)
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            import json as _json
            parsed = _json.loads(content)
            parsed["_model"] = self.model
            parsed["_source"] = "groq"
            return parsed
        except Exception:
            return self._fallback(lang_code, village, scheme, interest_rate, tenure_years, buffer, business_category)

    def _build_chat_system_prompt(self, case_summary: Dict[str, Any], language: str = "en") -> str:
        lines = [
            "You are the GramIntel AI Case Advisor, helping a rural SCA/bank officer evaluate a loan application.",
            "You answer only about the case provided. Be honest, evidence-based, and concise.",
            "Never invent numbers not present in the context. Reference specific figures from the case.",
            "Use markdown formatting (bold, bullet lists). If you use a markdown table, put the header, the separator row, and every data row each on its own line.",
            "Your creator is GramIntel. Always introduce yourself as GramIntel's AI Assistant. Never claim to be ChatGPT, never mention OpenAI, Groq, or any third-party API/company, and never mention your model name.",
        ]
        if language[:2].lower() not in ("en", "hi", "te"):
            language = "en"
        lang_name = "Hindi" if language[:2].lower() == "hi" else "Telugu" if language[:2].lower() == "te" else "English"
        lines.append(f"Respond only in {lang_name}; do not mix languages. Keep rupee amounts as ₹ with digits. Use markdown.")
        fc = case_summary.get("financial", {})
        feas = case_summary.get("feasibility", {})
        viab = feas.get("viability", {})
        lines.append("CASE FACTS:")
        lines.append(f"- Business: {case_summary.get('business_category')} in {case_summary.get('village')}, {case_summary.get('block')}, {case_summary.get('district')}")
        lines.append(f"- Margin capital: Rs {case_summary.get('margin_capital'):,} | Project cost: Rs {fc.get('project_cost', 0):,} | Max loan: Rs {fc.get('max_loan', 0):,}")
        if fc:
            lines.append(f"- Scheme: {fc.get('scheme')} at {fc.get('interest_rate')}% p.a., {fc.get('tenure_months')} months, {fc.get('moratorium_months')} months moratorium | EMI monthly: Rs {fc.get('emi_monthly', 0):,}, quarterly: Rs {fc.get('emi_quarterly', 0):,}, total interest: Rs {fc.get('total_interest', 0):,}")
        if viab:
            lines.append(f"- Viability score: {viab.get('score')} / grade {viab.get('grade')}")
            factors = viab.get("factors", [])
            if factors:
                lines.append("- Viability factors: " + "; ".join(f"{f.get('label')}: {f.get('v')} ({f.get('note', '')})" for f in factors))
        mr = feas.get("market_reach", {})
        if mr:
            lines.append(f"- Market reach: {mr.get('radius_km')} km, ~{mr.get('estimated_consumers')} consumers, {mr.get('similar_businesses')} similar, demand Rs {mr.get('monthly_demand_lakh')}L/mo | source: {mr.get('source')}")
        comp = feas.get("competitor_map", {})
        if comp:
            lines.append(f"- Competitors: {comp.get('count')} within {comp.get('radius_km')} km (density {comp.get('density_per_km2')}/km2), source: {comp.get('source')}")
        opp = feas.get("opportunity_analysis", {})
        if opp:
            niches = opp.get("niches", [])
            if niches:
                lines.append("- Top opportunities: " + "; ".join(f"{n.get('niche')} (score {n.get('score')})" for n in niches[:3]))
            if opp.get("top_niche"):
                lines.append(f"- Top niche: {opp['top_niche']}")
        swot = feas.get("swot", {})
        if swot:
            lines.append("- SWOT strengths: " + ", ".join(swot.get("strengths", [])))
            lines.append("- SWOT weaknesses: " + ", ".join(swot.get("weaknesses", [])))
            lines.append("- SWOT threats: " + ", ".join(swot.get("threats", [])))
        pmv = feas.get("product_market_value", {})
        if pmv:
            pricing = pmv.get("pricing", {})
            pricing = feas.get("product_market_value", {}).get("pricing", {})
            if pricing:
                lines.append(f"- Pricing: median Rs {pricing.get('median')}, suggested band {pricing.get('band')} {pricing.get('unit', '')}")
        return "\n".join(lines)

    def _chat_fallback(self, case_summary: Dict[str, Any], question: str, language: str = "en") -> str:
        fc = case_summary.get("financial", {})
        feas = case_summary.get("feasibility", {})
        viab = feas.get("viability", {})
        cat = case_summary.get("business_category", "the business")
        villa = case_summary.get("village", "the area")
        grade = viab.get("grade", "B")
        score = viab.get("score", 0)
        lang_code = language[:2].lower() if language else "en"
        if lang_code not in ("en", "hi", "te"):
            lang_code = "en"
        lines = [
            (
                f"Here's an offline assessment for this {cat} case in {villa}."
                if lang_code == "en"
                else (f"{villa} లోని {cat} కేసు కోసం ఆఫ్‌లైన్ అంచనా ఇక్కడ ఉంది." if lang_code == "te" else f"{villa} के पास {cat} केस के लिए यह ऑफ़लाइन आकलन है।")
            )
        ]
        lines.append(
            f"- Viability score: {score} (grade {grade})."
            if lang_code == "en"
            else (f"- అంచనా స్కోరు: {score} (గ్రేడ్ {grade})." if lang_code == "te" else f"- व्यवहार्यता स्कोर: {score} (ग्रेड {grade}).")
        )
        if fc:
            lines.append(
                f"- Project cost Rs {fc.get('project_cost', 0):,}, max loan Rs {fc.get('max_loan', 0):,} under the {fc.get('scheme')} scheme at {fc.get('interest_rate')}% p.a. with quarterly EMI Rs {fc.get('emi_quarterly', 0):,}."
                if lang_code == "en"
                else (f"- ప్రాజెక్ట్ ఖర్చు ₹{fc.get('project_cost', 0):,}, గరిష్ట రుణం ₹{fc.get('max_loan', 0):,}, {fc.get('scheme')} పథకం {fc.get('interest_rate')}% తో, త్రైమాసిక కిస్తు ₹{fc.get('emi_quarterly', 0):,}." if lang_code == "te" else f"- परियोजना लागत ₹{fc.get('project_cost', 0):,}, अधिकतम ऋण ₹{fc.get('max_loan', 0):,}, {fc.get('scheme')} योजना {fc.get('interest_rate')}% पर, तिमाही किस्त ₹{fc.get('emi_quarterly', 0):,}।")
            )
        mr = feas.get("market_reach", {})
        if mr:
            lines.append(
                f"- Market reach ~{mr.get('radius_km')} km with estimated {mr.get('estimated_consumers')} consumers."
                if lang_code == "en"
                else (f"- మార్కెట్ పరిధి ~{mr.get('radius_km')} కి.మీ, సుమారు {mr.get('estimated_consumers')} వినియోగదారులు." if lang_code == "te" else f"- बाज़ार पहुँच ~{mr.get('radius_km')} किमी, अनुमानित {mr.get('estimated_consumers')} उपभोक्ता।")
            )
        lines.append(
            (
                "This is a template response because the AI service is offline. Review the feasibility and financial details in the case for your decision."
                if lang_code == "en"
                else (f"AI సేవ ఆఫ్‌లైన్లో ఉన్నందున ఇది టెంప్లేట్ సమాధానం. నిర్ణయానికి ముందు కేసులోని ఫీజిబిలిటీ మరియు ఆర్థిక వివరాలు సమీక్షించండి." if lang_code == "te" else "एआई सेवा ऑफ़लाइन होने के कारण यह टेम्पलेट उत्तर है। निर्णय से पहले केस की व्यवहार्यता और वित्तीय विवरण समीक्षा करें।")
            )
        )
        return " ".join(lines)

    async def stream_chat(
        self,
        case_summary: Dict[str, Any],
        message: str,
        history: Optional[list] = None,
        language: str = "en",
    ):
        if not self.api_key:
            yield self._chat_fallback(case_summary, message, language)
            return
        system = self._build_chat_system_prompt(case_summary, language)
        messages = [{"role": "system", "content": system}]
        if history:
            for h in history[-8:]:
                role = h.get("role")
                content = h.get("content")
                if role in ("user", "assistant") and content:
                    messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": message})
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.4,
            "max_tokens": 700,
            "stream": True,
        }
        try:
            client_kwargs: Dict[str, Any] = {
                "timeout": httpx.Timeout(60.0, connect=10.0),
                "headers": self.headers,
                "base_url": self.base_url,
            }
            if self._transport:
                client_kwargs["transport"] = self._transport
            async with httpx.AsyncClient(**client_kwargs) as client:
                async with client.stream("POST", "/chat/completions", json=payload) as resp:
                    if resp.status_code >= 400:
                        text = (await resp.aread()).decode("utf-8", "replace")
                        raise APIError(f"HTTP {resp.status_code}: {text[:500]}", status_code=resp.status_code)
                    async for line in resp.aiter_lines():
                        if not line or not line.startswith("data:"):
                            continue
                        data = line[len("data:"):].strip()
                        if data == "[DONE]":
                            break
                        import json as _json
                        try:
                            chunk = _json.loads(data)
                            delta = chunk["choices"][0].get("delta", {})
                            content = delta.get("content")
                            if content:
                                yield content
                        except Exception:
                            continue
        except Exception:
            yield self._chat_fallback(case_summary, message, language)

    def _fallback(self, lang_code: str, village: str, scheme: str, rate: float, years: int, buffer: int, category: str) -> Dict[str, Any]:
        template = FALLBACK_TEMPLATES.get(lang_code, FALLBACK_TEMPLATES["en"])
        summary = template.format(buffer=f"{buffer:,}", scheme=scheme, rate=rate, years=years, village=village)
        swot_en = {
            "strengths": f"Good local demand for {category} near {village}; 3 supply points within 6km.",
            "weaknesses": "First-time entrepreneur; needs working capital discipline.",
            "opportunities": "Underserved value-added niche; premium pricing possible.",
            "threats": "Seasonal dips and single-buyer concentration.",
        }
        if lang_code == "hi":
            swot = {
                "strengths": f"{village} के पास {category} की अच्छी माँग; 6 किमी में 3 आपूर्ति केंद्र।",
                "weaknesses": "पहली बार उद्यमी; कार्यशील पूँजी अनुशासन ज़रूरी।",
                "opportunities": "मूल्य-वर्धित आला बाज़ार में अवसर; प्रीमियम मूल्य संभव।",
                "threats": "मौसमी उतार-चढ़ाव और एकल-खरीदार निर्भरता।",
            }
        elif lang_code == "te":
            swot = {
                "strengths": f"{village} దగ్గర {category} కు మంచి డిమాండ్; 6కిమీ లో 3 సప్లై కేంద్రాలు.",
                "weaknesses": "మొదటిసారి వ్యవస్థాపకుడు; వర్కింగ్ క్యాపిటల్ క్రమశిక్షణ అవసరం.",
                "opportunities": "విలువ-ఆధారిత నిచ్ లో అవకాశం; ప్రీమియం ధర సాధ్యం.",
                "threats": "సీజనల్ హెచ్చుతగ్గులు మరియు ఒకే కొనుగోలుదారుపై ఆధారపడటం.",
            }
        else:
            swot = swot_en

        return {
            "swot": swot,
            "opportunity_insight": summary,
            "threats_note": swot["threats"],
            "pricing_note": "Suggested band ±12% around district median; align with local purchasing power.",
            "vernacular_summary": summary,
            "_model": "template",
            "_source": "template",
        }
