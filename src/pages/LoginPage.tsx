import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { ApiError } from "../lib/api";
import { homePathForRole } from "../lib/roles";
import { useT } from "../lib/i18n/I18nContext";
import { Button, Card, Input } from "../components/ui";
import { PublicTopBar } from "../components/PublicTopBar";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(homePathForRole(user.role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("login.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <PublicTopBar />
      <div className="flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-sm p-8">
          <h1 className="text-xl font-semibold text-brand-600 mb-1">{t("login.title")}</h1>
          <p className="text-sm text-neutral-500 mb-6">{t("login.subtitle")}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{t("login.email")}</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{t("login.password")}</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full justify-center">
              {loading ? t("login.submitting") : t("login.submit")}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
