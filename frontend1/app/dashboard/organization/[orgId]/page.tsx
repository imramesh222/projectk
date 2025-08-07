'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { RoleBasedLayout } from '@/components/dashboard/RoleBasedLayout';

interface OrganizationData {
  id: string;
  name: string;
  description: string | null;
  members?: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  }>;
}

import { AdminOverview } from '@/components/dashboard/admin/AdminOverview';
import OrganizationDashboard from '@/components/dashboard/organization/OrganizationDashboard';

export default function OrganizationPage() {
  const params = useParams<{ orgId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [org, setOrg] = useState<OrganizationData | null>(null);
  const [userRole, setUserRole] = useState<'superadmin' | 'admin' | 'user'>('user');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrg = async () => {
      if (!params.orgId) return;
      
      try {
        // Use the API base URL with the correct path
        let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        // Remove any trailing slashes
        baseUrl = baseUrl.replace(/\/+$/, '');
        const apiUrl = `${baseUrl}/org/organizations/${params.orgId}/`;
        
        console.log('Fetching organization from:', apiUrl);
        
        const res = await fetch(apiUrl, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          credentials: 'include'
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error('API Error:', {
            status: res.status,
            statusText: res.statusText,
            error: errorData
          });
          throw new Error(errorData.detail || `Failed to load organization (${res.status} ${res.statusText})`);
        }
        const data = await res.json();
        console.log('Organization data:', data);
        setOrg(data);
      } catch (err) {
        console.error('Error fetching organization:', err);
        setError('Failed to load organization data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrg();
  }, [params.orgId]);

  if (isLoading) {
    return (
      <RoleBasedLayout>
        <div className="p-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>
      </RoleBasedLayout>
    );
  }

  if (error) {
    return (
      <RoleBasedLayout>
        <div className="p-6">
          <div className="rounded-md bg-red-50 p-4">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </RoleBasedLayout>
    );
  }

  if (!org) {
    return (
      <RoleBasedLayout>
        <div className="p-6">
          <div className="rounded-md bg-yellow-50 p-4">
            <h3 className="text-sm font-medium text-yellow-800">Organization Not Found</h3>
            <p className="mt-2 text-sm text-yellow-700">The requested organization could not be found or you don't have permission to view it.</p>
          </div>
        </div>
      </RoleBasedLayout>
    );
  }

  return (
    <RoleBasedLayout>
      <div className="p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{org.name}</h1>
          {org.description && (
            <p className="mt-2 text-gray-600 dark:text-gray-300">{org.description}</p>
          )}
        </header>
        
        {userRole === 'admin' ? (
          <AdminOverview orgId={params.orgId} />
        ) : (
          <OrganizationDashboard orgId={org.id} />
        )}
      </div>
    </RoleBasedLayout>
  );
}
