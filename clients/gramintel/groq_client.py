from typing import Any, Dict, Optional
import httpx
from .base import BaseAPIClient, APIError

DEFAULT_MODEL = "openai/gpt-oss-20b"

FALLBACK_TEMPLATES = {
    "en": "This business keeps about ₹{buffer} each month after expenses and loan. The {scheme} scheme ({rate}% for {years} years) fits your project. Start small near {village} and grow steadily.",
    "hi": "यह व्यवसाय खर्च और क़िस्त के बाद हर महीने लगभग ₹{buffer} बचाता है। {scheme} योजना ({rate}% {years} साल) आपकी परियोजना के लिए उपयुक्त है। {village} के पास छोटे स्तर से शुरू करें और धीरे-धीरे बढ़ें।",
    "te": "ఈ వ్యాపారం ఖర్చులు మరియు లోన్ తర్వాత నెలకు సుమారు ₹{buffer} మిగులుస్తుంది. {scheme} పథకం ({rate}% {years} సంవత్సరాలు) మీ ప్రాజెక్ట్‌కు సరిపోతుంది. {village} దగ్గర చిన్నగా ప్రారంభించి క్రమంగా పెరగండి।",
    "bn": "এই ব্যবসা খরচ ও কিস্তির পর প্রতি মাসে প্রায় ₹{buffer} বাঁচায়। {scheme} প্রকল্প ({rate}% {years} বছর) আপনার প্রকল্পের জন্য উপযুক্ত। {village}-এর কাছে ছোট করে শুরু করুন এবং ধীরে ধীরে বাড়ান।",
    "mr": "हा व्यवसाय खर्च आणि हप्त्यानंतर दर महिन्याला सुमारे ₹{buffer} वाचवतो. {scheme} योजना ({rate}% {years} वर्षे) तुमच्या प्रकल्पासाठी योग्य आहे. {village} जवळ लहान सुरुवात करा आणि हळूहळू वाढा.",
    "ta": "இந்தத் தொழில் செலவுகள் மற்றும் கடன் தவணைக்குப் பிறகு மாதந்தோறும் சுமார் ₹{buffer} மிச்சப்படுத்துகிறது. {scheme} திட்டம் ({rate}% {years} ஆண்டுகள்) உங்கள் திட்டத்திற்கு ஏற்றது. {village} அருகே சிறியதாகத் தொடங்கி படிப்படியாக வளருங்கள்.",
}

LANGUAGE_NAMES = {
    "hi": "Hindi",
    "te": "Telugu",
    "bn": "Bengali",
    "mr": "Marathi",
    "ta": "Tamil",
}

SUPPORTED_LANGS = ("en", "hi", "te", "bn", "mr", "ta")


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
        language_name = LANGUAGE_NAMES.get(code, "English")
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
        if lang_code not in SUPPORTED_LANGS:
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
        if lang_code not in SUPPORTED_LANGS:
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
        if language[:2].lower() not in SUPPORTED_LANGS:
            language = "en"
        lang_name = LANGUAGE_NAMES.get(language[:2].lower(), "English")
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
        if lang_code not in SUPPORTED_LANGS:
            lang_code = "en"
        intros = {
            "en": f"Here's an offline assessment for this {cat} case in {villa}.",
            "te": f"{villa} లోని {cat} కేసు కోసం ఆఫ్‌లైన్ అంచనా ఇక్కడ ఉంది.",
            "hi": f"{villa} के पास {cat} केस के लिए यह ऑफ़लाइन आकलन है।",
            "bn": f"{villa} এর কাছে {cat} কেসের জন্য অফলাইন মূল্যায়ন এখানে।",
            "mr": f"{villa} जवळील {cat} प्रकरणासाठी ऑफलाइन मूल्यांकन येथे आहे.",
            "ta": f"{villa} அருகிலுள்ள {cat} வழக்குக்கான ஆஃப்லைன் மதிப்பீடு இங்கே.",
        }
        lines = [intros[lang_code]]
        viabilities = {
            "en": f"- Viability score: {score} (grade {grade}).",
            "te": f"- అంచనా స్కోరు: {score} (గ్రేడ్ {grade}).",
            "hi": f"- व्यवहार्यता स्कोर: {score} (ग्रेड {grade}).",
            "bn": f"- সম্ভাব্যতা স্কোর: {score} (গ্রেড {grade})।",
            "mr": f"- व्यवहार्यता गुण: {score} (श्रेणी {grade}).",
            "ta": f"- சாத்தியக்கூறு மதிப்பெண்: {score} (தரம் {grade}).",
        }
        lines.append(viabilities[lang_code])
        if fc:
            finances = {
                "en": f"- Project cost Rs {fc.get('project_cost', 0):,}, max loan Rs {fc.get('max_loan', 0):,} under the {fc.get('scheme')} scheme at {fc.get('interest_rate')}% p.a. with quarterly EMI Rs {fc.get('emi_quarterly', 0):,}.",
                "te": f"- ప్రాజెక్ట్ ఖర్చు ₹{fc.get('project_cost', 0):,}, గరిష్ట రుణం ₹{fc.get('max_loan', 0):,}, {fc.get('scheme')} పథకం {fc.get('interest_rate')}% తో, త్రైమాసిక కిస్తు ₹{fc.get('emi_quarterly', 0):,}.",
                "hi": f"- परियोजना लागत ₹{fc.get('project_cost', 0):,}, अधिकतम ऋण ₹{fc.get('max_loan', 0):,}, {fc.get('scheme')} योजना {fc.get('interest_rate')}% पर, तिमाही किस्त ₹{fc.get('emi_quarterly', 0):,}।",
                "bn": f"- প্রকল্প ব্যয় ₹{fc.get('project_cost', 0):,}, সর্বোচ্চ ঋণ ₹{fc.get('max_loan', 0):,}, {fc.get('scheme')} প্রকল্প {fc.get('interest_rate')}% হারে, ত্রৈমাসিক কিস্তি ₹{fc.get('emi_quarterly', 0):,}।",
                "mr": f"- प्रकल्प खर्च ₹{fc.get('project_cost', 0):,}, कमाल कर्ज ₹{fc.get('max_loan', 0):,}, {fc.get('scheme')} योजना {fc.get('interest_rate')}% दराने, तिमाही हप्ता ₹{fc.get('emi_quarterly', 0):,}।",
                "ta": f"- திட்டச் செலவு ₹{fc.get('project_cost', 0):,}, அதிகபட்சக் கடன் ₹{fc.get('max_loan', 0):,}, {fc.get('scheme')} திட்டம் {fc.get('interest_rate')}% வட்டியில், காலாண்டுத் தவணை ₹{fc.get('emi_quarterly', 0):,}।",
            }
            lines.append(finances[lang_code])
        mr = feas.get("market_reach", {})
        if mr:
            reaches = {
                "en": f"- Market reach ~{mr.get('radius_km')} km with estimated {mr.get('estimated_consumers')} consumers.",
                "te": f"- మార్కెట్ పరిధి ~{mr.get('radius_km')} కి.మీ, సుమారు {mr.get('estimated_consumers')} వినియోగదారులు.",
                "hi": f"- बाज़ार पहुँच ~{mr.get('radius_km')} किमी, अनुमानित {mr.get('estimated_consumers')} उपभोक्ता।",
                "bn": f"- বাজার পরিধি ~{mr.get('radius_km')} কিমি, আনুমানিক {mr.get('estimated_consumers')} ভোক্তা।",
                "mr": f"- बाजार पोहोच ~{mr.get('radius_km')} किमी, अंदाजे {mr.get('estimated_consumers')} ग्राहक.",
                "ta": f"- சந்தை வரம்பு ~{mr.get('radius_km')} கி.மீ., மதிப்பிடப்பட்ட {mr.get('estimated_consumers')} நுகர்வோர்.",
            }
            lines.append(reaches[lang_code])
        closings = {
            "en": "This is a template response because the AI service is offline. Review the feasibility and financial details in the case for your decision.",
            "te": "AI సేవ ఆఫ్‌లైన్లో ఉన్నందున ఇది టెంప్లేట్ సమాధానం. నిర్ణయానికి ముందు కేసులోని ఫీజిబిలిటీ మరియు ఆర్థిక వివరాలు సమీక్షించండి.",
            "hi": "एआई सेवा ऑफ़लाइन होने के कारण यह टेम्पलेट उत्तर है। निर्णय से पहले केस की व्यवहार्यता और वित्तीय विवरण समीक्षा करें।",
            "bn": "AI পরিষেবা অফলাইন থাকায় এটি একটি টেমপ্লেট উত্তর। সিদ্ধান্তের আগে কেসের সম্ভাব্যতা ও আর্থিক বিবরণ পর্যালোচনা করুন।",
            "mr": "AI सेवा ऑफलाइन असल्याने हे टेम्पलेट उत्तर आहे. निर्णयापूर्वी प्रकरणातील व्यवहार्यता आणि आर्थिक तपशील तपासा.",
            "ta": "AI சேவை ஆஃப்லைனில் இருப்பதால் இது ஒரு டெம்ப்ளேட் பதில். முடிவெடுப்பதற்கு முன் வழக்கின் சாத்தியம் மற்றும் நிதி விவரங்களை மதிப்பாய்வு செய்யுங்கள்.",
        }
        lines.append(closings[lang_code])
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
        category_names = {
            "hi": {"Dairy": "डेयरी", "Retail": "खुदरा", "Textile": "वस्त्र", "Food Processing": "खाद्य प्रसंस्करण", "Poultry": "पोल्ट्री", "Kirana": "किराना", "Services": "सेवाएँ", "Food": "खाद्य"},
            "te": {"Dairy": "పాడి పరిశ్రమ", "Retail": "రిటైల్", "Textile": "వస్త్రాలు", "Food Processing": "ఆహార ప్రాసెసింగ్", "Poultry": "పౌల్ట్రీ", "Kirana": "కిరాణా", "Services": "సేవలు", "Food": "ఆహారం"},
            "bn": {"Dairy": "দুগ্ধ", "Retail": "খুচরা", "Textile": "বস্ত্র", "Food Processing": "খাদ্য প্রক্রিয়াকরণ", "Poultry": "পোল্ট্রি", "Kirana": "মুদি", "Services": "পরিষেবা", "Food": "খাদ্য"},
            "mr": {"Dairy": "दुग्ध", "Retail": "किरकोळ", "Textile": "कापड", "Food Processing": "अन्न प्रक्रिया", "Poultry": "कुक्कुटपालन", "Kirana": "किराणा", "Services": "सेवा", "Food": "अन्न"},
            "ta": {"Dairy": "பால் பண்ணை", "Retail": "சில்லறை", "Textile": "துணி", "Food Processing": "உணவு பதப்படுத்தல்", "Poultry": "கோழிப்பண்ணை", "Kirana": "மளிகை", "Services": "சேவைகள்", "Food": "உணவு"},
        }
        display_category = category_names.get(lang_code, {}).get(category, category)
        swot_en = {
            "strengths": f"Good local demand for {category} near {village}; 3 supply points within 6km.",
            "weaknesses": "First-time entrepreneur; needs working capital discipline.",
            "opportunities": "Underserved value-added niche; premium pricing possible.",
            "threats": "Seasonal dips and single-buyer concentration.",
        }
        if lang_code == "hi":
            swot = {
                "strengths": f"{village} के पास {display_category} की अच्छी माँग; 6 किमी में 3 आपूर्ति केंद्र।",
                "weaknesses": "पहली बार उद्यमी; कार्यशील पूँजी अनुशासन ज़रूरी।",
                "opportunities": "मूल्य-वर्धित आला बाज़ार में अवसर; प्रीमियम मूल्य संभव।",
                "threats": "मौसमी उतार-चढ़ाव और एकल-खरीदार निर्भरता।",
            }
        elif lang_code == "te":
            swot = {
                "strengths": f"{village} దగ్గర {display_category}కు మంచి డిమాండ్; 6 కి.మీ.లో 3 సరఫరా కేంద్రాలు.",
                "weaknesses": "మొదటిసారి వ్యవస్థాపకుడు; వర్కింగ్ క్యాపిటల్ క్రమశిక్షణ అవసరం.",
                "opportunities": "విలువ-ఆధారిత నిచ్ లో అవకాశం; ప్రీమియం ధర సాధ్యం.",
                "threats": "సీజనల్ హెచ్చుతగ్గులు మరియు ఒకే కొనుగోలుదారుపై ఆధారపడటం.",
            }
        elif lang_code == "bn":
            swot = {
                "strengths": f"{village} এর কাছে {display_category} এর ভালো চাহিদা; ৬ কিমির মধ্যে ৩টি সরবরাহ কেন্দ্র।",
                "weaknesses": "প্রথমবারের উদ্যোক্তা; কার্যকরী মূলধনে শৃঙ্খলা জরুরি।",
                "opportunities": "মূল্য সংযোজন বাজারে সুযোগ; প্রিমিয়াম দাম সম্ভব।",
                "threats": "মৌসুমি ওঠানামা ও একক ক্রেতা নির্ভরতা।",
            }
        elif lang_code == "mr":
            swot = {
                "strengths": f"{village} जवळ {display_category} ची चांगली मागणी; ६ किमीमध्ये ३ पुरवठा केंद्रे.",
                "weaknesses": "पहिल्यांदाच उद्योजक; खेळत्या भांडवलात शिस्त आवश्यक.",
                "opportunities": "मूल्यवर्धित बाजारपेठेत संधी; प्रीमियम किंमत शक्य.",
                "threats": "हंगामी चढ-उतार आणि एकल-खरेदीदार अवलंबित्व.",
            }
        elif lang_code == "ta":
            swot = {
                "strengths": f"{village} அருகே {display_category}-க்கு நல்ல தேவை; 6 கி.மீ.க்குள் 3 வழங்கல் மையங்கள்.",
                "weaknesses": "முதல் முறை தொழில்முனைவோர்; செயல்பாட்டு மூலதன ஒழுக்கம் அவசியம்.",
                "opportunities": "மதிப்பு கூட்டப்பட்ட சந்தையில் வாய்ப்பு; பிரீமியம் விலை சாத்தியம்.",
                "threats": "பருவகால ஏற்ற இறக்கங்கள் மற்றும் ஒற்றை வாங்குபவர் சார்பு.",
            }
        else:
            swot = swot_en

        pricing_notes = {
            "en": "Suggested band ±12% around district median; align with local purchasing power.",
            "hi": "जिले के औसत मूल्य के आसपास ±12% सीमा रखें और स्थानीय क्रय-शक्ति के अनुसार तय करें।",
            "te": "జిల్లా మధ్యస్థ ధర చుట్టూ ±12% పరిధిని ఉంచి, స్థానిక కొనుగోలు శక్తికి అనుగుణంగా ధర నిర్ణయించండి.",
            "bn": "জেলার গড় দামের আশেপাশে ±12% সীমা রাখুন এবং স্থানীয় ক্রয়ক্ষমতা অনুযায়ী নির্ধারণ করুন।",
            "mr": "जिल्ह्याच्या सरासरी किमतीभोवती ±12% पट्टा ठेवा आणि स्थानिक खरेदीशक्तीनुसार ठरवा.",
            "ta": "மாவட்ட சராசரி விலையைச் சுற்றி ±12% வரம்பை வைத்து, உள்ளூர் வாங்கும் திறனுக்கு ஏற்ப விலை நிர்ணயம் செய்யுங்கள்.",
        }
        return {
            "swot": swot,
            "opportunity_insight": summary,
            "threats_note": swot["threats"],
            "pricing_note": pricing_notes.get(lang_code, pricing_notes["en"]),
            "vernacular_summary": summary,
            "_model": "template",
            "_source": "template",
        }
