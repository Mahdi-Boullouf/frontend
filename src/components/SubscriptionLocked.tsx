import { Card } from "./ui";
import { useT } from "../lib/i18n/I18nContext";

export function SubscriptionLocked({ message }: { message: string }) {
  const { t } = useT();
  return (
    <Card className="p-8 text-center">
      <p className="text-base font-semibold text-neutral-900 mb-1">{t("subscriptionLocked.title")}</p>
      <p className="text-sm text-neutral-500">{message}</p>
    </Card>
  );
}
