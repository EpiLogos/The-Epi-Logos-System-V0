import type { Metadata } from 'next';
import '@fontsource/jetbrains-mono';
import './globals.css';
import { UnifiedAuthProvider } from '@/auth';
import { PageTransitionProvider } from '@/contexts/PageTransitionContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import DesktopOnlyWrapper from '@/components/DesktopOnlyWrapper';

export const metadata: Metadata = {
  title: 'Epi:Logos System',
  description: 'A tri-laminar architecture for wisdom synthesis',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <DesktopOnlyWrapper>
          <UnifiedAuthProvider>
            <PageTransitionProvider>
              <SidebarProvider>
                {children}
              </SidebarProvider>
            </PageTransitionProvider>
          </UnifiedAuthProvider>
        </DesktopOnlyWrapper>
      </body>
    </html>
  );
}
