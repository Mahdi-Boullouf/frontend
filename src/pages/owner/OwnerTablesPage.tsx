import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { api, ApiError } from "../../lib/api";
import type { Restaurant } from "../../lib/types";
import { useT } from "../../lib/i18n/I18nContext";
import { Button, Card, Input } from "../../components/ui";
import { SubscriptionLocked } from "../../components/SubscriptionLocked";

export function OwnerTablesPage() {
  const { t } = useT();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lockedMessage, setLockedMessage] = useState("");
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(30);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .get<Restaurant>("/restaurants/me")
      .then(setRestaurant)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) setLockedMessage(err.message);
        else setError(err instanceof ApiError ? err.message : t("tables.loadFailed"));
      })
      .finally(() => setLoading(false));
  }, [t]);

  const tables = useMemo(() => {
    const lo = Math.max(1, Math.min(from, to));
    const hi = Math.max(from, to);
    // ponytail: cap at 200 so a typo like "to = 99999" can't freeze the tab
    const count = Math.min(hi - lo + 1, 200);
    return Array.from({ length: count }, (_, i) => lo + i);
  }, [from, to]);

  if (lockedMessage) return <SubscriptionLocked message={lockedMessage} />;
  if (loading || !restaurant) return null;

  const urlFor = (table: number) => `${window.location.origin}/order/${restaurant.id}/${table}`;
  const deliveryUrl = `${window.location.origin}/order/${restaurant.id}/delivery`;

  const copyDeliveryLink = async () => {
    try {
      await navigator.clipboard.writeText(deliveryUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t("tables.copyFailed"));
    }
  };

  return (
    <div className="max-w-4xl">
      <Card className="p-6 mb-6 print:hidden">
        <p className="text-sm font-semibold text-neutral-900 mb-1">🛵 {t("tables.deliveryTitle")}</p>
        <p className="text-sm text-neutral-600 mb-4">{t("tables.deliveryHelp")}</p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="rounded-lg border border-neutral-200 bg-white p-2 shrink-0">
            <QRCodeSVG value={deliveryUrl} size={96} level="M" marginSize={1} />
          </div>
          <div className="flex-1 w-full min-w-0">
            <Input readOnly value={deliveryUrl} onFocus={(e) => e.target.select()} />
            <Button onClick={copyDeliveryLink} className="mt-2">
              {copied ? t("tables.copied") : t("tables.copyLink")}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-6 print:hidden">
        <p className="text-sm text-neutral-600 mb-4">{t("tables.help")}</p>
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm">
            <span className="block font-medium text-neutral-700 mb-1">{t("tables.from")}</span>
            <Input type="number" min={1} value={from} onChange={(e) => setFrom(Number(e.target.value) || 1)} className="w-28" />
          </label>
          <label className="text-sm">
            <span className="block font-medium text-neutral-700 mb-1">{t("tables.to")}</span>
            <Input type="number" min={1} value={to} onChange={(e) => setTo(Number(e.target.value) || 1)} className="w-28" />
          </label>
          <Button onClick={() => window.print()}>{t("tables.print")}</Button>
        </div>
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </Card>

      <div className="qr-print grid grid-cols-2 sm:grid-cols-3 gap-4">
        {tables.map((table) => (
          <div
            key={table}
            className="flex flex-col items-center gap-3 rounded-2xl border-2 border-brand-600 bg-white p-5 text-center break-inside-avoid"
          >
            <p className="text-lg font-bold text-brand-700">{restaurant.name}</p>
            <div className="rounded-xl border border-neutral-200 p-2">
              <QRCodeSVG value={urlFor(table)} size={160} level="M" marginSize={1} />
            </div>
            <p dir="rtl" className="text-base font-semibold text-neutral-800 leading-snug">
              افحصني للطلب من هاتفك مباشرة
            </p>
            <p className="text-sm font-bold text-white bg-brand-600 rounded-full px-4 py-1">
              {t("tables.tableLabel", { n: table })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
