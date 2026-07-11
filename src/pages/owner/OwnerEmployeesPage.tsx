import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../../lib/api";
import type { Employee, Role } from "../../lib/types";
import { useT } from "../../lib/i18n/I18nContext";
import { Badge, Button, Card, Input, Modal } from "../../components/ui";
import { SubscriptionLocked } from "../../components/SubscriptionLocked";

export function OwnerEmployeesPage() {
  const { t } = useT();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState("");
  const [lockedMessage, setLockedMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setEmployees(await api.get<Employee[]>("/employees"));
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setLockedMessage(err.message);
      } else {
        setError(err instanceof ApiError ? err.message : t("employees.loadFailed"));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (lockedMessage) return <SubscriptionLocked message={lockedMessage} />;

  const remove = async (employee: Employee) => {
    if (!confirm(t("employees.confirmRemove", { email: employee.email }))) return;
    setError("");
    try {
      await api.delete(`/employees/${employee.id}`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("employees.removeFailed"));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-neutral-500">{t("employees.count", { count: employees.length })}</p>
        <Button onClick={() => setCreateOpen(true)}>{t("employees.new")}</Button>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500">
              <th className="px-4 py-3 font-medium text-start">{t("employees.colEmail")}</th>
              <th className="px-4 py-3 font-medium text-start">{t("employees.colRole")}</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {!loading && employees.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-neutral-400">
                  {t("employees.empty")}
                </td>
              </tr>
            )}
            {employees.map((employee) => (
              <tr key={employee.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 font-medium text-neutral-900">{employee.email}</td>
                <td className="px-4 py-3">
                  <Badge tone={employee.role === "CHEF" ? "amber" : "green"}>
                    {employee.role === "CHEF" ? t("employees.create.roleChef") : t("employees.create.rolePaymentAgent")}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-end">
                  <Button variant="danger" onClick={() => remove(employee)}>
                    {t("employees.remove")}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <CreateEmployeeModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />
    </div>
  );
}

function CreateEmployeeModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("CHEF");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setEmail("");
    setPassword("");
    setRole("CHEF");
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/employees", { email, password, role });
      reset();
      onClose();
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("employees.create.failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={t("employees.create.title")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{t("employees.create.role")}</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="CHEF">{t("employees.create.roleChef")}</option>
            <option value="PAYMENTAGENT">{t("employees.create.rolePaymentAgent")}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{t("employees.create.email")}</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{t("employees.create.password")}</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={saving} className="w-full justify-center">
          {saving ? t("employees.create.submitting") : t("employees.create.submit")}
        </Button>
      </form>
    </Modal>
  );
}
