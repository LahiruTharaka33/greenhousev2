'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

interface NavItem {
  name: string;
  href: string;
  icon: string;
  description: string;
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: '🏠',
    description: 'Overview and statistics'
  },
  {
    name: 'Controller',
    href: '/user/controller',
    icon: '🎮',
    description: 'IoT device control and monitoring'
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: '👥',
    description: 'Manage customer information'
  },
  {
    name: 'Main Inventory',
    href: '/inventory',
    icon: '📦',
    description: 'Main inventory management'
  },
  {
    name: 'Tunnels',
    href: '/tunnels',
    icon: '🌱',
    description: 'Greenhouse tunnel tracking'
  },
  {
    name: 'Configuration',
    href: '/configuration',
    icon: '⚙️',
    description: 'Client ID mapping and settings'
  },
  {
    name: 'Items',
    href: '/items',
    icon: '🏷️',
    description: 'Individual items and SKUs'
  },
  {
    name: 'Customer Inventory',
    href: '/customer-inventory',
    icon: '📋',
    description: 'Customer-specific inventory'
  },
  {
    name: 'Schedules',
    href: '/schedules',
    icon: '📅',
    description: 'Maintenance schedules'
  },
  {
    name: 'New Schedules',
    href: '/schedules-v2',
    icon: '🌱',
    description: 'New improved schedule system'
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: '✅',
    description: 'Task management'
  },
  {
    name: 'Financial Records',
    href: '/financial-records',
    icon: '💰',
    description: 'Track income and expenses'
  },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

  return (
    <>
      {/* Mobile menu button - Enhanced with animation */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-3 min-w-[44px] min-h-[44px] rounded-lg bg-white shadow-lg hover:bg-gray-50 active:bg-gray-100 border border-gray-200 transition-all duration-300 hamburger-button"
          aria-label={isMobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileOpen}
        >
          <div className="relative w-6 h-5 flex flex-col justify-center items-center">
            <span className={`absolute w-6 h-0.5 bg-gray-600 transition-all duration-300 ease-in-out ${
              isMobileOpen ? 'rotate-45 translate-y-0' : '-translate-y-2'
            }`}></span>
            <span className={`w-6 h-0.5 bg-gray-600 transition-all duration-300 ease-in-out ${
              isMobileOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
            }`}></span>
            <span className={`absolute w-6 h-0.5 bg-gray-600 transition-all duration-300 ease-in-out ${
              isMobileOpen ? '-rotate-45 translate-y-0' : 'translate-y-2'
            }`}></span>
          </div>
        </button>
      </div>

      {/* Mobile overlay - Enhanced animation */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Enhanced animations */}
      <div className={`bg-white shadow-2xl transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      } h-screen fixed left-0 top-0 z-50 lg:translate-x-0 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-gray-900">GreenHouseV2</h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-md hover:bg-gray-50 transition-colors hidden lg:block"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Admin user info */}
      {!isCollapsed && session && (
        <div className="p-4 bg-emerald-50 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-600 font-medium">
                {session.user?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
              <p className="text-xs text-emerald-600">Administrator</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation - Enhanced with smooth scrolling */}
      <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center p-3 min-h-[44px] rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <span className="text-xl mr-3 flex-shrink-0">{item.icon}</span>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity lg:block hidden truncate">
                        {item.description}
                      </div>
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sign out button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
        {!isCollapsed ? (
          <button
            onClick={handleSignOut}
            className="w-full flex items-center p-3 min-h-[44px] text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 rounded-lg transition-colors"
          >
            <span className="text-lg mr-3">🚪</span>
            Sign Out
          </button>
        ) : (
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center p-3 min-h-[44px] text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 rounded-lg transition-colors"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <span className="text-lg">🚪</span>
          </button>
        )}
      </div>
    </div>
    </>
  );
} 