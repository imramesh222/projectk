'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserWithFallback, getAccessToken } from '@/lib/auth';
import { apiGet } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';

// Define types for organization memberships
interface OrganizationRole {
  id: string;
  name: string;
  permissions: string[];
  organization: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface OrganizationMembership {
  organization_id: string;
  organization_name: string;
  roles: OrganizationRole[];
  // Add optional role field to handle both formats
  role?: string;
}

interface UserData {
  id: string;
  username: string;
  email: string;
  role: string;
  organization_memberships?: OrganizationMembership[];
  [key: string]: any;
}

// Role hierarchy for sorting
const ROLE_HIERARCHY: Record<string, number> = {
  admin: 1,
  manager: 2,
  member: 3,
  user: 4
};

// Debug logging helper
const debug = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DashboardPage] ${message}`, data || '');
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkUserAndRedirect = async () => {
      try {
        setIsLoading(true);
        // First get the basic user data
        const user = await getCurrentUserWithFallback();
        
        debug('User data:', user);
        
        if (!user) {
          debug('No user found, redirecting to login');
          router.push('/login');
          return;
        }

        // Fetch detailed user data including organization memberships using the API client
        const token = getAccessToken();
        const userData: UserData = await apiGet('users/me/', token ? { token } : {});
        debug('Detailed user data:', userData);
        
        // Get organization memberships with proper typing and validation
        const memberships: OrganizationMembership[] = [];
        
        try {
          debug('Raw organization memberships:', userData.organization_memberships);
          
          if (userData.organization_memberships && Array.isArray(userData.organization_memberships)) {
            // Process each membership
            userData.organization_memberships.forEach(membership => {
              try {
                debug('Processing membership:', membership);
                
                // Handle both array of roles and single role string
                let roles: Array<{name: string, id?: string, permissions?: string[], is_default?: boolean, created_at?: string, updated_at?: string}> = [];
                
                if (Array.isArray(membership.roles)) {
                  roles = membership.roles;
                } else if (membership.role) {
                  // If roles is a single role string, convert to array
                  roles = [{ name: membership.role }];
                } else if (typeof membership.roles === 'string') {
                  // Handle case where roles is a single role string in the roles field
                  roles = [{ name: membership.roles }];
                }
                
                if (membership.organization_id) {
                  memberships.push({
                    organization_id: membership.organization_id,
                    organization_name: membership.organization_name || 'Organization',
                    roles: roles.filter(role => role && role.name).map(role => ({
                      id: role.id || 'default-role',
                      name: role.name,
                      permissions: role.permissions || [],
                      organization: membership.organization_id,
                      is_default: role.is_default || false,
                      created_at: role.created_at || new Date().toISOString(),
                      updated_at: role.updated_at || new Date().toISOString()
                    }))
                  });
                }
              } catch (error) {
                console.error('Error processing membership:', membership, error);
              }
            });
          }
          
          debug('Processed memberships:', memberships);
        } catch (error) {
          console.error('Error processing organization memberships:', error);
        }
        
        // Check if user is a superadmin (global role)
        if (userData.role === 'superadmin') {
          debug('User is superadmin, redirecting to superadmin dashboard');
          router.push('/dashboard/superadmin');
          return;
        }
        
        // If user has valid organization memberships, redirect to the first organization
        if (memberships.length > 0) {
          // Sort memberships based on the highest role in the role hierarchy
          const sortedMemberships = [...memberships].sort((a, b) => {
            // Get the highest role for each membership
            const getHighestRole = (roles: OrganizationRole[] = []) => {
              if (!Array.isArray(roles) || roles.length === 0) return 'member';
              const defaultRole = roles[0]?.name?.toLowerCase() || 'member';
              return roles.reduce((highest, role) => {
                if (!role?.name) return highest;
                const roleName = role.name.toLowerCase();
                const currentPriority = ROLE_HIERARCHY[roleName] || 99;
                const highestPriority = ROLE_HIERARCHY[highest] || 99;
                return currentPriority < highestPriority ? roleName : highest;
              }, defaultRole);
            };
            
            const roleA = getHighestRole(a.roles);
            const roleB = getHighestRole(b.roles);
            return (ROLE_HIERARCHY[roleA] || 99) - (ROLE_HIERARCHY[roleB] || 99);
          });
          
          const primaryMembership = sortedMemberships[0];
          const orgId = primaryMembership.organization_id;
          const primaryRole = primaryMembership.roles[0]?.name.toLowerCase() || 'member';
          
          // Store the membership data in session storage for the organization page
          sessionStorage.setItem(`org_membership_${primaryMembership.organization_id}`, JSON.stringify(primaryMembership));
          
          // Store the user's roles for this organization in localStorage
          localStorage.setItem(`org_roles_${orgId}`, JSON.stringify(primaryMembership.roles.map(r => r.name)));
          
          debug(`Redirecting to organization dashboard: ${primaryMembership.organization_id} with roles: ${primaryMembership.roles.map(r => r.name).join(', ')}`);
          router.push(`/dashboard/organization/${primaryMembership.organization_id}`);
        } else {
          // If no organization memberships, show appropriate UI
          return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
              <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md text-center">
                <div className="flex justify-center">
                  <div className="p-3 bg-red-100 rounded-full">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">No Organization Found</h2>
                <p className="text-gray-600">
                  You don't have access to any organization yet. Please contact your administrator or create a new organization.
                </p>
                
                <div className="flex flex-col space-y-3 mt-6">
                  {userData.role === 'admin' && (
                    <Link 
                      href="/dashboard/organization/create"
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Create New Organization
                    </Link>
                  )}
                  
                  <Link 
                    href="/dashboard"
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Back to Dashboard
                  </Link>
                  
                  <button
                    onClick={() => window.location.reload()}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            </div>
          );
        }
      } catch (error) {
        console.error('Error in dashboard redirection:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkUserAndRedirect();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px] mx-auto" />
          </div>
        </div>
      </div>
    );
  }
  
  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Loading Dashboard</h2>
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
