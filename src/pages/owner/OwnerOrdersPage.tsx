import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";
import type { Order, OrderStatus } from "../../lib/types";
import { useT } from "../../lib/i18n/I18nContext";
import { Badge, Button, Card } from "../../components/ui";
import { SubscriptionLocked } from "../../components/SubscriptionLocked";

const toneFor: Record<OrderStatus, "amber" | "green" | "red"> = {
  PENDING: "amber",
  COMPLETED: "green",
  CANCELLED: "red",
};

export function OwnerOrdersPage() {
  const { t } = useT();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lockedMessage, setLockedMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setOrders(await api.get<Order[]>("/orders"));
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setLockedMessage(err.message);
      } else {
        setError(err instanceof ApiError ? err.message : t("orders.loadFailed"));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (lockedMessage) return <SubscriptionLocked message={lockedMessage} />;

  const updateStatus = async (order: Order, status: OrderStatus) => {
    setError("");
    try {
      await api.patch(`/orders/${order.id}/status`, { status });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("orders.updateFailed"));
    }
  };

  return (
    <div>
      <p className="text-sm text-neutral-500 mb-5">{t("orders.countToday", { count: orders.length })}</p>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {!loading && orders.length === 0 && (
        <Card className="px-4 py-8 text-center text-neutral-400">{t("orders.empty")}</Card>
      )}

      <div className="space-y-3">
        {orders.map((order) => (
          <Card key={order.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-neutral-900">{t("customer.table", { table: order.tableName })}</p>
                <p className="text-xs text-neutral-400">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={toneFor[order.status]}>{order.status}</Badge>
                <span className="font-semibold text-neutral-900">{order.total.toLocaleString()} DZD</span>
              </div>
            </div>

            <ul className="mt-3 text-sm text-neutral-600 space-y-1">
              {order.items.map((item) => {
                const unitPrice = item.price + item.modifiers.reduce((sum, m) => sum + m.price, 0);
                return (
                  <li key={item.id} className="flex justify-between gap-3">
                    <span className="min-w-0">
                      {item.quantity}× {item.product?.name ?? "—"}
                      {item.modifiers.length > 0 && (
                        <span className="block text-xs text-neutral-400 truncate">
                          {item.modifiers.map((m) => m.name).join(", ")}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0">{(unitPrice * item.quantity).toLocaleString()} DZD</span>
                  </li>
                );
              })}
            </ul>

            {order.status === "PENDING" && (
              <div className="mt-4 flex gap-2">
                <Button onClick={() => updateStatus(order, "COMPLETED")}>{t("orders.markCompleted")}</Button>
                <Button variant="danger" onClick={() => updateStatus(order, "CANCELLED")}>
                  {t("orders.cancel")}
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
