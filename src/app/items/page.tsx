import Layout from '@/components/Layout';

export default function ItemsPage() {
  return (
    <Layout>
      <main className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Items
          </h1>
          <p className="text-lg text-gray-600">
            Manage individual items and SKUs
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-6xl mb-4">🏷️</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Items Management
          </h2>
          <p className="text-gray-600 mb-6">
            This page will be implemented soon. Here you'll be able to:
          </p>
          <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto">
            <li>• Create new items and SKUs</li>
            <li>• Manage item categories</li>
            <li>• Set item specifications</li>
            <li>• Track item pricing</li>
            <li>• Manage item suppliers</li>
            <li>• View item history and usage</li>
          </ul>
        </div>
      </main>
    </Layout>
  );
} 