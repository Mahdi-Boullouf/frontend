import { useState } from "react";
import type { ModifierOption, Product } from "../../lib/types";
import { useT } from "../../lib/i18n/I18nContext";
import { Button, Modal } from "../../components/ui";

export function ModifierSelectionModal({
  product,
  onClose,
  onAdd,
}: {
  product: Product;
  onClose: () => void;
  onAdd: (optionIds: string[]) => void;
}) {
  const { t } = useT();
  const groups = product.modifierGroups ?? [];
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [error, setError] = useState("");

  const toggleSingle = (groupId: string, optionId: string) => {
    setSelected((prev) => ({ ...prev, [groupId]: [optionId] }));
  };

  const toggleMultiple = (groupId: string, optionId: string) => {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      const next = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId];
      return { ...prev, [groupId]: next };
    });
  };

  const allOptionsById = new Map<string, ModifierOption>(groups.flatMap((g) => g.options.map((o) => [o.id, o])));
  const selectedIds = Object.values(selected).flat();
  const modifiersTotal = selectedIds.reduce((sum, id) => sum + (allOptionsById.get(id)?.price ?? 0), 0);
  const unitPrice = product.price + modifiersTotal;

  const handleAdd = () => {
    for (const group of groups) {
      if (group.required && (selected[group.id]?.length ?? 0) === 0) {
        setError(`"${group.name}" — ${t("modifiers.requiredBadge")}`);
        return;
      }
    }
    onAdd(selectedIds);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={product.name}>
      <div className="space-y-4 max-h-[55vh] overflow-y-auto -mx-1 px-1">
        {groups.map((group) => (
          <div key={group.id}>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium text-neutral-900">{group.name}</p>
              {group.required && (
                <span className="text-[11px] font-medium text-brand-600 bg-brand-50 rounded-full px-2 py-0.5">
                  {t("modifiers.requiredBadge")}
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {group.options.map((option) => {
                const checked = (selected[group.id] ?? []).includes(option.id);
                return (
                  <label
                    key={option.id}
                    className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm cursor-pointer ${
                      checked ? "border-brand-400 bg-brand-50" : "border-neutral-200"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type={group.type === "SINGLE" ? "radio" : "checkbox"}
                        name={group.id}
                        checked={checked}
                        onChange={() => (group.type === "SINGLE" ? toggleSingle(group.id, option.id) : toggleMultiple(group.id, option.id))}
                      />
                      {option.name}
                    </span>
                    <span className="text-neutral-500">{option.price > 0 ? `+${option.price.toLocaleString()} DZD` : t("modifiers.free")}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button onClick={handleAdd} className="w-full justify-center">
          {t("modifiers.addToCart")} · {unitPrice.toLocaleString()} DZD
        </Button>
      </div>
    </Modal>
  );
}
