'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { ToastProvider, ToastContainer } from '@/components/ui/use-toast';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Project K</title>
        <meta name="description" content="Project K - Your Project Management Solution" />
      </head>
      <body className={inter.className}>
        <ToastProvider>
          {children}
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}