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
      className="font-bold text-xs h-7 w-7 p-0 shadow-xs border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
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
