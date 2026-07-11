import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../../lib/api";
import type { Restaurant, SubscriptionPlan } from "../../lib/types";
import { useT } from "../../lib/i18n/I18nContext";
import { Badge, Button, Card, Input, Modal } from "../../components/ui";

function statusFor(restaurant: Restaurant, t: ReturnType<typeof useT>["t"]): { label: string; tone: "green" | "red" | "amber" } {
  if (!restaurant.subscriptionEndAt) return { label: t("admin.status.noPlan"), tone: "red" };
  const endsAt = new Date(restaurant.subscriptionEndAt);
  if (endsAt < new Date()) return { label: t("admin.status.expired"), tone: "red" };
  const daysLeft = Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 3) return { label: t("admin.status.daysLeft", { days: daysLeft }), tone: "amber" };
  return { label: t("admin.status.active"), tone: "green" };
}

export function AdminRestaurantsPage() {
  const { t } = useT();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Restaurant | null>(null);

  const load = async () => {
    setLoading(true);
    const [restaurantData, planData] = await Promise.all([
      api.get<Restaurant[]>("/restaurants"),
      api.get<SubscriptionPlan[]>("/subscription-plans"),
    ]);
    setRestaurants(restaurantData);
    setPlans(planData);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-neutral-500">{t("admin.count", { count: restaurants.length })}</p>
        <Button onClick={() => setCreateOpen(true)}>{t("admin.newRestaurant")}</Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-start text-neutral-500">
              <th className="px-4 py-3 font-medium text-start">{t("admin.colName")}</th>
              <th className="px-4 py-3 font-medium text-start">{t("admin.colOwner")}</th>
              <th className="px-4 py-3 font-medium text-start">{t("admin.colPlan")}</th>
              <th className="px-4 py-3 font-medium text-start">{t("admin.colStatus")}</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {!loading && restaurants.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                  {t("admin.empty")}
                </td>
              </tr>
            )}
            {restaurants.map((restaurant) => {
              const status = statusFor(restaurant, t);
              return (
                <tr key={restaurant.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-neutral-900">{restaurant.name}</td>
                  <td className="px-4 py-3 text-neutral-600">{restaurant.memeber?.email}</td>
                  <td className="px-4 py-3 text-neutral-600">{restaurant.subscriptionPlan?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Button variant="secondary" onClick={() => setAssignTarget(restaurant)}>
                      {t("admin.manageSubscription")}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <CreateRestaurantModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />
      {assignTarget && (
        <AssignSubscriptionModal
          restaurant={assignTarget}
          plans={plans}
          onClose={() => setAssignTarget(null)}
          onAssigned={load}
        />
      )}
    </div>
  );
}

function CreateRestaurantModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { t } = useT();
  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName("");
    setOwnerEmail("");
    setOwnerPassword("");
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/restaurants", { name, ownerEmail, ownerPassword });
      reset();
      onClose();
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("admin.create.failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={t("admin.create.title")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{t("admin.create.name")}</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{t("admin.create.ownerEmail")}</label>
          <Input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{t("admin.create.ownerPassword")}</label>
          <Input type="password" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} minLength={6} required />
        </div>
        <p className="text-xs text-neutral-400">{t("admin.create.trialNote")}</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={saving} className="w-full justify-center">
          {saving ? t("admin.create.submitting") : t("admin.create.submit")}
        </Button>
      </form>
    </Modal>
  );
}

function AssignSubscriptionModal({
  restaurant,
  plans,
  onClose,
  onAssigned,
}: {
  restaurant: Restaurant;
  plans: SubscriptionPlan[];
  onClose: () => void;
  onAssigned: () => void;
}) {
  const { t } = useT();
  const [planId, setPlanId] = useState(plans.find((p) => !p.isTrial)?.id ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAssign = async () => {
    setError("");
    setSaving(true);
    try {
      await api.patch(`/restaurants/${restaurant.id}/subscription`, { subscriptionPlanId: planId });
      onClose();
      onAssigned();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("admin.assign.failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={t("admin.assign.title", { name: restaurant.name })}>
      <div className="space-y-4">
        <p className="text-sm text-neutral-500">
          {t("admin.assign.currentPlan")}{" "}
          <span className="font-medium text-neutral-700">{restaurant.subscriptionPlan?.name ?? t("admin.assign.none")}</span>
          {restaurant.subscriptionEndAt && (
            <> · {t("admin.assign.ends", { date: new Date(restaurant.subscriptionEndAt).toLocaleDateString() })}</>
          )}
        </p>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{t("admin.assign.label")}</label>
          <select
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} — {plan.isTrial ? t("admin.assign.free") : `${plan.price.toLocaleString()} DZD`} (
                {t("admin.assign.days", { days: plan.days })})
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-neutral-400">{t("admin.assign.note")}</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button onClick={handleAssign} disabled={saving} className="w-full justify-center">
          {saving ? t("common.saving") : t("admin.assign.submit")}
        </Button>
      </div>
    </Modal>
  );
}
