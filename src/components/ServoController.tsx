'use client';

import { useState, useEffect } from 'react';
import mqttService from '@/lib/mqtt';

interface ServoControllerProps {
  className?: string;
}

export default function ServoController({ className = '' }: ServoControllerProps) {
  const [degree, setDegree] = useState(0);
  const [inputDegree, setInputDegree] = useState('0');
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

  const moveServo = (newDegree: number) => {
    if (!isConnected) {
      console.error('MQTT not connected');
      return;
    }

    if (newDegree >= 0 && newDegree <= 180) {
      if (mqttService.publish('servo', newDegree.toString())) {
        setDegree(newDegree);
        setInputDegree(newDegree.toString());
      }
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setDegree(value);
    setInputDegree(value.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputDegree(e.target.value);
  };

  const handleInputSubmit = () => {
    const value = parseInt(inputDegree);
    if (!isNaN(value) && value >= 0 && value <= 180) {
      moveServo(value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputSubmit();
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Servo Control
        </h3>
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
             title={isConnected ? 'Connected' : 'Disconnected'} />
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Current Position:</span>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {degree}°
          </span>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Position Slider (0° - 180°)
          </label>
          <input
            type="range"
            min="0"
            max="180"
            value={degree}
            onChange={handleSliderChange}
            disabled={!isConnected}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0°</span>
            <span>90°</span>
            <span>180°</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <input
            type="number"
            min="0"
            max="180"
            value={inputDegree}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={!isConnected}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Enter degree (0-180)"
          />
          <button
            onClick={handleInputSubmit}
            disabled={!isConnected}
            className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
              isConnected ? '' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            Move
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => moveServo(0)}
            disabled={!isConnected}
            className={`py-2 px-3 text-sm rounded-lg transition-colors ${
              isConnected
                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                : 'bg-gray-400 cursor-not-allowed text-gray-200'
            }`}
          >
            0°
          </button>
          <button
            onClick={() => moveServo(90)}
            disabled={!isConnected}
            className={`py-2 px-3 text-sm rounded-lg transition-colors ${
              isConnected
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-400 cursor-not-allowed text-gray-200'
            }`}
          >
            90°
          </button>
          <button
            onClick={() => moveServo(180)}
            disabled={!isConnected}
            className={`py-2 px-3 text-sm rounded-lg transition-colors ${
              isConnected
                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                : 'bg-gray-400 cursor-not-allowed text-gray-200'
            }`}
          >
            180°
          </button>
        </div>
        
        {!isConnected && (
          <p className="text-xs text-red-500 text-center">
            MQTT connection required
          </p>
        )}
      </div>
    </div>
  );
}
