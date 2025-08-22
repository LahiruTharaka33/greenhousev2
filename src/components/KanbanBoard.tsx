'use client';

import { useState } from 'react';

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

interface KanbanBoardProps {
  tasks: Task[];
  onStatusUpdate: (taskId: string, newStatus: Task['status']) => void;
  onTaskDelete: (taskId: string) => void;
}

const columns = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-50', borderColor: 'border-gray-200', textColor: 'text-gray-700' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700' },
  { id: 'done', title: 'Done', color: 'bg-emerald-50', borderColor: 'border-emerald-200', textColor: 'text-emerald-700' },
  { id: 'overdue', title: 'Overdue', color: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-700' },
] as const;

export default function KanbanBoard({ tasks, onStatusUpdate, onTaskDelete }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: Task['status']) => {
    e.preventDefault();
    if (draggedTask) {
      onStatusUpdate(draggedTask, targetStatus);
      setDraggedTask(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {columns.map((column) => {
        const columnTasks = tasks.filter(task => task.status === column.id);
        
        return (
          <div
            key={column.id}
            className={`${column.color} ${column.borderColor} border rounded-lg p-4 min-h-[500px] lg:min-h-[600px] shadow-sm`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id as Task['status'])}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${column.textColor}`}>
                {column.title}
              </h3>
              <span className="bg-white bg-opacity-80 px-2 py-1 rounded-full text-sm font-medium text-gray-700 border border-gray-200">
                {columnTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-all duration-200 hover:border-emerald-300"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1 mr-2">
                      {task.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}
                        title={`Priority: ${task.priority}`}
                      />
                      <button
                        onClick={() => onTaskDelete(task.id)}
                        className="text-gray-400 hover:text-red-500 text-sm transition-colors"
                        title="Delete task"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {task.description && (
                    <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="space-y-2 text-xs text-gray-500 mb-3">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700">Customer:</span>
                      <span className="ml-1">{task.customerName}</span>
                    </div>

                    {task.assignedTo && (
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700">Assigned:</span>
                        <span className="ml-1">{task.assignedTo}</span>
                      </div>
                    )}

                    {task.dueDate && (
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700">Due:</span>
                        <span className="ml-1">{formatDate(task.dueDate)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {task.priority}
                    </span>

                    {/* Mobile-friendly status buttons */}
                    <div className="flex space-x-1">
                      {columns.map((col) => (
                        <button
                          key={col.id}
                          onClick={() => onStatusUpdate(task.id, col.id as Task['status'])}
                          className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
                            task.status === col.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-800'
                          }`}
                          title={`Move to ${col.title}`}
                        >
                          {col.title.charAt(0)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {columnTasks.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm">No tasks</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 