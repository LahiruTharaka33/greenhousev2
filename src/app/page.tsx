'use client';

import Layout from '@/components/Layout';
import LEDController from '@/components/LEDController';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session || session.user.role !== 'admin') {
    redirect('/login');
  }
  return (
    <Layout>
      <main className="min-h-screen bg-gray-50 text-gray-900">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-6 shadow-sm">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
              <div className="text-center flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  Greenhouse Dashboard
                </h1>
                <p className="text-gray-600">
                  Monitor your greenhouse environment and inventory
                </p>
              </div>
              
              {/* Quick Logout Button */}
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Welcome, {session?.user?.name}</p>
                  <p className="text-xs text-emerald-600">Administrator</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                >
                  <span className="mr-2">🚪</span>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="px-4 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Bell Pepper Plant Section */}
            <div className="relative flex flex-col items-center justify-center min-h-[60vh]">
              
              {/* Humidity Metric - Top */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 mb-8">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Humidity</h3>
                  <p className="text-3xl font-bold text-blue-600">78%</p>
                  <p className="text-sm text-gray-500 mt-1">Optimal range</p>
                </div>
              </div>

              {/* Bell Pepper Plant Image - Center */}
              <div className="relative z-10 my-16 px-8">
                <div className="w-64 h-64 sm:w-80 sm:h-80 mx-auto relative">
                  <Image
                    src="/images/bell-pepper-plant-with-root-under-the-ground-vector.jpg"
                    alt="Bell Pepper Plant"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="text-center mt-4">
                  <p className="text-emerald-700 font-medium">Bell Pepper Plant</p>
                  <p className="text-sm text-emerald-600 mt-1">Healthy & Growing</p>
                </div>
              </div>

              {/* Water Level - Bottom Left */}
              <div className="absolute bottom-0 left-0 sm:left-8">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Water Level</h3>
                  <p className="text-3xl font-bold text-blue-600">65%</p>
                  <p className="text-sm text-gray-500 mt-1">Tank capacity</p>
                </div>
              </div>

              {/* Stock - Bottom Right */}
              <div className="absolute bottom-0 right-0 sm:right-8">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Stock</h3>
                  <p className="text-3xl font-bold text-emerald-600">1,247</p>
                  <p className="text-sm text-gray-500 mt-1">Total items</p>
                </div>
              </div>

              {/* LED Controller */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                <LEDController />
              </div>

            </div>

            {/* Status Indicators */}
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">System Status</h3>
                <p className="text-green-600 font-medium">All Systems Operational</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Last Update</h3>
                <p className="text-blue-600 font-medium">2 minutes ago</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Energy Usage</h3>
                <p className="text-purple-600 font-medium">2.4 kWh</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
