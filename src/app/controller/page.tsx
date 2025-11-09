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
      <main className="min-h-screen bg-gray-50">
        {/* Main Content - Simplified Mobile Layout */}
        <div className="pb-6 sm:pb-8">
          {/* Water Tank Monitor */}
          <div className="px-3 pt-4 sm:px-4 sm:pt-5 md:px-6 md:pt-6">
            <div className="max-w-7xl mx-auto">
              <WaterTankMonitor />
            </div>
          </div>

          {/* MQTT Connection */}
          <div className="px-3 pt-3 sm:px-4 sm:pt-4 md:px-6 md:pt-5">
            <div className="max-w-7xl mx-auto">
              <MQTTStatus />
            </div>
          </div>

          {/* Sensor Dashboard */}
          <div className="px-3 pt-3 sm:px-4 sm:pt-4 md:px-6 md:pt-5">
            <div className="max-w-7xl mx-auto">
              <GreenhouseSensorDashboard />
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}




