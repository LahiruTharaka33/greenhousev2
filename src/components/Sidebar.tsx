'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
    name: 'Items',
    href: '/items',
    icon: '🏷️',
    description: 'Individual items and SKUs'
  },
  {
    name: 'Schedules',
    href: '/schedules',
    icon: '📅',
    description: 'Maintenance schedules'
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: '✅',
    description: 'Task management'
  },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-md bg-white shadow-lg hover:bg-gray-100"
        >
          <span className="block w-6 h-0.5 bg-gray-600 mb-1"></span>
          <span className="block w-6 h-0.5 bg-gray-600 mb-1"></span>
          <span className="block w-6 h-0.5 bg-gray-600"></span>
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } min-h-screen fixed left-0 top-0 z-50 lg:translate-x-0 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-gray-900">GreenHouseV2</h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors hidden lg:block"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center p-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-green-100 text-green-700 border-l-4 border-green-500'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <span className="text-xl mr-3">{item.icon}</span>
                  {!isCollapsed && (
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
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

      {/* Footer */}
      {!isCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            GreenHouseV2 v1.0
          </div>
        </div>
      )}
    </div>
    </>
  );
} 