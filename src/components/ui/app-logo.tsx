'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface AppLogoProps {
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'auto' | 'light' | 'dark';
  className?: string;
  textClassName?: string;
}

export function AppLogo({
  showText = true,
  size = 'md',
  variant = 'auto',
  className,
  textClassName,
}: AppLogoProps) {
  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-11 h-11',
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  const subtitleSizes = {
    sm: 'text-[10px]',
    md: 'text-[10.5px]',
    lg: 'text-xs',
  };

  // Text color styles based on variant
  const getProColor = () => {
    if (variant === 'dark') return 'text-white';
    if (variant === 'light') return 'text-neutral-900';
    return 'text-neutral-900 dark:text-white';
  };

  const getStockColor = () => {
    if (variant === 'dark') return 'text-emerald-300';
    if (variant === 'light') return 'text-[#006400]';
    return 'text-[#006400] dark:text-emerald-400';
  };

  const getErpBadgeStyle = () => {
    if (variant === 'dark') return 'bg-emerald-400 text-neutral-950';
    if (variant === 'light') return 'bg-[#006400] text-white';
    return 'bg-[#006400] text-white dark:bg-emerald-400 dark:text-neutral-950';
  };

  const getSubtitleColor = () => {
    if (variant === 'dark') return 'text-emerald-200/80';
    if (variant === 'light') return 'text-neutral-500 font-semibold';
    return 'text-neutral-500 dark:text-neutral-400 font-semibold';
  };

  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      {/* 3D Isometric Inventory Box Icon */}
      <div className={cn('shrink-0 drop-shadow-sm', iconDimensions[size])}>
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#006400" />
              <stop offset="100%" stopColor="#003800" />
            </linearGradient>
            <linearGradient id="logoTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="logoLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="logoRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#065f46" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="14" fill="url(#logoBg)" />
          <rect x="1.5" y="1.5" width="61" height="61" rx="12.5" stroke="#34d399" strokeWidth="2" strokeOpacity="0.4" />
          <polygon points="32,13 50,22 32,31 14,22" fill="url(#logoTop)" />
          <polygon points="14,22 32,31 32,50 14,41" fill="url(#logoLeft)" />
          <polygon points="32,31 50,22 50,41 32,50" fill="url(#logoRight)" />
          <line x1="32" y1="31" x2="32" y2="50" stroke="#003800" strokeWidth="1.5" strokeOpacity="0.6" />
          <line x1="32" y1="31" x2="50" y2="22" stroke="#003800" strokeWidth="1" strokeOpacity="0.3" />
          <line x1="32" y1="31" x2="14" y2="22" stroke="#003800" strokeWidth="1" strokeOpacity="0.3" />
          <path d="M27,22 L34,17 L36,24" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {showText && (
        <div className={cn('flex flex-col text-left', textClassName)}>
          <div className="flex items-center gap-1.5 leading-none">
            <span className={cn('font-extrabold tracking-tight font-sans', titleSizes[size])}>
              <span className={getProColor()}>Pro</span>
              <span className={getStockColor()}>Stock</span>
            </span>
            <span className={cn('font-black px-1.5 py-0.5 rounded-xs font-mono text-[9px]', getErpBadgeStyle())}>
              ERP
            </span>
          </div>
          <span className={cn('tracking-wide mt-1 font-mono', subtitleSizes[size], getSubtitleColor())}>
            Inventory System
          </span>
        </div>
      )}
    </div>
  );
}
