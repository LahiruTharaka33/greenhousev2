'use client';

import { useEffect } from 'react';
import MQTTStatus from '@/components/MQTTStatus';
import LEDController from '@/components/LEDController';
import ServoController from '@/components/ServoController';
import NeoPixelController from '@/components/NeoPixelController';
import SensorDisplay from '@/components/SensorDisplay';
 
export default function ControllerPage() {
  useEffect(() => {
    // Set page title
    document.title = 'Smart Greenhouse Controller - Dashboard';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - Sticky with safe zone */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700 animate-fade-in">
        <div className="max-w-7xl mx-auto pl-[72px] pr-4 lg:px-8 py-4 lg:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                Smart Greenhouse Controller
              </h1>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Control your IoT devices and monitor sensor data in real-time
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
      <div className="max-w-7xl mx-auto pl-[72px] pr-4 lg:px-8 py-4 sm:py-6 lg:py-8 animate-fade-in-up">
        {/* MQTT Connection Status */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <MQTTStatus />
        </div>

        {/* Control Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* LED Control */}
          <LEDController />
          
          {/* Servo Control */}
          <ServoController />
          
          {/* NeoPixel Control */}
          <NeoPixelController />
          
          {/* Sensor Display */}
          <div className="lg:col-span-2 xl:col-span-1">
            <SensorDisplay />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 sm:mt-6 lg:mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <button className="p-3 sm:p-4 min-h-[88px] sm:min-h-[100px] bg-green-100 hover:bg-green-200 active:bg-green-300 dark:bg-green-900/20 dark:hover:bg-green-900/30 rounded-lg transition-colors">
              <div className="text-2xl sm:text-3xl mb-2">🌱</div>
              <div className="text-xs sm:text-sm font-medium text-green-800 dark:text-green-200">Grow Mode</div>
            </button>
            <button className="p-3 sm:p-4 min-h-[88px] sm:min-h-[100px] bg-blue-100 hover:bg-blue-200 active:bg-blue-300 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
              <div className="text-2xl sm:text-3xl mb-2">💧</div>
              <div className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200">Water Mode</div>
            </button>
            <button className="p-3 sm:p-4 min-h-[88px] sm:min-h-[100px] bg-yellow-100 hover:bg-yellow-200 active:bg-yellow-300 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 rounded-lg transition-colors">
              <div className="text-2xl sm:text-3xl mb-2">🌡️</div>
              <div className="text-xs sm:text-sm font-medium text-yellow-800 dark:text-yellow-200">Heat Mode</div>
            </button>
            <button className="p-3 sm:p-4 min-h-[88px] sm:min-h-[100px] bg-purple-100 hover:bg-purple-200 active:bg-purple-300 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 rounded-lg transition-colors">
              <div className="text-2xl sm:text-3xl mb-2">🌙</div>
              <div className="text-xs sm:text-sm font-medium text-purple-800 dark:text-purple-200">Night Mode</div>
            </button>
          </div>
        </div>

        {/* System Information */}
        <div className="mt-4 sm:mt-6 lg:mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
            System Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-xs sm:text-sm">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">MQTT Configuration</h4>
              <div className="space-y-1 text-gray-600 dark:text-gray-400 break-words">
                <div>Broker: mqtt.eclipseprojects.io</div>
                <div>Port: 9001 (WebSocket)</div>
                <div>Protocol: MQTT 3.1.1 over WS</div>
                <div>QoS: 1</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Supported Devices</h4>
              <div className="space-y-1 text-gray-600 dark:text-gray-400">
                <div>• DHT22 Temperature Sensor</div>
                <div>• LED Light</div>
                <div>• Servo Motor (0-180°)</div>
                <div>• WS2812 RGB Strip</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Data Format</h4>
              <div className="space-y-1 text-gray-600 dark:text-gray-400">
                <div>Temperature: Celsius</div>
                <div>Humidity: Percentage</div>
                <div>Servo: Degrees (0-180)</div>
                <div>RGB: R,G,B (0-255)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
