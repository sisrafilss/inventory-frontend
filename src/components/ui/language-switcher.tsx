'use client';

import React from 'react';
import { useLanguage } from '@/lib/context/language-context';
import { Button } from './button';
import { Languages } from 'lucide-react';

export function LanguageSwitcher({ variant = 'outline', size = 'sm' }: { variant?: 'outline' | 'ghost' | 'secondary'; size?: 'sm' | 'default' }) {
  const { lang, toggleLang } = useLanguage();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleLang}
      className="gap-1.5 font-bold text-xs h-7 px-2.5 shadow-xs border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors"
      title={lang === 'en' ? 'Switch to বাংলা' : 'Switch to English'}
    >
      <Languages className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
      <span className="text-neutral-900 dark:text-neutral-100 font-bold">{lang === 'en' ? 'বাংলা' : 'English'}</span>
    </Button>
  );
}

