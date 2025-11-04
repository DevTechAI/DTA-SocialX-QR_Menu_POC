import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Manager - SocialX',
  description: 'Order management dashboard for SocialX Community Café',
};

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

