import Layout from '@/components/Layout';

export default function TasksPage() {
  return (
    <Layout>
      <main className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tasks
          </h1>
          <p className="text-lg text-gray-600">
            Track pending and completed tasks
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Task Management
          </h2>
          <p className="text-gray-600 mb-6">
            This page will be implemented soon. Here you'll be able to:
          </p>
          <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto">
            <li>• Create new tasks</li>
            <li>• Assign tasks to team members</li>
            <li>• Set task priorities</li>
            <li>• Track task progress</li>
            <li>• Mark tasks as completed</li>
            <li>• View task history and analytics</li>
          </ul>
        </div>
      </main>
    </Layout>
  );
} 