export const Role = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const UserStatus = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  REJECTED: "REJECTED",
  INACTIVE: "INACTIVE",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const SaleStatus = {
  COMPLETED: "COMPLETED",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;
export type SaleStatus = (typeof SaleStatus)[keyof typeof SaleStatus];

export type StockMovementType =
  | "RESTOCK"
  | "DAMAGE"
  | "LOSS"
  | "RETURN"
  | "CORRECTION"
  | "OPENING_STOCK"
  | "SALE_DEDUCTION"
  | "OTHER";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  role: Role;
  status: UserStatus;
  mustChangePassword?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    products: number;
  };
}

export interface Company {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    products: number;
  };
}

export interface WarehouseStock {
  id: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  warehouse?: Warehouse;
  product?: Product;
}

export interface Warehouse {
  id: string;
  name: string;
  code?: string | null;
  address?: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  stocks?: WarehouseStock[];
  _count?: {
    stocks: number;
  };
}

export interface Supplier {
  id: string;
  name: string;
  companyName?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  openingDue: number;
  currentDue: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    purchases: number;
    payments: number;
  };
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  openingDue: number;
  currentDue: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    sales: number;
    payments: number;
  };
}

export interface PurchaseItem {
  id?: string;
  purchaseId?: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    unit?: string;
  };
  warehouseId?: string | null;
  warehouse?: { id: string; name: string } | null;
  quantity: number;
  dpRate: number;
  commissionPercent: number;
  purchaseRate: number;
  lineTotal: number;
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  supplierId?: string | null;
  supplier?: Supplier | null;
  supplierName?: string | null;
  paymentType: "CASH" | "SUPPLIER";
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  note?: string | null;
  createdById: string;
  createdBy?: { id: string; name: string; email?: string } | null;
  createdAt: string;
  updatedAt: string;
  items: PurchaseItem[];
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  note?: string | null;
  createdById: string;
  createdBy?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface PartyPayment {
  id: string;
  receiptNumber: string;
  type: "CUSTOMER_COLLECTION" | "SUPPLIER_PAYMENT";
  customerId?: string | null;
  customer?: {
    id: string;
    name: string;
    phone: string;
    address?: string | null;
    currentDue?: number;
  } | null;
  supplierId?: string | null;
  supplier?: {
    id: string;
    name: string;
    companyName?: string | null;
    phone: string;
    address?: string | null;
    currentDue?: number;
  } | null;
  amount: number;
  paymentMethod: string;
  referenceNote?: string | null;
  createdById: string;
  createdBy?: { id: string; name: string; role: Role } | null;
  createdAt: string;
}

export interface StoreSetting {
  id: string;
  storeName: string;
  proprietorName?: string | null;
  tagline?: string | null;
  address?: string | null;
  phone?: string | null;
  altPhone?: string | null;
  email?: string | null;
  vatRegistrationNo?: string | null;
  invoiceFooterNote?: string | null;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  categoryId?: string | null;
  category?: Category | null;
  companyId?: string | null;
  company?: Company | null;
  unit: string;
  costPrice?: number;
  dpRate?: number;
  commissionPercent?: number;
  sellingPrice: number;
  quantity: number;
  reorderLevel: number;
  description?: string | null;
  isActive: boolean;
  warehouseStocks?: WarehouseStock[];
  createdAt?: string;
  updatedAt?: string;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
}

export interface SaleItem {
  id?: string;
  saleId: string;
  productId: string;
  warehouseId?: string | null;
  warehouse?: { id: string; name: string } | null;
  product?: {
    id: string;
    name: string;
    sku: string;
    unit?: string;
    quantity?: number;
    company?: { id: string; name: string } | null;
  };
  quantity: number;
  purchaseCost?: number;
  unitPrice: number;
  lineTotal: number;
  profit?: number;
}

export interface Sale {
  id: string;
  referenceNumber: string;
  createdById: string;
  customerId?: string | null;
  customer?: {
    id: string;
    name: string;
    phone: string;
    address?: string | null;
    currentDue?: number;
  } | null;
  warehouseId?: string | null;
  warehouse?: { id: string; name: string } | null;
  paymentType: "CASH" | "CREDIT";
  createdBy?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  status: SaleStatus;
  totalAmount: number;
  discount?: number;
  netAmount?: number;
  paidAmount: number;
  dueAmount: number;
  totalPurchaseCost?: number;
  profit?: number;
  invoiceCost?: number;
  invoiceProfit?: number;
  customerName?: string | null;
  customerPhone?: string | null;
  note?: string | null;
  approvedById?: string | null;
  approvedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  approvedAt?: string | null;
  rejectedById?: string | null;
  rejectedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  items: SaleItem[];
}

export interface StockMovement {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
  type: StockMovementType;
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  referenceType?: string | null;
  referenceId?: string | null;
  reason?: string | null;
  performedById: string;
  performedBy: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId?: string | null;
  actor?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  } | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: any;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
  code?: string;
  errors?: Record<string, string>;
}
