'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Layout from '@/components/Layout';
import MQTTStatus from '@/components/MQTTStatus';
import GreenhouseSensorDashboard from '@/components/GreenhouseSensorDashboard';
import WaterTankMonitor from '@/components/WaterTankMonitor';

export default function AdminControllerPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Set page title
    document.title = 'Greenhouse Monitoring';
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') {
    redirect('/login');
  }

  return (
    <Layout>
      <main className="min-h-screen bg-gray-50 text-gray-900">
        {/* Sticky Header with Safe Zone */}
        <div className="bg-white border-b border-gray-200 pl-[72px] pr-4 lg:pl-6 lg:pr-6 py-4 md:py-6 shadow-sm sticky top-0 z-30 backdrop-blur-sm bg-white/95">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                  Greenhouse Monitoring
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Real-time sensor data and water tank status
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Water Tank Monitor with Safe Zone */}
        <div className="pl-[72px] pr-4 lg:pl-6 lg:pr-6 py-4 md:py-6 animate-fade-in-up">
          <div className="max-w-7xl mx-auto">
            <WaterTankMonitor />
          </div>
        </div>

        {/* MQTT Connection with Safe Zone */}
        <div className="pl-[72px] pr-4 lg:pl-6 lg:pr-6 pb-4 md:pb-6">
          <div className="max-w-7xl mx-auto">
            <MQTTStatus />
          </div>
        </div>

        {/* Sensor Dashboard with Safe Zone */}
        <div className="pl-[72px] pr-4 lg:pl-6 lg:pr-6 pb-4 md:pb-6">
          <div className="max-w-7xl mx-auto">
            <GreenhouseSensorDashboard />
          </div>
        </div>
      </main>
    </Layout>
  );
}




