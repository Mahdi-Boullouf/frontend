import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api, ApiError, API_ORIGIN } from "../../lib/api";
import type { Category, ModifierOption, Product } from "../../lib/types";
import { useT } from "../../lib/i18n/I18nContext";
import { PublicTopBar } from "../../components/PublicTopBar";
import { Button, Card, Input } from "../../components/ui";
import { ModifierSelectionModal } from "./ModifierSelectionModal";

interface RestaurantMenu {
  id: string;
  name: string;
  logo: string | null;
  description: string | null;
  categories: Category[];
  products: Product[];
}

interface CartEntry {
  productId: string;
  optionIds: string[];
  quantity: number;
}

interface CartLine extends CartEntry {
  key: string;
  product: Product;
  selectedOptions: ModifierOption[];
  unitPrice: number;
}

type View = "menu" | "cart" | "success";

const COVER_ICONS = ["🍕", "🍔", "🥗", "🍟", "🍗", "🍰", "🥙", "🍜"];

const lineKey = (productId: string, optionIds: string[]) => `${productId}::${[...optionIds].sort().join(",")}`;

function RestaurantCover({ name, logo }: { name: string; logo: string | null }) {
  return (
    <div className="relative h-48 bg-gradient-to-br from-brand-500 to-brand-700 overflow-hidden">
      <div className="absolute inset-0 flex flex-wrap items-center justify-around opacity-20 text-3xl select-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i}>{COVER_ICONS[i % COVER_ICONS.length]}</span>
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4">
        <div className="w-20 h-20 rounded-full bg-white ring-4 ring-white/70 shadow-md overflow-hidden flex items-center justify-center">
          {logo ? (
            <img src={`${API_ORIGIN}${logo}`} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">🍽️</span>
          )}
        </div>
        <h1 className="text-lg font-semibold text-white drop-shadow-sm text-center">{name}</h1>
      </div>
    </div>
  );
}

export function CustomerOrderPage() {
  const { restaurantId = "", tableName = "" } = useParams();
  const isDelivery = tableName === "delivery";
  const { t } = useT();
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [menu, setMenu] = useState<RestaurantMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState<Record<string, CartEntry>>({});
  const [view, setView] = useState<View>("menu");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [modifierTarget, setModifierTarget] = useState<Product | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");

  useEffect(() => {
    api
      .get<RestaurantMenu>(`/restaurants/${restaurantId}`)
      .then(setMenu)
      .catch((err) => setError(err instanceof ApiError ? err.message : t("customer.loadFailed")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const lines: CartLine[] = useMemo(() => {
    if (!menu) return [];
    return Object.values(cart)
      .filter((entry) => entry.quantity > 0)
      .map((entry) => {
        const product = menu.products.find((p) => p.id === entry.productId);
        if (!product) return null;
        const optionById = new Map((product.modifierGroups ?? []).flatMap((g) => g.options.map((o) => [o.id, o])));
        const selectedOptions = entry.optionIds.map((id) => optionById.get(id)).filter((o): o is ModifierOption => !!o);
        const unitPrice = product.price + selectedOptions.reduce((sum, o) => sum + o.price, 0);
        return { ...entry, key: lineKey(entry.productId, entry.optionIds), product, selectedOptions, unitPrice };
      })
      .filter((line): line is CartLine => !!line);
  }, [cart, menu]);

  const total = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  const addToCart = (productId: string, optionIds: string[]) => {
    const key = lineKey(productId, optionIds);
    setCart((prev) => ({
      ...prev,
      [key]: { productId, optionIds, quantity: (prev[key]?.quantity ?? 0) + 1 },
    }));
  };

  const setLineQty = (key: string, quantity: number) => {
    setCart((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key], quantity: Math.max(0, quantity) } } : prev));
  };

  const handleAddClick = (product: Product) => {
    if ((product.modifierGroups ?? []).length > 0) {
      setModifierTarget(product);
    } else {
      addToCart(product.id, []);
    }
  };

  const placeOrder = async () => {
    setPlaceError("");
    if (isDelivery && (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim())) {
      setPlaceError(t("customer.fillDelivery"));
      return;
    }
    setPlacing(true);
    try {
      await api.post("/orders", {
        restaurantId,
        isDelivery,
        ...(isDelivery
          ? { customerName: customer.name.trim(), customerPhone: customer.phone.trim(), customerAddress: customer.address.trim() }
          : { tableName }),
        items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity, modifierOptionIds: line.optionIds })),
      });
      setCart({});
      setView("success");
    } catch (err) {
      setPlaceError(err instanceof ApiError ? err.message : t("customer.orderFailed"));
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-neutral-400">{t("customer.loading")}</div>;
  }

  if (error || !menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <Card className="p-8 text-center max-w-sm">
          <p className="text-base font-semibold text-neutral-900 mb-1">{t("customer.unavailable")}</p>
          <p className="text-sm text-neutral-500">{error || t("customer.notFound")}</p>
        </Card>
      </div>
    );
  }

  if (view === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <Card className="p-8 text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4 text-2xl">
            ✓
          </div>
          <p className="text-base font-semibold text-neutral-900 mb-1">{t("customer.orderSent")}</p>
          <p className="text-sm text-neutral-500 mb-6">
            {isDelivery ? t("customer.deliveryOrderSent") : t("customer.orderSentDetail", { table: tableName })}
          </p>
          <Button onClick={() => setView("menu")} className="w-full justify-center">
            {t("customer.orderMore")}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <PublicTopBar />
      <RestaurantCover name={menu.name} logo={menu.logo} />

      <div className="px-4 pt-4 flex flex-col items-center text-center">
        {menu.description && <p className="text-sm text-neutral-500 max-w-sm">{menu.description}</p>}
        <span className="mt-2 text-xs font-medium text-brand-600 bg-brand-50 rounded-full px-2.5 py-1">
          {isDelivery ? `🛵 ${t("customer.delivery")}` : t("customer.table", { table: tableName })}
        </span>
      </div>

      {menu.categories.length > 0 && (
        <div className="mt-4 px-4 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              selectedCategoryId === null ? "bg-brand-600 text-white" : "bg-white text-neutral-600 border border-neutral-200"
            }`}
          >
            {t("customer.allCategories")}
          </button>
          {menu.categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                selectedCategoryId === category.id ? "bg-brand-600 text-white" : "bg-white text-neutral-600 border border-neutral-200"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {view === "menu" && (
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {menu.products.filter((p) => !selectedCategoryId || p.categoryId === selectedCategoryId).length === 0 && (
            <p className="col-span-full text-center text-neutral-400 py-8">{t("customer.noItems")}</p>
          )}
          {menu.products
            .filter((product) => !selectedCategoryId || product.categoryId === selectedCategoryId)
            .map((product) => {
            const hasModifiers = (product.modifierGroups ?? []).length > 0;
            const simpleKey = lineKey(product.id, []);
            const simpleQty = !hasModifiers ? cart[simpleKey]?.quantity ?? 0 : 0;

            return (
              <Card key={product.id} className="overflow-hidden flex flex-col">
                <div className="aspect-square bg-neutral-100">
                  {product.images[0] && (
                    <img src={`${API_ORIGIN}${product.images[0]}`} alt={product.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-3 flex flex-col gap-2 flex-1">
                  <p className="text-sm font-medium text-neutral-900">{product.name}</p>
                  <p className="text-sm text-neutral-500">{product.price.toLocaleString()} DZD</p>
                  <div className="mt-auto">
                    {simpleQty > 0 ? (
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setLineQty(simpleKey, simpleQty - 1)}
                          className="w-8 h-8 rounded-md border border-neutral-300 text-neutral-600"
                        >
                          −
                        </button>
                        <span className="text-sm font-medium">{simpleQty}</span>
                        <button
                          onClick={() => setLineQty(simpleKey, simpleQty + 1)}
                          className="w-8 h-8 rounded-md border border-neutral-300 text-neutral-600"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <Button className="w-full justify-center" onClick={() => handleAddClick(product)}>
                        {t("customer.add")}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {view === "cart" && (
        <div className="p-4 space-y-3">
          {lines.length === 0 && <p className="text-center text-neutral-400 py-8">{t("customer.emptyCart")}</p>}
          {lines.map((line) => (
            <Card key={line.key} className="p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900">{line.product.name}</p>
                {line.selectedOptions.length > 0 && (
                  <p className="text-xs text-neutral-500 truncate">{line.selectedOptions.map((o) => o.name).join(", ")}</p>
                )}
                <p className="text-xs text-neutral-500">{t("customer.eachPrice", { price: line.unitPrice.toLocaleString() })}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setLineQty(line.key, line.quantity - 1)}
                  className="w-8 h-8 rounded-md border border-neutral-300 text-neutral-600"
                >
                  −
                </button>
                <span className="text-sm font-medium">{line.quantity}</span>
                <button
                  onClick={() => setLineQty(line.key, line.quantity + 1)}
                  className="w-8 h-8 rounded-md border border-neutral-300 text-neutral-600"
                >
                  +
                </button>
              </div>
            </Card>
          ))}
          {isDelivery && lines.length > 0 && (
            <Card className="p-4 space-y-3">
              <p className="text-sm font-semibold text-neutral-900">{t("customer.deliveryDetails")}</p>
              <Input
                placeholder={t("customer.name")}
                value={customer.name}
                onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
              />
              <Input
                type="tel"
                placeholder={t("customer.phone")}
                value={customer.phone}
                onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
              />
              <Input
                placeholder={t("customer.address")}
                value={customer.address}
                onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))}
              />
            </Card>
          )}
          {placeError && <p className="text-sm text-red-600">{placeError}</p>}
        </div>
      )}

      {itemCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 p-4">
          {view === "menu" ? (
            <Button className="w-full justify-center" onClick={() => setView("cart")}>
              {t("customer.viewCart", { count: itemCount, total: total.toLocaleString() })}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => setView("menu")}>
                {t("customer.addMore")}
              </Button>
              <Button className="flex-1 justify-center" onClick={placeOrder} disabled={placing}>
                {placing ? t("customer.placing") : t("customer.checkout", { total: total.toLocaleString() })}
              </Button>
            </div>
          )}
        </div>
      )}

      {modifierTarget && (
        <ModifierSelectionModal
          product={modifierTarget}
          onClose={() => setModifierTarget(null)}
          onAdd={(optionIds) => addToCart(modifierTarget.id, optionIds)}
        />
      )}
    </div>
  );
}
