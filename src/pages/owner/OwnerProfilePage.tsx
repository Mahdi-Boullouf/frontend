import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError, API_ORIGIN } from "../../lib/api";
import type { Restaurant } from "../../lib/types";
import { useT } from "../../lib/i18n/I18nContext";
import { Button, Card } from "../../components/ui";
import { SubscriptionLocked } from "../../components/SubscriptionLocked";

export function OwnerProfilePage() {
  const { t } = useT();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [description, setDescription] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [lockedMessage, setLockedMessage] = useState("");

  useEffect(() => {
    api
      .get<Restaurant>("/restaurants/me")
      .then((data) => {
        setRestaurant(data);
        setDescription(data.description ?? "");
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) setLockedMessage(err.message);
        else setError(err instanceof ApiError ? err.message : t("profile.loadFailed"));
      })
      .finally(() => setLoading(false));
  }, [t]);

  if (lockedMessage) return <SubscriptionLocked message={lockedMessage} />;
  if (loading || !restaurant) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("description", description);
      if (logoFile) formData.append("logo", logoFile);
      const updated = await api.patch<Restaurant>("/restaurants/me", formData);
      setRestaurant(updated);
      setLogoFile(null);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("profile.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const logoPreview = logoFile ? URL.createObjectURL(logoFile) : restaurant.logo ? `${API_ORIGIN}${restaurant.logo}` : null;

  return (
    <div className="max-w-lg">
      <Card className="p-6">
        <p className="text-sm font-medium text-neutral-700 mb-4">{restaurant.name}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">{t("profile.logo")}</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center">
                {logoPreview && <img src={logoPreview} alt="" className="w-full h-full object-cover" />}
              </div>
              <label className="cursor-pointer">
                <span className="rounded-md px-3 py-2 text-sm font-medium bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50">
                  {restaurant.logo ? t("profile.changeLogo") : t("profile.uploadLogo")}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">{t("profile.bio")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("profile.bioPlaceholder")}
              rows={4}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-green-600">{t("profile.saved")}</p>}

          <Button type="submit" disabled={saving}>
            {saving ? t("common.saving") : t("profile.save")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
