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
        {/* Mobile-Optimized Header with Safe Zone */}
        <div className="bg-white border-b border-gray-200 pl-16 pr-4 lg:pl-6 lg:pr-6 py-4 md:py-6 shadow-sm sticky top-0 z-30 backdrop-blur-sm bg-white/95">
          <div className="max-w-7xl mx-auto">
            {/* Mobile: Stack vertically, Desktop: Side by side */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-4">
              {/* Title Section */}
              <div className="text-left flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-0.5 truncate">
                  Greenhouse Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Monitor your greenhouse environment and inventory
                </p>
              </div>
              
              {/* User Info & Logout - Mobile: Horizontal, Desktop: Keep same */}
              <div className="flex items-center justify-between md:justify-end gap-2 md:gap-4 flex-shrink-0">
                <div className="text-left md:text-right min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">Welcome, {session?.user?.name}</p>
                  <p className="text-xs text-emerald-600 truncate">Administrator</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center px-3 sm:px-4 py-2.5 min-h-[44px] min-w-[44px] text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors border border-gray-300 whitespace-nowrap flex-shrink-0"
                >
                  <span className="mr-0 sm:mr-2 text-base">🚪</span>
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content with Safe Zone */}
        <div className="pl-16 pr-4 lg:pl-6 lg:pr-6 py-4 md:py-8 lg:py-12">
          <div className="max-w-6xl mx-auto">
            
            {/* MOBILE LAYOUT: Vertical Stack (visible only on mobile) */}
            <div className="md:hidden space-y-4 animate-fade-in-up">
              {/* Humidity Card */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 text-center hover:shadow-lg transition-shadow duration-300">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Humidity</h3>
                <p className="text-3xl font-bold text-blue-600">78%</p>
                <p className="text-xs text-gray-500 mt-1">Optimal range</p>
              </div>

              {/* Plant Image */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 hover:shadow-lg transition-shadow duration-300">
                <div className="w-40 h-40 sm:w-48 sm:h-48 mx-auto relative">
                  <Image
                    src="/images/bell-pepper-plant-with-root-under-the-ground-vector.jpg"
                    alt="Bell Pepper Plant"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="text-center mt-3">
                  <p className="text-emerald-700 font-medium text-sm sm:text-base">Bell Pepper Plant</p>
                  <p className="text-xs sm:text-sm text-emerald-600 mt-1">Healthy & Growing</p>
                </div>
              </div>

              {/* Water Level Card */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 text-center hover:shadow-lg transition-shadow duration-300">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Water Level</h3>
                <p className="text-3xl font-bold text-blue-600">65%</p>
                <p className="text-xs text-gray-500 mt-1">Tank capacity</p>
              </div>

              {/* Stock Card */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 text-center hover:shadow-lg transition-shadow duration-300">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Stock</h3>
                <p className="text-3xl font-bold text-emerald-600">1,247</p>
                <p className="text-xs text-gray-500 mt-1">Total items</p>
              </div>

              {/* LED Controller */}
              <div className="w-full">
                <LEDController />
              </div>
            </div>

            {/* DESKTOP LAYOUT: Artistic positioning (hidden on mobile) */}
            <div className="hidden md:block">
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
                  <div className="w-64 h-64 lg:w-80 lg:h-80 mx-auto relative">
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
                <div className="absolute bottom-0 left-0 lg:left-8">
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
                <div className="absolute bottom-0 right-0 lg:right-8">
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
            </div>

            {/* Status Indicators - Mobile Optimized */}
            <div className="mt-6 md:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 lg:gap-6 animate-fade-in-up animation-delay-200">
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 md:p-5 text-center hover:shadow-lg transition-shadow duration-300">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-1">System Status</h3>
                <p className="text-xs md:text-sm text-green-600 font-medium">All Systems Operational</p>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 md:p-5 text-center hover:shadow-lg transition-shadow duration-300">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-1">Last Update</h3>
                <p className="text-xs md:text-sm text-blue-600 font-medium">2 minutes ago</p>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 md:p-5 text-center sm:col-span-1 hover:shadow-lg transition-shadow duration-300">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-1">Energy Usage</h3>
                <p className="text-xs md:text-sm text-purple-600 font-medium">2.4 kWh</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
