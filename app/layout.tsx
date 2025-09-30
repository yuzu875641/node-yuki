import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Yuzutube',
  description: 'A video sharing site powered by Invidious.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
