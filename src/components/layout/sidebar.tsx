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
      key: 'newSale',
      href: '/sales/new',
      icon: PlusCircle,
      roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    },
    {
      key: 'pendingSales',
      href: '/sales/pending',
      icon: Clock,
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
      key: 'purchases',
      href: '/purchases',
      icon: Truck,
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
    <aside className="w-64 border-r bg-card flex flex-col h-full select-none">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
          I
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-tight leading-none text-foreground">
            {t('common.appName')}
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
            {t('common.appSubtitle')}
          </p>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{title}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info footer in sidebar */}
      <div className="p-4 border-t bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
            {user.name?.slice(0, 2) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate text-foreground">{user.name}</p>
            <p className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-wider">
              {t(`roles.${user.role}`)}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
