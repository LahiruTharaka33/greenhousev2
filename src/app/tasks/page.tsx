'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import TaskForm from '@/components/TaskForm';
import KanbanBoard from '@/components/KanbanBoard';

interface Customer {
  id: string;
  customerId: string;
  customerName: string;
  company?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  customerId: string;
  customerName: string;
  assignedTo?: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'kanban' | 'list'>('kanban');

  useEffect(() => {
    fetchTasks();
    fetchCustomers();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks(prev => [...prev, newTask]);
    setShowTaskForm(false);
  };

  const handleStatusUpdate = async (taskId: string, newStatus: Task['status']) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setTasks(prev =>
          prev.map(task =>
            task.id === taskId ? { ...task, status: newStatus } : task
          )
        );
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getStatusStats = () => {
    return {
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      done: tasks.filter(t => t.status === 'done').length,
      overdue: tasks.filter(t => t.status === 'overdue').length,
    };
  };

  if (loading) {
    return (
      <Layout>
        <main className="min-h-screen bg-gray-50 text-gray-900">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading tasks...</div>
          </div>
        </main>
      </Layout>
    );
  }

  const stats = getStatusStats();

  return (
    <Layout>
      <main className="min-h-screen bg-gray-50 text-gray-900">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-6 shadow-sm">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Task Management
                </h1>
                <p className="text-gray-600">
                  Assign and track tasks for your customers
                </p>
              </div>
              <button
                onClick={() => setShowTaskForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 shadow-sm"
              >
                <span>+</span>
                <span>Add Task</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">To Do</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.todo}</p>
                  </div>
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                  </div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Done</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.done}</p>
                  </div>
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                  </div>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-white rounded-lg p-1 mb-6 shadow-sm border border-gray-200">
              <button
                onClick={() => setActiveTab('kanban')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'kanban'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Kanban Board
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'list'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List View
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-6">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'kanban' ? (
              <KanbanBoard
                tasks={tasks}
                onStatusUpdate={handleStatusUpdate}
                onTaskDelete={handleTaskDelete}
              />
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-gray-900 font-medium mb-2">{task.title}</h3>
                        {task.description && (
                          <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {task.customerName}
                          </span>
                          <span className={`px-2 py-1 rounded capitalize ${
                            task.priority === 'high' ? 'bg-red-100 text-red-800' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-1 rounded capitalize ${
                            task.status === 'todo' ? 'bg-gray-100 text-gray-700' :
                            task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            task.status === 'done' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleTaskDelete(task.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <p className="text-gray-600">No tasks yet</p>
                    <button
                      onClick={() => setShowTaskForm(true)}
                      className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Create your first task
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Task Form Modal */}
        {showTaskForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
              <TaskForm
                customers={customers}
                onTaskCreated={handleTaskCreated}
                onCancel={() => setShowTaskForm(false)}
              />
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
} 