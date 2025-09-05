'use client';

import { useState } from 'react';

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

interface ScheduleListProps {
  schedules: Schedule[];
  onEdit: (schedule: Schedule) => void;
  onDelete: (scheduleId: string) => void;
  onStatusChange: (scheduleId: string, status: string) => void;
  loading?: boolean;
}

export default function ScheduleList({ schedules, onEdit, onDelete, onStatusChange, loading = false }: ScheduleListProps) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSchedules = schedules.filter(schedule => {
    const matchesStatus = filterStatus === 'all' || schedule.status === filterStatus;
    const matchesSearch = 
      schedule.customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.customer.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-black border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading schedules...</p>
        </div>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
          <p className="text-gray-600">Create your first schedule to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by customer, item, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="all" className="text-black">All Status</option>
              <option value="pending" className="text-black">Pending</option>
              <option value="completed" className="text-black">Completed</option>
              <option value="cancelled" className="text-black">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Schedules List */}
      <div className="divide-y divide-gray-200">
        {filteredSchedules.map((schedule) => (
          <div key={schedule.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-medium text-black">
                    {schedule.customer.customerName}
                  </h3>
                  {schedule.customer.company && (
                    <span className="text-sm text-black">
                      ({schedule.customer.company})
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(schedule.status)}`}>
                    {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-black">Item:</span> {schedule.item.itemName}
                    <span className="text-black ml-1">({schedule.item.itemCategory})</span>
                  </div>
                  <div>
                    <span className="font-medium text-black">Quantity:</span> {schedule.quantity}
                  </div>
                  <div>
                    <span className="font-medium text-black">Scheduled:</span> {formatDate(schedule.scheduledDate)} at {formatTime(schedule.scheduledTime)}
                  </div>
                </div>

                {schedule.notes && (
                  <div className="mt-2">
                    <span className="font-medium text-black text-sm">Notes:</span>
                    <p className="text-black text-sm mt-1">{schedule.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                {schedule.status === 'pending' && (
                  <button
                    onClick={() => onStatusChange(schedule.id, 'completed')}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    title="Mark as completed"
                  >
                    ✓ Complete
                  </button>
                )}
                
                <button
                  onClick={() => onEdit(schedule)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  title="Edit schedule"
                >
                  ✏️ Edit
                </button>
                
                <button
                  onClick={() => onDelete(schedule.id)}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  title="Delete schedule"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            Showing {filteredSchedules.length} of {schedules.length} schedules
          </span>
          <div className="flex gap-4">
            <span>Pending: {schedules.filter(s => s.status === 'pending').length}</span>
            <span>Completed: {schedules.filter(s => s.status === 'completed').length}</span>
            <span>Cancelled: {schedules.filter(s => s.status === 'cancelled').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
