'use client';

import React from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { useLanguage } from '@/lib/context/language-context';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { LanguageSwitcher } from '../ui/language-switcher';
import { ThemeSwitcher } from '../ui/theme-switcher';
import { Menu, LogOut, Shield } from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  if (!user) return null;

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'destructive';
      case 'ADMIN':
        return 'default';
      case 'MANAGER':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <header className="h-16 border-b bg-card px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-md hover:bg-muted text-muted-foreground"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <span className="font-semibold text-sm text-foreground hidden sm:inline-block">
            {t('common.appName')} — {t('common.appSubtitle')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Theme Switcher Button */}
        <ThemeSwitcher />

        {/* Language Switcher Button */}
        <LanguageSwitcher />

        {/* Role Badge */}
        <Badge variant={getRoleBadgeVariant(user.role)} className="uppercase text-[10px] tracking-wider py-1 px-2.5">
          <Shield className="w-3 h-3 mr-1 inline" />
          {t(`roles.${user.role}`)}
        </Badge>

        <span className="text-xs text-muted-foreground hidden md:inline font-medium">
          {user.email}
        </span>

        {/* Logout Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="text-xs gap-1.5 h-8 text-muted-foreground hover:text-destructive hover:border-destructive"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('nav.logout')}</span>
        </Button>
      </div>
    </header>
  );
}
