import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface OrganizationMember {
  id: string;
  email: string;
  name: string;
  role: string;
  joined_date: string;
}

interface OrganizationMembers {
  [role: string]: OrganizationMember[];
}

interface DashboardStats {
  total_members: number;
  new_members_this_month: number;
  member_growth_rate: number;
}

interface MemberGrowthData {
  month: string;
  new_members: number;
  total_members: number;
}

interface RoleDistribution {
  role: string;
  count: number;
}

interface RecentActivity {
  type: string;
  title: string;
  description: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface DashboardData {
  stats: DashboardStats;
  member_growth: MemberGrowthData[];
  role_distribution: RoleDistribution[];
  recent_activity: RecentActivity[];
}

export const organizationService = {
  // Get organization dashboard data
  async getDashboard(organizationId: string): Promise<DashboardData> {
    try {
      const response = await axios.get<DashboardData>(
        `${API_BASE_URL}/organizations/${organizationId}/dashboard/`,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  // Get organization members
  async getMembers(organizationId: string): Promise<OrganizationMembers> {
    try {
      const response = await axios.get<OrganizationMembers>(
        `${API_BASE_URL}/organizations/${organizationId}/members/`,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching organization members:', error);
      throw error;
    }
  },

  // Format role for display
  formatRole(role: string): string {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  // Get role icon based on role
  getRoleIcon(role: string): React.ElementType {
    const { Users, Clock, Activity, TrendingUp, AlertCircle, UserCheck, Shield, Code, MessageSquare } = require('lucide-react');
    
    const roleIcons: { [key: string]: React.ElementType } = {
      admin: Shield,
      user: UserCheck,
      salesperson: TrendingUp,
      verifier: UserCheck,
      project_manager: Activity,
      developer: Code,
      support: MessageSquare,
    };

    return roleIcons[role] || Users;
  },

  // Format date to relative time (e.g., "2 days ago")
  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, seconds] of Object.entries(intervals)) {
      const interval = Math.floor(diffInSeconds / seconds);
      if (interval >= 1) {
        return interval === 1 ? `${interval} ${unit} ago` : `${interval} ${unit}s ago`;
      }
    }
    
    return 'Just now';
  }
};

export type { OrganizationMember, OrganizationMembers, DashboardData, RecentActivity, RoleDistribution };
