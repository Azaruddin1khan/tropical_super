import type { Metadata } from 'next';
import './globals.css';
import { SuperAdminProvider } from '@/context/super-admin-context';

export const metadata: Metadata = {
  title: 'Tropical Gyros — Super Admin Panel',
  description: 'Centralized Administrative & Custom Permission Management Console for Tropical Gyros',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SuperAdminProvider>
          {children}
        </SuperAdminProvider>
      </body>
    </html>
  );
}

