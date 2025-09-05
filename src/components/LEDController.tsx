'use client';

import { useState, useEffect } from 'react';
import mqttService from '@/lib/mqtt';

interface LEDControllerProps {
  className?: string;
}

export default function LEDController({ className = '' }: LEDControllerProps) {
  const [isOn, setIsOn] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize MQTT connection
    const initMQTT = async () => {
      const connected = await mqttService.connect();
      setIsConnected(connected);
    };

    initMQTT();

    // Check MQTT connection status periodically
    const checkConnection = () => {
      setIsConnected(mqttService.getConnectionStatus());
    };

    const interval = setInterval(checkConnection, 2000);

    return () => clearInterval(interval);
  }, []);

  const toggleLED = async () => {
    if (!isConnected) {
      console.error('MQTT not connected');
      return;
    }

    setIsLoading(true);
    const newState = !isOn;
    const message = newState ? 'ON' : 'OFF';
    
    try {
      if (mqttService.publish('lights', message)) {
        setIsOn(newState);
        console.log(`LED turned ${message}`);
      } else {
        console.error('Failed to publish MQTT message');
      }
    } catch (error) {
      console.error('Error controlling LED:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">LED Control</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${
          isOn ? 'bg-yellow-100' : 'bg-gray-100'
        }`}>
          <span className={`text-2xl ${isOn ? 'text-yellow-500' : 'text-gray-400'}`}>
            💡
          </span>
        </div>

        <p className={`text-lg font-medium mb-4 ${isOn ? 'text-yellow-600' : 'text-gray-500'}`}>
          LED is {isOn ? 'ON' : 'OFF'}
        </p>

        <button
          onClick={toggleLED}
          disabled={!isConnected || isLoading}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            isConnected && !isLoading
              ? isOn
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            `Turn ${isOn ? 'OFF' : 'ON'}`
          )}
        </button>

        {!isConnected && (
          <p className="text-sm text-red-500 mt-2">
            MQTT connection required to control LED
          </p>
        )}
      </div>
    </div>
  );
}
