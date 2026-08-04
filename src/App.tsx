import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/AuthContext";
import { homePathForRole } from "./lib/roles";
import { useT } from "./lib/i18n/I18nContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { AdminRestaurantsPage } from "./pages/admin/AdminRestaurantsPage";
import { OwnerProductsPage } from "./pages/owner/OwnerProductsPage";
import { OwnerOrdersPage } from "./pages/owner/OwnerOrdersPage";
import { OwnerEmployeesPage } from "./pages/owner/OwnerEmployeesPage";
import { OwnerProfilePage } from "./pages/owner/OwnerProfilePage";
import { OwnerTablesPage } from "./pages/owner/OwnerTablesPage";
import { LiveOrdersPage } from "./pages/LiveOrdersPage";
import { CustomerOrderPage } from "./pages/customer/CustomerOrderPage";

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homePathForRole(user.role)} replace />;
}

function App() {
  const { t } = useT();

  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/order/:restaurantId/:tableName" element={<CustomerOrderPage />} />

      <Route element={<ProtectedRoute allow={["ADMIN"]} />}>
        <Route
          element={<Layout title={t("layout.restaurants")} navItems={[{ to: "/admin/restaurants", label: t("nav.restaurants") }]} />}
        >
          <Route path="/admin/restaurants" element={<AdminRestaurantsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allow={["OWNER"]} />}>
        <Route
          element={
            <Layout
              title={t("layout.dashboard")}
              navItems={[
                { to: "/owner/live-orders", label: t("nav.liveOrders") },
                { to: "/owner/products", label: t("nav.products") },
                { to: "/owner/orders", label: t("nav.orders") },
                { to: "/owner/employees", label: t("nav.employees") },
                { to: "/owner/tables", label: t("nav.tables") },
                { to: "/owner/profile", label: t("nav.profile") },
              ]}
            />
          }
        >
          <Route path="/owner/live-orders" element={<LiveOrdersPage />} />
          <Route path="/owner/products" element={<OwnerProductsPage />} />
          <Route path="/owner/orders" element={<OwnerOrdersPage />} />
          <Route path="/owner/employees" element={<OwnerEmployeesPage />} />
          <Route path="/owner/tables" element={<OwnerTablesPage />} />
          <Route path="/owner/profile" element={<OwnerProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allow={["CHEF", "PAYMENTAGENT"]} />}>
        <Route element={<Layout title={t("layout.liveOrders")} navItems={[{ to: "/staff/orders", label: t("nav.liveOrders") }]} />}>
          <Route path="/staff/orders" element={<LiveOrdersPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
