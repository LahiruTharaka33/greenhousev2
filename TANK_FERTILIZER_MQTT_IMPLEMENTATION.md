# Tank-Fertilizer MQTT Publishing System - Implementation Summary

## Overview
This implementation integrates tank configurations with MQTT publishing. When a user selects a fertilizer and quantity in the schedules page, the system publishes the quantity to the correct MQTT topic based on which tank contains that fertilizer.

## Key Features

### 1. Tank-to-Topic Mapping
- **Tank A** → publishes to `fertilizer_1` topic
- **Tank B** → publishes to `fertilizer_2` topic
- **Tank C** → publishes to `fertilizer_3` topic

### 2. Duplicate Fertilizer Prevention
- Each fertilizer can only be assigned to one tank per tunnel
- The system validates both at the backend and frontend levels
- Clear error messages guide users to fix configuration issues

### 3. Schedule Validation
- Before creating a schedule, the system checks if the selected fertilizer is configured in a tank
- If not configured, the system prevents schedule creation and displays an error:
  > "Fertilizer '[Name]' is not configured in any tank for this tunnel. Please configure it in the Configuration page first."

## Implementation Details

### Files Created
1. **`src/utils/tankMapping.ts`**
   - Utility functions for tank-topic mapping
   - `getTankTopicFromName(tankName)` - Maps "Tank A" → "fertilizer_1"
   - `getTankNameFromTopic(topic)` - Reverse mapping
   - Helper functions for all tank names and topics

### Files Modified

#### 1. `src/app/api/configuration/tanks/route.ts`
- **Added**: Duplicate fertilizer validation
- **Behavior**: Returns 409 Conflict error if fertilizer is already assigned to another tank
- **Error Message**: "This fertilizer '[Name]' is already assigned to [Tank X]. Each fertilizer can only be assigned to one tank."

#### 2. `src/lib/scheduleV2Publisher.ts`
- **Added**: `publishScheduleV2WithTankMapping()` method
- **Features**:
  - Finds which tank contains the specified fertilizer
  - Publishes quantity to the correct `fertilizer_X` topic
  - Returns detailed error if fertilizer not found in any tank
- **Message Format**: Just the quantity as a string (e.g., "100")

#### 3. `src/app/api/schedules-v2/publish-now/route.ts`
- **Added**: Pre-validation before schedule creation
- **Behavior**: Checks if fertilizer is configured in a tank before creating schedule
- **Updated**: Uses new `publishScheduleV2WithTankMapping()` method
- **Error Handling**: Returns 400 Bad Request with clear error message if validation fails

#### 4. `src/app/configuration/page.tsx`
- **Updated**: Error handling for tank configuration saves
- **Behavior**: Displays backend validation errors (including duplicate fertilizer errors)
- **User Experience**: Form fields remain populated on error, allowing user to fix the issue

#### 5. `src/app/api/cron/publish-schedules/route.ts`
- **Updated**: Uses new `publishScheduleV2WithTankMapping()` method
- **Behavior**: Automatically handles tank mapping for scheduled publishes
- **Error Logging**: Logs warnings and errors from the publisher

## Usage Flow

### Configuration (Admin)
1. Navigate to **Configuration** page
2. Select a customer and tunnel
3. Assign fertilizers to tanks:
   - Tank A: Kodimix
   - Tank B: SuperGro
   - Tank C: Water
4. If you try to assign the same fertilizer to multiple tanks, you'll see an error

### Creating Schedules (Admin)
1. Navigate to **Schedules V2** page
2. Select customer, tunnel, and date
3. Select fertilizer type (e.g., Kodimix) and quantity (e.g., 100)
4. Add water amount and release schedule
5. Click "Save and Publish Now"
6. **System behavior**:
   - Validates that Kodimix is configured in a tank
   - Finds that Kodimix is in Tank A
   - Publishes "100" to `fertilizer_1` topic
   - Publishes water volume to `water_volume` topic
   - Publishes release schedules to `schedule_time1`, `schedule_volume1`, etc.

### MQTT Topics Published

For a schedule with:
- Fertilizer: Kodimix (configured in Tank A)
- Quantity: 100
- Water: 500
- Releases: 08:00 (30L), 12:00 (40L), 16:00 (30L)

The system publishes:
```
fertilizer_1 = "100"
water_volume = "500"
schedule_time1 = "0800"
schedule_volume1 = "30"
schedule_time2 = "1200"
schedule_volume2 = "40"
schedule_time3 = "1600"
schedule_volume3 = "30"
```

## Error Handling

### Error 1: Duplicate Fertilizer Assignment
**When**: Trying to assign a fertilizer to multiple tanks
**Error**: "This fertilizer 'Kodimix' is already assigned to Tank A. Each fertilizer can only be assigned to one tank."
**Solution**: Choose a different fertilizer or remove it from the other tank first

### Error 2: Fertilizer Not Configured
**When**: Creating a schedule with a fertilizer that's not configured in any tank
**Error**: "Fertilizer 'Kodimix' is not configured in any tank for this tunnel. Please configure it in the Configuration page first."
**Solution**: Go to Configuration page and assign the fertilizer to a tank

### Error 3: Fertilizer Not Found During Publishing
**When**: Publishing a schedule but fertilizer was removed from tank configuration
**Result**: Schedule is created but marked as "failed"
**Warning**: "Fertilizer '[Name]' is not configured in any tank for this tunnel..."

## Testing Recommendations

### Test Case 1: Happy Path
1. Configure Tank A with Kodimix
2. Create schedule with Kodimix, quantity 100
3. Publish now
4. Verify ESP32 receives "100" on `fertilizer_1` topic

### Test Case 2: Duplicate Prevention
1. Configure Tank A with Kodimix
2. Try to configure Tank B with Kodimix
3. Verify error message appears
4. Verify configuration is not saved

### Test Case 3: Missing Configuration
1. Do NOT configure any fertilizer in tanks
2. Try to create schedule with Kodimix
3. Verify error message appears
4. Verify schedule is not created

### Test Case 4: Cron Job
1. Create a schedule for tomorrow (don't publish now)
2. Wait for or manually trigger cron job
3. Verify schedule is published automatically
4. Verify correct topic receives the data

## ESP32 Integration

Your ESP32 should subscribe to:
```cpp
client.subscribe("fertilizer_1");
client.subscribe("fertilizer_2");
client.subscribe("fertilizer_3");
client.subscribe("water_volume");
client.subscribe("schedule_time1");
client.subscribe("schedule_volume1");
client.subscribe("schedule_time2");
client.subscribe("schedule_volume2");
client.subscribe("schedule_time3");
client.subscribe("schedule_volume3");
```

Example callback handling:
```cpp
void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  if (strcmp(topic, "fertilizer_1") == 0) {
    int quantity = message.toInt();
    Serial.print("Tank A quantity: ");
    Serial.println(quantity);
    // Activate pump for Tank A
  }
  else if (strcmp(topic, "fertilizer_2") == 0) {
    int quantity = message.toInt();
    Serial.print("Tank B quantity: ");
    Serial.println(quantity);
    // Activate pump for Tank B
  }
  // ... handle other topics
}
```

## Future Enhancements

1. **Frontend Validation**: Add real-time check in schedules form to show which tank contains the selected fertilizer
2. **Tank Status Display**: Show tank assignments in the schedules page for easier reference
3. **Multi-Fertilizer Support**: Support schedules with multiple fertilizers at once
4. **Dynamic Tank Count**: Support more than 3 tanks with dynamic topic generation

## Notes

- Water publishing to MQTT is handled separately (manual control as per requirements)
- Time format is converted from "HH:mm" to "HHmm" for ESP32 compatibility (e.g., "13:45" → "1345")
- All validations occur at multiple levels (frontend, backend, publisher) for robustness
- The old `publishScheduleV2()` method is retained for backward compatibility

## Rollback Procedure

If you need to rollback this implementation:
1. Revert `src/lib/scheduleV2Publisher.ts` to use `publishScheduleV2()` instead of `publishScheduleV2WithTankMapping()`
2. Remove validation checks from `src/app/api/schedules-v2/publish-now/route.ts`
3. Remove duplicate fertilizer checks from `src/app/api/configuration/tanks/route.ts`
4. The system will continue to work with the old behavior (all fertilizer topics receive values)

