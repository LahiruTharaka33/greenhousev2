'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import UserLayout from '@/components/UserLayout';

interface Tunnel {
  id: string;
  tunnelId: string;
  tunnelName: string;
  description?: string;
  customerId: string;
  cultivationType?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    customerId: string;
    customerName: string;
    company?: string;
  };
}

export default function UserTunnels() {
  const { data: session, status } = useSession();
  const [tunnels, setTunnels] = useState<Tunnel[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's assigned tunnels
  const fetchUserTunnels = async () => {
    try {
      const response = await fetch('/api/tunnels/user');
      if (response.ok) {
        const data = await response.json();
        setTunnels(data);
      } else {
        console.error('Failed to fetch user tunnels');
      }
    } catch (error) {
      console.error('Error fetching user tunnels:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && session.user.role === 'user') {
      fetchUserTunnels();
    }
  }, [session]);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session || session.user.role !== 'user') {
    redirect('/login');
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading your tunnels...</p>
              </div>
            ) : tunnels.length === 0 ? (
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
              <div className="space-y-4">
                {tunnels.map((tunnel) => (
                  <div
                    key={tunnel.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {tunnel.tunnelName}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {tunnel.tunnelId}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                          <div>
                            <span className="font-medium text-gray-700">Cultivation Type:</span>
                            <span className="ml-1">{tunnel.cultivationType || 'Not specified'}</span>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-700">Location:</span>
                            <span className="ml-1">{tunnel.location || 'Not specified'}</span>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-700">Assigned Date:</span>
                            <span className="ml-1">{formatDate(tunnel.createdAt)}</span>
                          </div>
                          
                          {tunnel.description && (
                            <div className="sm:col-span-2">
                              <span className="font-medium text-gray-700">Description:</span>
                              <span className="ml-1">{tunnel.description}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}