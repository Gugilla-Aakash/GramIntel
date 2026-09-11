"use client";

import { useEffect, useState } from "react";
import type { UiLang } from "./assistant-strings";

export type { UiLang };

export const LANG_KEY = "gramintel_ui_lang";
export const LANG_EVENT = "gi-lang";

export type LandingSection = "HERO" | "NAV";

export const LANG_OPTIONS: { code: UiLang; label: string; name: string }[] = [
  { code: "en", label: "EN", name: "English" },
  { code: "hi", label: "हि", name: "हिन्दी" },
  { code: "te", label: "తె", name: "తెలుగు" },
];

export interface HeroStrings {
  eyebrow: string;
  line1: string;
  line2: string;
  line3a: string;
  line3b: string;
  line4: string;
  sub: string;
  ctaPrimary: string;
  ctaSecondary: string;
  mapLink: string;
}

export interface NavStrings {
  links: [string, string, string, string, string, string, string];
  cta: string;
  menuCta: string;
  langLabel: string;
}

export const HERO: Record<UiLang, HeroStrings> = {
  en: {
    eyebrow: "AI for grassroots entrepreneurship",
    line1: "Turn local",
    line2: "opportunity",
    line3a: "into a",
    line3b: "sustainable",
    line4: "business",
    sub: "GramIntel reads the economic signals around your village — consumers, competition, demand — and turns them into a business decision you can defend.",
    ctaPrimary: "Analyze my business",
    ctaSecondary: "See how it thinks",
    mapLink: "Explore the live business map",
  },
  hi: {
    eyebrow: "ग्रामीण उद्यमिता के लिए AI",
    line1: "स्थानीय",
    line2: "अवसर",
    line3a: "को",
    line3b: "टिकाऊ",
    line4: "व्यवसाय बनाएँ",
    sub: "GramIntel आपके गाँव के आर्थिक संकेतों — उपभोक्ता, प्रतिस्पर्धा, मांग — को पढ़ता है और उन्हें ठोस व्यावसायिक निर्णय में बदलता है।",
    ctaPrimary: "मेरा व्यवसाय विश्लेषण करें",
    ctaSecondary: "यह कैसे सोचता है देखें",
    mapLink: "लाइव बिज़नेस मानचित्र देखें",
  },
  te: {
    eyebrow: "గ్రామీణ వ్యవస్థాపకత కోసం AI",
    line1: "స్థానిక",
    line2: "అవకాశాన్ని",
    line3a: "",
    line3b: "స్థిరమైన",
    line4: "వ్యాపారంగా మార్చండి",
    sub: "GramIntel మీ గ్రామం చుట్టూ ఆర్థిక సంకేతాలను — వినియోగదారులు, పోటీ, డిమాండ్ — చదివి వాటిని నమ్మకమైన వ్యాపార నిర్ణయంగా మారుస్తుంది.",
    ctaPrimary: "నా వ్యాపారాన్ని విశ్లేషించండి",
    ctaSecondary: "ఇది ఎలా ఆలోచిస్తుందో చూడండి",
    mapLink: "లైవ్ వ్యాపార మ్యాప్ చూడండి",
  },
};

export const NAV: Record<UiLang, NavStrings> = {
  en: {
    links: ["Method", "Map", "Market", "Viability", "Finance", "Schemes", "Language"],
    cta: "Analyze my business",
    menuCta: "ANALYZE MY BUSINESS",
    langLabel: "Language",
  },
  hi: {
    links: ["विधि", "मानचित्र", "बाज़ार", "व्यवहार्यता", "वित्त", "योजनाएँ", "भाषा"],
    cta: "मेरा व्यवसाय विश्लेषण करें",
    menuCta: "मेरा व्यवसाय विश्लेषण करें",
    langLabel: "भाषा",
  },
  te: {
    links: ["పద్ధతి", "మ్యాప్", "మార్కెట్", "సాధ్యత", "ఆర్థిక", "పథకాలు", "భాష"],
    cta: "నా వ్యాపారాన్ని విశ్లేషించండి",
    menuCta: "నా వ్యాపారాన్ని విశ్లేషించండి",
    langLabel: "భాష",
  },
};

export function tL(lang: UiLang, section: LandingSection, key: string): string {
  const table = section === "HERO" ? HERO : NAV;
  const get = (l: UiLang): string | undefined => {
    const dict = table[l] as unknown as Record<string, unknown> | undefined;
    if (!dict) return undefined;
    if (section === "NAV" && key.startsWith("links.")) {
      const i = Number(key.slice("links.".length));
      const arr = dict["links"] as unknown;
      if (Array.isArray(arr) && Number.isInteger(i) && i >= 0 && i < arr.length) {
        return typeof arr[i] === "string" ? (arr[i] as string) : undefined;
      }
      return undefined;
    }
    const v = dict[key];
    return typeof v === "string" ? v : undefined;
  };
  return get(lang) ?? get("en") ?? key;
}

export function getUiLang(): UiLang {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v === "en" || v === "hi" || v === "te") return v;
  } catch {}
  return "en";
}

export function setUiLang(l: UiLang): void {
  try {
    localStorage.setItem(LANG_KEY, l);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent<UiLang>(LANG_EVENT, { detail: l }));
  } catch {}
}

export function useUiLang(): UiLang {
  const [lang, setLang] = useState<UiLang>("en");
  useEffect(() => {
    setLang(getUiLang());
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LANG_KEY) return;
      if (e.newValue === "en" || e.newValue === "hi" || e.newValue === "te") setLang(e.newValue);
      else if (e.newValue === null) setLang("en");
    };
    const onCustom = (e: Event) => {
      const v = (e as CustomEvent<UiLang>).detail;
      if (v === "en" || v === "hi" || v === "te") setLang(v);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(LANG_EVENT, onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(LANG_EVENT, onCustom as EventListener);
    };
  }, []);
  return lang;
}
