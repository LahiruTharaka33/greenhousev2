'use client';

import { useState, useEffect } from 'react';
import { PublishSummary } from '@/lib/schedulePublisher';

interface MQTTTerminalNotificationProps {
  publishResult: PublishSummary | null;
  onClose: () => void;
  show: boolean;
}

export default function MQTTTerminalNotification({ 
  publishResult, 
  onClose, 
  show 
}: MQTTTerminalNotificationProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Auto-hide after 15 seconds
  useEffect(() => {
    if (show && publishResult) {
      const timer = setTimeout(() => {
        onClose();
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [show, publishResult, onClose]);

  if (!show || !publishResult) return null;

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full">
      <div className="bg-gray-900 text-green-400 rounded-lg shadow-2xl border border-gray-700 font-mono text-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-300 ml-2">ESP32 MQTT Terminal</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white text-xs"
            >
              {isExpanded ? '−' : '+'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Terminal Content */}
        {isExpanded && (
          <div className="p-4 max-h-96 overflow-y-auto">
            {/* Header Info */}
            <div className="mb-3">
              <div className="text-gray-500">
                [{formatTime(publishResult.timestamp)}] Publishing schedules to ESP32...
              </div>
              <div className={`font-bold ${publishResult.overallSuccess ? 'text-green-400' : 'text-red-400'}`}>
                {publishResult.overallSuccess ? '✅ SUCCESS' : '❌ PARTIAL/FAILED'}
              </div>
            </div>

            {/* Summary */}
            <div className="mb-4 text-gray-300">
              <div>📊 Total Schedules: {publishResult.totalSchedules}</div>
              <div>📅 Unique Dates: {publishResult.uniqueDates}</div>
              <div>🔗 MQTT Broker: HiveMQ (wss://broker.hivemq.com:8884)</div>
            </div>

            {/* Detailed Results */}
            {publishResult.publishResults.map((dateResult, index) => (
              <div key={index} className="mb-4 border-l-2 border-gray-600 pl-3">
                <div className="text-blue-400 font-bold">
                  📅 Date: {dateResult.date} at {dateResult.time}
                </div>
                
                {dateResult.results.map((result, resultIndex) => (
                  <div key={resultIndex} className="ml-2 flex items-center space-x-2">
                    <span className={result.success ? 'text-green-400' : 'text-red-400'}>
                      {result.success ? '✅' : '❌'}
                    </span>
                    <span className="text-gray-300">
                      {result.topic}
                    </span>
                    <span className="text-gray-500">→</span>
                    <span className="text-yellow-300">
                      "{result.message}"
                    </span>
                    {result.error && (
                      <span className="text-red-400 text-xs">
                        ({result.error})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}

            {/* Connection Status */}
            <div className="mt-4 pt-3 border-t border-gray-700">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${publishResult.overallSuccess ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-400 text-xs">
                  {publishResult.overallSuccess 
                    ? 'All data sent to ESP32 successfully' 
                    : 'Some data failed to send to ESP32'
                  }
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-3 text-gray-500 text-xs">
              ESP32 should receive fertilizer schedule data on topics:
              scheduled_date, scheduled_time, fertilizer_1, fertilizer_2, fertilizer_3
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
