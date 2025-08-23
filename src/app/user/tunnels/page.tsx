'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import UserLayout from '@/components/UserLayout';

export default function UserTunnels() {
  const { data: session, status } = useSession();
  const [tunnels] = useState([]);

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
          <h1 className="text-2xl font-bold text-gray-900">My Tunnels</h1>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Tunnel Information</h2>
            <p className="text-sm text-gray-500 mt-1">
              Monitor your greenhouse tunnels and their current status
            </p>
          </div>
          
          <div className="p-6">
            {tunnels.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-400 text-xl">🌱</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tunnels assigned</h3>
                <p className="text-gray-500 mb-4">
                  Contact your administrator to get tunnels assigned to your account.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Tunnel cards will be rendered here */}
              </div>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}