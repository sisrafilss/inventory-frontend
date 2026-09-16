import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num || 0);
}

export function formatMoney(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const val = (num || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `৳${val}`;
}

export function formatDate(dateStr: string | Date): string {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function calculateEffectivePackSize(
  unit: string,
  packSize?: number | string,
): number {
  if (unit === "Dozens") return 12;
  if (unit === "Pairs") return 2;
  const parsed = Number(packSize);
  return parsed > 0 ? parsed : 1;
}

export interface ProductFormData {
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  companyId: string;
  warehouseId: string;
  unit: string;
  packSize: number | string;
  dpRate: number;
  costPrice: number;
  sellingPrice: number;
  quantity: number | string;
  reorderLevel: number;
  description: string;
  isActive: boolean;
}

export function getDefaultProductForm(defaultCompanyId = ""): ProductFormData {
  return {
    name: "",
    sku: "",
    barcode: "",
    categoryId: "",
    companyId: defaultCompanyId,
    warehouseId: "",
    unit: "Pieces",
    packSize: 1,
    dpRate: 0,
    costPrice: 0,
    sellingPrice: 0,
    quantity: "0",
    reorderLevel: 10,
    description: "None",
    isActive: true,
  };
}
