'use client';

import { useState, useEffect } from 'react';
import mqttService from '@/lib/mqtt';

interface NeoPixelControllerProps {
  className?: string;
}

interface Color {
  r: number;
  g: number;
  b: number;
}

const presetColors: { name: string; color: Color }[] = [
  { name: 'Red', color: { r: 255, g: 0, b: 0 } },
  { name: 'Green', color: { r: 0, g: 255, b: 0 } },
  { name: 'Blue', color: { r: 0, g: 0, b: 255 } },
  { name: 'Yellow', color: { r: 255, g: 255, b: 0 } },
  { name: 'Purple', color: { r: 255, g: 0, b: 255 } },
  { name: 'Cyan', color: { r: 0, g: 255, b: 255 } },
  { name: 'White', color: { r: 255, g: 255, b: 255 } },
  { name: 'Off', color: { r: 0, g: 0, b: 0 } },
];

export default function NeoPixelController({ className = '' }: NeoPixelControllerProps) {
  const [currentColor, setCurrentColor] = useState<Color>({ r: 0, g: 0, b: 0 });
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

  const setColor = (color: Color) => {
    if (!isConnected) {
      console.error('MQTT not connected');
      return;
    }

    const message = `${color.r},${color.g},${color.b}`;
    if (mqttService.publish('lights/neopixel', message)) {
      setCurrentColor(color);
    }
  };

  const handleColorChange = (component: keyof Color, value: string) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(0, Math.min(255, numValue));
    
    const newColor = { ...currentColor, [component]: clampedValue };
    setCurrentColor(newColor);
  };

  const applyCustomColor = () => {
    setColor(currentColor);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          NeoPixel Control
        </h3>
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
             title={isConnected ? 'Connected' : 'Disconnected'} />
      </div>
      
      <div className="space-y-4">
        {/* Current Color Display */}
        <div className="space-y-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Current Color:</label>
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg border-2 border-gray-300"
              style={{ backgroundColor: `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})` }}
            />
            <div className="text-sm">
              <div>R: {currentColor.r}</div>
              <div>G: {currentColor.g}</div>
              <div>B: {currentColor.b}</div>
            </div>
          </div>
        </div>

        {/* RGB Sliders */}
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm text-gray-600 dark:text-gray-400 flex justify-between">
              <span>Red</span>
              <span>{currentColor.r}</span>
            </label>
            <input
              type="range"
              min="0"
              max="255"
              value={currentColor.r}
              onChange={(e) => handleColorChange('r', e.target.value)}
              className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-gray-600 dark:text-gray-400 flex justify-between">
              <span>Green</span>
              <span>{currentColor.g}</span>
            </label>
            <input
              type="range"
              min="0"
              max="255"
              value={currentColor.g}
              onChange={(e) => handleColorChange('g', e.target.value)}
              className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-gray-600 dark:text-gray-400 flex justify-between">
              <span>Blue</span>
              <span>{currentColor.b}</span>
            </label>
            <input
              type="range"
              min="0"
              max="255"
              value={currentColor.b}
              onChange={(e) => handleColorChange('b', e.target.value)}
              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Apply Custom Color Button */}
        <button
          onClick={applyCustomColor}
          disabled={!isConnected}
          className={`w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors ${
            isConnected ? '' : 'opacity-50 cursor-not-allowed'
          }`}
        >
          Apply Custom Color
        </button>

        {/* Preset Colors */}
        <div className="space-y-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Preset Colors:</label>
          <div className="grid grid-cols-4 gap-2">
            {presetColors.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setColor(preset.color)}
                disabled={!isConnected}
                className={`p-3 rounded-lg text-xs font-medium transition-all hover:scale-105 ${
                  isConnected ? '' : 'opacity-50 cursor-not-allowed'
                }`}
                style={{ backgroundColor: `rgb(${preset.color.r}, ${preset.color.g}, ${preset.color.b})` }}
              >
                <span className={`
                  ${preset.color.r + preset.color.g + preset.color.b > 500 ? 'text-black' : 'text-white'}
                `}>
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
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
