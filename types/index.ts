export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type PaymentMethod =
  | 'cod'
  | 'card'
  | 'google_pay'
  | 'apple_pay'
  | 'cash_app'
  | 'qr_payment';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type DriverStatus = 'available' | 'on_delivery' | 'offline';

// ==========================================
// CUSTOM PERMISSION SYSTEM (MODULE 09)
// ==========================================
export interface OrdersPermissions {
  viewOrders: boolean;
  viewOrderDetails: boolean;
  updateOrderStatus: boolean;
  assignDeliveryStaff: boolean;
  cancelOrders: boolean;
  printInvoice: boolean;
  exportOrders: boolean;
}

export interface ProductsPermissions {
  viewProducts: boolean;
  addProducts: boolean;
  editProducts: boolean;
  deleteProducts: boolean;
  updateStockAvailability: boolean;
}

export interface CategoriesPermissions {
  viewCategories: boolean;
  addCategories: boolean;
  editCategories: boolean;
  deleteCategories: boolean;
}

export interface PaymentsPermissions {
  viewPayments: boolean;
  viewTransactions: boolean;
  markCashReceived: boolean;
}

export interface DeliveryStaffPermissions {
  viewStaff: boolean;
  addStaff: boolean;
  editStaff: boolean;
  manageAssignments: boolean;
}

export interface CustomersPermissions {
  viewCustomers: boolean;
  viewCustomerDetails: boolean;
  manageCustomerAccounts: boolean;
}

export interface AdminPermissions {
  orders: OrdersPermissions;
  products: ProductsPermissions;
  categories: CategoriesPermissions;
  payments: PaymentsPermissions;
  deliveryStaff: DeliveryStaffPermissions;
  customers: CustomersPermissions;
}

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  roleTitle: string; // e.g. "Kitchen Supervisor", "Front Counter Clerk", "Operations Manager"
  status: 'active' | 'inactive';
  lastActive: string;
  avatarUrl?: string;
  permissions: AdminPermissions;
  createdAt: string;
}

// ==========================================
// ACTIVITY LOG & AUDIT TRAILS (MODULE 10)
// ==========================================
export type ActivityActionType =
  | 'order_status_update'
  | 'driver_assigned'
  | 'price_updated'
  | 'product_added'
  | 'product_deleted'
  | 'category_created'
  | 'cod_marked_paid'
  | 'permissions_updated'
  | 'admin_created'
  | 'admin_status_changed'
  | 'settings_updated';

export interface ActivityLog {
  id: string;
  adminId: string;
  adminName: string;
  adminRole: string;
  actionType: ActivityActionType;
  description: string;
  targetEntity?: string;
  timestamp: string;
  ipAddress?: string;
}

// ==========================================
// RESTAURANT CORE ENTITIES
// ==========================================
export interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  productCount: number;
  displayOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  description: string;
  price: number;
  discountPrice?: number;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
  isVegetarian: boolean;
  spicyLevel: number;
  ingredients: string[];
  rating: number;
  reviewCount: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl: string;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  barcodeId: string; // e.g. "TRP-884920-BC"
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryType: 'delivery' | 'pickup';
  deliveryAddress: {
    street: string;
    apartment?: string;
    city: string;
    postalCode: string;
    distanceMiles: number; // Enforces 3.0-mile limit
    deliveryNotes?: string;
  };
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  platformFee: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  barcodeVerifiedAt?: string;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  transactionRef: string;
  isCodRemitted?: boolean;
}

export interface DeliveryStaff {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl: string;
  vehicleType: string;
  vehicleNumber: string;
  status: DriverStatus;
  activeOrdersCount: number;
  completedDeliveries: number;
  unremittedCashBsd: number;
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  favoriteCategory?: string;
  totalOrders: number;
  totalSpent: number; // in BSD
  registeredDate: string;
  status: 'active' | 'banned';
  address: string;
  distanceMiles: number;
}

export interface RestaurantSettings {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  businessHours: string;
  maxDeliveryRadiusMiles: number; // Strict 3.0 miles
  deliveryFeeBsd: number;
  taxRate: number;
  platformFeeBsd: number;
  supportContact: string;
}

