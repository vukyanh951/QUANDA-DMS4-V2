import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QUANDA — Find your best path',
  description: 'An evidence-backed creative pipeline solver for finishing ambitious projects.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

