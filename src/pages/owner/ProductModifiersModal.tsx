import { useState } from "react";
import { api, ApiError } from "../../lib/api";
import type { ModifierType, Product } from "../../lib/types";
import { useT } from "../../lib/i18n/I18nContext";
import { Button, Modal } from "../../components/ui";

interface DraftOption {
  key: string;
  name: string;
  price: string;
}

interface DraftGroup {
  key: string;
  name: string;
  type: ModifierType;
  required: boolean;
  options: DraftOption[];
}

let keyCounter = 0;
const nextKey = () => `k${++keyCounter}`;

function toDraftGroups(product: Product): DraftGroup[] {
  return (product.modifierGroups ?? []).map((group) => ({
    key: nextKey(),
    name: group.name,
    type: group.type,
    required: group.required,
    options: group.options.map((option) => ({ key: nextKey(), name: option.name, price: String(option.price) })),
  }));
}

export function ProductModifiersModal({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) {
  const { t } = useT();
  const [groups, setGroups] = useState<DraftGroup[]>(() => toDraftGroups(product));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const addGroup = () => {
    setGroups((prev) => [...prev, { key: nextKey(), name: "", type: "SINGLE", required: false, options: [] }]);
  };

  const removeGroup = (key: string) => {
    setGroups((prev) => prev.filter((g) => g.key !== key));
  };

  const updateGroup = (key: string, patch: Partial<DraftGroup>) => {
    setGroups((prev) => prev.map((g) => (g.key === key ? { ...g, ...patch } : g)));
  };

  const addOption = (groupKey: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.key === groupKey ? { ...g, options: [...g.options, { key: nextKey(), name: "", price: "0" }] } : g)),
    );
  };

  const removeOption = (groupKey: string, optionKey: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.key === groupKey ? { ...g, options: g.options.filter((o) => o.key !== optionKey) } : g)),
    );
  };

  const updateOption = (groupKey: string, optionKey: string, patch: Partial<DraftOption>) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.key === groupKey
          ? { ...g, options: g.options.map((o) => (o.key === optionKey ? { ...o, ...patch } : o)) }
          : g,
      ),
    );
  };

  const handleSave = async () => {
    setError("");

    for (const group of groups) {
      if (!group.name.trim() || group.options.some((o) => !o.name.trim())) {
        setError(t("modifiers.needName"));
        return;
      }
      if (group.options.length === 0) {
        setError(t("modifiers.needOption"));
        return;
      }
    }

    setSaving(true);
    try {
      await api.put(`/products/${product.id}/modifiers`, {
        groups: groups.map((g) => ({
          name: g.name,
          type: g.type,
          required: g.required,
          options: g.options.map((o) => ({ name: o.name, price: Number(o.price) || 0 })),
        })),
      });
      onClose();
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("modifiers.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={t("modifiers.title", { name: product.name })}>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto -mx-1 px-1">
        {groups.length === 0 && <p className="text-sm text-neutral-400">{t("modifiers.empty")}</p>}

        {groups.map((group) => (
          <div key={group.key} className="rounded-md border border-neutral-200 p-3 space-y-3">
            <div className="flex items-start gap-2">
              <input
                value={group.name}
                onChange={(e) => updateGroup(group.key, { name: e.target.value })}
                placeholder={t("modifiers.groupNamePlaceholder")}
                className="flex-1 rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <button
                onClick={() => removeGroup(group.key)}
                className="text-neutral-400 hover:text-red-600 text-lg leading-none px-1"
                aria-label={t("modifiers.removeGroup")}
              >
                &times;
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <select
                value={group.type}
                onChange={(e) => updateGroup(group.key, { type: e.target.value as ModifierType })}
                className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="SINGLE">{t("modifiers.typeSingle")}</option>
                <option value="MULTIPLE">{t("modifiers.typeMultiple")}</option>
              </select>
              <label className="flex items-center gap-1.5 text-neutral-600">
                <input
                  type="checkbox"
                  checked={group.required}
                  onChange={(e) => updateGroup(group.key, { required: e.target.checked })}
                />
                {t("modifiers.required")}
              </label>
            </div>

            <div className="space-y-2">
              {group.options.map((option) => (
                <div key={option.key} className="flex items-center gap-2">
                  <input
                    value={option.name}
                    onChange={(e) => updateOption(group.key, option.key, { name: e.target.value })}
                    placeholder={t("modifiers.optionName")}
                    className="flex-1 rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={option.price}
                    onChange={(e) => updateOption(group.key, option.key, { price: e.target.value })}
                    placeholder={t("modifiers.optionPrice")}
                    className="w-28 rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <button
                    onClick={() => removeOption(group.key, option.key)}
                    className="text-neutral-400 hover:text-red-600 text-lg leading-none px-1"
                    aria-label={t("modifiers.removeOption")}
                  >
                    &times;
                  </button>
                </div>
              ))}
              <Button variant="secondary" onClick={() => addOption(group.key)} className="text-xs">
                {t("modifiers.addOption")}
              </Button>
            </div>
          </div>
        ))}

        <Button variant="secondary" onClick={addGroup} className="w-full justify-center">
          {t("modifiers.addGroup")}
        </Button>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button onClick={handleSave} disabled={saving} className="w-full justify-center">
          {saving ? t("common.saving") : t("modifiers.save")}
        </Button>
      </div>
    </Modal>
  );
}
