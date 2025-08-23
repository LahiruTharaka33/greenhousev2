'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import UserLayout from '@/components/UserLayout';

export default function UserTasks() {
  const { data: session, status } = useSession();
  const [tasks] = useState([]);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session || session.user.role !== 'user') {
    redirect('/login');
  }

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Create Task
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Task Management</h2>
            <p className="text-sm text-gray-500 mt-1">
              Track and manage your daily greenhouse tasks and activities
            </p>
          </div>
          
          <div className="p-6">
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-400 text-xl">✅</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                <p className="text-gray-500 mb-4">
                  Create your first task to start organizing your greenhouse work.
                </p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  Create First Task
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Task items will be rendered here */}
              </div>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}