'use client';

import React from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { Badge } from '../ui/badge';
import { ThemeSwitcher } from '../ui/theme-switcher';
import { Menu, LogOut, Shield, Phone } from 'lucide-react';
import { AppLogo } from '@/components/ui/app-logo';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onOpenMobileMenu?: () => void;
  isSidebarOpen?: boolean;
}

export function Header({ onToggleSidebar, onOpenMobileMenu, isSidebarOpen }: HeaderProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="h-12 bg-[#004d00] dark:bg-emerald-950 text-white border-b border-[#003800] dark:border-emerald-900 px-3 sm:px-5 flex items-center justify-between sticky top-0 z-30 shadow-md select-none">
      {/* Left: Sidebar Toggle & Desktop System Title */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleSidebar || onOpenMobileMenu}
          className="p-1.5 rounded hover:bg-white/10 text-white transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
          title={isSidebarOpen ? 'Collapse sidebar (Ctrl+B)' : 'Expand sidebar (Ctrl+B)'}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <AppLogo size="sm" showText={false} />
          <span className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-1.5">
            <span className="hidden sm:inline">ProStock ERP — Inventory & Accounts Solution</span>
            <span className="sm:hidden">ProStock ERP</span>
          </span>
        </div>
      </div>

      {/* Right: Controls & User Status */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Developer WhatsApp Chip */}
        <a
          href="https://wa.me/8801521410415"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-[#003800] hover:bg-[#002800] border border-emerald-600/50 text-emerald-200 hover:text-white text-[10.5px] font-mono transition-colors shadow-xs"
          title="Contact Developer Israfil Hossen on WhatsApp"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-neutral-300">Dev:</span>
          <span className="font-bold text-white">Israfil Hossen</span>
          <span className="text-emerald-400 font-bold">(01521410415)</span>
        </a>

        {/* Theme Switcher Button */}
        <ThemeSwitcher size="sm" />

        {/* Role Badge */}
        <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-xs bg-[#800000] text-white text-[10px] font-mono font-bold tracking-wider uppercase border border-rose-900 shadow-xs">
          <Shield className="w-3 h-3 text-rose-200" />
          <span>{user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'ADMIN' ? 'Admin' : 'Manager'}</span>
        </div>

        {/* User Email */}
        <span className="text-xs text-emerald-100/90 hidden md:inline font-mono font-medium px-2 py-0.5 bg-black/20 rounded-xs border border-white/10">
          {user.email}
        </span>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="h-7 px-2.5 bg-white/95 hover:bg-white text-rose-700 font-bold text-xs rounded-xs border border-rose-300 shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
          title="Sign out of system"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-600" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
