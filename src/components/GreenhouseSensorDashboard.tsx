'use client';

import { useState, useEffect } from 'react';
import mqttService from '@/lib/mqtt';

interface SensorData {
  temperature: number | null;
  humidity: number | null;
  soil_moisture: number | null;
  soil_temperature: number | null;
  N: number | null;
  P: number | null;
  K: number | null;
  timestamp: Date;
}

export default function GreenhouseSensorDashboard() {
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: null,
    humidity: null,
    soil_moisture: null,
    soil_temperature: null,
    N: null,
    P: null,
    K: null,
    timestamp: new Date()
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('Never');
  const [dataReceived, setDataReceived] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [lastRawMessage, setLastRawMessage] = useState<string>('');
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    console.log('🌡️ GreenhouseSensorDashboard: Component mounted');
    
    // Check MQTT connection status
    const checkConnection = () => {
      const connected = mqttService.getConnectionStatus();
      
      // Log connection status changes
      if (connected !== isConnected) {
        console.log(`🌡️ MQTT Connection Status Changed: ${connected ? 'Connected ✅' : 'Disconnected ❌'}`);
      }
      
      setIsConnected(connected);
      
      if (connected) {
        // Subscribe to sensor data topic
        console.log('🌡️ Attempting to subscribe to "Tempdata" topic...');
        const subscribed = mqttService.subscribe('Tempdata', handleSensorData);
        if (subscribed) {
          console.log('🌡️ Successfully subscribed to "Tempdata" topic ✅');
        } else {
          console.warn('🌡️ Failed to subscribe to "Tempdata" topic ❌');
        }
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    return () => {
      console.log('🌡️ GreenhouseSensorDashboard: Component unmounting, unsubscribing from Tempdata');
      clearInterval(interval);
      mqttService.unsubscribe('Tempdata');
    };
  }, []);

  const handleSensorData = (message: string) => {
    console.log('🌡️ 📨 RAW MESSAGE RECEIVED on Tempdata:', message);
    setMessageCount(prev => prev + 1);
    setLastRawMessage(message);
    
    try {
      // Parse JSON message from ESP32
      const data = JSON.parse(message);
      console.log('🌡️ ✅ Parsed JSON data:', data);
      
      const parsedSensorData = {
        temperature: data.temperature !== undefined && data.temperature !== null ? parseFloat(data.temperature) : null,
        humidity: data.humidity !== undefined && data.humidity !== null ? parseFloat(data.humidity) : null,
        soil_moisture: data.soil_moisture !== undefined && data.soil_moisture !== null ? parseInt(data.soil_moisture) : null,
        soil_temperature: data.soil_temperature !== undefined && data.soil_temperature !== null ? parseFloat(data.soil_temperature) : null,
        N: data.N !== undefined && data.N !== null ? parseInt(data.N) : null,
        P: data.P !== undefined && data.P !== null ? parseInt(data.P) : null,
        K: data.K !== undefined && data.K !== null ? parseInt(data.K) : null,
        timestamp: new Date()
      };
      
      console.log('🌡️ 📊 Setting sensor data:', parsedSensorData);
      setSensorData(parsedSensorData);
      
      setDataReceived(true);
      const now = new Date();
      setLastUpdate(now.toLocaleTimeString());
      
      console.log(`🌡️ ✅ Sensor data updated successfully at ${now.toLocaleTimeString()}`);
    } catch (error) {
      console.error('🌡️ ❌ Error parsing sensor data:', error);
      console.error('🌡️ ❌ Problematic message:', message);
    }
  };

  // Color-coded status functions
  const getTemperatureColor = (temp: number | null) => {
    if (temp === null) return 'text-gray-400';
    if (temp < 15) return 'text-blue-600 dark:text-blue-400';
    if (temp < 25) return 'text-green-600 dark:text-green-400';
    if (temp < 30) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getHumidityColor = (hum: number | null) => {
    if (hum === null) return 'text-gray-400';
    if (hum < 30) return 'text-red-600 dark:text-red-400';
    if (hum < 60) return 'text-green-600 dark:text-green-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  const getSoilMoistureColor = (moisture: number | null) => {
    if (moisture === null) return 'text-gray-400';
    if (moisture < 30) return 'text-red-600 dark:text-red-400';
    if (moisture < 70) return 'text-green-600 dark:text-green-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  const getNPKColor = (value: number | null) => {
    if (value === null) return 'text-gray-400';
    if (value < 50) return 'text-yellow-600 dark:text-yellow-400';
    if (value < 150) return 'text-green-600 dark:text-green-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  const getTemperatureIcon = (temp: number | null) => {
    if (temp === null) return '🌡️';
    if (temp < 15) return '❄️';
    if (temp < 25) return '🌱';
    if (temp < 30) return '🌡️';
    return '🔥';
  };

  const getHumidityIcon = (hum: number | null) => {
    if (hum === null) return '💧';
    if (hum < 30) return '🏜️';
    if (hum < 60) return '💧';
    return '🌊';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Status Banner */}
      <div className={`rounded-lg p-4 ${
        isConnected && dataReceived
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
          : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              isConnected && dataReceived ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
            }`}></div>
            <span className={`text-sm font-medium ${
              isConnected && dataReceived
                ? 'text-green-700 dark:text-green-300'
                : 'text-yellow-700 dark:text-yellow-300'
            }`}>
              {isConnected && dataReceived
                ? 'Receiving real-time sensor data'
                : isConnected
                  ? 'Connected - Waiting for data...'
                  : 'Disconnected from MQTT broker'
              }
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Last Update: {lastUpdate}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              Messages: {messageCount}
            </span>
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg"
        >
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            🔧 Debug Information
          </span>
          <span className="text-gray-500">{showDebug ? '▼' : '▶'}</span>
        </button>
        
        {showDebug && (
          <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500 dark:text-gray-400">MQTT Connected:</span>
                <span className={`ml-2 font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'Yes ✅' : 'No ❌'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Data Received:</span>
                <span className={`ml-2 font-medium ${dataReceived ? 'text-green-600' : 'text-yellow-600'}`}>
                  {dataReceived ? 'Yes ✅' : 'No ⏳'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Message Count:</span>
                <span className="ml-2 font-medium text-blue-600">{messageCount}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Subscribed Topic:</span>
                <span className="ml-2 font-mono text-blue-600">Tempdata</span>
              </div>
            </div>
            
            {lastRawMessage && (
              <div className="mt-3">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Last Raw Message:
                </div>
                <div className="bg-black text-green-400 p-2 rounded font-mono text-xs overflow-x-auto">
                  {lastRawMessage}
                </div>
              </div>
            )}
            
            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
              <div className="font-medium mb-1">💡 Troubleshooting Tips:</div>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Ensure MQTT Status panel shows "Connected"</li>
                <li>Check browser console (F12) for logs starting with 🌡️</li>
                <li>Verify ESP32 is publishing to "Tempdata" topic</li>
                <li>Both devices must use broker.hivemq.com</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Sensor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Air Temperature (DHT22) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-all hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Air Temperature</h3>
            <span className="text-2xl">{getTemperatureIcon(sensorData.temperature)}</span>
          </div>
          <div className={`text-3xl sm:text-4xl font-bold ${getTemperatureColor(sensorData.temperature)}`}>
            {sensorData.temperature !== null ? `${sensorData.temperature.toFixed(1)}°C` : '--°C'}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">DHT22 Sensor</p>
        </div>

        {/* Air Humidity (DHT22) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-all hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Air Humidity</h3>
            <span className="text-2xl">{getHumidityIcon(sensorData.humidity)}</span>
          </div>
          <div className={`text-3xl sm:text-4xl font-bold ${getHumidityColor(sensorData.humidity)}`}>
            {sensorData.humidity !== null ? `${sensorData.humidity.toFixed(1)}%` : '--%'}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">DHT22 Sensor</p>
        </div>

        {/* Soil Moisture */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-all hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Soil Moisture</h3>
            <span className="text-2xl">💦</span>
          </div>
          <div className={`text-3xl sm:text-4xl font-bold ${getSoilMoistureColor(sensorData.soil_moisture)}`}>
            {sensorData.soil_moisture !== null ? `${sensorData.soil_moisture}%` : '--%'}
          </div>
          {sensorData.soil_moisture !== null && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    sensorData.soil_moisture < 30 
                      ? 'bg-red-500' 
                      : sensorData.soil_moisture < 70 
                        ? 'bg-green-500' 
                        : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(sensorData.soil_moisture, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Capacitive Sensor</p>
        </div>

        {/* Soil Temperature (DS18B20) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-all hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Soil Temperature</h3>
            <span className="text-2xl">🌡️</span>
          </div>
          <div className={`text-3xl sm:text-4xl font-bold ${getTemperatureColor(sensorData.soil_temperature)}`}>
            {sensorData.soil_temperature !== null ? `${sensorData.soil_temperature.toFixed(1)}°C` : '--°C'}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">DS18B20 Sensor</p>
        </div>

        {/* NPK Sensor (Grouped Card - spans 2 columns on medium screens) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-all hover:shadow-lg md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Soil NPK Levels</h3>
            <span className="text-2xl">🧪</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {/* Nitrogen */}
            <div className="text-center">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Nitrogen (N)</div>
              <div className={`text-2xl sm:text-3xl font-bold ${getNPKColor(sensorData.N)}`}>
                {sensorData.N !== null ? sensorData.N : '--'}
              </div>
              <div className="text-xs text-gray-400 mt-1">mg/kg</div>
            </div>
            
            {/* Phosphorus */}
            <div className="text-center border-l border-r border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Phosphorus (P)</div>
              <div className={`text-2xl sm:text-3xl font-bold ${getNPKColor(sensorData.P)}`}>
                {sensorData.P !== null ? sensorData.P : '--'}
              </div>
              <div className="text-xs text-gray-400 mt-1">mg/kg</div>
            </div>
            
            {/* Potassium */}
            <div className="text-center">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Potassium (K)</div>
              <div className={`text-2xl sm:text-3xl font-bold ${getNPKColor(sensorData.K)}`}>
                {sensorData.K !== null ? sensorData.K : '--'}
              </div>
              <div className="text-xs text-gray-400 mt-1">mg/kg</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
            RS485 Modbus Sensor (SN-3002-TR-NPK-N01)
          </p>
          {(sensorData.N === null || sensorData.P === null || sensorData.K === null) && (
            <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-700 dark:text-yellow-300 text-center">
              NPK sensor not detected or offline
            </div>
          )}
        </div>
      </div>

      {/* Connection Warning */}
      {!isConnected && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-sm text-red-700 dark:text-red-300">
              MQTT connection required to receive sensor data. Please connect using the MQTT Status panel above.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}


