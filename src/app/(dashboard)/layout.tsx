'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        try {
          router.replace('/login');
        } catch {
          window.location.replace('/login');
        }
        const timer = setTimeout(() => {
          if (!localStorage.getItem('auth_token')) {
            window.location.replace('/login');
          }
        }, 300);
        return () => clearTimeout(timer);
      } else if (user.mustChangePassword && pathname !== '/change-password') {
        router.replace('/change-password');
      }
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e8f0f8] dark:bg-slate-950 p-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Verifying authorization...</p>
          <a
            href="/login"
            className="text-xs text-emerald-700 dark:text-emerald-400 underline mt-2 hover:opacity-80"
          >
            Click here to return to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#e8f0f8] dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50 flex w-64 flex-col bg-[#13281b] dark:bg-slate-950 shadow-2xl">
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto p-1.5 sm:p-2 bg-[#e8f0f8] dark:bg-slate-950">
          <div className="w-full flex-1 flex flex-col min-h-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
