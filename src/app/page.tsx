'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import Link from 'next/link';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [redirectPath, setRedirectPath] = useState<string>('/login');

  useEffect(() => {
    // Determine destination directly
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const dest = storedToken ? '/dashboard' : '/login';
    setRedirectPath(dest);

    // Immediate navigation attempt
    try {
      router.replace(dest);
    } catch {
      window.location.replace(dest);
    }

    // Hard fallback: if still on '/' after 300ms, force window location replace
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && window.location.pathname === '/') {
        window.location.replace(dest);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-medium">Loading system...</p>
        <div className="pt-2">
          <Link
            href={redirectPath}
            className="text-xs text-primary underline hover:opacity-80 transition-opacity"
          >
            Click here if you are not redirected automatically
          </Link>
        </div>
        <noscript>
          <meta httpEquiv="refresh" content="0; url=/login" />
        </noscript>
      </div>
    </div>
  );
}

