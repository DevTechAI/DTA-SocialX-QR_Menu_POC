import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SocialX Menu',
  description: 'QR-based ordering system for SocialX Community Café',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

