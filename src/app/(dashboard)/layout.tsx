'use client';

import React, { useState, useEffect, useRef } from 'react';
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

  const DEFAULT_SIDEBAR_WIDTH = 230;
  const MIN_SIDEBAR_WIDTH = 190;

  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState<number>(DEFAULT_SIDEBAR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarWidthRef = useRef(sidebarWidth);

  // Initialize desktop sidebar state & custom width from localStorage
  useEffect(() => {
    try {
      const savedExpanded = localStorage.getItem('sidebar_expanded');
      if (savedExpanded !== null) {
        setDesktopSidebarOpen(savedExpanded === 'true');
      }
      const savedWidth = localStorage.getItem('erp_sidebar_width');
      if (savedWidth) {
        const parsed = parseInt(savedWidth, 10);
        const maxAllowed = Math.floor(window.innerWidth / 2);
        if (!isNaN(parsed) && parsed >= MIN_SIDEBAR_WIDTH) {
          const clamped = Math.min(parsed, maxAllowed);
          setSidebarWidth(clamped);
          sidebarWidthRef.current = clamped;
        }
      }
    } catch {}
  }, []);

  // Clamp width if window size drops
  useEffect(() => {
    const handleWindowResize = () => {
      const maxAllowed = Math.floor(window.innerWidth / 2);
      setSidebarWidth((prev) => {
        if (prev > maxAllowed) {
          const next = Math.max(MIN_SIDEBAR_WIDTH, maxAllowed);
          sidebarWidthRef.current = next;
          return next;
        }
        return prev;
      });
    };
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  // Drag-to-resize event handling
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const maxAllowed = Math.floor(window.innerWidth / 2);
      const newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(e.clientX, maxAllowed));
      setSidebarWidth(newWidth);
      sidebarWidthRef.current = newWidth;
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      try {
        localStorage.setItem('erp_sidebar_width', String(sidebarWidthRef.current));
      } catch {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

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
      {/* Desktop / Large Screen Resizable Collapsible Sidebar */}
      <div
        className={cn(
          'relative hidden lg:flex lg:flex-shrink-0 overflow-hidden',
          isResizing ? 'transition-none select-none' : 'transition-[width,opacity] duration-200 ease-in-out',
          desktopSidebarOpen ? 'opacity-100' : 'w-0 opacity-0 pointer-events-none'
        )}
        style={{
          width: desktopSidebarOpen ? `${sidebarWidth}px` : '0px',
        }}
      >
        <div className="w-full h-full flex flex-col min-w-0 overflow-hidden">
          <Sidebar onClose={closeSidebar} />
        </div>

        {/* Drag-to-Resize Handle */}
        {desktopSidebarOpen && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
            }}
            onDoubleClick={() => {
              const reset = DEFAULT_SIDEBAR_WIDTH;
              setSidebarWidth(reset);
              sidebarWidthRef.current = reset;
              try {
                localStorage.setItem('erp_sidebar_width', String(reset));
              } catch {}
            }}
            title="Drag to resize sidebar (Double click to reset)"
            className={cn(
              'absolute top-0 right-0 w-2 h-full cursor-col-resize z-30 group transition-all select-none',
              'hover:bg-emerald-500/50',
              isResizing ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]' : 'bg-transparent'
            )}
          >
            {/* Visual handle indicator */}
            <div className="absolute top-1/2 -translate-y-1/2 right-[2px] flex flex-col gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="w-0.5 h-1.5 rounded-full bg-emerald-300" />
              <span className="w-0.5 h-1.5 rounded-full bg-emerald-300" />
              <span className="w-0.5 h-1.5 rounded-full bg-emerald-300" />
            </div>
          </div>
        )}
      </div>

      {/* Global transparent overlay while dragging so mouse events are not swallowed */}
      {isResizing && (
        <div
          className="fixed inset-0 z-[99999] cursor-col-resize select-none"
          style={{ cursor: 'col-resize', userSelect: 'none' }}
        />
      )}

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
