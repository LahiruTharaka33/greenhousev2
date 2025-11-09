<!-- 6a4fa9c6-951b-4651-b031-e4231c2c37dd 529a201f-d9fb-4237-a714-888b18f51799 -->
# Add Water Tank Monitoring with Animation

## Overview

Enhance the existing WaterTankMonitor component with realistic water physics - adding fluid motion, ripples, bubbles, and natural water movement when the level changes.

## Implementation Steps

### 1. Create WaterTankMonitor Component

**File**: `src/components/WaterTankMonitor.tsx`

Create a new React component that:

- Subscribes to `watertank_status` MQTT topic (following the pattern in `GreenhouseSensorDashboard.tsx`)
- Parses incoming water level data (expecting JSON format like `{"level": 75}` or similar)
- Displays an animated SVG water tank with:
  - Tank container with transparent/semi-transparent walls
  - Animated water fill that rises/falls based on level percentage
  - Smooth CSS transitions for water level changes
  - Wave animation effect at water surface
  - Color coding: red (low <30%), yellow (medium 30-70%), blue (normal >70%)
- Shows current water level percentage
- Displays connection status and last update time
- Includes debug panel (similar to sensor dashboard)

### 2. Update Controller Page

**File**: `src/app/controller/page.tsx`

- Import the new `WaterTankMonitor` component
- Add it as the first section after the header (line ~51, before MQTTStatus)
- Ensure proper spacing and responsive layout

### 3. Styling Approach

- Use Tailwind CSS for layout and basic styling (consistent with existing components)
- Use inline SVG with CSS animations for the water tank
- Implement smooth transitions for water level changes
- Add wave animation using CSS keyframes
- Ensure mobile responsiveness

## Key Technical Details

**MQTT Integration Pattern** (from `GreenhouseSensorDashboard.tsx`):

- Use `mqttService` singleton from `@/lib/mqtt`
- Subscribe in `useEffect` hook
- Check connection status with interval
- Unsubscribe on component unmount

**Expected Data Format**:

Need to clarify with user what format the ESP32 sends, but will assume JSON like:

```json
{"level": 75, "client_id": "esp32-watertank-controller-01"}
```

**Animation Features**:

- SVG-based tank visualization (300-400px height)
- CSS transition for smooth level changes (duration: 1s)
- Sine wave animation at water surface
- Gradient fill for water (lighter at top, darker at bottom)
- Pulsing effect when receiving new data

## Files to Create/Modify

1. **Create**: `src/components/WaterTankMonitor.tsx` - Main component
2. **Modify**: `src/app/controller/page.tsx` - Add component to page

### To-dos

- [ ] Create WaterTankMonitor.tsx component with MQTT subscription and state management
- [ ] Implement animated SVG water tank with dynamic fill, wave effects, and color coding
- [ ] Add WaterTankMonitor component to controller page as first section