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
};

export function localizeMapStory(lang: UiLang, loc: MapStoryLocation): MapStoryLocation {
  const copy = COPY[lang][loc.id] ?? COPY.en[loc.id];
  return {
    ...loc,
    ...copy,
    metric: { label: copy.metricLabel, value: loc.metric.value, sub: copy.metricSub },
  };
}
