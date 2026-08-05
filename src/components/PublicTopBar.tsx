import { LanguageSwitcher } from "./LanguageSwitcher";

export function PublicTopBar() {
  return (
    <div className="sticky top-0 z-20 bg-white border-b border-neutral-200 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img src="/favicon.svg" alt="" className="w-7 h-7" />
        <span className="text-lg font-semibold tracking-tight text-brand-600">TablaScan</span>
      </div>
      <LanguageSwitcher className="w-40" />
    </div>
  );
}
