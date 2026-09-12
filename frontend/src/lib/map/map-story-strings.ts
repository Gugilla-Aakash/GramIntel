import type { UiLang } from "../assistant-strings";
import type { MapStoryLocation } from "./map-story";

type Copy = Pick<MapStoryLocation, "subtitle" | "narrative" | "intelligenceLabel" | "intelligenceDetail" | "context"> & {
  metricLabel: string;
  metricSub: string;
};

const COPY: Record<UiLang, Record<string, Copy>> = {
  en: {
    gandipet: { subtitle: "Hyderabad · Telangana", narrative: "Start with your own local economy.", intelligenceLabel: "LOCAL MARKET", intelligenceDetail: "5 km market reach · real local roads & places", context: "peri-urban / high-density market", metricLabel: "EST. CONSUMERS", metricSub: "10 km · AI estimate" },
    warangal: { subtitle: "Warangal · Telangana", narrative: "A regional market changes the scale of opportunity.", intelligenceLabel: "REGIONAL DEMAND", intelligenceDetail: "Textiles · agriculture · regional distribution", context: "regional commercial / agricultural economy", metricLabel: "REGIONAL REACH", metricSub: "40 km · estimate" },
    nizamabad: { subtitle: "Nizamabad · Telangana", narrative: "Local production creates local opportunity.", intelligenceLabel: "SUPPLY + DEMAND", intelligenceDetail: "Agriculture · food processing · dairy", context: "agricultural and food-processing economy", metricLabel: "SUPPLY NODES", metricSub: "co-ops & markets · demo" },
    karimnagar: { subtitle: "Karimnagar · Telangana", narrative: "Competition reveals what the market still lacks.", intelligenceLabel: "COMPETITION GAP", intelligenceDetail: "Retail density · services · small manufacturing", context: "semi-urban + agricultural economy", metricLabel: "GAP SIGNAL", metricSub: "Value-add gap · low competition · estimate" },
    khammam: { subtitle: "Khammam · Telangana", narrative: "Turn geographic signals into a business decision.", intelligenceLabel: "BUSINESS OPPORTUNITY", intelligenceDetail: "Market + transport + distribution · opportunity overlay", context: "agriculture + trade + rural markets", metricLabel: "OPPORTUNITY", metricSub: "Good potential · estimate" },
  },
  hi: {
    gandipet: { subtitle: "हैदराबाद · तेलंगाना", narrative: "अपनी स्थानीय अर्थव्यवस्था से शुरुआत करें।", intelligenceLabel: "स्थानीय बाज़ार", intelligenceDetail: "5 किमी बाज़ार पहुँच · स्थानीय सड़कें और स्थान", context: "शहर के आसपास / उच्च घनत्व वाला बाज़ार", metricLabel: "अनुमानित उपभोक्ता", metricSub: "10 किमी · AI अनुमान" },
    warangal: { subtitle: "वारंगल · तेलंगाना", narrative: "क्षेत्रीय बाज़ार अवसर का पैमाना बदलता है।", intelligenceLabel: "क्षेत्रीय मांग", intelligenceDetail: "वस्त्र · कृषि · क्षेत्रीय वितरण", context: "क्षेत्रीय वाणिज्यिक / कृषि अर्थव्यवस्था", metricLabel: "क्षेत्रीय पहुँच", metricSub: "40 किमी · अनुमान" },
    nizamabad: { subtitle: "निज़ामाबाद · तेलंगाना", narrative: "स्थानीय उत्पादन स्थानीय अवसर बनाता है।", intelligenceLabel: "आपूर्ति + मांग", intelligenceDetail: "कृषि · खाद्य प्रसंस्करण · डेयरी", context: "कृषि और खाद्य-प्रसंस्करण अर्थव्यवस्था", metricLabel: "आपूर्ति केंद्र", metricSub: "सहकारी संस्थाएँ और बाज़ार · डेमो" },
    karimnagar: { subtitle: "करीमनगर · तेलंगाना", narrative: "प्रतिस्पर्धा दिखाती है कि बाज़ार में अभी क्या कमी है।", intelligenceLabel: "प्रतिस्पर्धा अंतर", intelligenceDetail: "खुदरा घनत्व · सेवाएँ · लघु विनिर्माण", context: "अर्ध-शहरी + कृषि अर्थव्यवस्था", metricLabel: "अंतर संकेत", metricSub: "मूल्य-वर्धन अंतर · कम प्रतिस्पर्धा · अनुमान" },
    khammam: { subtitle: "खम्मम · तेलंगाना", narrative: "भौगोलिक संकेतों को व्यावसायिक निर्णय में बदलें।", intelligenceLabel: "व्यावसायिक अवसर", intelligenceDetail: "बाज़ार + परिवहन + वितरण · अवसर परत", context: "कृषि + व्यापार + ग्रामीण बाज़ार", metricLabel: "अवसर", metricSub: "अच्छी संभावना · अनुमान" },
  },
  te: {
    gandipet: { subtitle: "హైదరాబాద్ · తెలంగాణ", narrative: "మీ స్థానిక ఆర్థిక వ్యవస్థతో ప్రారంభించండి.", intelligenceLabel: "స్థానిక మార్కెట్", intelligenceDetail: "5 కి.మీ. మార్కెట్ పరిధి · నిజమైన స్థానిక రహదారులు, ప్రదేశాలు", context: "నగర పరిసరాలు / అధిక సాంద్రత మార్కెట్", metricLabel: "అంచనా వినియోగదారులు", metricSub: "10 కి.మీ. · AI అంచనా" },
    warangal: { subtitle: "వరంగల్ · తెలంగాణ", narrative: "ప్రాంతీయ మార్కెట్ అవకాశ పరిమాణాన్ని మారుస్తుంది.", intelligenceLabel: "ప్రాంతీయ డిమాండ్", intelligenceDetail: "వస్త్రాలు · వ్యవసాయం · ప్రాంతీయ పంపిణీ", context: "ప్రాంతీయ వాణిజ్య / వ్యవసాయ ఆర్థిక వ్యవస్థ", metricLabel: "ప్రాంతీయ పరిధి", metricSub: "40 కి.మీ. · అంచనా" },
    nizamabad: { subtitle: "నిజామాబాద్ · తెలంగాణ", narrative: "స్థానిక ఉత్పత్తి స్థానిక అవకాశాన్ని సృష్టిస్తుంది.", intelligenceLabel: "సరఫరా + డిమాండ్", intelligenceDetail: "వ్యవసాయం · ఆహార ప్రాసెసింగ్ · పాడి", context: "వ్యవసాయ మరియు ఆహార ప్రాసెసింగ్ ఆర్థిక వ్యవస్థ", metricLabel: "సరఫరా కేంద్రాలు", metricSub: "సహకార సంఘాలు, మార్కెట్లు · డెమో" },
    karimnagar: { subtitle: "కరీంనగర్ · తెలంగాణ", narrative: "మార్కెట్‌లో ఇంకా ఏమి లేవో పోటీ చూపిస్తుంది.", intelligenceLabel: "పోటీ లోటు", intelligenceDetail: "రిటైల్ సాంద్రత · సేవలు · చిన్న తయారీ", context: "పాక్షిక నగర + వ్యవసాయ ఆర్థిక వ్యవస్థ", metricLabel: "లోటు సంకేతం", metricSub: "విలువ జోడింపు లోటు · తక్కువ పోటీ · అంచనా" },
    khammam: { subtitle: "ఖమ్మం · తెలంగాణ", narrative: "భౌగోళిక సంకేతాలను వ్యాపార నిర్ణయంగా మార్చండి.", intelligenceLabel: "వ్యాపార అవకాశం", intelligenceDetail: "మార్కెట్ + రవాణా + పంపిణీ · అవకాశం పొర", context: "వ్యవసాయం + వాణిజ్యం + గ్రామీణ మార్కెట్లు", metricLabel: "అవకాశం", metricSub: "మంచి అవకాశం · అంచనా" },
  },
  bn: {
    gandipet: { subtitle: "হায়দরাবাদ · তেলেঙ্গানা", narrative: "আপনার নিজের স্থানীয় অর্থনীতি দিয়ে শুরু করুন।", intelligenceLabel: "স্থানীয় বাজার", intelligenceDetail: "৫ কিমি বাজার পরিধি · আসল স্থানীয় রাস্তা ও স্থান", context: "শহরতলি / উচ্চ ঘনত্বের বাজার", metricLabel: "আনুমানিক ভোক্তা", metricSub: "১০ কিমি · AI অনুমান" },
    warangal: { subtitle: "ওয়ারাঙ্গল · তেলেঙ্গানা", narrative: "আঞ্চলিক বাজার সুযোগের মাত্রা বদলে দেয়।", intelligenceLabel: "আঞ্চলিক চাহিদা", intelligenceDetail: "বস্ত্র · কৃষি · আঞ্চলিক বণ্টন", context: "আঞ্চলিক বাণিজ্য / কৃষি অর্থনীতি", metricLabel: "আঞ্চলিক পরিধি", metricSub: "৪০ কিমি · অনুমান" },
    nizamabad: { subtitle: "নিজামাবাদ · তেলেঙ্গানা", narrative: "স্থানীয় উৎপাদন স্থানীয় সুযোগ তৈরি করে।", intelligenceLabel: "সরবরাহ + চাহিদা", intelligenceDetail: "কৃষি · খাদ্য প্রক্রিয়াকরণ · দুগ্ধ", context: "কৃষি ও খাদ্য প্রক্রিয়াকরণ অর্থনীতি", metricLabel: "সরবরাহ কেন্দ্র", metricSub: "সমবায় ও বাজার · ডেমো" },
    karimnagar: { subtitle: "করিমনগর · তেলেঙ্গানা", narrative: "প্রতিযোগিতা দেখায় বাজারে এখনও কী ঘাটতি।", intelligenceLabel: "প্রতিযোগিতা ঘাটতি", intelligenceDetail: "খুচরা ঘনত্ব · পরিষেবা · ক্ষুদ্র উৎপাদন", context: "আধা-শহুরে + কৃষি অর্থনীতি", metricLabel: "ঘাটতি সংকেত", metricSub: "মূল্য সংযোজন ঘাটতি · কম প্রতিযোগিতা · অনুমান" },
    khammam: { subtitle: "খাম্মাম · তেলেঙ্গানা", narrative: "ভৌগোলিক সংকেতকে ব্যবসায়িক সিদ্ধান্তে বদলান।", intelligenceLabel: "ব্যবসায়িক সুযোগ", intelligenceDetail: "বাজার + পরিবহন + বণ্টন · সুযোগ স্তর", context: "কৃষি + বাণিজ্য + গ্রামীণ বাজার", metricLabel: "সুযোগ", metricSub: "ভালো সম্ভাবনা · অনুমান" },
  },
  mr: {
    gandipet: { subtitle: "हैदराबाद · तेलंगणा", narrative: "तुमच्या स्थानिक अर्थव्यवस्थेपासून सुरुवात करा.", intelligenceLabel: "स्थानिक बाजार", intelligenceDetail: "५ किमी बाजार पोहोच · खरे स्थानिक रस्ते व ठिकाणे", context: "शहरालगत / उच्च घनता बाजार", metricLabel: "अंदाजे ग्राहक", metricSub: "१० किमी · AI अंदाज" },
    warangal: { subtitle: "वारंगल · तेलंगणा", narrative: "प्रादेशिक बाजार संधीचे प्रमाण बदलतो.", intelligenceLabel: "प्रादेशिक मागणी", intelligenceDetail: "कापड · शेती · प्रादेशिक वाटप", context: "प्रादेशिक व्यापारी / शेती अर्थव्यवस्था", metricLabel: "प्रादेशिक पोहोच", metricSub: "४० किमी · अंदाज" },
    nizamabad: { subtitle: "निजामाबाद · तेलंगणा", narrative: "स्थानिक उत्पादन स्थानिक संधी निर्माण करते.", intelligenceLabel: "पुरवठा + मागणी", intelligenceDetail: "शेती · अन्न प्रक्रिया · दुग्ध", context: "शेती आणि अन्न प्रक्रिया अर्थव्यवस्था", metricLabel: "पुरवठा केंद्रे", metricSub: "सहकारी संस्था व बाजार · डेमो" },
    karimnagar: { subtitle: "करिमनगर · तेलंगणा", narrative: "बाजारात अजून काय उणे आहे ते स्पर्धा दाखवते.", intelligenceLabel: "स्पर्धा तफावत", intelligenceDetail: "किरकोळ घनता · सेवा · लघु उत्पादन", context: "अर्ध-शहरी + शेती अर्थव्यवस्था", metricLabel: "तफावत संकेत", metricSub: "मूल्यवर्धन तफावत · कमी स्पर्धा · अंदाज" },
    khammam: { subtitle: "खम्माम · तेलंगणा", narrative: "भौगोलिक संकेतांचे व्यावसायिक निर्णयात रूपांतर करा.", intelligenceLabel: "व्यावसायिक संधी", intelligenceDetail: "बाजार + वाहतूक + वाटप · संधी थर", context: "शेती + व्यापार + ग्रामीण बाजार", metricLabel: "संधी", metricSub: "चांगली क्षमता · अंदाज" },
  },
  ta: {
    gandipet: { subtitle: "ஐதராபாத் · தெலங்கானா", narrative: "உங்கள் உள்ளூர் பொருளாதாரத்தில் தொடங்குங்கள்.", intelligenceLabel: "உள்ளூர் சந்தை", intelligenceDetail: "5 கி.மீ. சந்தை வரம்பு · உண்மை உள்ளூர் சாலைகள், இடங்கள்", context: "நகர்ப்புற / அதிக அடர்த்திச் சந்தை", metricLabel: "மதிப்பிட்ட நுகர்வோர்", metricSub: "10 கி.மீ. · AI மதிப்பீடு" },
    warangal: { subtitle: "வாரங்கல் · தெலங்கானா", narrative: "பிராந்தியச் சந்தை வாய்ப்பின் அளவை மாற்றும்.", intelligenceLabel: "பிராந்தியத் தேவை", intelligenceDetail: "துணி · வேளாண்மை · பிராந்திய விநியோகம்", context: "பிராந்திய வணிக / வேளாண் பொருளாதாரம்", metricLabel: "பிராந்திய வரம்பு", metricSub: "40 கி.மீ. · மதிப்பீடு" },
    nizamabad: { subtitle: "நிஜாமாபாத் · தெலங்கானா", narrative: "உள்ளூர் உற்பத்தி உள்ளூர் வாய்ப்பை உருவாக்கும்.", intelligenceLabel: "வழங்கல் + தேவை", intelligenceDetail: "வேளாண்மை · உணவு பதப்படுத்தல் · பால்", context: "வேளாண், உணவு பதப்படுத்தும் பொருளாதாரம்", metricLabel: "வழங்கல் மையங்கள்", metricSub: "கூட்டுறவுகள், சந்தைகள் · டெமோ" },
    karimnagar: { subtitle: "கரீம்நகர் · தெலங்கானா", narrative: "சந்தையில் இன்னும் என்ன இல்லை என்பதைப் போட்டி காட்டும்.", intelligenceLabel: "போட்டி இடைவெளி", intelligenceDetail: "சில்லறை அடர்த்தி · சேவைகள் · சிறு உற்பத்தி", context: "அரை நகர்ப்புற + வேளாண் பொருளாதாரம்", metricLabel: "இடைவெளிச் சமிக்ஞை", metricSub: "மதிப்பு கூட்டல் இடைவெளி · குறைந்த போட்டி · மதிப்பீடு" },
    khammam: { subtitle: "கம்மம் · தெலங்கானா", narrative: "புவியியல் சமிக்ஞைகளைத் தொழில் முடிவாக மாற்றுங்கள்.", intelligenceLabel: "தொழில் வாய்ப்பு", intelligenceDetail: "சந்தை + போக்குவரத்து + விநியோகம் · வாய்ப்பு அடுக்கு", context: "வேளாண்மை + வணிகம் + கிராமச் சந்தைகள்", metricLabel: "வாய்ப்பு", metricSub: "நல்ல வாய்ப்பு · மதிப்பீடு" },
  },
};

export function localizeMapStory(lang: UiLang, loc: MapStoryLocation): MapStoryLocation {
  const copy = COPY[lang][loc.id] ?? COPY.en[loc.id];
  return {
    ...loc,
    ...copy,
    metric: { label: copy.metricLabel, value: loc.metric.value, sub: copy.metricSub },
  };
}
