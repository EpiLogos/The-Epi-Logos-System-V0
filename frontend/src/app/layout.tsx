import type { Metadata } from 'next';
import '@fontsource/jetbrains-mono';
import './globals.css';
import { UnifiedAuthProvider } from '@/auth';
import { PageTransitionProvider } from '@/contexts/PageTransitionContext';

export const metadata: Metadata = {
  title: 'Epi:Logos System',
  description: 'A tri-laminar architecture for wisdom synthesis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <UnifiedAuthProvider>
          <PageTransitionProvider>
            {children}
          </PageTransitionProvider>
        </UnifiedAuthProvider>
      </body>
    </html>
  );
}
