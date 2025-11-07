import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SocialX Menu',
  description: 'QR-based ordering system for SocialX Community Café',
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, viewport-fit=cover, user-scalable=yes',
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

