import { apiGet } from './apiService';

// Base interfaces that match the backend response
export interface SystemService {
  name: string;
  status: 'running' | 'stopped' | string;
  pid?: number;
  memory_mb?: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  system: {
    os: string;
    hostname: string;
    python_version: string;
  };
  cpu: {
    usage_percent: number;
    cores: number;
  };
  memory: {
    used_gb: number;
    total_gb: number;
    usage_percent: number;
  };
  disk: {
    used_gb: number;
    total_gb: number;
    usage_percent: number;
  };
  uptime: string;
  database: {
    status: string;
    tables: number;
  };
  services: SystemService[];
}

// Frontend-specific types
export interface FrontendSystemService extends Omit<SystemService, 'status'> {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastChecked?: string;
}

export interface FrontendSystemHealth extends Omit<SystemHealth, 'services' | 'database' | 'cpu' | 'memory' | 'disk' | 'uptime'> {
  services: FrontendSystemService[];
  database: {
    status: 'connected' | 'disconnected';
    size: number;
    tables: number;
  };
  server: {
    cpu: number;
    memory: number;
    disk: number;
    uptime: string;
  };
}

export const fetchSystemHealth = async (): Promise<FrontendSystemHealth> => {
  try {
    // Fetch raw system health data from the backend
    const response = await apiGet<SystemHealth>('/dashboard/system/health/');
    
    // Transform the response to match our frontend types
    const frontendData: FrontendSystemHealth = {
      ...response,
      database: {
        status: response.database.status === 'connected' ? 'connected' : 'disconnected',
        size: response.disk.used_gb * 1024 * 1024 * 1024, // Convert GB to bytes
        tables: response.database.tables
      },
      server: {
        cpu: response.cpu.usage_percent,
        memory: response.memory.usage_percent,
        disk: response.disk.usage_percent,
        uptime: response.uptime
      },
      services: response.services.map(service => ({
        ...service,
        status: service.status === 'running' ? 'up' : 'down',
        responseTime: 0, // Not provided by backend
        lastChecked: new Date().toISOString()
      }))
    };
    
    return frontendData;
  } catch (error) {
    console.error('Error fetching system health:', error);
    throw error;
  }
};
