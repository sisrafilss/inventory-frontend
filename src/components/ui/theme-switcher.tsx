'use client';

import React from 'react';
import { useTheme } from '@/lib/context/theme-context';
import { useLanguage } from '@/lib/context/language-context';
import { Button } from './button';
import { Sun, Moon } from 'lucide-react';

export function ThemeSwitcher({
  variant = 'outline',
  size = 'sm',
  showLabel = false,
}: {
  variant?: 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'default';
  showLabel?: boolean;
}) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className="gap-1.5 font-semibold text-xs h-8 px-2.5 shadow-sm border-input transition-colors"
      title={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
      aria-label={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
    >
      {isDark ? (
        <Sun className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
      ) : (
        <Moon className="w-3.5 h-3.5 text-slate-700" />
      )}
      {showLabel && (
        <span>{isDark ? t('theme.light') : t('theme.dark')}</span>
      )}
    </Button>
  );
}
