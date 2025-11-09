<!-- 6a4fa9c6-951b-4651-b031-e4231c2c37dd bca996ad-3256-4d8f-9bfa-e70701449204 -->
# Add Water Tank Monitor to User Controller Page

## Overview
Add the WaterTankMonitor component to the user controller page (`src/app/user/controller/page.tsx`) so users can see the animated water tank visualization that fills based on real-time data from the ESP32's `"watertank_status"` MQTT topic.

## Current State
- **Admin page**: Already has WaterTankMonitor ✅
- **User page**: Missing WaterTankMonitor ❌

## Changes Required

### File: `src/app/user/controller/page.tsx`

**1. Import WaterTankMonitor**
Add import at the top:
```tsx
import WaterTankMonitor from '@/components/WaterTankMonitor';
```

**2. Add Water Tank Section**
Insert after the header, before MQTT Status (around line 38):
```tsx
{/* Water Tank Monitor */}
<div className="mb-4 sm:mb-6 lg:mb-8">
  <WaterTankMonitor />
</div>
```

## How It Works
The WaterTankMonitor component:
- Subscribes to `"watertank_status"` MQTT topic
- Expects JSON: `{"level": 0-100}`
- Animates water filling from 0% (empty) to 100% (full)
- Shows realistic water physics (waves, bubbles, ripples)
- Color-coded: Red (<30%), Yellow (30-70%), Blue (>70%)

This matches your ESP32 implementation perfectly!

### To-dos

- [ ] Import WaterTankMonitor component in user controller page
- [ ] Add WaterTankMonitor section at the top of user controller page content