import { LanguageSwitcher } from "./LanguageSwitcher";

export function PublicTopBar() {
  return (
    <div className="sticky top-0 z-20 bg-white border-b border-neutral-200 px-4 py-2 flex justify-end">
      <LanguageSwitcher className="w-40" />
    </div>
  );
}
