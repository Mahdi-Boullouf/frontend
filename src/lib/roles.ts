import type { Role } from "./types";

export function homePathForRole(role: Role): string {
  if (role === "ADMIN") return "/admin/restaurants";
  if (role === "OWNER") return "/owner/products";
  return "/staff/orders";
}
