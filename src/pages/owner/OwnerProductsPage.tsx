import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { api, ApiError, API_ORIGIN } from "../../lib/api";
import type { Category, Product } from "../../lib/types";
import { useT } from "../../lib/i18n/I18nContext";
import { Badge, Button, Card, Input, Modal } from "../../components/ui";
import { SubscriptionLocked } from "../../components/SubscriptionLocked";
import { ProductModifiersModal } from "./ProductModifiersModal";
import { CategoriesModal } from "./CategoriesModal";

const MAX_IMAGES = 3;

export function OwnerProductsPage() {
  const { t } = useT();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [imagesTarget, setImagesTarget] = useState<Product | null>(null);
  const [modifiersTarget, setModifiersTarget] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [lockedMessage, setLockedMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [productData, categoryData] = await Promise.all([
        api.get<Product[]>("/products"),
        api.get<Category[]>("/categories"),
      ]);
      setProducts(productData);
      setCategories(categoryData);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setLockedMessage(err.message);
      } else {
        setError(err instanceof ApiError ? err.message : t("products.loadFailed"));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (lockedMessage) return <SubscriptionLocked message={lockedMessage} />;

  const toggleAvailability = async (product: Product) => {
    setError("");
    try {
      await api.patch(`/products/${product.id}`, { isAvailable: !product.isAvailable });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("products.updateFailed"));
    }
  };

  const changeCategory = async (product: Product, categoryId: string) => {
    setError("");
    try {
      await api.patch(`/products/${product.id}`, { categoryId: categoryId || null });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("products.updateFailed"));
    }
  };

  const remove = async (product: Product) => {
    if (!confirm(t("products.confirmDelete", { name: product.name }))) return;
    setError("");
    try {
      await api.delete(`/products/${product.id}`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("products.deleteFailed"));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-2">
        <p className="text-sm text-neutral-500">{t("products.count", { count: products.length })}</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setCategoriesOpen(true)}>
            {t("categories.manage")}
          </Button>
          <Button onClick={() => setCreateOpen(true)}>{t("products.new")}</Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500">
              <th className="px-4 py-3 font-medium text-start">{t("products.colPhotos")}</th>
              <th className="px-4 py-3 font-medium text-start">{t("products.colName")}</th>
              <th className="px-4 py-3 font-medium text-start">{t("products.colPrice")}</th>
              <th className="px-4 py-3 font-medium text-start">{t("products.create.category")}</th>
              <th className="px-4 py-3 font-medium text-start">{t("products.colStatus")}</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                  {t("products.empty")}
                </td>
              </tr>
            )}
            {products.map((product) => (
              <tr key={product.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex -space-x-2 rtl:space-x-reverse">
                    {product.images.length === 0 && (
                      <div className="w-10 h-10 rounded-md bg-neutral-100 border border-neutral-200" />
                    )}
                    {product.images.map((src) => (
                      <img
                        key={src}
                        src={`${API_ORIGIN}${src}`}
                        alt=""
                        className="w-10 h-10 rounded-md object-cover border border-white ring-1 ring-neutral-200"
                      />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-neutral-900">{product.name}</td>
                <td className="px-4 py-3 text-neutral-600">{product.price.toLocaleString()} DZD</td>
                <td className="px-4 py-3">
                  <select
                    value={product.categoryId ?? ""}
                    onChange={(e) => changeCategory(product, e.target.value)}
                    className="rounded-md border border-neutral-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  >
                    <option value="">{t("products.create.noCategory")}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={product.isAvailable ? "green" : "neutral"}>
                    {product.isAvailable ? t("products.available") : t("products.unavailable")}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-end space-x-2 rtl:space-x-reverse whitespace-nowrap">
                  <Button variant="secondary" onClick={() => setImagesTarget(product)}>
                    {t("products.photos")}
                  </Button>
                  <Button variant="secondary" onClick={() => setModifiersTarget(product)}>
                    {t("products.modifiers")}
                  </Button>
                  <Button variant="secondary" onClick={() => toggleAvailability(product)}>
                    {product.isAvailable ? t("products.disable") : t("products.enable")}
                  </Button>
                  <Button variant="danger" onClick={() => remove(product)}>
                    {t("products.delete")}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <CreateProductModal open={createOpen} categories={categories} onClose={() => setCreateOpen(false)} onCreated={load} />
      {imagesTarget && (
        <ProductImagesModal product={imagesTarget} onClose={() => setImagesTarget(null)} onSaved={load} />
      )}
      {modifiersTarget && (
        <ProductModifiersModal product={modifiersTarget} onClose={() => setModifiersTarget(null)} onSaved={load} />
      )}
      {categoriesOpen && <CategoriesModal onClose={() => setCategoriesOpen(false)} onChanged={load} />}
    </div>
  );
}

function ImagePicker({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const { t } = useT();
  const handlePick = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []).slice(0, MAX_IMAGES);
    onChange(picked);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">{t("products.create.photos", { max: MAX_IMAGES })}</label>
      <input type="file" accept="image/*" multiple onChange={handlePick} className="text-sm" />
      {files.length > 0 && (
        <div className="mt-2 flex gap-2">
          {files.map((file) => (
            <img
              key={file.name + file.size}
              src={URL.createObjectURL(file)}
              alt=""
              className="w-14 h-14 rounded-md object-cover border border-neutral-200"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CreateProductModal({
  open,
  categories,
  onClose,
  onCreated,
}: {
  open: boolean;
  categories: Category[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useT();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName("");
    setPrice("");
    setCategoryId("");
    setImages([]);
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("price", price);
      if (categoryId) formData.append("categoryId", categoryId);
      images.forEach((file) => formData.append("images", file));
      await api.post("/products", formData);
      reset();
      onClose();
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("products.create.failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={t("products.create.title")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{t("products.create.name")}</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{t("products.create.price")}</label>
          <Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{t("products.create.category")}</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="">{t("products.create.noCategory")}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <ImagePicker files={images} onChange={setImages} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={saving} className="w-full justify-center">
          {saving ? t("products.create.submitting") : t("products.create.submit")}
        </Button>
      </form>
    </Modal>
  );
}

function ProductImagesModal({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) {
  const { t } = useT();
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (images.length === 0) {
      setError(t("products.images.needOne"));
      return;
    }
    setError("");
    setSaving(true);
    try {
      const formData = new FormData();
      images.forEach((file) => formData.append("images", file));
      await api.patch(`/products/${product.id}/images`, formData);
      onClose();
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("products.images.failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={t("products.images.title", { name: product.name })}>
      <div className="space-y-4">
        {product.images.length > 0 && (
          <div>
            <p className="text-xs text-neutral-400 mb-2">{t("products.images.current")}</p>
            <div className="flex gap-2">
              {product.images.map((src) => (
                <img key={src} src={`${API_ORIGIN}${src}`} alt="" className="w-14 h-14 rounded-md object-cover border border-neutral-200" />
              ))}
            </div>
          </div>
        )}
        <ImagePicker files={images} onChange={setImages} />
        <p className="text-xs text-neutral-400">{t("products.images.replaceNote")}</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button onClick={handleSave} disabled={saving} className="w-full justify-center">
          {saving ? t("common.saving") : t("products.images.submit")}
        </Button>
      </div>
    </Modal>
  );
}
