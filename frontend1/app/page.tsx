'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserWithFallback, isAuthenticated } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }
      
      const user = getCurrentUserWithFallback();
      setIsLoading(false);
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Redirect to appropriate dashboard based on role
      switch (user.role) {
        case 'superadmin':
          router.push('/superadmin');
          break;
        case 'admin':
          router.push('/admin');
          break;
        case 'manager':
          router.push('/manager');
          break;
        case 'developer':
          router.push('/developer');
          break;
        case 'sales':
          router.push('/sales');
          break;
        case 'support':
          router.push('/support');
          break;
        case 'verifier':
          router.push('/verifier');
          break;
        default:
          router.push('/dashboard');
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return null; // Will be redirected by the effect
}