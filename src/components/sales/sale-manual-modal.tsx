'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  X,
  Calendar as CalendarIcon,
  Loader2,
  Check,
  AlertCircle,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { Product, Customer, Warehouse, Sale } from '@/lib/types';
import { api } from '@/lib/api/client';
import { InvoiceMemoModal, MemoSale } from './invoice-memo-modal';
import { ProductLookupModal } from '../products/product-lookup-modal';
import { CustomerLookupModal } from '../customers/customer-lookup-modal';

export interface ManualSaleLineItem {
  id: string;
  productId: string;
  code: string;
  name: string;
  type: string;
  quantity: number;
  rate: number;
  amount: number;
  purchaseRate: number;
  purchaseAmount: number;
  profit: number;
}

interface SaleManualModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess?: () => void;
}

export function SaleManualModal({
  open,
  onOpenChange,
  onSaveSuccess,
}: SaleManualModalProps) {
  // Current Date
  const [currentDate] = useState(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  });

  // Top Metadata
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CUSTOMER'>('CASH');
  const [memoPreview, setMemoPreview] = useState<boolean>(true);

  // Warehouse State
  const [warehousesList, setWarehousesList] = useState<Warehouse[]>([]);
  const [defaultWarehouseId, setDefaultWarehouseId] = useState<string>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [warehouseSearchText, setWarehouseSearchText] = useState<string>('');
  const [isWarehouseDropdownOpen, setIsWarehouseDropdownOpen] = useState<boolean>(false);
  const warehouseDropdownRef = useRef<HTMLDivElement>(null);
  // Customer State
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [debouncedCustomerId, setDebouncedCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [customerWarning, setCustomerWarning] = useState<string | null>(null);
  const [customerSuccess, setCustomerSuccess] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerDues, setCustomerDues] = useState('0.00');

  // Customer Dropdown & Lookup State
  const [customerSearchText, setCustomerSearchText] = useState<string>('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState<boolean>(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const [customerLookupOpen, setCustomerLookupOpen] = useState<boolean>(false);

  // Customer ref
  const customerInputRef = useRef<HTMLInputElement>(null);

  // Item Form Fields
  const [itemCode, setItemCode] = useState('');
  const [debouncedCode, setDebouncedCode] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [itemName, setItemName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [productSaleRateMRP, setProductSaleRateMRP] = useState<number | string>('');
  const [dpRate, setDpRate] = useState<number | string>('');
  const [commission, setCommission] = useState<number | string>('');
  const [purchaseRate, setPurchaseRate] = useState<number | string>('');
  const [quantity, setQuantity] = useState<number | string>('');
  const [availableStock, setAvailableStock] = useState<number>(0);
  const [saleRate, setSaleRate] = useState<number | string>('');
  const [itemType, setItemType] = useState('Pieces');

  // Calculated single item amount
  const itemQtyNum = parseFloat(String(quantity)) || 0;
  const itemRateNum = parseFloat(String(saleRate)) || 0;
  const currentItemAmount = Number((itemQtyNum * itemRateNum).toFixed(2));

  // Helper to get warehouse-specific stock
  const getStockForWarehouse = (p: Product | null, wId: string): number => {
    if (!p) return 0;
    if (!wId) return p.quantity || 0;
    if (p.warehouseStocks && p.warehouseStocks.length > 0) {
      const match = p.warehouseStocks.find(
        (ws) => ws.warehouseId === wId || ws.warehouse?.id === wId
      );
      if (match !== undefined) return match.quantity;
    }
    return p.quantity || 0;
  };

  // Loading & Focus States
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const [codeWarning, setCodeWarning] = useState<string | null>(null);
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [activeFocusedField, setActiveFocusedField] = useState<string>('itemCode');

  // Table Items
  const [lineItems, setLineItems] = useState<ManualSaleLineItem[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Totals & Discounts
  const [paidAmount, setPaidAmount] = useState<number | string>('0.00');
  const [paidTouched, setPaidTouched] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<number | string>('0.00');
  const [discountPercent, setDiscountPercent] = useState<number | string>('0');
  const [lastDiscountType, setLastDiscountType] = useState<'amount' | 'percent'>('amount');

  // Dialogs
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Memo Modal
  const [savedSaleForMemo, setSavedSaleForMemo] = useState<MemoSale | null>(null);
  const [showMemoModal, setShowMemoModal] = useState(false);

  // Product Catalog Lookup Modal
  const [productLookupOpen, setProductLookupOpen] = useState(false);

  // Refs
  const codeInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const saleRateInputRef = useRef<HTMLInputElement>(null);

  const handleSelectProductFromLookup = (p: Product) => {
    setItemCode(p.sku);
    setDebouncedCode(p.sku);
    setSelectedProduct(p);
    setItemName(p.name);
    setCompanyName(p.company?.name || '—');
    const mrp = p.sellingPrice ? Number(p.sellingPrice) : 0;
    setProductSaleRateMRP(mrp > 0 ? String(mrp) : '0');
    const dp = p.dpRate ? Number(p.dpRate) : (p.costPrice ? Number(p.costPrice) : 0);
    setDpRate(dp > 0 ? String(dp) : '0');
    const comm = p.commissionPercent ? Number(p.commissionPercent) : 0;
    setCommission(comm > 0 ? String(comm) : '0');
    const pCost = p.costPrice ? Number(p.costPrice) : dp;
    setPurchaseRate(pCost > 0 ? String(pCost) : '0');
    setAvailableStock(getStockForWarehouse(p, selectedWarehouseId));
    setItemType(p.unit || 'Pieces');
    setSaleRate(''); // Never preloaded: admin/manager manually enters Sale Rate
    setQuantity('1');
    setCodeSuccess(true);
    setCodeWarning(null);
    setActiveFocusedField('quantity');
    setProductLookupOpen(false);
    setTimeout(() => qtyInputRef.current?.focus(), 100);
  };

  // Generate Invoice Number and load Customers/Warehouses on open
  useEffect(() => {
    if (open) {
      setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
      setCustomerId('');
      setDebouncedCustomerId('');
      setSelectedCustomer(null);
      setCustomerSearchText('');
      setIsCustomerDropdownOpen(false);
      setCustomerName('');
      setCustomerAddress('');
      setCustomerPhone('');
      setCustomerDues('0.00');
      setCustomerWarning(null);
      setCustomerSuccess(false);

      api.get<Customer[]>('/parties/customers')
        .then((res) => {
          if (res.data) setCustomersList(res.data);
        })
        .catch(() => {});

      api.get<Warehouse[]>('/warehouses')
        .then((res) => {
          if (res.data && res.data.length > 0) {
            const activeList = res.data.filter((w) => w.isActive !== false);
            const list = activeList.length > 0 ? activeList : res.data;
            setWarehousesList(list);
            const def = list.find((w) => w.isDefault) || list[0];
            if (def) {
              setDefaultWarehouseId(def.id);
            }
          }
        })
        .catch(() => {});
    }
  }, [open]);

  // Close warehouse dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        warehouseDropdownRef.current &&
        !warehouseDropdownRef.current.contains(event.target as Node)
      ) {
        setIsWarehouseDropdownOpen(false);
        const currentW = warehousesList.find((w) => w.id === selectedWarehouseId);
        if (currentW) {
          setWarehouseSearchText(currentW.name);
        } else if (!selectedWarehouseId) {
          setWarehouseSearchText('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [warehousesList, selectedWarehouseId]);

  // Close customer dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCustomerDropdownOpen(false);
        if (selectedCustomer) {
          const displayId =
            selectedCustomer.id.length > 12
              ? selectedCustomer.id.slice(0, 8)
              : selectedCustomer.id;
          setCustomerSearchText(displayId);
        } else if (!customerId) {
          setCustomerSearchText('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedCustomer, customerId]);

  // Debounced Item Code Search (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCode(itemCode.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [itemCode]);

  // Query product when debouncedCode changes
  useEffect(() => {
    if (!open) return;
    const code = debouncedCode.toUpperCase();
    if (!code) {
      setCodeWarning(null);
      setCodeSuccess(false);
      setIsSearchingProduct(false);
      return;
    }

    if (selectedProduct && selectedProduct.sku.toUpperCase() === code) {
      return;
    }

    let active = true;
    setIsSearchingProduct(true);
    setCodeWarning(null);
    setCodeSuccess(false);

    api.get<Product>(`/products/by-code/${encodeURIComponent(code)}`)
      .then((res) => {
        if (!active) return;
        const p = res.data;
        if (p) {
          setSelectedProduct(p);
          setItemName(p.name);
          setCompanyName(p.company?.name || '—');
          const mrp = p.sellingPrice ? Number(p.sellingPrice) : 0;
          setProductSaleRateMRP(mrp > 0 ? String(mrp) : '0');
          const dp = p.dpRate ? Number(p.dpRate) : (p.costPrice ? Number(p.costPrice) : 0);
          setDpRate(dp > 0 ? String(dp) : '0');
          const comm = p.commissionPercent ? Number(p.commissionPercent) : 0;
          setCommission(comm > 0 ? String(comm) : '0');
          const pCost = p.costPrice ? Number(p.costPrice) : dp;
          setPurchaseRate(pCost > 0 ? String(pCost) : '0');
          setAvailableStock(getStockForWarehouse(p, selectedWarehouseId));
          setItemType(p.unit || 'Pieces');
          setSaleRate(''); // Never preloaded: admin/manager manually enters Sale Rate
          setQuantity('1');
          setCodeSuccess(true);
          setCodeWarning(null);
          setActiveFocusedField('quantity');
          setTimeout(() => qtyInputRef.current?.focus(), 80);
        }
      })
      .catch(() => {
        if (!active) return;
        setSelectedProduct(null);
        setItemName('');
        setCompanyName('');
        setProductSaleRateMRP('');
        setDpRate('');
        setCommission('');
        setPurchaseRate('');
        setAvailableStock(0);
        setSaleRate('');
        setQuantity('');
        setCodeSuccess(false);
        setCodeWarning(`Product "${code}" does not exist in database.`);
      })
      .finally(() => {
        if (active) setIsSearchingProduct(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedCode, open]);

  // Debounced Customer ID Search (400ms)
  useEffect(() => {
    if (!open) return;
    const handler = setTimeout(() => {
      setDebouncedCustomerId(customerId.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [customerId, open]);

  // Query Customer when debouncedCustomerId changes (searches by Name, Phone, or ID)
  useEffect(() => {
    if (!open) return;
    const code = debouncedCustomerId.trim();
    if (!code || code === '0') {
      setCustomerWarning(null);
      setCustomerSuccess(false);
      setIsSearchingCustomer(false);
      return;
    }

    if (
      selectedCustomer &&
      (selectedCustomer.id.toLowerCase() === code.toLowerCase() ||
        selectedCustomer.phone === code ||
        selectedCustomer.name.toLowerCase() === code.toLowerCase())
    ) {
      return;
    }

    let active = true;
    setIsSearchingCustomer(true);
    setCustomerWarning(null);
    setCustomerSuccess(false);

    api
      .get<Customer>(`/parties/customers/by-code/${encodeURIComponent(code)}`)
      .then((res) => {
        if (!active) return;
        const c = res.data;
        if (c) {
          setSelectedCustomer(c);
          setCustomerName(c.name);
          setCustomerAddress(c.address || '');
          setCustomerPhone(c.phone || '');
          const due = c.currentDue ?? c.openingDue ?? 0;
          setCustomerDues(Number(due).toFixed(2));
          setCustomerSuccess(true);
          setCustomerWarning(null);
        }
      })
      .catch(() => {
        if (!active) return;
        setSelectedCustomer(null);
        setCustomerSuccess(false);
        if (paymentMode === 'CUSTOMER') {
          setCustomerWarning(`Customer "${code}" not found in database.`);
        }
      })
      .finally(() => {
        if (active) setIsSearchingCustomer(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedCustomerId, open, paymentMode, selectedCustomer]);

  // Add Item to Table
  const handleAddItem = () => {
    if (!selectedWarehouseId) {
      setValidationWarning('Please select a warehouse first before adding items.');
      return;
    }

    if (!selectedProduct) {
      setValidationWarning('Please enter an Item Code and select a product first.');
      return;
    }

    const qty = parseInt(String(quantity), 10);
    if (isNaN(qty) || qty <= 0) {
      setValidationWarning('Quantity must be greater than 0.');
      setTimeout(() => qtyInputRef.current?.focus(), 50);
      return;
    }

    const rate = parseFloat(String(saleRate));
    if (isNaN(rate) || rate <= 0) {
      setValidationWarning('Please enter a valid Sale Rate. It must be a positive value greater than zero.');
      setTimeout(() => saleRateInputRef.current?.focus(), 50);
      return;
    }

    // Check existing quantity in table
    const existingInTable = lineItems
      .filter((i) => i.productId === selectedProduct.id)
      .reduce((sum, i) => sum + i.quantity, 0);

    if (existingInTable + qty > availableStock) {
      setValidationWarning(
        `Insufficient stock! Available: ${availableStock}, In Invoice: ${existingInTable + qty}.`
      );
      return;
    }

    const pRate = parseFloat(String(purchaseRate)) || 0;
    const amount = Number((qty * rate).toFixed(2));
    const purchaseAmount = Number((qty * pRate).toFixed(2));
    const profit = Number((amount - purchaseAmount).toFixed(2));

    const newItem: ManualSaleLineItem = {
      id: Math.random().toString(),
      productId: selectedProduct.id,
      code: selectedProduct.sku,
      name: selectedProduct.name,
      type: itemType,
      quantity: qty,
      rate,
      amount,
      purchaseRate: pRate,
      purchaseAmount,
      profit,
    };

    setLineItems((prev) => [...prev, newItem]);

    // Reset item form fields
    setItemCode('');
    setDebouncedCode('');
    setSelectedProduct(null);
    setItemName('');
    setCompanyName('');
    setProductSaleRateMRP('');
    setDpRate('');
    setCommission('');
    setPurchaseRate('');
    setQuantity('');
    setAvailableStock(0);
    setSaleRate('');
    setCodeWarning(null);
    setCodeSuccess(false);
    setActiveFocusedField('itemCode');
    setTimeout(() => codeInputRef.current?.focus(), 50);
  };

  // Remove Item from Table
  const handleRemoveItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedRowId === id) setSelectedRowId(null);
  };

  // Delete Selected Row via Action button
  const handleDeleteSelectedRow = () => {
    if (!selectedRowId) {
      setValidationWarning('Please select an item row from the table below to delete.');
      return;
    }
    handleRemoveItem(selectedRowId);
  };

  // Refresh / Clear All
  const handleRefresh = () => {
    setItemCode('');
    setDebouncedCode('');
    setSelectedProduct(null);
    setItemName('');
    setCompanyName('');
    setProductSaleRateMRP('');
    setDpRate('');
    setCommission('');
    setPurchaseRate('');
    setQuantity('');
    setAvailableStock(0);
    setSaleRate('');
    setCodeWarning(null);
    setCodeSuccess(false);
    setLineItems([]);
    setSelectedRowId(null);
    setPaidAmount('0.00');
    setPaidTouched(false);
    setDiscountAmount('0.00');
    setDiscountPercent('0');
    setLastDiscountType('amount');
    setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
    setSelectedWarehouseId('');
    setWarehouseSearchText('');
    setCustomerId('');
    setDebouncedCustomerId('');
    setSelectedCustomer(null);
    setCustomerSearchText('');
    setIsCustomerDropdownOpen(false);
    setCustomerName('');
    setCustomerAddress('');
    setCustomerPhone('');
    setCustomerDues('0.00');
    setCustomerWarning(null);
    setCustomerSuccess(false);
    setActiveFocusedField('itemCode');
    setTimeout(() => codeInputRef.current?.focus(), 50);
  };

  // Warehouse selection handler
  const handleSelectWarehouse = (w: Warehouse) => {
    setSelectedWarehouseId(w.id);
    setWarehouseSearchText(w.name);
    setIsWarehouseDropdownOpen(false);
    if (selectedProduct) {
      setAvailableStock(getStockForWarehouse(selectedProduct, w.id));
    }
  };

  // Filtered warehouses based on search text (matching name or code)
  const isSearchingWarehouse =
    warehouseSearchText.trim().length > 0 &&
    warehouseSearchText.trim().toLowerCase() !==
      (warehousesList.find((w) => w.id === selectedWarehouseId)?.name || '').trim().toLowerCase();

  const filteredWarehouses = isSearchingWarehouse
    ? warehousesList.filter(
        (w) =>
          w.name.toLowerCase().includes(warehouseSearchText.toLowerCase()) ||
          (w.code && w.code.toLowerCase().includes(warehouseSearchText.toLowerCase()))
      )
    : warehousesList;

  // Customer selection handler
  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    const displayId = c.id.length > 12 ? c.id.slice(0, 8) : c.id;
    setCustomerId(displayId);
    setCustomerSearchText(displayId);
    setCustomerName(c.name);
    setCustomerAddress(c.address || '');
    setCustomerPhone(c.phone || '');
    const due = c.currentDue ?? c.openingDue ?? 0;
    setCustomerDues(Number(due).toFixed(2));
    setCustomerSuccess(true);
    setCustomerWarning(null);
    setIsCustomerDropdownOpen(false);
  };

  const handleSelectCustomerFromLookup = (c: Customer) => {
    handleSelectCustomer(c);
    setCustomerLookupOpen(false);
  };

  // Filtered customers based on search text (matching ID, Name, Phone, Address)
  const isSearchingCustomerText =
    customerSearchText.trim().length > 0 &&
    customerSearchText.trim().toLowerCase() !==
      (selectedCustomer
        ? (selectedCustomer.id.length > 12 ? selectedCustomer.id.slice(0, 8) : selectedCustomer.id).toLowerCase()
        : '');

  const filteredCustomers = isSearchingCustomerText
    ? customersList.filter((c) => {
        const query = customerSearchText.toLowerCase();
        return (
          c.name.toLowerCase().includes(query) ||
          c.phone.toLowerCase().includes(query) ||
          c.id.toLowerCase().includes(query) ||
          (c.address && c.address.toLowerCase().includes(query))
        );
      })
    : customersList;

  // Totals Calculations
  const totalAmount = lineItems.reduce((acc, item) => acc + item.amount, 0);

  const handleDiscountAmountChange = (val: string) => {
    setDiscountAmount(val);
    setLastDiscountType('amount');
    const num = parseFloat(val);
    if (!isNaN(num) && totalAmount > 0) {
      const pct = (num / totalAmount) * 100;
      setDiscountPercent(pct % 1 === 0 ? pct.toString() : pct.toFixed(2));
    } else if (val === '' || num === 0) {
      setDiscountPercent('0');
    }
  };

  const handleDiscountPercentChange = (val: string) => {
    setDiscountPercent(val);
    setLastDiscountType('percent');
    const pct = parseFloat(val);
    if (!isNaN(pct) && totalAmount > 0) {
      const amt = (totalAmount * pct) / 100;
      setDiscountAmount(amt.toFixed(2));
    } else if (val === '' || pct === 0) {
      setDiscountAmount('0.00');
    }
  };

  useEffect(() => {
    if (lastDiscountType === 'percent') {
      const pct = parseFloat(String(discountPercent));
      if (!isNaN(pct) && pct > 0 && totalAmount > 0) {
        const amt = (totalAmount * pct) / 100;
        setDiscountAmount(amt.toFixed(2));
      } else if (totalAmount === 0 || pct === 0) {
        setDiscountAmount('0.00');
      }
    } else if (lastDiscountType === 'amount') {
      const amt = parseFloat(String(discountAmount));
      if (!isNaN(amt) && amt > 0 && totalAmount > 0) {
        const pct = (amt / totalAmount) * 100;
        setDiscountPercent(pct % 1 === 0 ? pct.toString() : pct.toFixed(2));
      } else if (totalAmount === 0 || amt === 0) {
        setDiscountPercent('0');
      }
    }
  }, [totalAmount, lastDiscountType]);

  const totalPurchaseCost = lineItems.reduce((acc, item) => acc + item.purchaseAmount, 0);
  const discountVal = Math.max(0, parseFloat(String(discountAmount)) || 0);
  const netAmount = Math.max(0, totalAmount - discountVal);
  const totalProfit = Number((netAmount - totalPurchaseCost).toFixed(2));

  // Paid amount calculation: in cash mode defaults to netAmount
  const effectivePaid =
    paymentMode === 'CASH' && !paidTouched
      ? netAmount
      : Math.max(0, parseFloat(String(paidAmount)) || 0);

  const currentDues = Number(Math.max(0, netAmount - effectivePaid).toFixed(2));

  // Save Validation & Trigger
  const handleInitiateSave = () => {
    if (!selectedWarehouseId) {
      setValidationWarning('Please select a warehouse before saving the sale.');
      return;
    }

    if (lineItems.length === 0) {
      setValidationWarning('Please add at least one item to the sale invoice before saving.');
      return;
    }

    if (paymentMode === 'CUSTOMER' && !selectedCustomer && !customerName.trim()) {
      setValidationWarning('Please enter a Customer Name or select a customer for credit sale.');
      return;
    }

    setShowConfirmSave(true);
  };

  // Save Execute to Database
  const handleExecuteSave = async () => {
    setIsSaving(true);
    try {
      const targetWarehouseId = selectedWarehouseId || undefined;
      const effectiveCustName =
        customerName.trim() || (paymentMode === 'CASH' ? 'Cash Party' : 'Customer');

      const payload = {
        referenceNumber: invoiceNumber.trim() || undefined,
        paymentType: paymentMode === 'CASH' ? ('CASH' as const) : ('CREDIT' as const),
        customerId: selectedCustomer ? selectedCustomer.id : undefined,
        customerName: effectiveCustName,
        customerPhone: (selectedCustomer?.phone || customerPhone.trim()) || undefined,
        customerAddress: (selectedCustomer?.address || customerAddress.trim()) || undefined,
        warehouseId: targetWarehouseId,
        discount: discountVal,
        discountPercent: parseFloat(String(discountPercent)) || undefined,
        paidAmount: effectivePaid,
        items: lineItems.map((item) => ({
          productId: item.productId,
          warehouseId: targetWarehouseId,
          quantity: item.quantity,
          unitPrice: item.rate,
          purchaseCost: item.purchaseRate,
        })),
      };

      const res = await api.post<Sale>('/sales', payload);
      const created = res.data;

      // Refresh customers list so any newly created customer is in the list immediately
      api.get<Customer[]>('/parties/customers')
        .then((cRes) => {
          if (cRes.data) setCustomersList(cRes.data);
        })
        .catch(() => {});

      setShowConfirmSave(false);

      // Prepare memo data
      if (memoPreview) {
        const memoData: MemoSale = {
          id: created.id,
          referenceNumber: created.referenceNumber || invoiceNumber,
          totalAmount: Number(created.totalAmount),
          discount: Number(created.discount || discountVal),
          netAmount: Number(created.netAmount || netAmount),
          paidAmount: Number(created.paidAmount || effectivePaid),
          dueAmount: Number(created.dueAmount || currentDues),
          paymentType: paymentMode === 'CASH' ? 'CASH' : 'CREDIT',
          totalPurchaseCost,
          profit: totalProfit,
          customerName: created.customerName || effectiveCustName,
          customerPhone: created.customerPhone || (selectedCustomer?.phone || customerPhone.trim()) || undefined,
          customer: {
            name: created.customer?.name || effectiveCustName,
            phone: created.customer?.phone || selectedCustomer?.phone || customerPhone.trim(),
            address: created.customer?.address || selectedCustomer?.address || customerAddress.trim(),
            currentDue: Number(created.customer?.currentDue ?? (currentDues || 0)),
          },
          items: lineItems.map((item) => ({
            quantity: item.quantity,
            unitPrice: item.rate,
            lineTotal: item.amount,
            product: {
              name: item.name,
              sku: item.code,
              unit: item.type,
            },
          })),
        };
        setSavedSaleForMemo(memoData);
        setShowMemoModal(true);
        handleRefresh();
      } else {
        alert('Sale saved successfully!');
        handleRefresh();
        onOpenChange(false);
        if (onSaveSuccess) onSaveSuccess();
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Failed to save sale.');
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
        className="p-0 max-w-6xl w-full border-2 border-[#800000] dark:border-rose-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
      >
        {/* Dark Green Banner Header with Drag Handle */}
        <div
          data-drag-handle
          title="Click and drag to move window"
          className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🍎</span>
            <span className="text-white font-bold text-sm tracking-wide">Sale Manual</span>
          </div>

          <h2 className="text-xl font-bold text-white tracking-wide pointer-events-none select-none absolute left-1/2 -translate-x-1/2">
            Sale Manual
          </h2>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="text-white/90 hover:text-white hover:bg-black/20 p-1 rounded transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="p-3 sm:p-4 space-y-3 select-none text-xs text-neutral-900 dark:text-neutral-100">
          {/* Top Form Area (3 Columns: Item Details on Left, Financials in Center, Customer & Options on Right with generous gap) */}
          <div className="flex flex-col lg:flex-row items-start justify-between gap-y-3 gap-x-4 lg:gap-x-6">
            {/* Column 1: Item Details Inputs & Action Buttons (w-[420px]) */}
            <div className="w-full lg:w-[420px] shrink-0 space-y-1.5">
              {/* Row 1: Invoice Number */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                  Invoice
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  readOnly
                  tabIndex={-1}
                  placeholder="Auto"
                  className="w-36 h-6 px-2 bg-neutral-200/80 dark:bg-slate-800/80 text-neutral-800 dark:text-neutral-200 border border-neutral-400 dark:border-slate-600 font-mono text-xs focus:outline-none cursor-not-allowed select-all"
                />
              </div>

              {/* Row 2: Item Code + View Button */}
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                    Item Code
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex items-center">
                      <input
                        ref={codeInputRef}
                        type="text"
                        value={itemCode}
                        onChange={(e) => {
                          setItemCode(e.target.value.toUpperCase());
                          if (codeWarning) setCodeWarning(null);
                        }}
                        onFocus={() => setActiveFocusedField('itemCode')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            setDebouncedCode(itemCode.trim());
                          }
                        }}
                        placeholder="e.g. 937095"
                        disabled={isSaving}
                        className="w-32 h-6 px-2 pr-6 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50"
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
                      className="h-6 px-4 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-medium text-xs shadow-sm transition-colors disabled:opacity-50"
                    >
                      View
                    </button>
                  </div>
                </div>

                {/* Aligned Error Warning */}
                {codeWarning && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="w-20 shrink-0" />
                    <div className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{codeWarning}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 3: Item Name */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                  Item Name
                </label>
                <input
                  type="text"
                  value={itemName}
                  readOnly
                  placeholder="Product name"
                  className="w-[320px] h-6 px-2 bg-white/90 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-medium focus:outline-none"
                />
              </div>

              {/* Row 4: Quantity & Stock */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                  Quantity
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={qtyInputRef}
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    onFocus={() => setActiveFocusedField('quantity')}
                    onBlur={() => setActiveFocusedField('')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!saleRate || parseFloat(String(saleRate)) <= 0) {
                          saleRateInputRef.current?.focus();
                        } else {
                          handleAddItem();
                        }
                      }
                    }}
                    placeholder="0"
                    className={`w-24 h-6 px-2 border border-neutral-400 dark:border-slate-600 font-bold focus:outline-none transition-colors ${
                      activeFocusedField === 'quantity'
                        ? 'bg-[#ffff00] text-black ring-1 ring-amber-500'
                        : 'bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100'
                    }`}
                  />
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 w-10 text-center">Stock</span>
                  <input
                    type="text"
                    readOnly
                    value={availableStock}
                    className="w-20 h-6 px-2 bg-white/80 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 5: Sale Rate & Type */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                  Sale Rate
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={saleRateInputRef}
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={saleRate}
                    onChange={(e) => setSaleRate(e.target.value)}
                    onFocus={() => setActiveFocusedField('saleRate')}
                    onBlur={() => setActiveFocusedField('')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                    placeholder="0.00"
                    className={`w-24 h-6 px-2 border border-neutral-400 dark:border-slate-600 font-bold focus:outline-none transition-colors ${
                      activeFocusedField === 'saleRate'
                        ? 'bg-[#ffff00] text-black ring-1 ring-amber-500'
                        : 'bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100'
                    }`}
                  />
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 w-10 text-center">Type</span>
                  <input
                    type="text"
                    readOnly
                    value={itemType}
                    className="w-20 h-6 px-2 bg-white/80 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 6: Amount */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                  Amount
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentItemAmount > 0 ? currentItemAmount.toFixed(2) : ''}
                  placeholder="0.00"
                  className="w-24 h-6 px-2 bg-white/80 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-bold focus:outline-none"
                />
              </div>

              {/* Row 7: Action Buttons Row (Refresh, Add, Save, Delete, Close) */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isSaving}
                  className="w-[74px] h-7 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={isSaving}
                  className="w-[74px] h-7 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={handleInitiateSave}
                  disabled={isSaving}
                  className="w-[74px] h-7 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border-2 border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />}
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelectedRow}
                  disabled={isSaving}
                  className="w-[74px] h-7 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 border border-blue-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  disabled={isSaving}
                  className="w-[74px] h-7 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Column 2: Financials & Warehouse (Warehouse, Company, Sale Rate (MRP), DP Rate, Commission, Purchase Rate) */}
            <div className="w-full lg:w-[270px] shrink-0 space-y-1.5 lg:ml-2">
              {/* Row 1: Warehouse Combobox */}
              <div className="flex items-center gap-2 relative" ref={warehouseDropdownRef}>
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Warehouse
                </label>
                <div className="relative flex-1">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={warehouseSearchText}
                      onChange={(e) => {
                        setWarehouseSearchText(e.target.value);
                        setIsWarehouseDropdownOpen(true);
                        if (!e.target.value.trim()) {
                          setSelectedWarehouseId('');
                          if (selectedProduct) {
                            setAvailableStock(getStockForWarehouse(selectedProduct, ''));
                          }
                        }
                      }}
                      onFocus={() => setIsWarehouseDropdownOpen(true)}
                      onClick={() => setIsWarehouseDropdownOpen(true)}
                      placeholder="Select Warehouse..."
                      disabled={isSaving}
                      className="w-full h-6 px-2 pr-6 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setIsWarehouseDropdownOpen((prev) => !prev)}
                      className="absolute right-1 text-neutral-500 hover:text-neutral-700 p-0.5 cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Dropdown list */}
                  {isWarehouseDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-60 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-600 shadow-xl z-50 py-1">
                      {filteredWarehouses.length === 0 ? (
                        <div className="px-3 py-1.5 text-xs text-neutral-500 text-center">
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
                              className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-slate-700 cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-emerald-100/70 dark:bg-emerald-950 font-bold text-emerald-900 dark:text-emerald-200'
                                  : 'text-neutral-800 dark:text-neutral-200'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="truncate">{w.name}</span>
                                {w.code && (
                                  <span className="text-[10px] text-neutral-500 font-mono">
                                    ({w.code})
                                  </span>
                                )}
                                {w.isDefault && (
                                  <span className="text-[9px] px-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded border border-amber-300 shrink-0">
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

              {/* Row 2: Company */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Company
                </label>
                <input
                  type="text"
                  value={companyName}
                  readOnly
                  placeholder="—"
                  className="w-28 h-6 px-2 bg-white/80 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:outline-none"
                />
              </div>

              {/* Row 3: Sale Rate (MRP) */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Sale Rate (MRP)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={productSaleRateMRP}
                    readOnly
                    placeholder="0.00"
                    className="w-24 h-6 px-2 bg-white/80 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-bold focus:outline-none"
                  />
                  <span className="text-xs font-semibold">Tk</span>
                </div>
              </div>

              {/* Row 4: DP Rate */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  DP Rate
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={dpRate}
                    readOnly
                    placeholder="0.00"
                    className="w-24 h-6 px-2 bg-white/80 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:outline-none"
                  />
                  <span className="text-xs font-semibold">Tk</span>
                </div>
              </div>

              {/* Row 5: Commission */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Commission
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={commission}
                    readOnly
                    placeholder="0"
                    className="w-14 h-6 px-2 bg-white/80 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 text-center focus:outline-none"
                  />
                  <span className="text-xs font-semibold">%</span>
                </div>
              </div>

              {/* Row 6: Purchase Rate */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Purchase Rate
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={purchaseRate}
                    readOnly
                    placeholder="0.00"
                    className="w-24 h-6 px-2 bg-white/80 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-bold focus:outline-none"
                  />
                  <span className="text-xs font-semibold">Tk</span>
                </div>
              </div>
            </div>

            {/* Column 3: Customer / Party Info & Date & Options (w-[380px] with guaranteed separation) */}
            <div className="w-full lg:w-[380px] shrink-0 space-y-1.5 lg:ml-auto">
              {/* Row 1: Date in top right */}
              <div className="flex justify-end h-6 items-center">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 px-2 py-0.5 font-mono text-xs shadow-sm">
                  <span className="font-semibold">{currentDate}</span>
                  <CalendarIcon className="w-3.5 h-3.5 text-neutral-500" />
                </div>
              </div>

              {/* Row 2: Radios & Memo Preview Checkbox */}
              <div className="flex items-center justify-between gap-3 h-6">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    <input
                      type="radio"
                      name="salePaymentMode"
                      checked={paymentMode === 'CASH'}
                      onChange={() => {
                        setPaymentMode('CASH');
                        setPaidTouched(false);
                      }}
                      className="accent-emerald-700 w-4 h-4 cursor-pointer"
                    />
                    <span>Cash</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    <input
                      type="radio"
                      name="salePaymentMode"
                      checked={paymentMode === 'CUSTOMER'}
                      onChange={() => {
                        setPaymentMode('CUSTOMER');
                        setPaidTouched(true);
                        setPaidAmount('0.00');
                        setTimeout(() => customerInputRef.current?.focus(), 80);
                      }}
                      className="accent-emerald-700 w-4 h-4 cursor-pointer"
                    />
                    <span>Customer</span>
                  </label>
                </div>

                {/* Memo Preview Checkbox in Bold Red */}
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-red-600 dark:text-red-400">
                  <input
                    type="checkbox"
                    checked={memoPreview}
                    onChange={(e) => setMemoPreview(e.target.checked)}
                    className="accent-red-600 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Memo Preview</span>
                </label>
              </div>

              {/* Row 3: Customer ID Combobox & View Button */}
              <div className="relative" ref={customerDropdownRef}>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                    Customer ID
                  </label>
                  <div className="flex items-center gap-1.5 flex-1 relative">
                    <div className="relative flex-1 flex items-center">
                      <input
                        ref={customerInputRef}
                        type="text"
                        value={customerSearchText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomerSearchText(val);
                          setCustomerId(val);
                          setIsCustomerDropdownOpen(true);
                          if (customerWarning) setCustomerWarning(null);
                          if (!val.trim()) {
                            setSelectedCustomer(null);
                            setCustomerName('');
                            setCustomerAddress('');
                            setCustomerPhone('');
                            setCustomerDues('0.00');
                            setCustomerSuccess(false);
                          }
                        }}
                        onFocus={() => setIsCustomerDropdownOpen(true)}
                        onClick={() => setIsCustomerDropdownOpen(true)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            setIsCustomerDropdownOpen(false);
                            setDebouncedCustomerId(customerSearchText.trim());
                          }
                        }}
                        disabled={isSaving}
                        placeholder="Search ID, Name, Phone..."
                        className="w-full h-6 px-2 pr-12 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-75"
                      />
                      <div className="absolute right-1 flex items-center gap-0.5 text-neutral-500">
                        {isSearchingCustomer && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 pointer-events-none" />
                        )}
                        {!isSearchingCustomer && customerSuccess && (
                          <Check className="w-3.5 h-3.5 text-emerald-600 pointer-events-none" />
                        )}
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setIsCustomerDropdownOpen((prev) => !prev)}
                          className="hover:text-neutral-700 dark:hover:text-neutral-300 p-0.5 cursor-pointer"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomerLookupOpen(true)}
                      disabled={isSaving}
                      title="Open Customer Directory to browse and select customers"
                      className="h-6 px-3 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-medium text-xs shadow-sm transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                </div>

                {/* Dropdown list */}
                {isCustomerDropdownOpen && (
                  <div className="absolute left-24 right-0 top-full mt-1 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-600 shadow-xl z-50 py-1">
                    {filteredCustomers.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-neutral-500 text-center">
                        No customer found
                      </div>
                    ) : (
                      filteredCustomers.map((c) => {
                        const isSelected = selectedCustomer?.id === c.id;
                        const due = Number(c.currentDue ?? c.openingDue ?? 0);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectCustomer(c)}
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 dark:hover:bg-slate-700 cursor-pointer transition-colors border-b border-neutral-100 dark:border-slate-700/50 last:border-b-0 ${
                              isSelected
                                ? 'bg-emerald-100/70 dark:bg-emerald-950 font-bold text-emerald-900 dark:text-emerald-200'
                                : 'text-neutral-800 dark:text-neutral-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate font-semibold">{c.name}</span>
                              {due > 0 && (
                                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 rounded">
                                  Due: ৳{due.toFixed(0)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono mt-0.5">
                              <span>ID: #{c.id.slice(0, 8)}</span>
                              {c.phone && <span>• {c.phone}</span>}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Aligned Error Warning for Customer */}
                {customerWarning && paymentMode === 'CUSTOMER' && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="w-24 shrink-0" />
                    <div className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{customerWarning}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 4: Name */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (customerWarning) setCustomerWarning(null);
                  }}
                  disabled={isSaving}
                  placeholder={paymentMode === 'CASH' ? 'Cash Party / Customer Name' : 'Customer Name'}
                  className="flex-1 h-6 px-2 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:outline-none disabled:opacity-75"
                />
              </div>

              {/* Row 5: Address */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Address
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  disabled={isSaving}
                  placeholder="Address"
                  className="flex-1 h-6 px-2 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:outline-none disabled:opacity-75"
                />
              </div>

              {/* Row 6: Phone No */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Phone No
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  disabled={isSaving}
                  placeholder="017..."
                  className="flex-1 h-6 px-2 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:outline-none disabled:opacity-75"
                />
              </div>

              {/* Row 7: Dues */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Dues
                </label>
                <input
                  type="text"
                  value={customerDues}
                  readOnly
                  className="w-28 h-6 px-2 bg-white/80 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-bold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Middle Table Grid (SN | Code | Item Name | Type | Quantity | Rate | Amount | Action | P_Rate | P_Amount | Cm/Profit) */}
          <div className="border border-neutral-400 dark:border-slate-700 bg-[#9ca3af] dark:bg-slate-950 overflow-hidden shadow-inner">
            <div className="max-h-52 sm:max-h-56 overflow-y-auto overflow-x-auto min-h-[140px] bg-[#9ca3af] dark:bg-slate-950 flex flex-col">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead className="sticky top-0 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border-b border-neutral-400 dark:border-slate-700 font-bold select-none text-xs">
                  <tr>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-10 text-center font-bold">
                      SN
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-24 font-bold">
                      Code
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 min-w-[180px] font-bold">
                      Item Name
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-20 font-bold">
                      Type
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-20 text-right font-bold">
                      Quantity
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-24 text-right font-bold">
                      Rate
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-24 text-right font-bold">
                      Amount
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-16 text-center font-bold">
                      Action
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-24 text-right font-bold">
                      P_Rate
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-24 text-right font-bold">
                      P_Amount
                    </th>
                    <th className="py-1 px-2 text-right font-bold w-24">
                      Profit
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900">
                  {lineItems.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-neutral-500 font-medium italic bg-white dark:bg-slate-900">
                        No sale items added. Type product code above and click Add.
                      </td>
                    </tr>
                  ) : (
                    lineItems.map((item, idx) => {
                      const isSelected = selectedRowId === item.id;
                      const isCyan = idx % 2 === 1;

                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedRowId(item.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-sky-500 text-white font-semibold'
                              : isCyan
                              ? 'bg-[#e0f7fa] dark:bg-cyan-950/40 text-neutral-900 dark:text-neutral-100 hover:bg-sky-100 dark:hover:bg-slate-800'
                              : 'bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 hover:bg-sky-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-center">
                            {idx + 1}
                          </td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 font-mono">
                            {item.code}
                          </td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700">
                            {item.name}
                          </td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700">
                            {item.type}
                          </td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-right font-bold">
                            {item.quantity}
                          </td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-right">
                            {item.rate.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-right font-bold">
                            {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveItem(item.id);
                              }}
                              className={`underline font-semibold ${
                                isSelected ? 'text-white hover:text-red-200' : 'text-blue-600 hover:text-red-600'
                              }`}
                            >
                              Delete
                            </button>
                          </td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-right">
                            {item.purchaseRate.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-right font-semibold">
                            {item.purchaseAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-0.5 px-2 text-right font-bold text-emerald-700 dark:text-emerald-400">
                            {item.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <div className="flex-1 min-h-[50px] bg-[#9ca3af] dark:bg-slate-950 w-full" />
            </div>
          </div>

          {/* Bottom Summary Area (Paid, Current Dues | Total, Discount, Net Amount | Purchase Cost, Gross Profit) */}
          <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-1">
            {/* Left Section: Paid & Current Dues */}
            <div className="space-y-1.5 w-full sm:w-auto">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right">
                  Paid
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paidTouched ? paidAmount : effectivePaid}
                  onChange={(e) => {
                    setPaidTouched(true);
                    setPaidAmount(e.target.value);
                  }}
                  disabled={isSaving}
                  placeholder="0.00"
                  className="w-32 h-6 px-2 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 text-right font-bold disabled:opacity-50"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-red-600 dark:text-red-500 w-24 text-right">
                  Current Dues
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentDues.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  className="w-32 h-6 px-2 bg-white/80 dark:bg-slate-800/80 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 text-right font-bold"
                />
              </div>
            </div>

            {/* Middle Section: Total, Discount, Net Amount */}
            <div className="space-y-1.5 w-full sm:w-auto">
              <div className="flex items-center justify-end gap-3">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right">
                  Total
                </label>
                <input
                  type="text"
                  readOnly
                  value={totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  className="w-36 h-6 px-2 bg-white/80 dark:bg-slate-800/80 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 text-right font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <label className="text-xs font-bold text-red-600 dark:text-red-500 w-24 text-right">
                  Discount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => handleDiscountAmountChange(e.target.value)}
                  disabled={isSaving}
                  placeholder="0.00"
                  className="w-36 h-6 px-2 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-neutral-400 dark:border-slate-600 text-right font-bold disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <label className="text-xs font-bold text-red-600 dark:text-red-500 w-24 text-right">
                  Discount (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => handleDiscountPercentChange(e.target.value)}
                  disabled={isSaving}
                  placeholder="0"
                  className="w-36 h-6 px-2 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-neutral-400 dark:border-slate-600 text-right font-bold disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-100 w-24 text-right">
                  Net Amount
                </label>
                <input
                  type="text"
                  readOnly
                  value={netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  className="w-36 h-6 px-2 bg-white/90 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 text-right font-bold"
                />
              </div>
            </div>

            {/* Far Right Section: Cost & Profit */}
            <div className="space-y-1.5 w-full sm:w-auto">
              {/* Purchase Cost */}
              <div className="flex items-center justify-end gap-2">
                <input
                  type="text"
                  readOnly
                  value={totalPurchaseCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  className="w-36 h-6 px-2 bg-white/80 dark:bg-slate-800/80 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 text-right font-bold"
                  title="Total Purchase Cost"
                />
              </div>

              {/* Gross Profit */}
              <div className="flex items-center justify-end gap-2">
                <input
                  type="text"
                  readOnly
                  value={totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  className="w-36 h-6 px-2 bg-white/90 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-neutral-400 dark:border-slate-600 text-right font-bold"
                  title="Net Profit"
                />
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Confirmation Dialog (Screenshot 5) */}
      <Dialog
        open={showConfirmSave}
        onOpenChange={(isOpen) => !isSaving && setShowConfirmSave(isOpen)}
        closeOnBackdropClick={!isSaving}
        className="max-w-sm p-5 bg-white dark:bg-neutral-900 border border-border shadow-2xl rounded-sm"
      >
        <div className="space-y-4">
          <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 border-b pb-1">
            Confirmation
          </div>

          <div className="flex items-center gap-3 py-2">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
              ?
            </div>
            <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
              Do you want to save the information?
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <Button
              size="sm"
              onClick={handleExecuteSave}
              disabled={isSaving}
              className="min-w-[70px] h-7 bg-white hover:bg-neutral-100 text-black border border-neutral-400 text-xs font-semibold focus:ring-1 focus:ring-blue-500 shadow-sm"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConfirmSave(false)}
              disabled={isSaving}
              className="min-w-[70px] h-7 text-xs font-semibold"
            >
              No
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Validation Notice Dialog */}
      <Dialog
        open={!!validationWarning}
        onOpenChange={() => setValidationWarning(null)}
        className="max-w-sm p-5 bg-white dark:bg-neutral-900 border border-border shadow-2xl rounded-sm"
      >
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-sm font-bold text-foreground">Notice</h3>
          <p className="text-xs text-muted-foreground">{validationWarning}</p>
          <div className="pt-2 flex justify-center">
            <Button size="sm" onClick={() => setValidationWarning(null)} className="px-6">
              OK
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Memo Preview Modal */}
      {savedSaleForMemo && (
        <InvoiceMemoModal
          sale={savedSaleForMemo}
          open={showMemoModal}
          onOpenChange={(isOpen) => {
            setShowMemoModal(isOpen);
            if (!isOpen) {
              setSavedSaleForMemo(null);
              onOpenChange(false);
              if (onSaveSuccess) onSaveSuccess();
            }
          }}
        />
      )}

      {/* Product Catalog Lookup Modal with Infinite Scrolling */}
      <ProductLookupModal
        open={productLookupOpen}
        onOpenChange={setProductLookupOpen}
        onSelectProduct={handleSelectProductFromLookup}
        initialSearch={itemCode}
      />

      {/* Customer Lookup Modal */}
      <CustomerLookupModal
        open={customerLookupOpen}
        onOpenChange={setCustomerLookupOpen}
        onSelectCustomer={handleSelectCustomerFromLookup}
        initialSearch={customerSearchText}
      />
    </>
  );
}
