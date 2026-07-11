export type Role = "ADMIN" | "OWNER" | "CHEF" | "PAYMENTAGENT";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  days: number;
  price: number;
  isTrial: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  logo: string | null;
  description: string | null;
  memeberId: string;
  subscriptionPlanId: string | null;
  subscriptionStartAt: string | null;
  subscriptionEndAt: string | null;
  memeber?: AuthUser;
  subscriptionPlan?: SubscriptionPlan;
}

export type ModifierType = "SINGLE" | "MULTIPLE";

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
  modifierGroupId: string;
}

export interface ModifierGroup {
  id: string;
  name: string;
  type: ModifierType;
  required: boolean;
  productId: string;
  options: ModifierOption[];
}

export interface Category {
  id: string;
  name: string;
  position: number;
  restaurantId: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  images: string[];
  restaurantId: string;
  categoryId: string | null;
  category?: Category | null;
  modifierGroups?: ModifierGroup[];
}

export interface OrderItemModifier {
  id: string;
  name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
  modifiers: OrderItemModifier[];
}

export type OrderStatus = "PENDING" | "COMPLETED" | "CANCELLED";

export interface Order {
  id: string;
  restaurantId: string;
  total: number;
  status: OrderStatus;
  isPrepared: boolean;
  isPaid: boolean;
  tableName: string;
  createdAt: string;
  items: OrderItem[];
}

export interface Employee {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}
