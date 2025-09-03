'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ScheduleForm from '@/components/ScheduleForm';
import ScheduleList from '@/components/ScheduleList';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

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

export default function SchedulesPage() {
  const { data: session, status } = useSession();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Fetch schedules
  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/schedules');
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      } else {
        console.error('Failed to fetch schedules');
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && session.user.role === 'admin') {
      fetchSchedules();
    }
  }, [session]);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session || session.user.role !== 'admin') {
    redirect('/login');
  }

  // Handle form submission
  const handleSubmit = async (scheduleData: { customerId: string; items: any[] }) => {
    setFormLoading(true);
    try {
      // Create multiple schedules for each item
      const promises = scheduleData.items.map(item => 
        fetch('/api/schedules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId: scheduleData.customerId,
            itemId: item.itemId,
            scheduledDate: item.scheduledDate,
            scheduledTime: item.scheduledTime,
            quantity: item.quantity,
            notes: item.notes
          }),
        })
      );

      const responses = await Promise.all(promises);
      const hasError = responses.some(response => !response.ok);

      if (hasError) {
        alert('Some schedules failed to create. Please try again.');
      } else {
        await fetchSchedules();
        setShowForm(false);
        setEditingSchedule(null);
      }
    } catch (error) {
      console.error('Error creating schedules:', error);
      alert('Failed to create schedules');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    setDeleteLoading(scheduleId);
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSchedules();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Handle status change
  const handleStatusChange = async (scheduleId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchSchedules();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update schedule status');
      }
    } catch (error) {
      console.error('Error updating schedule status:', error);
      alert('Failed to update schedule status');
    }
  };

  return (
    <Layout>
      <main className="p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Schedules
              </h1>
              <p className="text-lg text-gray-600">
                Manage maintenance and task schedules for customers
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              + New Schedule
            </button>
          </div>
        </div>

        {showForm ? (
          <div className="mb-8">
            <ScheduleForm
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingSchedule(null);
              }}
              loading={formLoading}
              initialData={editingSchedule}
            />
          </div>
        ) : (
          <ScheduleList
            schedules={schedules}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            loading={loading}
          />
        )}
      </main>
    </Layout>
  );
} 