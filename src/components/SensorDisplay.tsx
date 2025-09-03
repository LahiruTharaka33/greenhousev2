'use client';

import { useState, useEffect } from 'react';
import mqttService from '@/lib/mqtt';

interface SensorDisplayProps {
  className?: string;
}

interface SensorData {
  temperature: number | null;
  humidity: number | null;
  timestamp: Date;
}

export default function SensorDisplay({ className = '' }: SensorDisplayProps) {
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: null,
    humidity: null,
    timestamp: new Date()
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('Never');

  useEffect(() => {
    // Check MQTT connection status
    const checkConnection = () => {
      const connected = mqttService.getConnectionStatus();
      setIsConnected(connected);
      
      if (connected) {
        // Subscribe to sensor data topic
        mqttService.subscribe('Tempdata', handleSensorData);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    return () => {
      clearInterval(interval);
      mqttService.unsubscribe('Tempdata');
    };
  }, []);

  const handleSensorData = (message: string) => {
    try {
      // Parse the message format: "temperature,humidity,"
      const parts = message.split(',');
      if (parts.length >= 2) {
        const temperature = parseFloat(parts[0]);
        const humidity = parseFloat(parts[1]);
        
        if (!isNaN(temperature) && !isNaN(humidity)) {
          setSensorData({
            temperature,
            humidity,
            timestamp: new Date()
          });
          
          // Update last update time
          const now = new Date();
          setLastUpdate(now.toLocaleTimeString());
        }
      }
    } catch (error) {
      console.error('Error parsing sensor data:', error);
    }
  };

  const getTemperatureColor = (temp: number) => {
    if (temp < 15) return 'text-blue-600 dark:text-blue-400';
    if (temp < 25) return 'text-green-600 dark:text-green-400';
    if (temp < 30) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getHumidityColor = (hum: number) => {
    if (hum < 30) return 'text-red-600 dark:text-red-400';
    if (hum < 60) return 'text-green-600 dark:text-green-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  const getTemperatureIcon = (temp: number) => {
    if (temp < 15) return '❄️';
    if (temp < 25) return '🌱';
    if (temp < 30) return '🌡️';
    return '🔥';
  };

  const getHumidityIcon = (hum: number) => {
    if (hum < 30) return '🏜️';
    if (hum < 60) return '💧';
    return '🌊';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Sensor Data
        </h3>
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
             title={isConnected ? 'Connected' : 'Disconnected'} />
      </div>
      
      <div className="space-y-4">
        {/* Temperature Display */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Temperature</div>
              <div className={`text-3xl font-bold ${getTemperatureColor(sensorData.temperature || 0)}`}>
                {sensorData.temperature !== null ? `${sensorData.temperature.toFixed(1)}°C` : '--°C'}
              </div>
            </div>
            <div className="text-4xl">
              {sensorData.temperature !== null ? getTemperatureIcon(sensorData.temperature) : '🌡️'}
            </div>
          </div>
        </div>

        {/* Humidity Display */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Humidity</div>
              <div className={`text-3xl font-bold ${getHumidityColor(sensorData.humidity || 0)}`}>
                {sensorData.humidity !== null ? `${sensorData.humidity.toFixed(1)}%` : '--%'}
              </div>
            </div>
            <div className="text-4xl">
              {sensorData.humidity !== null ? getHumidityIcon(sensorData.humidity) : '💧'}
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Connection:</span>
            <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Last Update:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {lastUpdate}
            </span>
          </div>
        </div>

        {/* Data Quality Indicator */}
        {sensorData.temperature !== null && sensorData.humidity !== null && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-700 dark:text-green-300">
                Receiving real-time data
              </span>
            </div>
          </div>
        )}

        {!isConnected && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm text-red-700 dark:text-red-300">
                MQTT connection required to receive sensor data
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
