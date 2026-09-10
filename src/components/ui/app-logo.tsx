'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface AppLogoProps {
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  textClassName?: string;
}

export function AppLogo({
  showText = true,
  size = 'md',
  className,
  textClassName,
}: AppLogoProps) {
  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
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
        <div className={cn('flex flex-col', textClassName)}>
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-extrabold tracking-tight text-sm font-sans">
              <span className="text-white">Pro</span>
              <span className="text-emerald-300">Stock</span>
            </span>
            <span className="bg-emerald-400 text-neutral-950 font-black text-[9px] px-1 py-0.2 rounded-xs font-mono">
              ERP
            </span>
          </div>
          <span className="text-[10px] text-emerald-200/80 font-medium tracking-wide mt-0.5 font-mono">
            Inventory System
          </span>
        </div>
      )}
    </div>
  );
}
