# MQTT Resubscription for Edited Schedules

## Overview
This feature automatically resubscribes to MQTT topics when release schedules are edited for schedules with "sent" status.

## How It Works

### 1. **Trigger**
When a user edits a schedule with `status: 'sent'` and updates the `releases` array, the system:
- Detects which release slots (1, 2, or 3) were modified
- Resubscribes ONLY to the MQTT topics for those specific slots

### 2. **Topic Pattern**
All subscriptions follow the pattern: `{clientId}/{topic_name}`

For release schedules:
- `{waterClientId}/schedule_time1` - Time for release slot 1
- `{waterClientId}/schedule_volume1` - Volume for release slot 1
- `{waterClientId}/schedule_time2` - Time for release slot 2
- `{waterClientId}/schedule_volume2` - Volume for release slot 2
- `{waterClientId}/schedule_time3` - Time for release slot 3
- `{waterClientId}/schedule_volume3` - Volume for release slot 3

### 3. **Change Detection**
The system compares:
- **Old releases** (from database before update)
- **New releases** (from the update request)

And identifies:
- ✅ **New releases added** (no old release in that slot)
- ✅ **Modified releases** (time or quantity changed)
- ✅ **Removed releases** (old release exists, new doesn't)
- ❌ **Cancelled releases** (automatically filtered out)

### 4. **Resubscription Process**
For each modified slot:
1. Subscribe to `{waterClientId}/schedule_time{N}`
2. Subscribe to `{waterClientId}/schedule_volume{N}`
3. Log subscription results

## Files Modified

### 1. `src/lib/scheduleV2Resubscriber.ts` (NEW)
- **Purpose**: Handles MQTT resubscription logic
- **Key Functions**:
  - `detectReleaseChanges()` - Compares old vs new releases
  - `resubscribeToModifiedReleases()` - Subscribes to modified topics

### 2. `src/app/api/schedules-v2/[id]/route.ts` (MODIFIED)
- **Changes**:
  - Added import for `scheduleV2Resubscriber`
  - Modified `existingSchedule` query to include releases
  - Added resubscription logic after successful update

## Example Flow

### Scenario: User edits release time for slot 2

**Before:**
```json
{
  "releases": [
    { "time": "08:00", "releaseQuantity": 10 },
    { "time": "12:00", "releaseQuantity": 15 },
    { "time": "16:00", "releaseQuantity": 10 }
  ]
}
```

**After:**
```json
{
  "releases": [
    { "time": "08:00", "releaseQuantity": 10 },
    { "time": "14:00", "releaseQuantity": 15 },  // Changed from 12:00 to 14:00
    { "time": "16:00", "releaseQuantity": 10 }
  ]
}
```

**Result:**
- ✅ Detects slot 2 was modified
- ✅ Subscribes to `esp32-watertank-controller-01/schedule_time2`
- ✅ Subscribes to `esp32-watertank-controller-01/schedule_volume2`
- ❌ Does NOT subscribe to slots 1 and 3 (unchanged)

## Restrictions

### ✅ Allowed for Sent Schedules
- Edit release times
- Edit release quantities
- Add new releases
- Remove releases

### ❌ NOT Allowed for Sent Schedules
- Edit customer, tunnel, fertilizer type
- Edit quantity, water, notes
- Edit status
- Edit cancelled releases

### ❌ Cancelled Releases
- Automatically filtered out
- Cannot be edited
- Not included in resubscription

## Error Handling

The resubscription process:
- ✅ Does NOT fail the entire update if resubscription fails
- ✅ Logs warnings for failed subscriptions
- ✅ Returns detailed error messages
- ✅ Continues with partial success if some topics fail

## Console Logs

When resubscription occurs, you'll see:
```
📡 Sent schedule releases were modified, initiating MQTT resubscription...
📡 Detected 1 release slot(s) modified: [...]
✅ Subscribed to esp32-watertank-controller-01/schedule_time2
✅ Subscribed to esp32-watertank-controller-01/schedule_volume2
✅ Successfully resubscribed to 2 topic(s)
```

## Testing

To test this feature:
1. Create a schedule and publish it (status becomes "sent")
2. Edit the release times/quantities
3. Click "Update Schedule"
4. Check console logs for resubscription messages
5. Verify MQTT topics are subscribed correctly
