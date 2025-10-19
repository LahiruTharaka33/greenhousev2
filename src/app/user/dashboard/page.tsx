'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import UserLayout from '@/components/UserLayout';

export default function UserDashboard() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session || session.user.role !== 'user') {
    redirect('/login');
  }

  return (
    <UserLayout>
      <div className="pl-[72px] pr-4 lg:px-0 space-y-4 sm:space-y-6 animate-fade-in-up">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Welcome, {session.user.name}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Welcome to your greenhouse management dashboard. Here you can manage your schedules, tasks, and tunnel information.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-md flex items-center justify-center">
                  <span className="text-green-600 text-xl sm:text-2xl">📅</span>
                </div>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">Schedules</h3>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Manage your greenhouse schedules</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-md flex items-center justify-center">
                  <span className="text-blue-600 text-xl sm:text-2xl">✅</span>
                </div>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">Tasks</h3>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Track your daily tasks</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-md flex items-center justify-center">
                  <span className="text-purple-600 text-xl sm:text-2xl">🌱</span>
                </div>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">Tunnels</h3>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Monitor your tunnel status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          <div className="text-center py-8 sm:py-12">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">📊</div>
            <p className="text-sm sm:text-base text-gray-500">No recent activity to display.</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-2 px-4">
              Start by creating schedules and tasks to see your activity here.
            </p>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}