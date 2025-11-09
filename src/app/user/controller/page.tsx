'use client';

import { useEffect } from 'react';
import UserLayout from '@/components/UserLayout';
import MQTTStatus from '@/components/MQTTStatus';
import GreenhouseSensorDashboard from '@/components/GreenhouseSensorDashboard';
import WaterTankMonitor from '@/components/WaterTankMonitor';
 
export default function ControllerPage() {
  useEffect(() => {
    // Set page title
    document.title = 'Greenhouse Sensor Monitoring';
  }, []);

  return (
    <UserLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header - Sticky */}
        <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                  Greenhouse Sensor Monitoring
                </h1>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Monitor real-time environmental conditions and soil nutrients
                </p>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Water Tank Monitor */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <WaterTankMonitor />
          </div>

          {/* MQTT Connection Status */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <MQTTStatus />
          </div>

          {/* Sensor Dashboard */}
          <GreenhouseSensorDashboard />
        </div>
      </div>
    </UserLayout>
  );
}
