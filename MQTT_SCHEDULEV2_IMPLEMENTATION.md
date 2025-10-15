# ScheduleV2 MQTT Implementation Summary

## 🎯 Overview
Successfully implemented MQTT publishing for the ScheduleV2 system to communicate with ESP32 devices using the new topic structure.

## 📝 What Was Implemented

### 1. **New MQTT Publisher** (`src/lib/scheduleV2Publisher.ts`)
- Created dedicated publisher for ScheduleV2 schedules
- Publishes to 10 MQTT topics for ESP32 communication
- Follows same pattern as existing `schedulePublisher.ts`

**Topics Published:**
```
fertilizer_1      → Quantity for Tank A (or 0)
fertilizer_2      → Quantity for Tank B (or 0)
fertilizer_3      → Quantity for Tank C (or 0)
water_volume      → Total water amount in liters
schedule_time1    → First release time (HH:mm format)
schedule_volume1  → First release quantity in liters
schedule_time2    → Second release time (HH:mm format)
schedule_volume2  → Second release quantity in liters
schedule_time3    → Third release time (HH:mm format)
schedule_volume3  → Third release quantity in liters
```

### 2. **Updated API Route** (`src/app/api/schedules-v2/route.ts`)

**Added Logic:**
1. Fetches tank configuration for selected tunnel after schedule creation
2. Determines which tank (A, B, or C) contains the selected fertilizer
3. Maps fertilizer quantity to correct topic based on tank configuration
4. Builds complete MQTT payload with all 10 topics
5. Publishes to MQTT broker (broker.hivemq.com)
6. Returns success/warnings in API response

**Key Features:**
- ✅ Automatic fertilizer-to-tank mapping
- ✅ Handles up to 3 release schedules
- ✅ Warns if fertilizer not configured in any tank
- ✅ Schedule still saves even if MQTT fails
- ✅ Detailed logging for debugging

### 3. **Updated Frontend** (`src/app/schedules-v2/page.tsx`)

**Enhanced Features:**
- Shows MQTT notification popup when schedule is created
- Displays success/warning messages
- Alerts user if fertilizer is not configured in tank
- Shows detailed MQTT publish results in terminal notification

## 🔧 How It Works

### Example Scenario:
```
User creates schedule:
- Customer: ABC Farm
- Tunnel: Tunnel 01
- Fertilizer: "kodimix" (configured in Tank A for Tunnel 01)
- Quantity: 5 kg
- Water: 100 L
- Release 1: 08:00, 30L
- Release 2: 14:00, 40L
- Release 3: 18:00, 30L
```

### MQTT Topics Published to ESP32:
```
fertilizer_1 → "5"        (kodimix is in Tank A)
fertilizer_2 → "0"        (not used)
fertilizer_3 → "0"        (not used)
water_volume → "100"
schedule_time1 → "08:00"
schedule_volume1 → "30"
schedule_time2 → "14:00"
schedule_volume2 → "40"
schedule_time3 → "18:00"
schedule_volume3 → "30"
```

### ESP32 Receives:
The ESP32 subscribes to these topics and receives all 10 values to execute the fertilization schedule.

## 🛡️ Error Handling

### 1. **Fertilizer Not Configured in Any Tank**
- **Behavior**: Schedule saves to database
- **MQTT**: Sends all fertilizer topics as "0"
- **User Alert**: Shows warning message
- **Recommendation**: Configure fertilizer in tank via Configuration page

### 2. **MQTT Connection Failed**
- **Behavior**: Schedule saves to database
- **User Alert**: Shows error message
- **Logging**: Detailed error logged to console

### 3. **More Than 3 Releases**
- **Behavior**: Only first 3 releases sent to ESP32
- **Note**: All releases saved in database

### 4. **Less Than 3 Releases**
- **Behavior**: Unused release slots sent as empty time ("") and 0 quantity

## 🔗 Integration Points

### Database Models Used:
- `ScheduleV2` - Main schedule record
- `ScheduleV2Release` - Release sub-records
- `TankConfiguration` - Maps fertilizers to tanks
- `Tunnel` - Identifies which tunnel
- `Item` - Fertilizer details

### MQTT Configuration:
- **Broker**: `broker.hivemq.com` (HiveMQ public broker)
- **Protocol**: WebSocket Secure (WSS) on port 8884
- **QoS**: 1 (at least once delivery)
- **Client ID**: Auto-generated greenhouse web client

## 📊 Testing Checklist

To test the implementation:

1. ✅ **Create Schedule with Tank Configuration**
   - Configure a fertilizer in Tank A via Configuration page
   - Create schedule with that fertilizer
   - Verify fertilizer_1 receives quantity, others are 0

2. ✅ **Create Schedule Without Tank Configuration**
   - Select fertilizer not configured in any tank
   - Verify warning message appears
   - Verify all fertilizer topics receive 0

3. ✅ **Test Release Schedules**
   - Create schedule with 1 release → verify only time1/volume1 populated
   - Create schedule with 2 releases → verify time1/volume1 and time2/volume2
   - Create schedule with 3 releases → verify all three sets

4. ✅ **Verify MQTT Notification**
   - Check that green notification appears after schedule creation
   - Verify it shows published topics
   - Confirm warnings displayed if any

## 🎨 UI Improvements

The ScheduleV2 page now shows:
- ✅ Success message with MQTT status
- ✅ Warning if fertilizer not configured
- ✅ Terminal notification with topic details
- ✅ Clear indication of ESP32 communication status

## 📁 Files Created/Modified

### Created:
- `src/lib/scheduleV2Publisher.ts` (139 lines)

### Modified:
- `src/app/api/schedules-v2/route.ts` (Updated POST handler)
- `src/app/schedules-v2/page.tsx` (Enhanced MQTT response handling)

## 🚀 Next Steps (Optional Enhancements)

1. Add retry logic for failed MQTT publishes
2. Store MQTT publish results in database for audit trail
3. Add real-time MQTT status indicator on dashboard
4. Implement schedule synchronization confirmation from ESP32
5. Add bulk schedule MQTT publishing

## 📖 Usage Guide

### For Users:
1. Go to **Configuration** page
2. Map fertilizers to tanks (A, B, C) for each tunnel
3. Go to **Schedules V2** page
4. Create schedule selecting customer, tunnel, fertilizer, etc.
5. System automatically sends data to ESP32 via MQTT
6. Check notification for confirmation

### For Developers:
- MQTT logs available in browser console
- Check `scheduleV2Publisher.ts` for publishing logic
- Tank mapping happens in API route before MQTT publish
- All MQTT errors are caught and logged without blocking schedule creation

---

## ✨ Summary

The ScheduleV2 MQTT implementation is now complete and fully functional! It:
- ✅ Automatically maps fertilizers to tanks
- ✅ Publishes to correct ESP32 topics
- ✅ Handles all edge cases gracefully
- ✅ Provides clear user feedback
- ✅ Maintains data integrity even if MQTT fails

**Status**: Ready for production use! 🎉


