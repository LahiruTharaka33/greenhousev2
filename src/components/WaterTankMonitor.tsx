'use client';

import { useState, useEffect } from 'react';
import mqttService from '@/lib/mqtt';

interface WaterTankData {
  level: number | null;
  rawValue: number | null;
  timestamp: Date;
}

export default function WaterTankMonitor() {
  const [tankData, setTankData] = useState<WaterTankData>({
    level: null,
    rawValue: null,
    timestamp: new Date()
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('Never');
  const [dataReceived, setDataReceived] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousLevel, setPreviousLevel] = useState<number | null>(null);
  const [isRising, setIsRising] = useState(false);

  useEffect(() => {
    console.log('💧 WaterTankMonitor: Component mounted');
    
    const checkConnection = () => {
      const connected = mqttService.getConnectionStatus();
      
      if (connected !== isConnected) {
        console.log(`💧 MQTT Connection Status Changed: ${connected ? 'Connected ✅' : 'Disconnected ❌'}`);
      }
      
      setIsConnected(connected);
      
      // If MQTT disconnects, reset subscription state
      if (!connected && isSubscribed) {
        setIsSubscribed(false);
        setDataReceived(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    return () => {
      console.log('💧 WaterTankMonitor: Component unmounting');
      clearInterval(interval);
      if (isSubscribed) {
        mqttService.unsubscribe('esp32-watertank-controller-01/watertank_status');
      }
    };
  }, [isSubscribed]);

  const handleWaterTankData = (message: string) => {
    console.log('💧 📨 RAW MESSAGE RECEIVED:', message);
    
    try {
      let level: number | null = null;
      let rawValue: number | null = null;
      
      // Try to parse as JSON first
      try {
        const data = JSON.parse(message);
        // Check if it's a simple number in the JSON parsing result (e.g. "196") or an object
        if (typeof data === 'number') {
           rawValue = data;
        } else if (typeof data === 'object' && data !== null) {
           console.log('💧 ✅ Parsed JSON data:', data);
           if (data.level !== undefined && data.level !== null) {
             rawValue = parseFloat(data.level);
           }
        }
      } catch (e) {
        // If JSON parse fails, try to parse the raw string as a number
        const parsed = parseFloat(message);
        if (!isNaN(parsed)) {
          rawValue = parsed;
        }
      }

      console.log('💧 📏 Extracted Raw Value:', rawValue);

      if (rawValue !== null) {
        // If value is > 100, assume it's CM and convert to %
        // Assuming Max Tank Height is 200cm. 
        // You can adjust MAX_TANK_HEIGHT as needed.
        const MAX_TANK_HEIGHT = 200; 
        
        if (rawValue > 100) {
           // Logic: Raw Value is Height in CM
           level = (rawValue / MAX_TANK_HEIGHT) * 100;
           // Cap at 100%
           if (level > 100) level = 100;
        } else {
           // Value is likely already a percentage
           level = rawValue;
        }

        console.log(`💧 📊 Calculated Level: ${level?.toFixed(2)}% (from raw: ${rawValue})`);
        
        if (level !== null && level >= 0) {
          if (previousLevel !== null) {
            setIsRising(level > previousLevel);
          }
          setPreviousLevel(level);
          
          setTankData({
            level,
            rawValue,
            timestamp: new Date()
          });
          
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 2000);
          
          setDataReceived(true);
          const now = new Date();
          setLastUpdate(now.toLocaleTimeString());
          
          console.log(`💧 ✅ Updated at ${now.toLocaleTimeString()}`);
        }
      }
    } catch (error) {
      console.error('💧 ❌ Error parsing water tank data:', error);
    }
  };

  const getLevelColor = (level: number | null) => {
    if (level === null) return '#9CA3AF';
    if (level < 30) return '#EF4444';
    if (level < 70) return '#F59E0B';
    return '#3B82F6';
  };

  const getLevelStatus = (level: number | null) => {
    if (level === null) return 'No Data';
    if (level < 30) return 'Low';
    if (level < 70) return 'Medium';
    return 'Good';
  };

  const getLevelStatusColor = (level: number | null) => {
    if (level === null) return 'text-gray-400';
    if (level < 30) return 'text-red-600';
    if (level < 70) return 'text-yellow-600';
    return 'text-blue-600';
  };

  const handleSubscribe = () => {
    if (!isConnected) {
      console.warn('💧 Cannot subscribe: MQTT not connected');
      return;
    }
    
    console.log('💧 User manually subscribing to "esp32-watertank-controller-01/watertank_status" topic...');
    const subscribed = mqttService.subscribe('esp32-watertank-controller-01/watertank_status', handleWaterTankData);
    if (subscribed) {
      console.log('💧 Successfully subscribed to "esp32-watertank-controller-01/watertank_status" topic ✅');
      setIsSubscribed(true);
    } else {
      console.warn('💧 Failed to subscribe to "esp32-watertank-controller-01/watertank_status" topic ❌');
    }
  };

  const handleUnsubscribe = () => {
    console.log('💧 User manually unsubscribing from "esp32-watertank-controller-01/watertank_status" topic...');
    mqttService.unsubscribe('esp32-watertank-controller-01/watertank_status');
    setIsSubscribed(false);
    setDataReceived(false);
    setLastUpdate('Never');
    console.log('💧 Unsubscribed from "esp32-watertank-controller-01/watertank_status" topic ✅');
  };

  return (
    <div className="space-y-3">
      {/* Animated Tank - Centered */}
      <div className="bg-white rounded-lg shadow-md p-4 flex justify-center">
        <div className="relative">
          <svg 
            width="200" 
            height="350" 
            viewBox="0 0 200 350" 
            className="drop-shadow-lg w-[160px] h-[280px] sm:w-[180px] sm:h-[315px] md:w-[200px] md:h-[350px]"
          >
            <defs>
              <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: getLevelColor(tankData.level), stopOpacity: 0.6 }} />
                <stop offset="50%" style={{ stopColor: getLevelColor(tankData.level), stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: getLevelColor(tankData.level), stopOpacity: 1 }} />
              </linearGradient>
              
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
              
              <radialGradient id="ripple">
                <stop offset="0%" style={{ stopColor: 'white', stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: 'white', stopOpacity: 0 }} />
              </radialGradient>
              
              <linearGradient id="glassShine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: 'white', stopOpacity: 0 }} />
                <stop offset="50%" style={{ stopColor: 'white', stopOpacity: 0.4 }} />
                <stop offset="100%" style={{ stopColor: 'white', stopOpacity: 0 }} />
              </linearGradient>
              
              <linearGradient id="reflection" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'white', stopOpacity: 0.2 }} />
                <stop offset="100%" style={{ stopColor: 'white', stopOpacity: 0 }} />
              </linearGradient>
              
              <filter id="waterShimmer">
                <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise">
                  <animate attributeName="baseFrequency" values="0.02;0.025;0.02" dur="4s" repeatCount="indefinite" />
                </feTurbulence>
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
              </filter>
            </defs>
            
            <rect x="40" y="50" width="120" height="250" rx="10" fill="rgba(255, 255, 255, 0.1)" stroke="#94A3B8" strokeWidth="3" opacity="0.7" />
            <rect x="43" y="53" width="114" height="244" rx="8" fill="none" stroke="rgba(0, 0, 0, 0.1)" strokeWidth="2" />
            <rect x="35" y="300" width="130" height="30" rx="5" fill="#475569" stroke="#334155" strokeWidth="2" />
            <ellipse cx="100" cy="305" rx="60" ry="8" fill="rgba(0, 0, 0, 0.2)" />
            
            <rect
              x="43"
              y={50 + (250 * (1 - (tankData.level || 0) / 100))}
              width="114"
              height={250 * ((tankData.level || 0) / 100)}
              rx="8"
              fill="url(#waterGradient)"
              filter="url(#waterShimmer)"
              className="transition-all duration-[2000ms] ease-out"
              style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            />
            
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
            
            {isAnimating && isRising && tankData.level !== null && tankData.level > 10 && (
              <>
                {[...Array(8)].map((_, i) => {
                  const startY = 50 + (250 * (1 - tankData.level! / 100)) + 50 + (i * 25);
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
                      <animate attributeName="cy" from={startY} to={50 + (250 * (1 - tankData.level! / 100))} dur={`${1.5 + Math.random()}s`} begin={`${i * 0.2}s`} repeatCount="1" />
                      <animate attributeName="opacity" values="0;0.8;0.8;0" dur={`${1.5 + Math.random()}s`} begin={`${i * 0.2}s`} repeatCount="1" />
                      <animate attributeName="cx" values={`${x};${x + (Math.random() - 0.5) * 10};${x}`} dur={`${1.5 + Math.random()}s`} begin={`${i * 0.2}s`} repeatCount="1" />
                    </circle>
                  );
                })}
              </>
            )}
            
            {tankData.level !== null && tankData.level > 0 && (
              <>
                <rect x="43" y={50 + (250 * (1 - tankData.level / 100)) - 15} width="114" height="30" fill="url(#wave1)" className="transition-all duration-[2000ms] ease-out" />
                <rect x="43" y={50 + (250 * (1 - tankData.level / 100)) - 15} width="114" height="30" fill="url(#wave2)" className="transition-all duration-[2000ms] ease-out" />
              </>
            )}
            
            {isAnimating && tankData.level !== null && tankData.level > 0 && (
              <>
                <ellipse cx="100" cy={50 + (250 * (1 - tankData.level / 100))} rx="0" ry="0" fill="url(#ripple)" opacity="0.6">
                  <animate attributeName="rx" from="0" to="50" dur="1.5s" repeatCount="1" />
                  <animate attributeName="ry" from="0" to="10" dur="1.5s" repeatCount="1" />
                  <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="1" />
                </ellipse>
                <ellipse cx="100" cy={50 + (250 * (1 - tankData.level / 100))} rx="0" ry="0" fill="url(#ripple)" opacity="0.4">
                  <animate attributeName="rx" from="0" to="40" dur="1.8s" begin="0.3s" repeatCount="1" />
                  <animate attributeName="ry" from="0" to="8" dur="1.8s" begin="0.3s" repeatCount="1" />
                  <animate attributeName="opacity" from="0.4" to="0" dur="1.8s" begin="0.3s" repeatCount="1" />
                </ellipse>
              </>
            )}
            
            <rect x="48" y="60" width="35" height="230" rx="5" fill="url(#glassShine)" />
            
            {[25, 50, 75].map((percent) => (
              <g key={percent}>
                <line x1="35" y1={50 + (250 * (1 - percent / 100))} x2="40" y2={50 + (250 * (1 - percent / 100))} stroke="#64748B" strokeWidth="2" />
                <text x="25" y={50 + (250 * (1 - percent / 100)) + 5} fontSize="12" fill="#64748B" textAnchor="end">{percent}%</text>
              </g>
            ))}
            
            <text x="100" y="30" fontSize="16" fontWeight="bold" fill="#1E293B" textAnchor="middle" className="dark:fill-gray-300">Water Tank</text>
          </svg>
          
          {isAnimating && (
            <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
          )}
        </div>
      </div>

      {/* Compact Info Cards - 2 Column Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Water Level Card */}
        <div className="bg-white rounded-lg shadow-md p-3">
          <div className="text-xs text-gray-500 mb-1">Water Level</div>
          <div className={`text-2xl font-bold ${getLevelStatusColor(tankData.level)}`}>
            {tankData.level !== null ? `${tankData.level.toFixed(1)}%` : '--%'}
            {tankData.rawValue !== null && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({tankData.rawValue})
              </span>
            )}
          </div>
          <div className={`text-xs font-medium mt-1 ${getLevelStatusColor(tankData.level)}`}>
            {getLevelStatus(tankData.level)}
          </div>
        </div>

        {/* Connection Status Card */}
        <div className="bg-white rounded-lg shadow-md p-3">
          <div className="text-xs text-gray-500 mb-1">Status</div>
          <div className="flex items-center gap-1.5 mb-1">
            <div className={`w-2 h-2 rounded-full ${isConnected && dataReceived ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className={`text-sm font-medium ${isConnected && dataReceived ? 'text-green-600' : 'text-gray-600'}`}>
              {isConnected && dataReceived ? 'Active' : 'Waiting'}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {lastUpdate}
          </div>
        </div>
      </div>

      {/* Progress Bar Card - Full Width */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-600">Tank Capacity</span>
          <span className={`text-sm font-bold ${getLevelStatusColor(tankData.level)}`}>
            {tankData.level !== null ? `${tankData.level.toFixed(1)}%` : '--'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="h-4 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
            style={{
              width: `${tankData.level || 0}%`,
              backgroundColor: getLevelColor(tankData.level)
            }}
          >
            {tankData.level !== null && tankData.level > 15 && (
              <span className="text-[10px] font-bold text-white drop-shadow">
                {tankData.level.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Water Tank Connection Control */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Water Tank Connection</h3>
            <p className="text-xs text-gray-500 mt-0.5">Subscribe to watertank_status</p>
          </div>
          <div className={`w-2.5 h-2.5 rounded-full ${isSubscribed ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
        </div>
        
        {!isConnected ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
              <span className="text-xs text-yellow-700 leading-tight">
                Please connect to MQTT first using the MQTT Status panel below.
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="bg-gray-50 rounded-lg p-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Topic:</span>
                <span className="font-mono text-gray-900">esp32-watertank-controller-01/watertank_status</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1.5">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${isSubscribed ? 'text-green-600' : 'text-gray-600'}`}>
                  {isSubscribed ? 'Subscribed' : 'Not Subscribed'}
                </span>
              </div>
            </div>
            
            {!isSubscribed ? (
              <button
                onClick={handleSubscribe}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Connect to Water Tank
              </button>
            ) : (
              <button
                onClick={handleUnsubscribe}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Disconnect from Water Tank
              </button>
            )}
          </div>
        )}
      </div>

      {/* Connection Warning */}
      {!isConnected && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
            <span className="text-xs text-red-700 leading-tight">
              MQTT connection required. Please connect using MQTT Status panel.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
