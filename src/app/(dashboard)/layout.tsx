'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  // Initialize desktop sidebar state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar_expanded');
      if (saved !== null) {
        setDesktopSidebarOpen(saved === 'true');
      }
    } catch {}
  }, []);

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileMenuOpen((prev) => !prev);
    } else {
      setDesktopSidebarOpen((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('sidebar_expanded', String(next));
        } catch {}
        return next;
      });
    }
  };

  const closeSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileMenuOpen(false);
    } else {
      setDesktopSidebarOpen(false);
      try {
        localStorage.setItem('sidebar_expanded', 'false');
      } catch {}
    }
  };

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar on desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
          return;
        }
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      {/* Desktop / Large Screen Collapsible Sidebar */}
      <div
        className={cn(
          'hidden lg:flex lg:flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden',
          desktopSidebarOpen ? 'w-56 opacity-100' : 'w-0 opacity-0 pointer-events-none'
        )}
      >
        <div className="w-56 h-full flex flex-col">
          <Sidebar onClose={closeSidebar} />
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50 flex w-64 flex-col bg-[#13281b] dark:bg-slate-950 shadow-2xl animate-in slide-in-from-left duration-200">
            <Sidebar
              onCloseMobile={() => setMobileMenuOpen(false)}
              onClose={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onToggleSidebar={toggleSidebar}
          onOpenMobileMenu={toggleSidebar}
          isSidebarOpen={desktopSidebarOpen}
        />
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto p-1.5 sm:p-2 bg-[#e8f0f8] dark:bg-slate-950">
          <div className="w-full flex-1 flex flex-col min-h-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
