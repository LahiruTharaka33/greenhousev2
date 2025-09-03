'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import UserLayout from '@/components/UserLayout';

interface Schedule {
  id: string;
  customerId: string;
  itemId: string;
  scheduledDate: string;
  scheduledTime: string;
  quantity: number;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    customerId: string;
    customerName: string;
    company?: string;
  };
  item: {
    id: string;
    itemId: string;
    itemName: string;
    itemCategory: string;
  };
}

export default function UserSchedules() {
  const { data: session, status } = useSession();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch user's assigned schedules
  const fetchUserSchedules = async () => {
    try {
      const response = await fetch('/api/schedules/user');
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      } else {
        console.error('Failed to fetch user schedules');
      }
    } catch (error) {
      console.error('Error fetching user schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && session.user.role === 'user') {
      fetchUserSchedules();
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
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredSchedules = schedules.filter(schedule => {
    return filterStatus === 'all' || schedule.status === filterStatus;
  });

  const getStatusStats = () => {
    return {
      pending: schedules.filter(s => s.status === 'pending').length,
      completed: schedules.filter(s => s.status === 'completed').length,
      cancelled: schedules.filter(s => s.status === 'cancelled').length,
    };
  };

  const stats = getStatusStats();

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Schedules</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Greenhouse Schedules</h2>
                <p className="text-sm text-gray-500 mt-1">
                  View your assigned maintenance and cultivation schedules
                </p>
              </div>
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading your schedules...</p>
              </div>
            ) : filteredSchedules.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-400 text-xl">📅</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filterStatus === 'all' ? 'No schedules assigned' : `No ${filterStatus} schedules`}
                </h3>
                <p className="text-gray-500 mb-4">
                  {filterStatus === 'all' 
                    ? 'Contact your administrator to get schedules assigned to your account.'
                    : `No schedules with ${filterStatus} status found.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-medium text-gray-900">
                            {schedule.item.itemName}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(schedule.status)}`}>
                            {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium text-gray-700">Item Category:</span>
                            <span className="ml-1">{schedule.item.itemCategory}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Quantity:</span>
                            <span className="ml-1">{schedule.quantity}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Scheduled:</span>
                            <span className="ml-1">{formatDate(schedule.scheduledDate)} at {schedule.scheduledTime}</span>
                          </div>
                        </div>

                        {schedule.notes && (
                          <div className="mt-3">
                            <span className="font-medium text-gray-700 text-sm">Notes:</span>
                            <p className="text-gray-600 text-sm mt-1">{schedule.notes}</p>
                          </div>
                        )}
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