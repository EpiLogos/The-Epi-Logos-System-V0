import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Tourney } from 'next/font/google';
import './globals.css';
import { UnifiedAuthProvider } from '@/auth';
import { PageTransitionProvider } from '@/contexts/PageTransitionContext';
import ConditionalNavigation from '@/components/navigation/ConditionalNavigation';

// Tourney for headings (Google Font)
const tourney = Tourney({
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-tourney',
  display: 'swap',
});

// Tourney Semi-Bold for body text (loaded as local font)
const tourneySemiBold = localFont({
  src: [
    {
      path: './fonts/Tourney-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-tourney-semibold',
  display: 'swap',
});

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
    <html lang="en" className={`dark ${tourneySemiBold.variable} ${tourney.variable}`}>
      <body className={tourneySemiBold.className}>
        <UnifiedAuthProvider>
          <PageTransitionProvider>
            <ConditionalNavigation />
            {children}
          </PageTransitionProvider>
        </UnifiedAuthProvider>
      </body>
    </html>
  );
}
