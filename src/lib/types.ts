export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const UserStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  REJECTED: 'REJECTED',
  INACTIVE: 'INACTIVE',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const SaleStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;
export type SaleStatus = (typeof SaleStatus)[keyof typeof SaleStatus];

export type StockMovementType =
  | 'RESTOCK'
  | 'DAMAGE'
  | 'LOSS'
  | 'RETURN'
  | 'CORRECTION'
  | 'OPENING_STOCK'
  | 'SALE_DEDUCTION'
  | 'OTHER';

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

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  category?: Category;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  reorderLevel: number;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface SaleItem {
  id?: string;
  saleId: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    unit?: string;
    quantity?: number;
  };
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Sale {
  id: string;
  referenceNumber: string;
  createdById: string;
  salesOfficerId?: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  salesOfficer?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  status: SaleStatus;
  totalAmount: number;
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
