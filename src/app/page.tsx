import Layout from '@/components/Layout';

export default function Home() {
  return (
    <Layout>
      {/* Main Content */}
      <main className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Welcome to your greenhouse management system
          </p>
        </div>

        {/* Entity Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Customers</h3>
            <p className="text-gray-600 text-sm mb-4">Manage customer information and relationships</p>
            <div className="text-2xl font-bold text-green-600">0</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tunnels</h3>
            <p className="text-gray-600 text-sm mb-4">Track greenhouse tunnels and their status</p>
            <div className="text-2xl font-bold text-blue-600">0</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Inventory</h3>
            <p className="text-gray-600 text-sm mb-4">Manage main and customer inventory</p>
            <div className="text-2xl font-bold text-purple-600">0</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Items</h3>
            <p className="text-gray-600 text-sm mb-4">Track individual items and SKUs</p>
            <div className="text-2xl font-bold text-orange-600">0</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedules</h3>
            <p className="text-gray-600 text-sm mb-4">Manage maintenance and task schedules</p>
            <div className="text-2xl font-bold text-red-600">0</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tasks</h3>
            <p className="text-gray-600 text-sm mb-4">Track pending and completed tasks</p>
            <div className="text-2xl font-bold text-indigo-600">0</div>
          </div>
        </div>
        
        {/* Setup Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Setup Instructions</h3>
          <ol className="text-left text-blue-800 space-y-2">
            <li>1. Configure your database connection in <code className="bg-blue-100 px-1 rounded">.env</code></li>
            <li>2. Run <code className="bg-blue-100 px-1 rounded">npx prisma migrate dev</code> to set up the database</li>
            <li>3. Run <code className="bg-blue-100 px-1 rounded">npx prisma generate</code> to generate the Prisma client</li>
            <li>4. Start the development server with <code className="bg-blue-100 px-1 rounded">pnpm dev</code></li>
          </ol>
        </div>
      </main>
    </Layout>
  );
}
