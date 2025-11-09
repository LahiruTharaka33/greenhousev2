<!-- 6a4fa9c6-951b-4651-b031-e4231c2c37dd 3aaace66-26a9-4b5a-9c02-1592e87216bf -->
# Apply Standard Mobile UI Pattern to Controller Page

## Overview

Update the controller page to follow the same mobile UI pattern used throughout the application, including the hamburger safe zone (`pl-[72px]`), sticky header, and consistent responsive spacing.

## Current State

The controller page currently uses:

- Simple padding: `px-3 sm:px-4 md:px-6`
- No hamburger safe zone
- No sticky header
- Different spacing pattern than other pages

## Target Pattern (Used in Customers, Inventory, etc.)

```jsx
// Sticky Header with Safe Zone
<div className="pl-[72px] pr-4 lg:pl-6 lg:pr-6 py-4 md:py-6 sticky top-0 z-30">

// Content with Safe Zone
<div className="pl-[72px] pr-4 lg:pl-6 lg:pr-6 py-4 md:py-6">
```

## Changes Required

### 1. Add Sticky Header

**File**: `src/app/controller/page.tsx`

Add a sticky header section with:

- Page title: "Greenhouse Monitoring"
- Subtitle: "Real-time sensor data and water tank status"
- Hamburger safe zone: `pl-[72px]`
- Sticky positioning with backdrop blur
- Consistent with other pages

### 2. Update Content Padding

Replace current padding pattern:

```jsx
// FROM:
<div className="px-3 pt-4 sm:px-4 sm:pt-5 md:px-6 md:pt-6">

// TO:
<div className="pl-[72px] pr-4 lg:pl-6 lg:pr-6 py-4 md:py-6">
```

### 3. Maintain Component Structure

Keep the existing components:

- WaterTankMonitor
- MQTTStatus  
- GreenhouseSensorDashboard

Just wrap them with the standard mobile UI pattern.

## Implementation Details

**Header Structure:**

```jsx
<div className="bg-white border-b border-gray-200 pl-[72px] pr-4 lg:pl-6 lg:pr-6 py-4 md:py-6 shadow-sm sticky top-0 z-30 backdrop-blur-sm bg-white/95">
  <div className="max-w-7xl mx-auto">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
          Greenhouse Monitoring
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 truncate">
          Real-time sensor data and water tank status
        </p>
      </div>
    </div>
  </div>
</div>
```

**Content Sections:**

```jsx
<div className="pl-[72px] pr-4 lg:pl-6 lg:pr-6 py-4 md:py-6">
  <div className="max-w-7xl mx-auto">
    {/* Component */}
  </div>
</div>
```

## Benefits

✅ **Consistency**: Matches all other pages in the app

✅ **Safe Zone**: Content doesn't hide under hamburger menu

✅ **Sticky Header**: Page title always visible

✅ **Professional**: Standard app-wide pattern

✅ **Mobile-Friendly**: Proper touch targets and spacing

### To-dos

- [ ] Remove green gradient app header from controller page
- [ ] Restructure WaterTankMonitor into compact cards (level, status, progress bar)
- [ ] Remove debug panel from WaterTankMonitor
- [ ] Simplify MQTT status to essential info only
- [ ] Remove debug panel from GreenhouseSensorDashboard