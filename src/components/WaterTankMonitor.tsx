'use client';

import { useState, useEffect } from 'react';
import mqttService from '@/lib/mqtt';

interface WaterTankData {
  level: number | null;
  timestamp: Date;
}

export default function WaterTankMonitor() {
  const [tankData, setTankData] = useState<WaterTankData>({
    level: null,
    timestamp: new Date()
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('Never');
  const [dataReceived, setDataReceived] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [lastRawMessage, setLastRawMessage] = useState<string>('');
  const [showDebug, setShowDebug] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousLevel, setPreviousLevel] = useState<number | null>(null);
  const [isRising, setIsRising] = useState(false);

  useEffect(() => {
    console.log('💧 WaterTankMonitor: Component mounted');
    
    // Check MQTT connection status
    const checkConnection = () => {
      const connected = mqttService.getConnectionStatus();
      
      // Log connection status changes
      if (connected !== isConnected) {
        console.log(`💧 MQTT Connection Status Changed: ${connected ? 'Connected ✅' : 'Disconnected ❌'}`);
      }
      
      setIsConnected(connected);
      
      if (connected) {
        // Subscribe to water tank status topic
        console.log('💧 Attempting to subscribe to "watertank_status" topic...');
        const subscribed = mqttService.subscribe('watertank_status', handleWaterTankData);
        if (subscribed) {
          console.log('💧 Successfully subscribed to "watertank_status" topic ✅');
        } else {
          console.warn('💧 Failed to subscribe to "watertank_status" topic ❌');
        }
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    return () => {
      console.log('💧 WaterTankMonitor: Component unmounting, unsubscribing from watertank_status');
      clearInterval(interval);
      mqttService.unsubscribe('watertank_status');
    };
  }, []);

  const handleWaterTankData = (message: string) => {
    console.log('💧 📨 RAW MESSAGE RECEIVED on watertank_status:', message);
    setMessageCount(prev => prev + 1);
    setLastRawMessage(message);
    
    try {
      // Parse JSON message from ESP32
      const data = JSON.parse(message);
      console.log('💧 ✅ Parsed JSON data:', data);
      
      const level = data.level !== undefined && data.level !== null ? parseFloat(data.level) : null;
      
      if (level !== null && level >= 0 && level <= 100) {
        console.log('💧 📊 Setting water tank data:', { level });
        
        // Determine if water is rising or falling
        if (previousLevel !== null) {
          setIsRising(level > previousLevel);
        }
        setPreviousLevel(level);
        
        setTankData({
          level,
          timestamp: new Date()
        });
        
        // Trigger animation pulse
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 2000);
        
        setDataReceived(true);
        const now = new Date();
        setLastUpdate(now.toLocaleTimeString());
        
        console.log(`💧 ✅ Water tank data updated successfully at ${now.toLocaleTimeString()}`);
      } else {
        console.warn('💧 ⚠️ Invalid water level value:', level);
      }
    } catch (error) {
      console.error('💧 ❌ Error parsing water tank data:', error);
      console.error('💧 ❌ Problematic message:', message);
    }
  };

  const getLevelColor = (level: number | null) => {
    if (level === null) return '#9CA3AF'; // gray-400
    if (level < 30) return '#EF4444'; // red-500
    if (level < 70) return '#F59E0B'; // yellow-500
    return '#3B82F6'; // blue-500
  };

  const getLevelStatus = (level: number | null) => {
    if (level === null) return 'No Data';
    if (level < 30) return 'Low';
    if (level < 70) return 'Medium';
    return 'Good';
  };

  const getLevelStatusColor = (level: number | null) => {
    if (level === null) return 'text-gray-400';
    if (level < 30) return 'text-red-600 dark:text-red-400';
    if (level < 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main Water Tank Card */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-lg p-4 sm:p-6 border border-blue-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-6">
          {/* Tank Visualization */}
          <div className="flex-shrink-0">
            <div className="relative">
              {/* Animated Water Tank SVG */}
              <svg 
                width="200" 
                height="350" 
                viewBox="0 0 200 350" 
                className="drop-shadow-lg w-[160px] h-[280px] sm:w-[180px] sm:h-[315px] md:w-[200px] md:h-[350px]"
              >
                <defs>
                  {/* Water gradient with depth effect */}
                  <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: getLevelColor(tankData.level), stopOpacity: 0.6 }} />
                    <stop offset="50%" style={{ stopColor: getLevelColor(tankData.level), stopOpacity: 0.8 }} />
                    <stop offset="100%" style={{ stopColor: getLevelColor(tankData.level), stopOpacity: 1 }} />
                  </linearGradient>
                  
                  {/* Realistic wave pattern with multiple layers */}
                  <pattern id="wave1" x="0" y="0" width="200" height="30" patternUnits="userSpaceOnUse">
                    <path d="M0,15 Q25,8 50,15 T100,15 T150,15 T200,15 V30 H0 Z" fill="url(#waterGradient)" opacity="0.4">
                      <animate
                        attributeName="d"
                        values="M0,15 Q25,8 50,15 T100,15 T150,15 T200,15 V30 H0 Z;
                                M0,15 Q25,22 50,15 T100,15 T150,15 T200,15 V30 H0 Z;
                                M0,15 Q25,8 50,15 T100,15 T150,15 T200,15 V30 H0 Z"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </path>
                  </pattern>
                  
                  <pattern id="wave2" x="0" y="0" width="200" height="30" patternUnits="userSpaceOnUse">
                    <path d="M0,15 Q30,10 60,15 T120,15 T180,15 T200,15 V30 H0 Z" fill="url(#waterGradient)" opacity="0.3">
                      <animate
                        attributeName="d"
                        values="M0,15 Q30,10 60,15 T120,15 T180,15 T200,15 V30 H0 Z;
                                M0,15 Q30,20 60,15 T120,15 T180,15 T200,15 V30 H0 Z;
                                M0,15 Q30,10 60,15 T120,15 T180,15 T200,15 V30 H0 Z"
                        dur="2.5s"
                        repeatCount="indefinite"
                      />
                    </path>
                  </pattern>
                  
                  {/* Ripple effect for water movement */}
                  <radialGradient id="ripple">
                    <stop offset="0%" style={{ stopColor: 'white', stopOpacity: 0.3 }} />
                    <stop offset="100%" style={{ stopColor: 'white', stopOpacity: 0 }} />
                  </radialGradient>
                  
                  {/* Glass shine effect */}
                  <linearGradient id="glassShine" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: 'white', stopOpacity: 0 }} />
                    <stop offset="50%" style={{ stopColor: 'white', stopOpacity: 0.4 }} />
                    <stop offset="100%" style={{ stopColor: 'white', stopOpacity: 0 }} />
                  </linearGradient>
                  
                  {/* Reflection gradient */}
                  <linearGradient id="reflection" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'white', stopOpacity: 0.2 }} />
                    <stop offset="100%" style={{ stopColor: 'white', stopOpacity: 0 }} />
                  </linearGradient>
                  
                  {/* Filter for realistic water shimmer */}
                  <filter id="waterShimmer">
                    <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise">
                      <animate attributeName="baseFrequency" values="0.02;0.025;0.02" dur="4s" repeatCount="indefinite" />
                    </feTurbulence>
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
                  </filter>
                </defs>
                
                {/* Tank container (glass) with realistic edges */}
                <rect
                  x="40"
                  y="50"
                  width="120"
                  height="250"
                  rx="10"
                  fill="rgba(255, 255, 255, 0.1)"
                  stroke="#94A3B8"
                  strokeWidth="3"
                  opacity="0.7"
                />
                
                {/* Inner shadow for depth */}
                <rect
                  x="43"
                  y="53"
                  width="114"
                  height="244"
                  rx="8"
                  fill="none"
                  stroke="rgba(0, 0, 0, 0.1)"
                  strokeWidth="2"
                />
                
                {/* Tank base */}
                <rect
                  x="35"
                  y="300"
                  width="130"
                  height="30"
                  rx="5"
                  fill="#475569"
                  stroke="#334155"
                  strokeWidth="2"
                />
                
                {/* Base shadow */}
                <ellipse
                  cx="100"
                  cy="305"
                  rx="60"
                  ry="8"
                  fill="rgba(0, 0, 0, 0.2)"
                />
                
                {/* Main water body with shimmer effect */}
                <rect
                  x="43"
                  y={50 + (250 * (1 - (tankData.level || 0) / 100))}
                  width="114"
                  height={250 * ((tankData.level || 0) / 100)}
                  rx="8"
                  fill="url(#waterGradient)"
                  filter="url(#waterShimmer)"
                  className="transition-all duration-[2000ms] ease-out"
                  style={{
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                />
                
                {/* Water reflection/highlight */}
                {tankData.level !== null && tankData.level > 5 && (
                  <rect
                    x="43"
                    y={50 + (250 * (1 - tankData.level / 100))}
                    width="114"
                    height={Math.min(60, 250 * (tankData.level / 100))}
                    rx="8"
                    fill="url(#reflection)"
                    className="transition-all duration-[2000ms] ease-out"
                  />
                )}
                
                {/* Animated bubbles when water is rising */}
                {isAnimating && isRising && tankData.level !== null && tankData.level > 10 && (
                  <>
                    {[...Array(8)].map((_, i) => {
                      const startY = 50 + (250 * (1 - tankData.level / 100)) + 50 + (i * 25);
                      const x = 50 + (i % 3) * 30 + Math.random() * 20;
                      return (
                        <circle
                          key={`bubble-${i}`}
                          cx={x}
                          cy={startY}
                          r={2 + Math.random() * 3}
                          fill="rgba(255, 255, 255, 0.6)"
                          opacity="0"
                        >
                          <animate
                            attributeName="cy"
                            from={startY}
                            to={50 + (250 * (1 - tankData.level / 100))}
                            dur={`${1.5 + Math.random()}s`}
                            begin={`${i * 0.2}s`}
                            repeatCount="1"
                          />
                          <animate
                            attributeName="opacity"
                            values="0;0.8;0.8;0"
                            dur={`${1.5 + Math.random()}s`}
                            begin={`${i * 0.2}s`}
                            repeatCount="1"
                          />
                          <animate
                            attributeName="cx"
                            values={`${x};${x + (Math.random() - 0.5) * 10};${x}`}
                            dur={`${1.5 + Math.random()}s`}
                            begin={`${i * 0.2}s`}
                            repeatCount="1"
                          />
                        </circle>
                      );
                    })}
                  </>
                )}
                
                {/* Multi-layered wave effects at water surface */}
                {tankData.level !== null && tankData.level > 0 && (
                  <>
                    <rect
                      x="43"
                      y={50 + (250 * (1 - tankData.level / 100)) - 15}
                      width="114"
                      height="30"
                      fill="url(#wave1)"
                      className="transition-all duration-[2000ms] ease-out"
                    />
                    <rect
                      x="43"
                      y={50 + (250 * (1 - tankData.level / 100)) - 15}
                      width="114"
                      height="30"
                      fill="url(#wave2)"
                      className="transition-all duration-[2000ms] ease-out"
                    />
                  </>
                )}
                
                {/* Ripples when water level changes */}
                {isAnimating && tankData.level !== null && tankData.level > 0 && (
                  <>
                    <ellipse
                      cx="100"
                      cy={50 + (250 * (1 - tankData.level / 100))}
                      rx="0"
                      ry="0"
                      fill="url(#ripple)"
                      opacity="0.6"
                    >
                      <animate
                        attributeName="rx"
                        from="0"
                        to="50"
                        dur="1.5s"
                        repeatCount="1"
                      />
                      <animate
                        attributeName="ry"
                        from="0"
                        to="10"
                        dur="1.5s"
                        repeatCount="1"
                      />
                      <animate
                        attributeName="opacity"
                        from="0.6"
                        to="0"
                        dur="1.5s"
                        repeatCount="1"
                      />
                    </ellipse>
                    <ellipse
                      cx="100"
                      cy={50 + (250 * (1 - tankData.level / 100))}
                      rx="0"
                      ry="0"
                      fill="url(#ripple)"
                      opacity="0.4"
                    >
                      <animate
                        attributeName="rx"
                        from="0"
                        to="40"
                        dur="1.8s"
                        begin="0.3s"
                        repeatCount="1"
                      />
                      <animate
                        attributeName="ry"
                        from="0"
                        to="8"
                        dur="1.8s"
                        begin="0.3s"
                        repeatCount="1"
                      />
                      <animate
                        attributeName="opacity"
                        from="0.4"
                        to="0"
                        dur="1.8s"
                        begin="0.3s"
                        repeatCount="1"
                      />
                    </ellipse>
                  </>
                )}
                
                {/* Glass shine overlay - enhanced */}
                <rect
                  x="48"
                  y="60"
                  width="35"
                  height="230"
                  rx="5"
                  fill="url(#glassShine)"
                />
                
                {/* Measurement lines */}
                {[25, 50, 75].map((percent) => (
                  <g key={percent}>
                    <line
                      x1="35"
                      y1={50 + (250 * (1 - percent / 100))}
                      x2="40"
                      y2={50 + (250 * (1 - percent / 100))}
                      stroke="#64748B"
                      strokeWidth="2"
                    />
                    <text
                      x="25"
                      y={50 + (250 * (1 - percent / 100)) + 5}
                      fontSize="12"
                      fill="#64748B"
                      textAnchor="end"
                    >
                      {percent}%
                    </text>
                  </g>
                ))}
                
                {/* Tank label */}
                <text
                  x="100"
                  y="30"
                  fontSize="16"
                  fontWeight="bold"
                  fill="#1E293B"
                  textAnchor="middle"
                  className="dark:fill-gray-300"
                >
                  Water Tank
                </text>
              </svg>
              
              {/* Pulsing indicator when receiving data */}
              {isAnimating && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
              )}
            </div>
          </div>
          
          {/* Tank Information */}
          <div className="flex-1 space-y-3 sm:space-y-4 w-full max-w-full lg:max-w-none">
            <div className="text-center lg:text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                Water Tank Status
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">
                ESP32 Water Tank Controller
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 break-all">
                (esp32-watertank-controller-01)
              </p>
            </div>
            
            {/* Level Display */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Current Level</span>
                <span className={`text-xs sm:text-sm font-bold ${getLevelStatusColor(tankData.level)}`}>
                  {getLevelStatus(tankData.level)}
                </span>
              </div>
              <div className={`text-4xl sm:text-5xl font-bold text-center lg:text-left ${getLevelStatusColor(tankData.level)}`}>
                {tankData.level !== null ? `${tankData.level.toFixed(1)}%` : '--%'}
              </div>
              
              {/* Progress bar */}
              {tankData.level !== null && (
                <div className="mt-3 sm:mt-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 sm:h-3">
                    <div
                      className="h-2.5 sm:h-3 rounded-full transition-all duration-1000 ease-in-out"
                      style={{
                        width: `${tankData.level}%`,
                        backgroundColor: getLevelColor(tankData.level)
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Status Indicators */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 sm:p-3 shadow-sm">
                <div className="flex items-center space-x-1.5 sm:space-x-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected && dataReceived ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Connection</span>
                </div>
                <span className={`text-xs sm:text-sm font-medium ${
                  isConnected && dataReceived
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {isConnected && dataReceived ? 'Active' : 'Waiting...'}
                </span>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 sm:p-3 shadow-sm">
                <div className="flex items-center space-x-1.5 sm:space-x-2 mb-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Last Update</span>
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate block">
                  {lastUpdate}
                </span>
              </div>
            </div>
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
                <span className="ml-2 font-mono text-blue-600">watertank_status</span>
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
                <li>Check browser console (F12) for logs starting with 💧</li>
                <li>Verify ESP32 is publishing to "watertank_status" topic</li>
                <li>Expected format: {`{"level": 75}`}</li>
                <li>Both devices must use broker.hivemq.com</li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Connection Warning */}
      {!isConnected && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-sm text-red-700 dark:text-red-300">
              MQTT connection required to receive water tank data. Please connect using the MQTT Status panel.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

