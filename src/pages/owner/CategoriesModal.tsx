import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../../lib/api";
import type { Category } from "../../lib/types";
import { useT } from "../../lib/i18n/I18nContext";
import { Button, Modal } from "../../components/ui";

export function CategoriesModal({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) {
  const { t } = useT();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setCategories(await api.get<Category[]>("/categories"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("categories.loadFailed"));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError("");
    setSaving(true);
    try {
      await api.post("/categories", { name: newName.trim() });
      setNewName("");
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("categories.addFailed"));
    } finally {
      setSaving(false);
    }
  };

  const rename = async (category: Category, name: string) => {
    if (!name.trim() || name === category.name) return;
    setError("");
    try {
      await api.patch(`/categories/${category.id}`, { name: name.trim() });
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("categories.renameFailed"));
    }
  };

  const remove = async (category: Category) => {
    if (!confirm(t("categories.confirmDelete", { name: category.name }))) return;
    setError("");
    try {
      await api.delete(`/categories/${category.id}`);
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("categories.deleteFailed"));
    }
  };

  return (
    <Modal open onClose={onClose} title={t("categories.title")}>
      <div className="space-y-4">
        {!loading && categories.length === 0 && <p className="text-sm text-neutral-400">{t("categories.empty")}</p>}

        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-2">
              <input
                defaultValue={category.name}
                onBlur={(e) => rename(category, e.target.value)}
                className="flex-1 rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <Button variant="danger" onClick={() => remove(category)}>
                {t("categories.delete")}
              </Button>
            </div>
          ))}
        </div>

        <form onSubmit={addCategory} className="flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("categories.namePlaceholder")}
            className="flex-1 rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <Button type="submit" disabled={saving}>
            {t("categories.add")}
          </Button>
        </form>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
