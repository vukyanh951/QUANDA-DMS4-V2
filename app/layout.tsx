import type { Metadata } from 'next';
import './globals.css';

const metadataOrigin = process.env.SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(metadataOrigin),
  title: 'QUANDA — Find your best path',
  description: 'An evidence-backed creative pipeline solver for finishing ambitious projects.',
  openGraph: {
    title: 'QUANDA V2 — Finish the project. Skip the detours.',
    description: 'An evidence-backed creative pipeline solver for finishing ambitious projects.',
    type: 'website',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QUANDA V2 — Finish the project. Skip the detours.',
    description: 'An evidence-backed creative pipeline solver for finishing ambitious projects.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
