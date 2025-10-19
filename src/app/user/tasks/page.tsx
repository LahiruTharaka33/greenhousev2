'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import UserLayout from '@/components/UserLayout';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  customerId: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    customerId: string;
    customerName: string;
    company?: string;
  };
}

export default function UserTasks() {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Fetch user's assigned tasks
  const fetchUserTasks = async () => {
    try {
      const response = await fetch('/api/tasks/user');
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        console.error('Failed to fetch user tasks');
      }
    } catch (error) {
      console.error('Error fetching user tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update task status
  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    setUpdatingStatus(taskId);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setTasks(prev =>
          prev.map(task =>
            task.id === taskId ? { ...task, status: newStatus } : task
          )
        );
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Failed to update task status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  useEffect(() => {
    if (session && session.user.role === 'user') {
      fetchUserTasks();
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

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusOptions = (currentStatus: Task['status']) => {
    const allStatuses: Task['status'][] = ['todo', 'in-progress', 'done'];
    return allStatuses.filter(status => status !== currentStatus);
  };

  const getStatusStats = () => {
    return {
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      done: tasks.filter(t => t.status === 'done').length,
      overdue: tasks.filter(t => t.status === 'overdue').length,
    };
  };

  const stats = getStatusStats();

  return (
    <UserLayout>
      <div className="pl-[72px] pr-4 lg:px-0 space-y-4 sm:space-y-6 animate-fade-in-up">
        <div className="flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Tasks</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs sm:text-sm truncate">To Do</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.todo}</p>
              </div>
              <div className="w-3 h-3 bg-gray-400 rounded-full flex-shrink-0 ml-2"></div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs sm:text-sm truncate">In Progress</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs sm:text-sm truncate">Done</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.done}</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0 ml-2"></div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 text-xs sm:text-sm truncate">Overdue</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0 ml-2"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-medium text-gray-900">Task Management</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              View and update the status of your assigned tasks
            </p>
          </div>
          
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading your tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-gray-400 text-2xl sm:text-3xl">📋</span>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No tasks assigned</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4 px-4">
                  Contact your administrator to get tasks assigned to your account.
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            {task.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </span>
                          </div>
                        </div>
                        
                        {task.description && (
                          <p className="text-sm sm:text-base text-gray-600 mb-3 break-words">{task.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                          <div>
                            <span className="font-medium text-gray-700">Due Date:</span>
                            <span className="ml-1">{formatDate(task.dueDate)}</span>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-700">Assigned Date:</span>
                            <span className="ml-1">{formatDate(task.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2 sm:ml-4">
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value as Task['status'])}
                          disabled={updatingStatus === task.id}
                          className="w-full sm:w-auto px-3 py-2 min-h-[44px] text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                        >
                          <option value="todo">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                        
                        {updatingStatus === task.id && (
                          <span className="text-xs text-gray-500 text-center">Updating...</span>
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