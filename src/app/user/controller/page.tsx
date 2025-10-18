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
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto pl-16 pr-4 sm:pl-16 sm:pr-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Smart Greenhouse Controller
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Control your IoT devices and monitor sensor data in real-time
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto pl-16 pr-4 sm:pl-16 sm:pr-6 lg:px-8 py-8">
        {/* MQTT Connection Status */}
        <div className="mb-8">
          <MQTTStatus />
        </div>

        {/* Control Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 rounded-lg transition-colors">
              <div className="text-2xl mb-2">🌱</div>
              <div className="text-sm font-medium text-green-800 dark:text-green-200">Grow Mode</div>
            </button>
            <button className="p-4 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
              <div className="text-2xl mb-2">💧</div>
              <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Water Mode</div>
            </button>
            <button className="p-4 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 rounded-lg transition-colors">
              <div className="text-2xl mb-2">🌡️</div>
              <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Heat Mode</div>
            </button>
            <button className="p-4 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 rounded-lg transition-colors">
              <div className="text-2xl mb-2">🌙</div>
              <div className="text-sm font-medium text-purple-800 dark:text-purple-200">Night Mode</div>
            </button>
          </div>
        </div>

        {/* System Information */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            System Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                         <div>
               <h4 className="font-medium text-gray-900 dark:text-white mb-2">MQTT Configuration</h4>
                               <div className="space-y-1 text-gray-600 dark:text-gray-400">
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
