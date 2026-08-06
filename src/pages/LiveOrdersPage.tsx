import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { api, ApiError } from "../lib/api";
import { connectLiveOrdersSocket } from "../lib/socket";
import { isAudioUnlocked, playDing, unlockAudio } from "../lib/sound";
import type { Order } from "../lib/types";
import { useT } from "../lib/i18n/I18nContext";
import { Button, Card } from "../components/ui";
import { SubscriptionLocked } from "../components/SubscriptionLocked";

function isResolved(order: Order) {
  return order.isPrepared && order.isPaid;
}

// Shared real-time order queue: used by the owner, chef, and payment-agent dashboards alike.
export function LiveOrdersPage() {
  const { t } = useT();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lockedMessage, setLockedMessage] = useState("");
  const [soundOn, setSoundOn] = useState(isAudioUnlocked());
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let cancelled = false;

    api
      .get<Order[]>("/orders/live")
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 403) setLockedMessage(err.message);
        else setError(err instanceof ApiError ? err.message : t("staff.loadFailed"));
      })
      .finally(() => !cancelled && setLoading(false));

    const socket = connectLiveOrdersSocket();
    socketRef.current = socket;

    socket.on("order:new", (order: Order) => {
      setOrders((prev) => [...prev, order]);
      playDing();
    });

    socket.on("order:updated", (order: Order) => {
      setOrders((prev) =>
        isResolved(order) ? prev.filter((o) => o.id !== order.id) : prev.map((o) => (o.id === order.id ? order : o)),
      );
    });

    return () => {
      cancelled = true;
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (lockedMessage) return <SubscriptionLocked message={lockedMessage} />;

  const enableSound = async () => {
    await unlockAudio();
    setSoundOn(isAudioUnlocked());
  };

  const toggleFlag = async (order: Order, flag: "isPrepared" | "isPaid") => {
    setError("");
    try {
      const updated = await api.patch<Order>(`/orders/${order.id}/flags`, { [flag]: !order[flag] });
      setOrders((prev) =>
        isResolved(updated) ? prev.filter((o) => o.id !== order.id) : prev.map((o) => (o.id === order.id ? updated : o)),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("staff.updateFailed"));
    }
  };

  return (
    <div>
      {!soundOn && (
        <Card className="p-4 mb-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800">{t("staff.soundOff")}</p>
          <Button onClick={enableSound} className="shrink-0">
            {t("staff.enableSound")}
          </Button>
        </Card>
      )}

      <p className="text-sm text-neutral-500 mb-5">{t("staff.countActive", { count: orders.length })}</p>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {!loading && orders.length === 0 && (
        <Card className="px-4 py-8 text-center text-neutral-400">{t("staff.empty")}</Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="p-4">
            <div className="flex items-center justify-between mb-2 gap-2">
              {order.isDelivery ? (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-white bg-brand-600 rounded-full px-3 py-1">
                  🛵 {t("staff.delivery")}
                </span>
              ) : (
                <p className="text-lg font-semibold text-neutral-900">{t("customer.table", { table: order.tableName })}</p>
              )}
              <span className="text-xs text-neutral-400 shrink-0">{new Date(order.createdAt).toLocaleTimeString()}</span>
            </div>

            {order.isDelivery && (
              <div className="mb-3 rounded-lg bg-brand-50 border border-brand-100 p-2 text-sm text-neutral-600 space-y-0.5">
                {order.customerName && <p className="font-medium text-neutral-900">{order.customerName}</p>}
                {order.customerPhone && (
                  <p dir="ltr" className="text-start">
                    <a href={`tel:${order.customerPhone}`} className="text-brand-700">{order.customerPhone}</a>
                  </p>
                )}
                {order.customerAddress && <p>{order.customerAddress}</p>}
              </div>
            )}

            <ul className="text-sm text-neutral-600 space-y-1 mb-3">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.quantity}× {item.product?.name ?? "—"}
                  {item.modifiers.length > 0 && (
                    <span className="block text-xs text-neutral-400">{item.modifiers.map((m) => m.name).join(", ")}</span>
                  )}
                </li>
              ))}
            </ul>

            <p className="text-sm font-medium text-neutral-900 mb-3">{order.total.toLocaleString()} DZD</p>

            <div className="flex gap-2">
              <Button
                variant={order.isPrepared ? "primary" : "secondary"}
                className="flex-1 justify-center"
                onClick={() => toggleFlag(order, "isPrepared")}
              >
                {order.isPrepared ? t("staff.prepared") : t("staff.markPrepared")}
              </Button>
              <Button
                variant={order.isPaid ? "primary" : "secondary"}
                className="flex-1 justify-center"
                onClick={() => toggleFlag(order, "isPaid")}
              >
                {order.isPaid ? t("staff.paid") : t("staff.markPaid")}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
