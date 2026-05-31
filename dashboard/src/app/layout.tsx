import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'RoadSoS X — Premium Dashboard',
  description: 'AI-Powered Vehicle Safety & Monitoring Platform.',
};

import Providers from '@/components/Providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-app-bg text-text-primary antialiased font-inter">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
