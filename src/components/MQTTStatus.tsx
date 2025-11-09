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
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          MQTT Connection
        </h3>
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} 
             title={getStatusText()} />
      </div>
      
      <div className="space-y-3">
        {/* Connection Status */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status:</span>
            <span className={`text-sm font-medium ${
              isConnecting 
                ? 'text-yellow-600'
                : isConnected 
                  ? 'text-green-600' 
                  : 'text-red-600'
            }`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* Connection Controls */}
        <div className="flex space-x-2">
          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                isConnecting
                  ? 'bg-yellow-600 cursor-not-allowed text-white'
                  : 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white'
              }`}
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
