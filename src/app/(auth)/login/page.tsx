'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { useLanguage } from '@/lib/context/language-context';
import { api } from '@/lib/api/client';
import { User } from '@/lib/types';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import {
  Lock,
  Mail,
  AlertCircle,
  ShieldCheck,
  LogIn,
  KeyRound,
  Building2,
  CheckCircle2,
  Minus,
  Square,
  X,
  Loader2,
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, login } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  React.useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await api.post<{ token: string; user: User }>('/auth/login', {
        email,
        password,
      });

      if (res.data) {
        login(res.data.token, res.data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail('admin@inventory.local');
    setPassword('SuperAdminInitialPassword123!');
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#c6d8ea] dark:bg-slate-950 relative select-none">
      
      {/* Floating Classic Desktop Window */}
      <div className="w-full max-w-md border-2 border-[#004d00] dark:border-emerald-900 bg-[#c6d8ea] dark:bg-slate-900 rounded-none shadow-2xl overflow-hidden">
        
        {/* 1. Classic Windows/ERP Title Bar */}
        <div className="bg-[#006400] dark:bg-emerald-950 py-1.5 px-3 border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-200 shrink-0" />
            <span className="font-bold text-xs uppercase tracking-wider">
              INVENTORY ERP SYSTEM • AUTHENTICATION
            </span>
          </div>

          {/* Retro Window Control Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="w-5 h-5 bg-[#004d00] hover:bg-[#003d00] border border-emerald-700 flex items-center justify-center text-white/80 rounded-none text-[10px]"
              tabIndex={-1}
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              className="w-5 h-5 bg-[#004d00] hover:bg-[#003d00] border border-emerald-700 flex items-center justify-center text-white/80 rounded-none text-[10px]"
              tabIndex={-1}
            >
              <Square className="w-2.5 h-2.5" />
            </button>
            <button
              type="button"
              className="w-5 h-5 bg-red-700 hover:bg-red-800 border border-red-900 flex items-center justify-center text-white rounded-none text-[10px]"
              tabIndex={-1}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 2. Top Window Utility Bar */}
        <div className="bg-[#eaf1f8] dark:bg-slate-800/90 px-3 py-1 border-b border-neutral-300 dark:border-slate-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-neutral-600 dark:text-neutral-400">
            <Building2 className="w-3.5 h-3.5 text-neutral-500" />
            <span>OPERATIONAL DESKTOP CLIENT</span>
          </div>

          {/* Theme & Language Switchers */}
          <div className="flex items-center gap-1.5">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </div>

        {/* 3. Main Form Container */}
        <div className="p-4">
          <div className="p-5 bg-white dark:bg-slate-950 border border-neutral-400 dark:border-slate-700 shadow-inner space-y-4">
            
            {/* Header / Logo Badge */}
            <div className="text-center pb-1 border-b border-neutral-200 dark:border-slate-800">
              <div className="inline-flex items-center justify-center w-11 h-11 bg-[#006400] text-white border-2 border-[#004d00] shadow-sm font-bold text-xl mb-1.5 font-mono">
                ERP
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                {t('auth.signIn')}
              </h2>
              <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                {t('auth.signInDesc')}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-2.5 bg-red-50 dark:bg-rose-950/80 border border-red-400 dark:border-rose-900 flex items-start gap-2 text-xs text-red-800 dark:text-red-200 font-bold">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Email / Username */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#006400] dark:text-emerald-400" />
                    {t('auth.email')}:
                  </span>
                  <span className="text-[10px] text-neutral-400 font-normal">REQUIRED</span>
                </label>
                <input
                  type="email"
                  placeholder="admin@inventory.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full h-8 px-2.5 text-xs bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-none focus:outline-none focus:bg-[#ffffea] dark:focus:bg-slate-800 focus:border-[#006400] text-neutral-900 dark:text-neutral-100 font-mono shadow-xs transition-colors"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-[#006400] dark:text-emerald-400" />
                    {t('auth.password')}:
                  </span>
                  <span className="text-[10px] text-neutral-400 font-normal">CONFIDENTIAL</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full h-8 px-2.5 text-xs bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-none focus:outline-none focus:bg-[#ffffea] dark:focus:bg-slate-800 focus:border-[#006400] text-neutral-900 dark:text-neutral-100 font-mono shadow-xs transition-colors"
                />
              </div>

              {/* Submit Action */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-8.5 bg-[#006400] hover:bg-[#004d00] active:bg-[#003d00] text-white font-bold text-xs uppercase tracking-wider border border-[#003d00] shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer rounded-none disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('auth.signingIn')}</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{t('auth.signIn')}</span>
                    </>
                  )}
                </button>

                {/* Demo Login Button */}
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="w-full h-7.5 bg-[#eaf1f8] hover:bg-[#d9e7f5] dark:bg-slate-800 dark:hover:bg-slate-700 text-neutral-800 dark:text-neutral-200 border border-neutral-400 dark:border-slate-600 font-bold text-xs uppercase tracking-wider shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer rounded-none"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#006400] dark:text-emerald-400" />
                  <span>DEMO CREDENTIALS (ADMIN)</span>
                </button>
              </div>

            </form>

          </div>
        </div>

        {/* 4. Bottom Window Status Bar */}
        <div className="bg-[#eaf1f8] dark:bg-slate-900 px-3 py-1 border-t border-neutral-300 dark:border-slate-700 text-[11px] font-mono text-neutral-600 dark:text-neutral-400 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>SECURITY: 256-BIT SSL ENCRYPTED</span>
          </div>
          <span className="font-bold text-neutral-800 dark:text-neutral-300">
            SYSTEM ONLINE
          </span>
        </div>

      </div>

    </div>
  );
}
