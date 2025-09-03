'use client';

import { useState, useEffect } from 'react';
import mqttService from '@/lib/mqtt';

interface LEDControllerProps {
  className?: string;
}

export default function LEDController({ className = '' }: LEDControllerProps) {
  const [isOn, setIsOn] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check MQTT connection status
    const checkConnection = () => {
      setIsConnected(mqttService.getConnectionStatus());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleLED = async () => {
    if (!isConnected) {
      console.error('MQTT not connected');
      return;
    }

    const newState = !isOn;
    const message = newState ? 'ON' : 'OFF';
    
    if (mqttService.publish('lights', message)) {
      setIsOn(newState);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          LED Control
        </h3>
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
             title={isConnected ? 'Connected' : 'Disconnected'} />
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isOn 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}>
            {isOn ? 'ON' : 'OFF'}
          </span>
        </div>
        
        <button
          onClick={toggleLED}
          disabled={!isConnected}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            isConnected
              ? isOn
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-400 cursor-not-allowed text-gray-200'
          }`}
        >
          {isOn ? 'Turn OFF' : 'Turn ON'}
        </button>
        
        {!isConnected && (
          <p className="text-xs text-red-500 text-center">
            MQTT connection required
          </p>
        )}
      </div>
    </div>
  );
}
