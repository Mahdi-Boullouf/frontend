import { useT } from "../lib/i18n/I18nContext";
import type { Lang } from "../lib/i18n/translations";

const OPTIONS: { code: Lang; label: string }[] = [
  { code: "ar", label: "العربية" },
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
];

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useT();

  return (
    <div className={`flex rounded-md border border-neutral-300 overflow-hidden text-xs ${className}`}>
      {OPTIONS.map((option) => (
        <button
          key={option.code}
          onClick={() => setLang(option.code)}
          className={`flex-1 px-2 py-1.5 font-medium transition-colors ${
            lang === option.code ? "bg-brand-600 text-white" : "bg-white text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
