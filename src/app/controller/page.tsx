'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Layout from '@/components/Layout';
import MQTTStatus from '@/components/MQTTStatus';
import GreenhouseSensorDashboard from '@/components/GreenhouseSensorDashboard';

export default function AdminControllerPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Set page title
    document.title = 'Greenhouse Sensor Monitoring';
  }, []);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session || session.user.role !== 'admin') {
    redirect('/login');
  }

  return (
    <Layout>
      <main className="min-h-screen bg-gray-50 text-gray-900">
        {/* Header with Safe Zone */}
        <div className="bg-white border-b border-gray-200 pl-[72px] pr-4 lg:pl-6 lg:pr-6 py-4 md:py-6 shadow-sm sticky top-0 z-30 backdrop-blur-sm bg-white/95">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  Greenhouse Sensor Monitoring
                </h1>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                  Monitor real-time environmental conditions and soil nutrients
                </p>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm text-gray-600">Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          {/* MQTT Connection Status */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <MQTTStatus />
          </div>

          {/* Sensor Dashboard */}
          <GreenhouseSensorDashboard />
        </div>
      </main>
    </Layout>
  );
}




