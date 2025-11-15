import type { Metadata } from 'next';
import '@fontsource/jetbrains-mono';
import './globals.css';
import { UnifiedAuthProvider } from '@/auth';
import { PageTransitionProvider } from '@/contexts/PageTransitionContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import DesktopOnlyWrapper from '@/components/DesktopOnlyWrapper';

export const metadata: Metadata = {
  title: 'The Epi-Logos',
  description: 'Integral Philosophy for the age of AI.',
  icons: {
    icon: '/ui-system/epi-logos-logo.svg',
    apple: '/ui-system/epi-logos-logo-vibes.png',
  },
  openGraph: {
    title: 'The Epi-Logos',
    description: 'Integral Philosophy for the age of AI.',
    url: 'https://epi-logos.org',
    siteName: 'The Epi-Logos',
    images: [
      {
        url: '/ui-system/epi-logos-logo-vibes.png',
        width: 1200,
        height: 630,
        alt: 'The Epi-Logos',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Epi-Logos',
    description: 'Integral Philosophy for the age of AI.',
    images: ['/ui-system/epi-logos-logo-vibes.png'],
  },
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
