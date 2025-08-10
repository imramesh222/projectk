'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Always redirect to projectk page for the root route
    router.replace('/projectk');
  }, [router]);

  // Show nothing while redirecting
  return null;
}