'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { useLanguage } from '@/lib/context/language-context';
import { api } from '@/lib/api/client';
import { User } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { Lock, Mail, AlertCircle, Phone } from 'lucide-react';
import { AppLogo } from '@/components/ui/app-logo';

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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/40 relative">
      {/* Top right theme and language switchers */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md shadow-lg border border-neutral-200 dark:border-slate-800 overflow-hidden">
        {/* Subtle Top Green Accent Bar */}
        <div className="h-1.5 w-full bg-[#006400] dark:bg-emerald-600" />

        <CardHeader className="text-center space-y-1">
          <AppLogo size="lg" className="justify-center mb-1" />
          <CardTitle className="text-2xl font-bold">{t('auth.signIn')}</CardTitle>
          <CardDescription>
            {t('auth.signInDesc')}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/15 border border-destructive/30 rounded-lg flex items-start gap-2.5 text-sm text-destructive font-medium">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#006400] dark:text-emerald-400" /> {t('auth.email')}
              </label>
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="focus-visible:ring-[#006400] dark:focus-visible:ring-emerald-500 focus-visible:border-[#006400]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#006400] dark:text-emerald-400" /> {t('auth.password')}
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="focus-visible:ring-[#006400] dark:focus-visible:ring-emerald-500 focus-visible:border-[#006400]"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2.5 pt-2">
            <Button
              type="submit"
              className="w-full h-10 font-semibold bg-[#006400] hover:bg-[#004d00] text-white shadow-sm transition-colors cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDemoLogin}
              className="w-full h-10 border-dashed border-[#006400]/40 dark:border-emerald-700/50 text-[#006400] dark:text-emerald-400 hover:bg-[#006400]/5 dark:hover:bg-emerald-950/30 font-medium transition-colors cursor-pointer"
            >
              Demo Login
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Developer & Contact Credit Footer */}
      <div className="mt-6 text-center space-y-1 select-none">
        <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
          Developed by <span className="font-bold text-neutral-900 dark:text-neutral-100">Israfil Hossen</span>
        </p>
        <a
          href="https://wa.me/8801521410415"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006400] dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-mono transition-colors"
        >
          <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Contact: 01521410415 (WhatsApp)</span>
        </a>
      </div>
    </div>
  );
}
