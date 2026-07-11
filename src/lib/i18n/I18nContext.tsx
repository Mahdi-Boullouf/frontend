import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, RTL_LANGS, type Lang, type TranslationKey } from "./translations";

type Vars = Record<string, string | number>;

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  dir: "ltr" | "rtl";
  t: (key: TranslationKey, vars?: Vars) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ""));
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem("lang") as Lang) || "ar");
  const dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = (next: Lang) => {
    localStorage.setItem("lang", next);
    setLangState(next);
  };

  const t = (key: TranslationKey, vars?: Vars) => {
    const template = translations[lang][key] ?? translations.en[key] ?? key;
    const withPlural = vars && "count" in vars ? { ...vars, plural: Number(vars.count) === 1 ? "" : "s" } : vars;
    return interpolate(template, withPlural);
  };

  return <I18nContext.Provider value={{ lang, setLang, dir, t }}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within I18nProvider");
  return ctx;
}
