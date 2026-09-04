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
      className="gap-1.5 font-semibold text-xs h-8 px-2.5 shadow-sm border-input"
      title={lang === 'en' ? 'Switch to বাংলা' : 'Switch to English'}
    >
      <Languages className="w-3.5 h-3.5 text-primary" />
      <span>{lang === 'en' ? 'বাংলা' : 'English'}</span>
    </Button>
  );
}
