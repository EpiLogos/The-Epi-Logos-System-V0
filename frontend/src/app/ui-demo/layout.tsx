import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UI System Demo - Epi:Logos System',
  description: 'Demonstration of the new UI system with JetBrains Mono and Tailwind v4',
};

export default function UIDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ui-demo-layout">
      {children}
    </div>
  );
}