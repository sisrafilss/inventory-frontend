'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { useLanguage } from '@/lib/context/language-context';
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
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user) return null;

  const role = user.role;

  // Build navigation items based on role
  const navItems = [
    {
      key: 'dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'allSales',
      href: '/sales',
      icon: ShoppingCart,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'products',
      href: '/products',
      icon: Package,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'categories',
      href: '/categories',
      icon: Layers,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'companies',
      href: '/companies',
      icon: Building2,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'warehouses',
      href: '/warehouses',
      icon: Warehouse,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'parties',
      href: '/parties',
      icon: Contact,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'expenses',
      href: '/expenses',
      icon: Receipt,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'payments',
      href: '/payments',
      icon: BadgeDollarSign,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'inventory',
      href: '/inventory',
      icon: Boxes,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'users',
      href: '/users',
      icon: Users,
      roles: ['SUPER_ADMIN', 'ADMIN'],
    },
    {
      key: 'reports',
      href: '/reports',
      icon: BarChart3,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'auditLogs',
      href: '/audit-logs',
      icon: ShieldCheck,
      roles: ['SUPER_ADMIN', 'ADMIN'],
    },
    {
      key: 'profile',
      href: '/profile',
      icon: UserIcon,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-56 bg-[#13281b] dark:bg-slate-950 text-slate-200 border-r border-[#0d1d14] flex flex-col h-full select-none shadow-lg">
      {/* Brand Header */}
      <div className="h-12 flex items-center justify-between px-4 bg-[#004d00] dark:bg-emerald-950 border-b border-[#003800] dark:border-emerald-900 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xs bg-emerald-400 text-neutral-950 flex items-center justify-center font-black text-base shadow-xs">
            I
          </div>
          <div>
            <h1 className="font-bold text-xs tracking-wide text-white uppercase font-mono">
              {t('common.appName')}
            </h1>
            <p className="text-[10px] text-emerald-200/80 font-medium leading-none">
              POS ERP Solution
            </p>
          </div>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 rounded hover:bg-white/10 text-white"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-2 py-2.5 space-y-0.5 overflow-y-auto">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const title = t(`nav.${item.key}`);
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href) && item.href !== '/sales');

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
      <div className="p-3 border-t border-[#0d1d14] bg-[#0b1b11] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xs bg-[#006400] text-emerald-200 border border-emerald-500/30 flex items-center justify-center font-bold text-[11px] uppercase">
            {user.name?.slice(0, 2) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate text-white leading-tight">{user.name}</p>
            <p className="text-[10px] text-emerald-400 truncate uppercase font-mono font-semibold">
              {t(`roles.${user.role}`)}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
