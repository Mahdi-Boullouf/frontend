import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import type { Role } from "../lib/types";

export function ProtectedRoute({ allow }: { allow: Role[] }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) return <Navigate to="/login" replace />;

  return <Outlet />;
}
