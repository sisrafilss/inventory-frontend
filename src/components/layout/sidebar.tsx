'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Layers,
  Package,
  Boxes,
  ShoppingCart,
  Clock,
  BarChart3,
  ShieldCheck,
  PlusCircle,
  User as UserIcon,
  Building2,
  Warehouse,
  Contact,
  Truck,
  Receipt,
  BadgeDollarSign,
  Tag,
  X,
  Phone,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { AppLogo } from '@/components/ui/app-logo';

interface SidebarProps {
  onClose?: () => void;
  onCloseMobile?: () => void;
}

function ReportsSubMenu({
  role,
  onCloseMobile,
}: {
  role: string;
  onCloseMobile?: () => void;
}) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'warehouse-stock';

  const reportGroups = [
    {
      id: 'stock',
      group: 'Stock & Godown',
      icon: Warehouse,
      items: [
        { label: 'Warehouse Stock', tab: 'warehouse-stock' },
        { label: 'Stock Alerts & Aging', tab: 'reorder-aging' },
        { label: 'Catalog Stock', tab: 'inventory' },
        { label: 'Stock Adjustments', tab: 'adjustments' },
      ],
    },
    {
      id: 'sales',
      group: 'Sales & Commercial',
      icon: ShoppingCart,
      items: [
        { label: 'Daily Sales', tab: 'daily-sales' },
        { label: 'Sales History', tab: 'sales' },
        { label: 'SR Performance', tab: 'user-performance' },
        ...(role !== 'MANAGER'
          ? [{ label: 'Profit by Invoice', tab: 'profit-by-invoice' }]
          : []),
      ],
    },
    {
      id: 'dues',
      group: 'Dues & Ledger',
      icon: Receipt,
      items: [
        { label: 'Due List (AP & AR)', tab: 'due-list' },
        { label: 'Customer Ledger', tab: 'customer-ledger' },
        { label: 'Daily Purchases', tab: 'daily-purchases' },
      ],
    },
    {
      id: 'financials',
      group: 'Financials & Cash',
      icon: BadgeDollarSign,
      items: [
        ...(role !== 'MANAGER'
          ? [{ label: 'Balance Sheet', tab: 'balance-sheet' }]
          : []),
        { label: 'Daily Expenses', tab: 'daily-costs' },
        { label: 'Cash Handover', tab: 'cash' },
      ],
    },
    {
      id: 'analytics',
      group: 'Analytics',
      icon: BarChart3,
      items: [{ label: 'BI Custom Builder', tab: 'bi-analytics' }],
    },
  ];

  // Identify which group contains currentTab
  const activeGroup = reportGroups.find((g) =>
    g.items.some((item) => item.tab === currentTab)
  );
  const activeGroupId = activeGroup ? activeGroup.id : 'stock';

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    [activeGroupId]: true,
  }));

  // Auto-expand active group when tab changes
  useEffect(() => {
    if (activeGroupId) {
      setOpenGroups((prev) => ({
        ...prev,
        [activeGroupId]: true,
      }));
    }
  }, [activeGroupId]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <div className="pl-1.5 py-1 space-y-1 border-l border-emerald-800/70 ml-3.5 my-1">
      {reportGroups.map((grp) => {
        const isOpen = !!openGroups[grp.id];
        const isGroupActive = grp.items.some((item) => item.tab === currentTab);
        const Icon = grp.icon;

        return (
          <div key={grp.id} className="space-y-0.5">
            {/* Group Accordion Button */}
            <button
              type="button"
              onClick={() => toggleGroup(grp.id)}
              className={cn(
                'w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-semibold rounded-xs transition-all cursor-pointer text-left',
                isGroupActive
                  ? 'text-emerald-100 bg-emerald-950/70 border border-emerald-800/70 shadow-xs'
                  : 'text-emerald-200/80 hover:bg-white/10 hover:text-white'
              )}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Icon className={cn('w-3.5 h-3.5 shrink-0', isGroupActive ? 'text-emerald-300' : 'text-emerald-400/80')} />
                <span className="truncate">{grp.group}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-1">
                <span
                  className={cn(
                    'text-[9px] px-1 rounded-full font-mono font-bold',
                    isGroupActive
                      ? 'bg-emerald-900 text-emerald-200'
                      : 'bg-white/10 text-emerald-200/70'
                  )}
                >
                  {grp.items.length}
                </span>
                {isOpen ? (
                  <ChevronDown className="w-3 h-3 text-emerald-300 shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-emerald-400/70 shrink-0" />
                )}
              </div>
            </button>

            {/* Nested Sub-Items */}
            {isOpen && (
              <div className="pl-2.5 py-0.5 space-y-0.5 border-l border-emerald-700/40 ml-2.5 my-0.5">
                {grp.items.map((sub) => {
                  const isActive = currentTab === sub.tab;
                  return (
                    <Link
                      key={sub.tab}
                      href={`/reports?tab=${sub.tab}`}
                      onClick={onCloseMobile}
                      className={cn(
                        'flex items-center gap-2 px-2 py-1 text-[11px] rounded-xs transition-colors',
                        isActive
                          ? 'bg-[#006400] text-white font-bold shadow-xs'
                          : 'text-emerald-100/70 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full shrink-0',
                          isActive ? 'bg-emerald-300' : 'bg-emerald-600/50'
                        )}
                      />
                      <span className="truncate">{sub.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Sidebar({ onClose, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [reportsExpanded, setReportsExpanded] = useState(pathname.startsWith('/reports'));

  useEffect(() => {
    if (pathname.startsWith('/reports')) {
      setReportsExpanded(true);
    }
  }, [pathname]);

  if (!user) return null;

  const role = user.role;

  // Build navigation items based on role
  const navItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'allSales',
      label: 'Sales',
      href: '/sales',
      icon: ShoppingCart,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'returns',
      label: 'Returns & Refunds',
      href: '/returns',
      icon: RotateCcw,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'products',
      label: 'Product Catalog',
      href: '/products',
      icon: Package,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'categories',
      label: 'Categories',
      href: '/categories',
      icon: Layers,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'companies',
      label: 'Companies',
      href: '/companies',
      icon: Building2,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'warehouses',
      label: 'Warehouses',
      href: '/warehouses',
      icon: Warehouse,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'parties',
      label: 'Parties (Cust/Supp)',
      href: '/parties',
      icon: Contact,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'expenses',
      label: 'Expenses',
      href: '/expenses',
      icon: Receipt,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'payments',
      label: 'Payments / Dues',
      href: '/payments',
      icon: BadgeDollarSign,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'inventory',
      label: 'Inventory / Stock',
      href: '/inventory',
      icon: Boxes,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'users',
      label: 'User Management',
      href: '/users',
      icon: Users,
      roles: ['SUPER_ADMIN', 'ADMIN'],
    },
    {
      key: 'reports',
      label: 'Reports & Ledger',
      href: '/reports',
      icon: BarChart3,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'auditLogs',
      label: 'Audit Trail',
      href: '/audit-logs',
      icon: ShieldCheck,
      roles: ['SUPER_ADMIN', 'ADMIN'],
    },
    {
      key: 'profile',
      label: 'My Profile',
      href: '/profile',
      icon: UserIcon,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-full bg-[#13281b] dark:bg-slate-950 text-slate-200 border-r border-[#0d1d14] flex flex-col h-full select-none shadow-lg">
      {/* Brand Header */}
      <div className="h-12 flex items-center justify-between px-3 bg-[#004d00] dark:bg-emerald-950 border-b border-[#003800] dark:border-emerald-900 shrink-0">
        <AppLogo size="sm" variant="dark" />

        {(onClose || onCloseMobile) && (
          <button
            type="button"
            onClick={onClose || onCloseMobile}
            className="p-1 rounded hover:bg-white/10 text-white transition-colors cursor-pointer"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-2 py-2.5 space-y-0.5 overflow-y-auto">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const title = item.label;
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href) && item.href !== '/sales');

          if (item.key === 'reports') {
            return (
              <div key={item.href + item.key} className="space-y-0.5">
                <div
                  className={cn(
                    'flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold rounded-xs transition-colors',
                    isActive
                      ? 'bg-[#006400] text-white border-l-3 border-emerald-400 shadow-xs'
                      : 'text-emerald-100/75 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Link
                    href={item.href}
                    onClick={() => {
                      setReportsExpanded(true);
                      onCloseMobile?.();
                    }}
                    className="flex items-center gap-2.5 flex-1 min-w-0"
                  >
                    <Icon className={cn('w-3.5 h-3.5 shrink-0', isActive ? 'text-emerald-300' : 'text-emerald-200/70')} />
                    <span className="truncate">{title}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReportsExpanded((prev) => !prev);
                    }}
                    className="p-1 hover:bg-black/20 rounded text-emerald-300 cursor-pointer"
                    title={reportsExpanded ? 'Collapse report options' : 'Expand report options'}
                  >
                    {reportsExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {reportsExpanded && (
                  <Suspense fallback={null}>
                    <ReportsSubMenu role={role} onCloseMobile={onCloseMobile} />
                  </Suspense>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href + item.key}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-semibold rounded-xs transition-colors',
                isActive
                  ? 'bg-[#006400] text-white border-l-3 border-emerald-400 shadow-xs'
                  : 'text-emerald-100/75 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className={cn('w-3.5 h-3.5 shrink-0', isActive ? 'text-emerald-300' : 'text-emerald-200/70')} />
              <span className="truncate">{title}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info Footer in Sidebar */}
      <div className="p-2.5 border-t border-[#0d1d14] bg-[#0b1b11] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xs bg-[#006400] text-emerald-200 border border-emerald-500/30 flex items-center justify-center font-bold text-[11px] uppercase">
            {user.name?.slice(0, 2) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate text-white leading-tight">{user.name}</p>
            <p className="text-[10px] text-emerald-400 truncate uppercase font-mono font-semibold">
              {user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'ADMIN' ? 'Admin' : 'Manager'}
            </p>
          </div>
        </div>
      </div>

      {/* Developer & Contact Card (Always Visible) */}
      <div className="p-2 px-3 border-t border-[#0d1d14] bg-[#07130b] shrink-0 select-none">
        <div className="flex items-center justify-between text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider mb-0.5">
          <span className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            DEVELOPED BY
          </span>
          <span className="text-neutral-500 font-mono text-[8px]">PRO</span>
        </div>
        <div className="text-[11px] font-bold text-white tracking-wide truncate">
          Israfil Hossen
        </div>
        <a
          href="https://wa.me/8801521410415"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex items-center gap-1.5 text-[10.5px] text-emerald-300 hover:text-emerald-200 font-mono font-bold transition-colors group cursor-pointer"
          title="Contact on WhatsApp"
        >
          <Phone className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
          <span className="truncate">01521410415 (WhatsApp)</span>
        </a>
      </div>
    </aside>
  );
}
