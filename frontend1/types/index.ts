// User type
export interface OrganizationMembership {
  id: string;
  organization: {
    id: string;
    name: string;
  };
  role: string;
  joined_at: string;
  is_active: boolean;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  last_login: string | null;
  date_joined: string;
  organization_memberships: OrganizationMembership[];
  phone_number?: string;
  profile_picture?: string;
  bio?: string;
}

// Organization type
export interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  member_count: number;
}
