import type { Metadata } from 'next';
import '@fontsource/jetbrains-mono';
import './globals.css';
import { UnifiedAuthProvider } from '@/auth';
import { PageTransitionProvider } from '@/contexts/PageTransitionContext';
import { SidebarProvider } from '@/contexts/SidebarContext';

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
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </PageTransitionProvider>
        </UnifiedAuthProvider>
      </body>
    </html>
  );
}
