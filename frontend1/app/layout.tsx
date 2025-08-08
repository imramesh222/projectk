'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { ToastProvider, Toaster } from '@/hooks/use-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();

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
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            {children}
            <Toaster />
          </ToastProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}