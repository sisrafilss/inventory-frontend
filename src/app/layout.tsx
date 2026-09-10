import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/context/auth-context';
import { LanguageProvider } from '@/lib/context/language-context';
import { ThemeProvider } from '@/lib/context/theme-context';
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: 'Inventory Management System',
  description: 'Production-minded MVP Inventory and Sales Management Application',
};

const themeScript = `
  (function() {
    try {
      var saved = localStorage.getItem('app_theme');
      var isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches) || (saved === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>{children}</LanguageProvider>
<Toaster position="bottom-right" richColors closeButton />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

