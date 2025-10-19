'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import UserLayout from '@/components/UserLayout';

interface Release {
  id: string;
  time: string;
  releaseQuantity: number;
}

interface Schedule {
  id: string;
  scheduledDate: string;
  quantity: number;
  water: number;
  notes: string;
  status: string;
  tunnel: {
    tunnelId: string;
    tunnelName: string;
    description: string | null;
  };
  fertilizerType: {
    itemId: string;
    itemName: string;
    itemCategory: string;
    unit: string;
  };
  releases: Release[];
  createdAt: string;
  updatedAt: string;
}

interface CustomerInfo {
  id: string;
  customerId: string;
  customerName: string;
}

export default function UserNewSchedulesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSchedules();
    }
  }, [status]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/user/schedules-v2');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch schedules');
      }
      
      const data = await response.json();
      setCustomerInfo(data.customer);
      setSchedules(data.schedules);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredSchedules = schedules.filter((schedule) => {
    if (filterStatus === 'all') return true;
    return schedule.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const stats = {
    total: schedules.length,
    pending: schedules.filter((s) => s.status.toLowerCase() === 'pending').length,
    completed: schedules.filter((s) => s.status.toLowerCase() === 'completed').length,
    inProgress: schedules.filter((s) => s.status.toLowerCase() === 'in-progress').length,
  };

  if (status === 'loading' || loading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading schedules...</div>
        </div>
      </UserLayout>
    );
  }

  if (error) {
    return (
      <UserLayout>
        <div className="min-h-screen px-4 sm:px-6 py-4 sm:py-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchSchedules}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="min-h-screen animate-fade-in-up">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            📅 My Schedules
          </h1>
          {customerInfo && (
            <p className="text-sm text-gray-600 mt-1">
              {customerInfo.customerName} ({customerInfo.customerId})
            </p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Total</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="text-2xl sm:text-3xl ml-2">📊</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Pending</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="text-2xl sm:text-3xl ml-2">⏳</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">In Progress</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                </div>
                <div className="text-2xl sm:text-3xl ml-2">🔄</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Completed</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <div className="text-2xl sm:text-3xl ml-2">✅</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="px-4 sm:px-6 py-4 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Status
          </label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto px-4 py-3 min-h-[44px] text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Schedules</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Schedules List */}
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          {filteredSchedules.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <div className="text-5xl sm:text-6xl mb-4">📅</div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                No Schedules Found
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                {filterStatus === 'all'
                  ? 'No schedules have been assigned to you yet.'
                  : `No ${filterStatus} schedules found.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-3 sm:p-4 border border-gray-200"
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                        {schedule.tunnel.tunnelName}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Tunnel ID: {schedule.tunnel.tunnelId}
                      </p>
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusBadgeClass(
                        schedule.status
                      )} whitespace-nowrap`}
                    >
                      {schedule.status}
                    </span>
                  </div>

                  {/* Schedule Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Scheduled Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        📅 {formatDate(schedule.scheduledDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Fertilizer Type</p>
                      <p className="text-sm font-medium text-gray-900 break-words">
                        🧪 {schedule.fertilizerType.itemName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Quantity</p>
                      <p className="text-sm font-medium text-gray-900">
                        📦 {schedule.quantity} {schedule.fertilizerType.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Water Volume</p>
                      <p className="text-sm font-medium text-gray-900">💧 {schedule.water} L</p>
                    </div>
                  </div>

                  {/* Release Schedule */}
                  {schedule.releases && schedule.releases.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-2 font-medium">Release Schedule</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {schedule.releases.map((release, index) => (
                          <div
                            key={release.id}
                            className="bg-gray-50 rounded-md p-2 border border-gray-200"
                          >
                            <p className="text-xs text-gray-600">Release {index + 1}</p>
                            <p className="text-sm font-medium text-gray-900">
                              ⏰ {release.time}
                            </p>
                            <p className="text-xs text-gray-600">
                              💧 {release.releaseQuantity} L
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {schedule.notes && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1 font-medium">Notes</p>
                      <p className="text-sm text-gray-700 break-words bg-gray-50 rounded-md p-2 border border-gray-200">
                        📝 {schedule.notes}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row sm:justify-between gap-2 text-xs text-gray-500">
                    <span>Created: {formatDate(schedule.createdAt)}</span>
                    <span>Updated: {formatDate(schedule.updatedAt)}</span>
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

