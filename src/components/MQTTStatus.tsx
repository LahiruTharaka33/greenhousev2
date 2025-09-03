'use client';

import { useState, useEffect } from 'react';
import mqttService from '@/lib/mqtt';

interface MQTTStatusProps {
  className?: string;
}

export default function MQTTStatus({ className = '' }: MQTTStatusProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionTime, setConnectionTime] = useState<string>('--');
  const [lastMessage, setLastMessage] = useState<string>('--');

  useEffect(() => {
    // Check MQTT connection status
    const checkConnection = () => {
      const connected = mqttService.getConnectionStatus();
      setIsConnected(connected);
      
      if (connected && connectionTime === '--') {
        setConnectionTime(new Date().toLocaleTimeString());
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, [connectionTime]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const success = await mqttService.connect();
      if (success) {
        setConnectionTime(new Date().toLocaleTimeString());
        setLastMessage('Connected successfully');
      } else {
        setLastMessage('Connection failed');
      }
    } catch (error) {
      setLastMessage('Connection error');
      console.error('Connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    mqttService.disconnect();
    setConnectionTime('--');
    setLastMessage('Disconnected');
  };

  const getStatusColor = () => {
    if (isConnecting) return 'bg-yellow-500';
    return isConnected ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    return isConnected ? 'Connected' : 'Disconnected';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          MQTT Connection
        </h3>
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} 
             title={getStatusText()} />
      </div>
      
      <div className="space-y-4">
        {/* Connection Status */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
            <span className={`font-medium ${
              isConnecting 
                ? 'text-yellow-600 dark:text-yellow-400'
                : isConnected 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
            }`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* Connection Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Broker:</span>
                         <span className="font-medium text-gray-900 dark:text-white">
               broker.emqx.io:8083 (WS)
             </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Connected Since:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {connectionTime}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Last Message:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {lastMessage}
            </span>
          </div>
        </div>

        {/* Connection Controls */}
        <div className="flex space-x-2">
          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                isConnecting
                  ? 'bg-yellow-600 cursor-not-allowed text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>

        {/* Connection Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <div className="font-medium mb-1">Topics:</div>
            <div className="space-y-1 text-xs">
              <div>• <span className="font-mono">lights</span> - LED control</div>
              <div>• <span className="font-mono">servo</span> - Servo position</div>
              <div>• <span className="font-mono">lights/neopixel</span> - RGB control</div>
              <div>• <span className="font-mono">Tempdata</span> - Sensor data</div>
            </div>
          </div>
        </div>

        {/* Connection Status Indicator */}
        <div className={`rounded-lg p-3 ${
          isConnected 
            ? 'bg-green-50 dark:bg-green-900/20' 
            : 'bg-red-50 dark:bg-red-900/20'
        }`}>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
            <span className={`text-sm ${
              isConnected 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-red-700 dark:text-red-300'
            }`}>
              {isConnected 
                ? 'Ready to send commands and receive sensor data' 
                : 'Connect to MQTT broker to control devices'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
