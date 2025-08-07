'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard,
  Users, 
  Building2, 
  Settings, 
  FileText, 
  BarChart3, 
  Shield, 
  Bell, 
  Wrench,
  Menu,
  Home,
  LogOut,
  ChevronRight,
  ChevronLeft,
  X,
  User,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole?: 'superadmin' | 'admin' | 'user';
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['superadmin', 'admin', 'user'] },
  { name: 'Organizations', href: '/organizations', icon: Building2, roles: ['superadmin', 'admin'] },
  { name: 'Users', href: '/users', icon: Users, roles: ['superadmin', 'admin'] },
  { name: 'Projects', href: '/projects', icon: FileText, roles: ['superadmin', 'admin', 'user'] },
  { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['superadmin', 'admin'] },
  { name: 'Roles & Permissions', href: '/roles', icon: Shield, roles: ['superadmin'] },
  { name: 'System Settings', href: '/settings', icon: Settings, roles: ['superadmin'] },
  { name: 'Help & Support', href: '/support', icon: HelpCircle, roles: ['superadmin', 'admin', 'user'] },
];

export function DashboardLayout({ children, userRole = 'user' }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const filteredNav = navigation.filter(item => item.roles.includes(userRole));
  const toggleSidebar = () => setCollapsed(!collapsed);
  const closeMobileSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out",
        "flex flex-col h-full",
        collapsed ? "w-20" : "w-64",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-md bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">LOGO</span>
            </div>
            {!collapsed && (
              <span className="text-lg font-semibold text-gray-800 dark:text-white">Admin Panel</span>
            )}
          </Link>
          {sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={closeMobileSidebar}
              className="md:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-2">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1',
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
                    collapsed ? 'justify-center' : 'justify-between'
                  )}
                  onClick={closeMobileSidebar}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5" />
                    {!collapsed && <span>{item.name}</span>}
                  </div>
                  {!collapsed && isActive && (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
        
        {/* User profile and collapse button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">User Name</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 ml-auto hidden md:flex"
              onClick={toggleSidebar}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-4 justify-start text-gray-600 hover:text-red-500 dark:text-gray-300 dark:hover:text-red-400"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          )}
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Main content */}
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
        collapsed ? "md:ml-20" : "md:ml-64"
      )}>
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {filteredNav.find(item => item.href === pathname)?.name || 'Dashboard'}
            </h1>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
              </Button>
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}