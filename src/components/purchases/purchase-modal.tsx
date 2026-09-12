'use client';
import { toast } from "sonner";

import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  X,
  Calendar as CalendarIcon,
  Loader2,
  Trash2,
  Check,
  AlertCircle,
  HelpCircle,
  Lock,
  ChevronDown,
  UserPlus,
} from 'lucide-react';
import { Product, Supplier, Warehouse } from '@/lib/types';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/context/auth-context';
import { SupplierLookupModal } from '@/components/suppliers/supplier-lookup-modal';
import { SupplierModal as AddSupplierModal } from '@/components/parties/supplier-modal';
import { ProductLookupModal } from '@/components/products/product-lookup-modal';
import { PremiumNumberInput } from '@/components/ui/number-input';

export interface PurchaseLineItem {
  id: string;
  productId: string;
  code: string;
  name: string;
  type: string;
  quantity: number;
  rate: number;
  amount: number;
  remarks: string;
  purchaseRate?: number;
  saleRate?: number;
  dpRate: number;
  commission: number;
}

interface PurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProductCode?: string;
  onSaveSuccess?: () => void;
}

export function PurchaseModal({
  open,
  onOpenChange,
  initialProductCode,
  onSaveSuccess,
}: PurchaseModalProps) {
  // Banner prompt text (e.g. "Type Product Code", "Type Quantity . . .")
  const [bannerPrompt, setBannerPrompt] = useState('Type Product Code');

  // Payment mode: CASH or SUPPLIER
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'SUPPLIER'>('CASH');

  // Date and Invoice
  const [purchaseDate, setPurchaseDate] = useState(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  });
  const [invoiceNumber, setInvoiceNumber] = useState('');

  const { user } = useAuth();

  // Supplier & Warehouse State
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
  const [warehousesList, setWarehousesList] = useState<Warehouse[]>([]);
  const [defaultWarehouseId, setDefaultWarehouseId] = useState<string>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [warehouseSearchText, setWarehouseSearchText] = useState<string>('');
  const [isWarehouseDropdownOpen, setIsWarehouseDropdownOpen] = useState(false);
  const warehouseDropdownRef = useRef<HTMLDivElement>(null);

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierId, setSupplierId] = useState('0');
  const [debouncedSupplierSearch, setDebouncedSupplierSearch] = useState('');
  const [supplierSearchText, setSupplierSearchText] = useState('');
  const [supplierName, setSupplierName] = useState('Cash Party');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierDues, setSupplierDues] = useState('0.00');
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [isSearchingSupplier, setIsSearchingSupplier] = useState(false);
  const [supplierWarning, setSupplierWarning] = useState<string | null>(null);
  const [supplierSuccess, setSupplierSuccess] = useState(false);
  const [supplierLookupOpen, setSupplierLookupOpen] = useState(false);
  const [addSupplierModalOpen, setAddSupplierModalOpen] = useState(false);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);
  const supplierInputRef = useRef<HTMLInputElement>(null);

  // Item form fields
  const [itemCode, setItemCode] = useState(initialProductCode || '');
  const [debouncedCode, setDebouncedCode] = useState(initialProductCode || '');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productLookupOpen, setProductLookupOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [quantity, setQuantity] = useState<number | string>('');
  const [itemType, setItemType] = useState('Pieces');
  const [dpRate, setDpRate] = useState<number | string>('');
  const [commission, setCommission] = useState<number | string>('');
  const [purchaseRate, setPurchaseRate] = useState<number | string>('');
  const [saleRate, setSaleRate] = useState<number | string>('');

  // Loading & status flags
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const [codeWarning, setCodeWarning] = useState<string | null>(null);
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [activeFocusedField, setActiveFocusedField] = useState<string>('itemCode');

  // Line items in the table
  const [lineItems, setLineItems] = useState<PurchaseLineItem[]>([]);

  // Summary calculations
  const [paidAmount, setPaidAmount] = useState<number | string>('');
  const [paidTouched, setPaidTouched] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<number | string>('');

  // Dialogs
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Ref for auto-focusing quantity
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Click-outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        warehouseDropdownRef.current &&
        !warehouseDropdownRef.current.contains(event.target as Node)
      ) {
        setIsWarehouseDropdownOpen(false);
      }
      if (
        supplierDropdownRef.current &&
        !supplierDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSupplierDropdownOpen(false);
        if (selectedSupplier) {
          const displayId =
            selectedSupplier.code ||
            (selectedSupplier.id.length > 12 ? selectedSupplier.id.slice(0, 8) : selectedSupplier.id);
          setSupplierSearchText(displayId);
        } else if (!supplierId || supplierId === '0') {
          setSupplierSearchText('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedSupplier, supplierId]);

  // Load suppliers and warehouses on mount / open
  useEffect(() => {
    if (!open) return;
    if (!invoiceNumber) {
      setInvoiceNumber(`PUR-${Date.now().toString().slice(-6)}`);
    }
    setPaymentMode('CASH');
    setPaidAmount('');
    setPaidTouched(false);
    setDiscountAmount('');
    setSelectedSupplier(null);
    setSupplierId('0');
    setSupplierName('Cash Party');
    setSupplierSearchText('');
    setDebouncedSupplierSearch('');
    setIsSupplierDropdownOpen(false);
    setSupplierAddress('');
    setSupplierPhone('');
    setSupplierDues('0.00');
    setSupplierWarning(null);
    setSupplierSuccess(false);
    setIsSearchingSupplier(false);

    api.get<Supplier[]>('/parties/suppliers')
      .then((res) => {
        if (res.data) setSuppliersList(res.data);
      })
      .catch(() => {});

    api.get<Warehouse[]>('/warehouses')
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setWarehousesList(res.data);
          const activeWhs = res.data.filter((w) => w.isActive);
          const def = activeWhs.find((w) => w.isDefault) || activeWhs[0] || res.data[0];
          setDefaultWarehouseId(def?.id || '');
          if (user?.role === 'MANAGER' && user?.warehouseId) {
            setSelectedWarehouseId(user.warehouseId);
            const managerWh = res.data.find((w) => w.id === user.warehouseId);
            setWarehouseSearchText(managerWh ? managerWh.name : 'Assigned Warehouse');
          } else {
            const currentId = def?.id || '';
            setSelectedWarehouseId(currentId);
            const chosen = res.data.find((w) => w.id === currentId);
            if (chosen) setWarehouseSearchText(chosen.name);
          }
        }
      })
      .catch(() => {});
  }, [open, user]);

  // Sync manager assigned warehouse
  useEffect(() => {
    if (open && user?.role === 'MANAGER' && user?.warehouseId) {
      setSelectedWarehouseId(user.warehouseId);
      const managerWh = warehousesList.find((w) => w.id === user.warehouseId);
      if (managerWh) {
        setWarehouseSearchText(managerWh.name);
      }
    }
  }, [open, user, warehousesList]);

  // If initialProductCode provided
  useEffect(() => {
    if (open && initialProductCode) {
      setItemCode(initialProductCode);
      setDebouncedCode(initialProductCode);
    }
  }, [open, initialProductCode]);

  // Debounce Item Code while typing (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCode(itemCode.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [itemCode]);

  // Fetch product as soon as debouncedCode changes
  useEffect(() => {
    if (!open) return;
    const code = debouncedCode.toUpperCase();
    if (!code || code.length === 0) {
      setCodeWarning(null);
      setCodeSuccess(false);
      setIsSearchingProduct(false);
      return;
    }

    // Skip if already loaded
    if (selectedProduct && selectedProduct.sku.toUpperCase() === code) {
      return;
    }

    let active = true;
    setIsSearchingProduct(true);
    setCodeWarning(null);
    setCodeSuccess(false);
    setBannerPrompt('Searching product...');

    api.get<Product>(`/products/by-code/${encodeURIComponent(code)}`)
      .then((res) => {
        if (!active) return;
        const p = res.data;
        if (p) {
          setSelectedProduct(p);
          setItemName(p.name || '');
          setCompanyName(p.company?.name || '');
          setItemType(p.unit || 'Pieces');
          const dp = p.dpRate ? Number(p.dpRate) : (p.costPrice ? Number(p.costPrice) : 0);
          setDpRate(dp > 0 ? String(dp) : '');
          const comm = p.commissionPercent ? Number(p.commissionPercent) : 0;
          setCommission(comm > 0 ? String(comm) : '');
          const pRate = p.costPrice ? Number(p.costPrice) : (dp > 0 ? dp : 0);
          setPurchaseRate(pRate > 0 ? String(pRate) : '');
          const sRate = p.sellingPrice ? Number(p.sellingPrice) : 0;
          setSaleRate(sRate > 0 ? String(sRate) : '');
          setCodeSuccess(true);
          setCodeWarning(null);
          setBannerPrompt('Type Quantity . . .');
          setActiveFocusedField('quantity');
          setTimeout(() => qtyInputRef.current?.focus(), 80);
        }
      })
      .catch(() => {
        if (!active) return;
        setSelectedProduct(null);
        setItemName('');
        setCompanyName('');
        setDpRate('');
        setCommission('');
        setPurchaseRate('');
        setSaleRate('');
        setCodeSuccess(false);
        setCodeWarning(`Product "${code}" does not exist in database.`);
        setBannerPrompt(`Product "${code}" not found`);
      })
      .finally(() => {
        if (active) setIsSearchingProduct(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedCode, open]);

  // Recalculate purchase rate when DP Rate or Commission changes
  useEffect(() => {
    const dp = parseFloat(String(dpRate)) || 0;
    const comm = parseFloat(String(commission)) || 0;
    if (dp > 0) {
      const net = dp - (dp * comm) / 100;
      setPurchaseRate(net.toFixed(2));
    } else {
      setPurchaseRate('');
    }
  }, [dpRate, commission]);

  // Handler for selecting product from ProductLookupModal
  const handleSelectProductFromLookup = (p: Product) => {
    setItemCode(p.sku);
    setDebouncedCode(p.sku);
    setSelectedProduct(p);
    setItemName(p.name || '');
    setCompanyName(p.company?.name || '');
    setItemType(p.unit || 'Pieces');
    const dp = p.dpRate ? Number(p.dpRate) : (p.costPrice ? Number(p.costPrice) : 0);
    setDpRate(dp > 0 ? String(dp) : '');
    const comm = p.commissionPercent ? Number(p.commissionPercent) : 0;
    setCommission(comm > 0 ? String(comm) : '');
    const pRate = p.costPrice ? Number(p.costPrice) : (dp > 0 ? dp : 0);
    setPurchaseRate(pRate > 0 ? String(pRate) : '');
    const sRate = p.sellingPrice ? Number(p.sellingPrice) : 0;
    setSaleRate(sRate > 0 ? String(sRate) : '');
    setQuantity('1');
    setCodeSuccess(true);
    setCodeWarning(null);
    setBannerPrompt('Type Quantity . . .');
    setActiveFocusedField('quantity');
    setProductLookupOpen(false);
    setTimeout(() => qtyInputRef.current?.focus(), 80);
  };

  // Debounced Supplier Search (400ms)
  useEffect(() => {
    if (!open) return;
    const handler = setTimeout(() => {
      setDebouncedSupplierSearch(supplierSearchText.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [supplierSearchText, open]);

  // Query Supplier when debouncedSupplierSearch changes
  useEffect(() => {
    if (!open) return;
    const code = debouncedSupplierSearch.trim();
    if (!code || code === '0') {
      setSupplierWarning(null);
      setSupplierSuccess(false);
      setIsSearchingSupplier(false);
      return;
    }

    if (
      selectedSupplier &&
      (selectedSupplier.id.toLowerCase() === code.toLowerCase() ||
        selectedSupplier.id.toLowerCase().startsWith(code.toLowerCase()) ||
        (selectedSupplier.id.length > 12 &&
          selectedSupplier.id.slice(0, 8).toLowerCase() === code.toLowerCase()) ||
        (selectedSupplier.code &&
          selectedSupplier.code.toLowerCase() === code.toLowerCase()) ||
        (selectedSupplier.phone && selectedSupplier.phone === code) ||
        selectedSupplier.name.toLowerCase() === code.toLowerCase())
    ) {
      setIsSearchingSupplier(false);
      setSupplierSuccess(true);
      return;
    }

    let active = true;
    setIsSearchingSupplier(true);
    setSupplierWarning(null);
    setSupplierSuccess(false);

    api
      .get<Supplier>(`/parties/suppliers/by-code/${encodeURIComponent(code)}`)
      .then((res) => {
        if (!active) return;
        const s = res.data;
        if (s) {
          handleSelectSupplier(s);
        }
      })
      .catch(() => {
        if (!active) return;
        setSelectedSupplier(null);
        setSupplierSuccess(false);
        setSupplierWarning(`Supplier "${code}" not found in database.`);
      })
      .finally(() => {
        if (active) setIsSearchingSupplier(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedSupplierSearch, open, paymentMode, selectedSupplier]);

  // Supplier selection handlers
  const handleSelectSupplier = (s: Supplier) => {
    setSelectedSupplier(s);
    const displayId = s.code || (s.id.length > 12 ? s.id.slice(0, 8) : s.id);
    setSupplierId(s.id);
    setSupplierSearchText(displayId);
    setDebouncedSupplierSearch(displayId);
    setSupplierName(s.name);
    setSupplierAddress(s.address || '');
    setSupplierPhone(s.phone || '');
    const due = s.currentDue ?? s.openingDue ?? 0;
    setSupplierDues(Number(due).toFixed(2));
    setSupplierSuccess(true);
    setSupplierWarning(null);
    setIsSearchingSupplier(false);
    setIsSupplierDropdownOpen(false);
  };

  const handleSelectSupplierFromLookup = (s: Supplier) => {
    handleSelectSupplier(s);
    setSupplierLookupOpen(false);
  };

  const handleSupplierCreated = (s?: Supplier) => {
    if (s) {
      setSuppliersList((prev) => [s, ...prev]);
      handleSelectSupplier(s);
    }
    setAddSupplierModalOpen(false);
  };

  // Warehouse search and selection helpers
  const isSearchingWarehouse =
    warehouseSearchText.trim().length > 0 &&
    warehouseSearchText.trim().toLowerCase() !==
      (warehousesList.find((w) => w.id === selectedWarehouseId)?.name || '').trim().toLowerCase();

  const filteredWarehouses = isSearchingWarehouse
    ? warehousesList.filter((w) => {
        const query = warehouseSearchText.toLowerCase();
        return (
          w.name.toLowerCase().includes(query) ||
          (w.code && w.code.toLowerCase().includes(query))
        );
      })
    : warehousesList;

  const handleSelectWarehouse = (w: Warehouse) => {
    setSelectedWarehouseId(w.id);
    setWarehouseSearchText(w.name);
    setIsWarehouseDropdownOpen(false);
  };

  // Filtered suppliers based on search text (matching Code, Name, Company, Phone, ID, Address)
  const isSearchingSupplierText =
    supplierSearchText.trim().length > 0 &&
    supplierSearchText.trim().toLowerCase() !==
      (selectedSupplier
        ? (selectedSupplier.code || (selectedSupplier.id.length > 12 ? selectedSupplier.id.slice(0, 8) : selectedSupplier.id)).toLowerCase()
        : '');

  const filteredSuppliers = isSearchingSupplierText
    ? suppliersList.filter((s) => {
        const q = supplierSearchText.toLowerCase();
        return (
          (s.code && s.code.toLowerCase().includes(q)) ||
          s.name.toLowerCase().includes(q) ||
          (s.companyName && s.companyName.toLowerCase().includes(q)) ||
          (s.phone && s.phone.toLowerCase().includes(q)) ||
          s.id.toLowerCase().includes(q) ||
          (s.address && s.address.toLowerCase().includes(q))
        );
      })
    : suppliersList;

  // Add line item to table
  const handleAddItem = () => {
    if (!selectedProduct) {
      setValidationWarning('Please enter a valid Item Code and select a product first.');
      return;
    }

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setValidationWarning('Quantity must be greater than 0.');
      setTimeout(() => qtyInputRef.current?.focus(), 50);
      return;
    }

    const rate = Number(purchaseRate) || Number(dpRate) || 0;
    const amount = Number((qty * rate).toFixed(2));
    const sRate = parseFloat(String(saleRate));

    const newItem: PurchaseLineItem = {
      id: Math.random().toString(),
      productId: selectedProduct.id,
      code: selectedProduct.sku,
      name: itemName || selectedProduct.name,
      type: itemType,
      quantity: qty,
      rate,
      purchaseRate: rate,
      saleRate: !isNaN(sRate) && sRate > 0 ? sRate : undefined,
      amount,
      remarks: '',
      dpRate: Number(dpRate) || 0,
      commission: Number(commission) || 0,
    };

    setLineItems((prev) => [...prev, newItem]);

    // Reset item inputs for next product entry
    setItemCode('');
    setDebouncedCode('');
    setSelectedProduct(null);
    setItemName('');
    setCompanyName('');
    setQuantity('');
    setDpRate('');
    setCommission('');
    setPurchaseRate('');
    setSaleRate('');
    setCodeWarning(null);
    setCodeSuccess(false);
    setBannerPrompt('Type Product Code');
    setActiveFocusedField('itemCode');
    setTimeout(() => codeInputRef.current?.focus(), 50);
  };

  // Remove line item
  const handleRemoveItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear / Refresh form
  const handleRefresh = () => {
    setItemCode('');
    setDebouncedCode('');
    setSelectedProduct(null);
    setItemName('');
    setCompanyName('');
    setQuantity('');
    setDpRate('');
    setCommission('');
    setPurchaseRate('');
    setSaleRate('');
    setCodeWarning(null);
    setCodeSuccess(false);
    setLineItems([]);
    setPaidAmount('');
    setPaidTouched(false);
    setDiscountAmount('');
    setInvoiceNumber(`PUR-${Date.now().toString().slice(-6)}`);
    setBannerPrompt('Type Product Code');
    setActiveFocusedField('itemCode');

    setPaymentMode('CASH');
    setSelectedSupplier(null);
    setSupplierId('0');
    setSupplierName('Cash Party');
    setSupplierSearchText('');
    setDebouncedSupplierSearch('');
    setSupplierAddress('');
    setSupplierPhone('');
    setSupplierDues('0.00');
    setSupplierWarning(null);
    setSupplierSuccess(false);
    setIsSupplierDropdownOpen(false);

    if (user?.role === 'MANAGER' && user?.warehouseId) {
      setSelectedWarehouseId(user.warehouseId);
      const managerWh = warehousesList.find((w) => w.id === user.warehouseId);
      setWarehouseSearchText(managerWh ? managerWh.name : 'Assigned Warehouse');
    } else {
      const def = warehousesList.find((w) => w.isDefault && w.isActive) || warehousesList[0];
      setSelectedWarehouseId(def?.id || '');
      setWarehouseSearchText(def ? def.name : '');
    }
    setIsWarehouseDropdownOpen(false);
    setIsSupplierDropdownOpen(false);
  };

  // Total calculations
  const totalAmount = lineItems.reduce((acc, item) => acc + item.amount, 0);
  const discountVal = Number(discountAmount) || 0;
  const netAmount = Math.max(0, totalAmount - discountVal);

  // If cash mode and paid not explicitly edited, paid = netAmount
  const effectivePaid =
    paymentMode === 'CASH' && !paidTouched
      ? netAmount
      : Math.max(0, parseFloat(String(paidAmount)) || 0);

  const currentDues = Number(Math.max(0, netAmount - effectivePaid).toFixed(2));

  // Trigger Save check
  const handleInitiateSave = () => {
    if (lineItems.length === 0) {
      setValidationWarning('Please add at least one product to the purchase invoice before saving.');
      return;
    }

    if (!selectedWarehouseId) {
      setValidationWarning('Please select a destination warehouse for this purchase.');
      return;
    }

    if (paymentMode === 'SUPPLIER' && (!selectedSupplier && (!supplierId || supplierId === '0'))) {
      setValidationWarning('Please select a valid supplier for supplier/credit purchases.');
      return;
    }

    setShowConfirmSave(true);
  };

  // Execute Save to Database
  const handleExecuteSavePurchase = async () => {
    setIsSaving(true);
    try {
      await api.post('/purchases', {
        invoiceNumber: invoiceNumber.trim() || undefined,
        paymentType: paymentMode,
        supplierId:
          paymentMode === 'SUPPLIER'
            ? selectedSupplier?.id || (supplierId !== '0' ? supplierId : undefined)
            : undefined,
        supplierName:
          paymentMode === 'CASH'
            ? supplierName || 'Cash Party'
            : selectedSupplier?.name || supplierName || undefined,
        warehouseId: selectedWarehouseId || defaultWarehouseId || undefined,
        paidAmount: effectivePaid,
        items: lineItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          dpRate: item.dpRate,
          commissionPercent: item.commission,
          purchaseRate: item.rate,
          saleRate: item.saleRate !== undefined && item.saleRate > 0 ? item.saleRate : undefined,
        })),
      });

      setShowConfirmSave(false);
      handleRefresh();
      if (onSaveSuccess) onSaveSuccess();
      toast.success('Purchase invoice saved successfully to database!');
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || err.message || 'Failed to save purchase invoice.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => !isSaving && onOpenChange(isOpen)}
        draggable={true}
        closeOnBackdropClick={false}
        className="p-0 max-w-5xl w-full border-2 border-[#800000] dark:border-rose-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
      >
        {/* Dark Green Banner Header with Drag Handle */}
        <div
          data-drag-handle
          title="Click and drag to move window"
          className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between cursor-grab active:cursor-grabbing touch-none"
        >
          {/* Dynamic prompt on left */}
          <div className="text-lime-300 font-bold text-lg sm:text-xl tracking-wide select-none drop-shadow-sm flex items-center gap-2">
            <span>{bannerPrompt}</span>
            {isSearchingProduct && <Loader2 className="w-4 h-4 animate-spin text-lime-300 inline" />}
          </div>

          {/* Center Title */}
          <h2 className="text-xl font-bold text-white tracking-wide pointer-events-none select-none absolute left-1/2 -translate-x-1/2">
            Purchase
          </h2>

          {/* Close Button */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="text-white/90 hover:text-white hover:bg-black/20 p-1 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body Container */}
        <div className="p-3 sm:p-4 space-y-3 select-none text-xs text-neutral-900 dark:text-neutral-100">
          {/* Upper Section: Actions Stack (Left), Item Form (Middle), Supplier/Payment Info (Right) */}
          <div className="flex flex-col lg:flex-row justify-between gap-4 items-start">
            {/* 1. Left Action Buttons Stack */}
            <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto shrink-0 justify-start pt-1">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isSaving}
                className="w-24 sm:w-28 h-7 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:bg-neutral-200 dark:disabled:bg-slate-800 disabled:text-neutral-400 dark:disabled:text-slate-500 disabled:border-neutral-300 dark:disabled:border-slate-700 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={handleInitiateSave}
                disabled={isSaving}
                className="w-24 sm:w-28 h-7 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border-2 border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:bg-neutral-200 dark:disabled:bg-slate-800 disabled:text-neutral-400 dark:disabled:text-slate-500 disabled:border-neutral-300 dark:disabled:border-slate-700 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-1 cursor-pointer"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />}
                Save
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
                className="w-24 sm:w-28 h-7 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:bg-neutral-200 dark:disabled:bg-slate-800 disabled:text-neutral-400 dark:disabled:text-slate-500 disabled:border-neutral-300 dark:disabled:border-slate-700 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
              >
                Exit
              </button>
            </div>

            {/* 2. Middle Form Fields (Item Details) */}
            <div className="space-y-1.5 flex-1 w-full max-w-md">
              {/* Item Code & View Button */}
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                    Item Code
                  </label>
                  <div className="flex items-center gap-1.5 flex-1">
                    <div className="relative flex items-center">
                      <input
                        ref={codeInputRef}
                        type="text"
                        value={itemCode}
                        onChange={(e) => {
                          setItemCode(e.target.value.toUpperCase());
                          if (codeWarning) setCodeWarning(null);
                        }}
                        onFocus={() => {
                          setBannerPrompt('Type Product Code');
                          setActiveFocusedField('itemCode');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            setDebouncedCode(itemCode.trim());
                          }
                        }}
                        placeholder="e.g. 937095"
                        disabled={isSaving}
                        className="w-32 sm:w-40 h-6 px-2 pr-6 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50"
                      />
                      {isSearchingProduct && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 absolute right-1.5 pointer-events-none" />
                      )}
                      {!isSearchingProduct && codeSuccess && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 absolute right-1.5 pointer-events-none" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setProductLookupOpen(true)}
                      disabled={isSaving}
                      title="Open Product Catalog to browse and select products"
                      className="h-6 px-3 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-medium text-xs shadow-sm transition-colors disabled:bg-neutral-200 dark:disabled:bg-slate-800 disabled:text-neutral-400 dark:disabled:text-slate-500 disabled:border-neutral-300 dark:disabled:border-slate-700 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                </div>

                {/* Warning when product code does not exist - aligned with inputs */}
                {codeWarning && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="w-24 shrink-0" />
                    <div className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{codeWarning}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Item Name (Read-only auto-populated from product) */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Item Name
                </label>
                <input
                  type="text"
                  value={itemName}
                  readOnly
                  tabIndex={-1}
                  placeholder="Product name"
                  className="flex-1 h-6 px-2 bg-neutral-200 dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-slate-700 font-medium select-none cursor-not-allowed focus:outline-none placeholder:text-neutral-400"
                />
              </div>

              {/* Company (Read-only auto-populated from product) */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Company
                </label>
                <input
                  type="text"
                  value={companyName}
                  readOnly
                  tabIndex={-1}
                  placeholder="Company name"
                  className="w-44 sm:w-56 h-6 px-2 bg-neutral-200 dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-slate-700 font-medium select-none cursor-not-allowed focus:outline-none placeholder:text-neutral-400"
                />
              </div>

              {/* Warehouse Combobox (Search by Code or Name, locked for Manager) */}
              <div className="flex items-center gap-2 relative" ref={warehouseDropdownRef}>
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0 flex items-center justify-end gap-1">
                  {user?.role === 'MANAGER' && <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                  Warehouse
                </label>
                <div className="relative w-44 sm:w-56">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={warehouseSearchText}
                      onChange={(e) => {
                        if (user?.role === 'MANAGER') return;
                        setWarehouseSearchText(e.target.value);
                        setIsWarehouseDropdownOpen(true);
                        if (!e.target.value.trim()) {
                          setSelectedWarehouseId('');
                        }
                      }}
                      onFocus={() => {
                        if (user?.role !== 'MANAGER') setIsWarehouseDropdownOpen(true);
                        setBannerPrompt('Search & Select Warehouse');
                        setActiveFocusedField('warehouse');
                      }}
                      onClick={() => {
                        if (user?.role !== 'MANAGER') setIsWarehouseDropdownOpen(true);
                      }}
                      placeholder={user?.role === 'MANAGER' ? "No warehouse assigned" : "Search code or name..."}
                      disabled={isSaving}
                      readOnly={user?.role === 'MANAGER'}
                      title={user?.role === 'MANAGER' ? "Assigned warehouse (locked for Manager role)" : "Search by warehouse code (e.g. WA-101) or name"}
                      className={`w-full h-6 px-2 pr-6 text-xs focus:outline-none disabled:opacity-50 ${
                        user?.role === 'MANAGER'
                          ? 'bg-neutral-200 dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-slate-700 cursor-not-allowed select-none font-medium'
                          : 'bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:ring-1 focus:ring-emerald-600 font-medium'
                      }`}
                    />
                    {user?.role === 'MANAGER' ? (
                      <div
                        className="absolute right-1 text-amber-600 dark:text-amber-400 p-0.5"
                        title="Warehouse is fixed by Administrator"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setIsWarehouseDropdownOpen((prev) => !prev)}
                        className="absolute right-1 text-neutral-500 hover:text-neutral-700 p-0.5 cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown list with Code & Name */}
                  {user?.role !== 'MANAGER' && isWarehouseDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-64 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 shadow-xl z-50 py-1">
                      {filteredWarehouses.length === 0 ? (
                        <div className="px-3 py-1.5 text-xs text-neutral-500 text-center italic">
                          No warehouse found
                        </div>
                      ) : (
                        filteredWarehouses.map((w) => {
                          const isSelected = w.id === selectedWarehouseId;
                          return (
                            <button
                              key={w.id}
                              type="button"
                              onClick={() => handleSelectWarehouse(w)}
                              className={`w-full text-left px-2.5 py-1.5 text-xs flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-slate-700 cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-emerald-100/70 dark:bg-emerald-950 font-bold text-emerald-900 dark:text-emerald-200'
                                  : 'text-neutral-800 dark:text-neutral-200'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="truncate">{w.name}</span>
                                {w.code && (
                                  <span className="text-[10px] text-neutral-600 dark:text-neutral-300 font-mono bg-neutral-100 dark:bg-slate-700 px-1 py-0.2 rounded border border-neutral-300 dark:border-slate-600">
                                    {w.code}
                                  </span>
                                )}
                                {w.isDefault && (
                                  <span className="text-[9px] px-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded border border-amber-300 shrink-0 font-normal">
                                    Default
                                  </span>
                                )}
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity & Type Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Quantity
                </label>
                <div className="flex items-center gap-2">
                  <PremiumNumberInput
                    inputRef={qtyInputRef}
                    min={1}
                    step={1}
                    value={quantity}
                    onChange={(val) => setQuantity(val)}
                    placeholder="0"
                    className="w-28"
                    isFocusedHighlight={activeFocusedField === 'quantity'}
                    onFocus={() => {
                      setBannerPrompt('Type Quantity . . .');
                      setActiveFocusedField('quantity');
                    }}
                    onBlur={() => setActiveFocusedField('')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                    disabled={isSaving}
                  />
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                    disabled={isSaving}
                    className="w-24 sm:w-28 h-6 px-1.5 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:outline-none disabled:opacity-50"
                  >
                    <option value="Pieces">Pieces</option>
                    <option value="Dozens">Dozens</option>
                    <option value="Sets">Sets</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Kilograms">Kilograms</option>
                    <option value="Cartons">Cartons</option>
                    <option value="Packets">Packets</option>
                    <option value="Pairs">Pairs</option>
                  </select>
                </div>
              </div>

              {/* DP Rate */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  DP Rate
                </label>
                <div className="flex items-center gap-1">
                  <PremiumNumberInput
                    min={0}
                    step={1}
                    value={dpRate}
                    onChange={(val) => setDpRate(val)}
                    placeholder="0.00"
                    className="w-28"
                    onFocus={() => setBannerPrompt('Type DP Rate')}
                    disabled={isSaving}
                  />
                  <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Tk</span>
                </div>
              </div>

              {/* Commission */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Commission
                </label>
                <div className="flex items-center gap-1">
                  <PremiumNumberInput
                    min={0}
                    max={100}
                    step={1}
                    value={commission}
                    onChange={(val) => setCommission(val)}
                    placeholder="0.00"
                    className="w-28"
                    onFocus={() => setBannerPrompt('Type Commission')}
                    disabled={isSaving}
                  />
                  <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">%</span>
                </div>
              </div>

              {/* Purchase Rate (Disabled / Auto-calculated) */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Purchase Rate
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={purchaseRate}
                    readOnly
                    tabIndex={-1}
                    placeholder="0.00"
                    className="w-28 h-6 px-2 bg-neutral-200 dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-slate-700 font-bold select-none cursor-not-allowed focus:outline-none placeholder:text-neutral-400"
                  />
                  <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Tk</span>
                </div>
              </div>

              {/* Sale Rate (Optional) & Add Button */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Sale Rate
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <PremiumNumberInput
                      min={0}
                      step={1}
                      value={saleRate}
                      onChange={(val) => setSaleRate(val)}
                      placeholder="0.00"
                      className="w-28"
                      onFocus={() => setBannerPrompt('Type Sale Rate (Optional)')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddItem();
                        }
                      }}
                      disabled={isSaving}
                    />
                    <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Tk</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={isSaving}
                    className="h-6 px-6 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border-2 border-[#b81b4c] dark:border-rose-500 font-bold text-xs shadow-sm transition-colors disabled:bg-neutral-200 dark:disabled:bg-slate-800 disabled:text-neutral-400 dark:disabled:text-slate-500 disabled:border-neutral-300 dark:disabled:border-slate-700 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Right Section: Cash / Supplier Radio, Date, Invoice, Supplier Info */}
            <div className="space-y-1.5 flex-1 w-full max-w-sm">
              {/* Row 1: Cash / Supplier Radio + Invoice & Date Header */}
              <div className="flex items-center justify-between gap-2 pb-1">
                {/* Cash & Supplier Radio Buttons */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 select-none">
                    <input
                      type="radio"
                      name="purchasePaymentMode"
                      checked={paymentMode === 'CASH'}
                      onChange={() => {
                        setPaymentMode('CASH');
                        setPaidTouched(false);
                        if (!selectedSupplier) {
                          setSupplierId('0');
                          setSupplierName('Cash Party');
                        }
                      }}
                      disabled={isSaving}
                      className="accent-emerald-700 dark:accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Cash</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 select-none">
                    <input
                      type="radio"
                      name="purchasePaymentMode"
                      checked={paymentMode === 'SUPPLIER'}
                      onChange={() => {
                        setPaymentMode('SUPPLIER');
                        setPaidTouched(true);
                        setPaidAmount('');
                        if (!selectedSupplier) {
                          setSupplierId('');
                          setSupplierName('');
                        }
                        setTimeout(() => supplierInputRef.current?.focus(), 80);
                      }}
                      disabled={isSaving}
                      className="accent-emerald-700 dark:accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Supplier</span>
                  </label>
                </div>

                {/* Date & Invoice */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-200">Invoice</span>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    disabled={isSaving}
                    placeholder="AUTO"
                    className="w-20 h-6 px-1.5 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-mono text-xs disabled:opacity-50"
                  />
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 px-1.5 py-0.5 font-mono text-xs">
                    <span>{purchaseDate}</span>
                    <CalendarIcon className="w-3.5 h-3.5 text-neutral-500" />
                  </div>
                </div>
              </div>

              {/* Row 2: Supplier ID Combobox & View Button */}
              <div className="relative" ref={supplierDropdownRef}>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                    Supplier ID
                  </label>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 relative">
                    <div className="relative flex-1 min-w-0 flex items-center">
                      <input
                        ref={supplierInputRef}
                        type="text"
                        value={supplierSearchText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSupplierSearchText(val);
                          setSupplierId(val);
                          setIsSupplierDropdownOpen(true);
                          if (supplierWarning) setSupplierWarning(null);
                          if (!val.trim()) {
                            setSelectedSupplier(null);
                            setSupplierName(paymentMode === 'CASH' ? 'Cash Party' : '');
                            setSupplierAddress('');
                            setSupplierPhone('');
                            setSupplierDues('0.00');
                            setSupplierSuccess(false);
                          }
                        }}
                        onFocus={() => setIsSupplierDropdownOpen(true)}
                        onClick={() => setIsSupplierDropdownOpen(true)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            setIsSupplierDropdownOpen(false);
                            setDebouncedSupplierSearch(supplierSearchText.trim());
                          }
                        }}
                        disabled={isSaving}
                        placeholder="Search ID, Name, Phone..."
                        className="w-full h-6 px-2 pr-12 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:bg-neutral-200 dark:disabled:bg-slate-800 disabled:text-neutral-400 disabled:cursor-not-allowed truncate"
                      />
                      <div className="absolute right-1 flex items-center gap-0.5 text-neutral-500">
                        {isSearchingSupplier && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 pointer-events-none" />
                        )}
                        {!isSearchingSupplier && supplierSuccess && (
                          <Check className="w-3.5 h-3.5 text-emerald-600 pointer-events-none" />
                        )}
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setIsSupplierDropdownOpen((prev) => !prev)}
                          className="hover:text-neutral-700 dark:hover:text-neutral-300 p-0.5 cursor-pointer"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSupplierLookupOpen(true)}
                      disabled={isSaving}
                      title="Open Supplier Directory to browse and select suppliers"
                      className="h-6 px-2.5 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-medium text-xs shadow-sm transition-colors disabled:bg-neutral-200 dark:disabled:bg-slate-800 disabled:text-neutral-400 dark:disabled:text-slate-500 disabled:border-neutral-300 dark:disabled:border-slate-700 disabled:cursor-not-allowed disabled:shadow-none shrink-0 cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                </div>

                {/* Warning message if supplier not found */}
                {supplierWarning && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="w-20 shrink-0" />
                    <div className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{supplierWarning}</span>
                    </div>
                  </div>
                )}

                {/* Dropdown list */}
                {isSupplierDropdownOpen && (
                  <div className="absolute left-20 right-0 top-full mt-1 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-600 shadow-xl z-50 py-1">
                    <div className="px-2.5 py-1 border-b border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/90 text-[11px]">
                      <span className="font-bold text-neutral-600 dark:text-neutral-300">
                        {filteredSuppliers.length} Suppliers
                      </span>
                    </div>

                    {filteredSuppliers.length === 0 ? (
                      <div className="p-3 text-center space-y-2">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          No supplier found {supplierSearchText ? `for "${supplierSearchText}"` : ''}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSupplierDropdownOpen(false);
                            setAddSupplierModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow cursor-pointer transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Add New Supplier</span>
                        </button>
                      </div>
                    ) : (
                      filteredSuppliers.map((s) => {
                        const isSelected = selectedSupplier?.id === s.id;
                        const due = Number(s.currentDue ?? s.openingDue ?? 0);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSelectSupplier(s)}
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 dark:hover:bg-slate-700 cursor-pointer transition-colors border-b border-neutral-100 dark:border-slate-700/50 last:border-b-0 ${
                              isSelected
                                ? 'bg-emerald-100/70 dark:bg-emerald-950 font-bold text-emerald-900 dark:text-emerald-200'
                                : 'text-neutral-800 dark:text-neutral-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate font-semibold">{s.name}</span>
                              {due > 0 && (
                                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 rounded">
                                  Due: ৳{due.toFixed(0)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono mt-0.5">
                              {s.code ? (
                                <span className="text-emerald-700 dark:text-emerald-400 font-bold">#{s.code}</span>
                              ) : (
                                <span>ID: #{s.id.slice(0, 8)}</span>
                              )}
                              {s.companyName && <span>• {s.companyName}</span>}
                              {s.phone && <span>• {s.phone}</span>}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Row 3: Name (Read-only) */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                  Name
                </label>
                <input
                  type="text"
                  readOnly
                  tabIndex={-1}
                  value={supplierName || (paymentMode === 'CASH' && !selectedSupplier ? 'Cash Party' : '')}
                  placeholder={paymentMode === 'CASH' ? 'Cash Party' : 'Supplier Name (auto)'}
                  className="flex-1 min-w-0 h-6 px-2 bg-neutral-200 dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-slate-700 font-medium select-none focus:outline-none cursor-not-allowed truncate placeholder:text-neutral-400"
                />
              </div>

              {/* Row 4: Address (Read-only) */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                  Address
                </label>
                <input
                  type="text"
                  readOnly
                  tabIndex={-1}
                  value={supplierAddress}
                  placeholder="Address (auto)"
                  className="flex-1 min-w-0 h-6 px-2 bg-neutral-200 dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-slate-700 font-medium select-none focus:outline-none cursor-not-allowed truncate placeholder:text-neutral-400"
                />
              </div>

              {/* Row 5: Phone No (Read-only) */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                  Phone No
                </label>
                <input
                  type="text"
                  readOnly
                  tabIndex={-1}
                  value={supplierPhone}
                  placeholder="Phone (auto)"
                  className="flex-1 min-w-0 h-6 px-2 bg-neutral-200 dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-slate-700 font-medium select-none focus:outline-none cursor-not-allowed truncate placeholder:text-neutral-400"
                />
              </div>

              {/* Row 6: Dues (Read-only) */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                  Dues
                </label>
                <input
                  type="text"
                  value={supplierDues}
                  readOnly
                  tabIndex={-1}
                  className="w-28 h-6 px-2 bg-neutral-200 dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-slate-700 font-bold focus:outline-none select-none cursor-not-allowed placeholder:text-neutral-400"
                />
              </div>
            </div>
          </div>

          {/* Middle Section: Items Purchase Table Grid */}
          <div className="border border-neutral-400 dark:border-slate-700 bg-[#9ca3af] dark:bg-slate-950 overflow-hidden shadow-inner mt-2">
            <div className="max-h-52 sm:max-h-56 overflow-y-auto overflow-x-auto min-h-[140px] bg-[#9ca3af] dark:bg-slate-950 flex flex-col">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead className="sticky top-0 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border-b border-neutral-400 dark:border-slate-700 font-bold select-none text-xs">
                  <tr>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-10 text-center font-bold">SN</th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-24 font-bold">Code</th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 min-w-[160px] font-bold">Item Name</th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-20 font-bold">Type</th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-20 text-right font-bold">Quantity</th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-24 text-right font-bold">Rate</th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-24 text-right font-bold">Sale Rate</th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-24 text-right font-bold">Amount</th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 min-w-[120px] font-bold">Remarks</th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-16 text-center font-bold">Action</th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-20 text-right font-bold">DP Rate</th>
                    <th className="py-1 px-2 text-right font-bold w-20">Commission</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900">
                  {lineItems.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-6 text-center text-neutral-500 font-medium italic bg-white dark:bg-slate-900">
                        No purchase items added yet. Type item code above and click Add.
                      </td>
                    </tr>
                  ) : (
                    lineItems.map((item, idx) => {
                      const isCyan = idx % 2 === 1;
                      return (
                        <tr
                          key={item.id}
                          className={`${
                            isCyan
                              ? 'bg-[#e0f7fa] dark:bg-cyan-950/40'
                              : 'bg-white dark:bg-slate-900'
                          } text-neutral-900 dark:text-neutral-100 hover:bg-sky-100 dark:hover:bg-slate-800 transition-colors`}
                        >
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-center">{idx + 1}</td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 font-mono font-semibold">{item.code}</td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700">{item.name}</td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700">{item.type}</td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-right font-bold">{item.quantity}</td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-right">{item.rate.toFixed(2)}</td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                            {item.saleRate ? item.saleRate.toFixed(2) : '—'}
                          </td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-right font-bold">{item.amount.toFixed(2)}</td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700">{item.remarks || '—'}</td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={isSaving}
                              className="text-red-600 hover:text-red-800 p-0.5 disabled:opacity-50"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-right">{item.dpRate.toFixed(2)}</td>
                          <td className="py-0.5 px-2 text-right">{item.commission}%</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              {/* Grey backdrop filling remaining space */}
              <div className="flex-1 min-h-[50px] bg-[#9ca3af] dark:bg-slate-950 w-full" />
            </div>
          </div>

          {/* Bottom Summary Area (Paid, Current Dues on Left - Total, Discount, Net Amount on Right) */}
          <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-1">
            {/* Left Summary: Paid & Current Dues */}
            <div className="space-y-1.5 w-full sm:w-auto">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right">
                  Paid
                </label>
                <PremiumNumberInput
                  min={0}
                  step={1}
                  value={
                    paidTouched
                      ? (paidAmount === 0 || paidAmount === '0.00' ? '' : paidAmount)
                      : (paymentMode === 'CASH' && effectivePaid > 0 ? effectivePaid.toFixed(2) : (paidAmount || ''))
                  }
                  onChange={(val) => {
                    setPaidTouched(true);
                    setPaidAmount(val);
                  }}
                  disabled={isSaving}
                  placeholder="0.00"
                  className="w-32"
                  textAlign="right"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-red-600 dark:text-red-500 w-24 text-right">
                  Current Dues
                </label>
                <input
                  type="text"
                  readOnly
                  tabIndex={-1}
                  value={currentDues.toFixed(2)}
                  className="w-32 h-6 px-2 bg-neutral-200 dark:bg-slate-800 text-red-600 dark:text-red-400 border border-neutral-300 dark:border-slate-700 text-right font-bold select-none cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>

            {/* Right Summary: Total, Discount, Net Amount */}
            <div className="space-y-1.5 w-full sm:w-auto">
              <div className="flex items-center justify-end gap-3">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right">
                  Total
                </label>
                <input
                  type="text"
                  readOnly
                  tabIndex={-1}
                  value={totalAmount.toFixed(2)}
                  className="w-36 h-6 px-2 bg-neutral-200 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-slate-700 text-right font-bold select-none cursor-not-allowed focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <label className="text-xs font-bold text-red-600 dark:text-red-500 w-24 text-right">
                  Discount
                </label>
                <PremiumNumberInput
                  min={0}
                  step={1}
                  value={discountAmount === 0 || discountAmount === '0.00' ? '' : discountAmount}
                  onChange={(val) => setDiscountAmount(val)}
                  disabled={isSaving}
                  placeholder="0.00"
                  className="w-36 text-red-600 dark:text-red-400 font-bold"
                  textAlign="right"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-100 w-24 text-right">
                  Net Amount
                </label>
                <input
                  type="text"
                  readOnly
                  tabIndex={-1}
                  value={netAmount.toFixed(2)}
                  className="w-36 h-6 px-2 bg-neutral-200 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-slate-700 text-right font-bold select-none cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Save Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirmSave}
        onOpenChange={(isOpen) => !isSaving && setShowConfirmSave(isOpen)}
        title="Confirm Save"
        description="Please confirm saving this purchase invoice to the database."
        onConfirm={handleExecuteSavePurchase}
        confirmText="Yes"
        cancelText="No"
        variant="success"
        isLoading={isSaving}
        loadingText="Saving..."
        details={[
          { label: 'Invoice:', value: invoiceNumber || 'Auto-generated' },
          { label: 'Payment Mode:', value: paymentMode },
          { label: 'Party Name:', value: selectedSupplier?.name || supplierName || (paymentMode === 'CASH' ? 'Cash Party' : 'Supplier') },
          { label: 'Total Items:', value: String(lineItems.length) },
          { label: 'Total Amount:', value: `৳${totalAmount.toFixed(2)}` },
          { label: 'Paid Amount:', value: `৳${effectivePaid.toFixed(2)}`, color: 'text-emerald-700 dark:text-emerald-400' },
          { label: 'Current Dues:', value: `৳${currentDues.toFixed(2)}`, color: 'text-red-600 dark:text-red-400' },
        ]}
      />

      {/* Validation Warning Dialog */}
      <ConfirmDialog
        open={!!validationWarning}
        onOpenChange={() => setValidationWarning(null)}
        title="Notice"
        description={validationWarning}
        onConfirm={() => setValidationWarning(null)}
        confirmText="OK"
        cancelText=""
        variant="danger"
      />

      {/* Product Catalog Lookup Modal */}
      <ProductLookupModal
        open={productLookupOpen}
        onOpenChange={setProductLookupOpen}
        onSelectProduct={handleSelectProductFromLookup}
        initialSearch={itemCode}
        warehouseId={selectedWarehouseId || defaultWarehouseId}
        title="Select Product for Purchase"
      />

      {/* Supplier Directory Lookup Modal */}
      <SupplierLookupModal
        open={supplierLookupOpen}
        onOpenChange={setSupplierLookupOpen}
        onSelectSupplier={handleSelectSupplierFromLookup}
        initialSearch={supplierSearchText}
      />

      {/* Add Supplier Modal */}
      <AddSupplierModal
        open={addSupplierModalOpen}
        onOpenChange={setAddSupplierModalOpen}
        onSuccess={handleSupplierCreated}
      />
    </>
  );
}
