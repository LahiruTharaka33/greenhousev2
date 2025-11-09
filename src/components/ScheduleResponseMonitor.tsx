'use client';

import { useState, useEffect } from 'react';
import mqttService from '@/lib/mqtt';

interface ScheduleResponse {
  [key: string]: any; // Flexible structure since we don't know exact format yet
}

export default function ScheduleResponseMonitor() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastRawMessage, setLastRawMessage] = useState<string>('');
  const [parsedData, setParsedData] = useState<ScheduleResponse | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [messageHistory, setMessageHistory] = useState<Array<{timestamp: Date, message: string}>>([]);

  useEffect(() => {
    console.log('📡 ScheduleResponseMonitor: Initializing...');

    const checkConnection = async () => {
      const connected = mqttService.getConnectionStatus();
      
      if (connected !== isConnected) {
        console.log(`📡 MQTT Connection Status: ${connected ? 'Connected ✅' : 'Disconnected ❌'}`);
      }
      
      setIsConnected(connected);
      
      if (connected) {
        console.log('📡 Attempting to subscribe to "Schedule_Responce" topic...');
        const subscribed = mqttService.subscribe('Schedule_Responce', handleScheduleResponse);
        if (subscribed) {
          console.log('📡 ✅ Successfully subscribed to "Schedule_Responce" topic');
        } else {
          console.warn('📡 ❌ Failed to subscribe to "Schedule_Responce" topic');
        }
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    return () => {
      console.log('📡 ScheduleResponseMonitor: Unmounting, unsubscribing from Schedule_Responce');
      clearInterval(interval);
      mqttService.unsubscribe('Schedule_Responce');
    };
  }, []);

  const handleScheduleResponse = (message: string) => {
    console.log('📡 📨 RAW MESSAGE RECEIVED on Schedule_Responce:', message);
    setMessageCount(prev => prev + 1);
    setLastRawMessage(message);
    setError(null);
    
    // Add to history
    setMessageHistory(prev => [
      { timestamp: new Date(), message },
      ...prev.slice(0, 9) // Keep last 10 messages
    ]);
    
    try {
      // Try to parse as JSON
      const data = JSON.parse(message);
      console.log('📡 ✅ Parsed JSON data:', data);
      setParsedData(data);
    } catch (parseError) {
      console.warn('📡 ⚠️ Message is not JSON, displaying as plain text');
      setParsedData({ raw: message });
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            📡 Schedule Response Monitor
            <span className="text-xs font-normal text-gray-500">(Schedule_Responce Topic)</span>
          </h2>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="text-sm font-medium text-gray-700">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Listening for responses from ESP32 (Client ID: esp32-watertank-controller-01)
        </p>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            ⚠️ Waiting for MQTT connection... Make sure MQTT service is running.
          </p>
        </div>
      )}

      {/* Message Count */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">Messages Received:</span>
          <span className="text-lg font-bold text-blue-600">{messageCount}</span>
        </div>
      </div>

      {/* Last Raw Message */}
      {lastRawMessage && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">📨 Last Raw Message:</h3>
          <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
            <pre className="whitespace-pre-wrap break-words">{lastRawMessage}</pre>
          </div>
        </div>
      )}

      {/* Parsed JSON Data */}
      {parsedData && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">📊 Parsed JSON Data:</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <pre className="text-xs text-gray-800 overflow-x-auto whitespace-pre-wrap break-words">
              {JSON.stringify(parsedData, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Message History */}
      {messageHistory.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">📜 Message History (Last 10):</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messageHistory.map((item, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">
                    {formatTimestamp(item.timestamp)}
                  </span>
                  <span className="text-xs text-gray-500">#{messageCount - index}</span>
                </div>
                <div className="bg-white p-2 rounded text-xs font-mono text-gray-700 overflow-x-auto">
                  {item.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Messages Yet */}
      {messageCount === 0 && isConnected && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-600 font-medium">No messages received yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Waiting for ESP32 to publish to "Schedule_Responce" topic...
          </p>
        </div>
      )}

      {/* Debug Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <details className="text-xs text-gray-600">
          <summary className="cursor-pointer font-medium hover:text-gray-900">
            🔧 Debug Information
          </summary>
          <div className="mt-2 space-y-1 pl-4">
            <p>• <strong>Topic:</strong> Schedule_Responce</p>
            <p>• <strong>ESP32 Client ID:</strong> esp32-watertank-controller-01</p>
            <p>• <strong>Broker:</strong> broker.hivemq.com:8884</p>
            <p>• <strong>Connection:</strong> {isConnected ? 'Active ✅' : 'Inactive ❌'}</p>
            <p>• <strong>Messages:</strong> {messageCount}</p>
          </div>
        </details>
      </div>
    </div>
  );
}
