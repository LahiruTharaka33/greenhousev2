# ScheduleV2 MQTT Testing Guide

## 🧪 How to Test the Implementation

### Prerequisites
1. Development server running (`npm run dev` or `pnpm dev`)
2. Database accessible
3. Admin user credentials
4. At least one customer and tunnel configured

---

## Test Case 1: Schedule with Configured Fertilizer

### Setup:
1. Navigate to **Configuration** page
2. Select a customer and tunnel
3. Configure **Tank A** with a fertilizer (e.g., "kodimix")
4. Save the configuration

### Test Steps:
1. Navigate to **Schedules V2** page
2. Click "Create Schedule" tab
3. Fill in the form:
   - **Customer**: Select the customer from setup
   - **Tunnel**: Select the tunnel from setup
   - **Date**: Any future date
   - **Fertilizer Type**: Select "kodimix" (the one configured in Tank A)
   - **Quantity**: 5
   - **Water**: 100
   - Add Release 1: Time = 08:00, Quantity = 30
   - Add Release 2: Time = 14:00, Quantity = 40
   - Add Release 3: Time = 18:00, Quantity = 30
4. Click "Create Schedule"

### Expected Results:
✅ Success alert appears with "✅ Data sent to ESP32 successfully!"
✅ Green MQTT notification appears in bottom-right corner
✅ Console logs show:
```
Fetching tank configuration for tunnel: [tunnelId]
Found fertilizer in Tank A
Publishing ScheduleV2 to ESP32 with topic data: {
  fertilizer_1: 5,
  fertilizer_2: 0,
  fertilizer_3: 0,
  water_volume: 100,
  schedule_time1: "08:00",
  schedule_volume1: 30,
  ...
}
Published to fertilizer_1: 5
Published to fertilizer_2: 0
Published to fertilizer_3: 0
Published to water_volume: 100
...
```

### Verify in Database:
```sql
SELECT * FROM "ScheduleV2" ORDER BY "createdAt" DESC LIMIT 1;
SELECT * FROM "ScheduleV2Release" WHERE "scheduleV2Id" = '[last schedule id]';
```

---

## Test Case 2: Schedule WITHOUT Tank Configuration

### Setup:
1. Make sure there's a fertilizer that is NOT configured in any tank

### Test Steps:
1. Navigate to **Schedules V2** page
2. Create a schedule selecting an unconfigured fertilizer
3. Fill in all required fields
4. Click "Create Schedule"

### Expected Results:
✅ Success alert appears BUT with warning:
```
Schedule created successfully!
✅ Data sent to ESP32 successfully!

⚠️ Warnings:
Warning: Selected fertilizer "[name]" is not configured in any tank for tunnel "[tunnel name]". Please configure it in the Configuration page.
```

✅ Console shows:
```
Warning: Selected fertilizer "..." is not configured in any tank...
Publishing ScheduleV2 to ESP32 with topic data: {
  fertilizer_1: 0,
  fertilizer_2: 0,
  fertilizer_3: 0,
  water_volume: 100,
  ...
}
```

✅ All fertilizer topics published as "0"
✅ Schedule still saved in database

---

## Test Case 3: Schedule with Different Tank Assignments

### Setup:
1. Configure **Tank B** with "NPK" fertilizer
2. Configure **Tank C** with "Urea" fertilizer

### Test Steps:

**Test 3A - Tank B:**
1. Create schedule with "NPK" fertilizer
2. Quantity: 10

**Expected:**
```javascript
fertilizer_1: 0
fertilizer_2: 10  // ← NPK is in Tank B
fertilizer_3: 0
```

**Test 3B - Tank C:**
1. Create schedule with "Urea" fertilizer
2. Quantity: 8

**Expected:**
```javascript
fertilizer_1: 0
fertilizer_2: 0
fertilizer_3: 8  // ← Urea is in Tank C
```

---

## Test Case 4: Variable Number of Releases

### Test 4A - Single Release:
**Form:**
- Release 1: 10:00, 50L

**Expected MQTT:**
```javascript
schedule_time1: "10:00"
schedule_volume1: 50
schedule_time2: ""
schedule_volume2: 0
schedule_time3: ""
schedule_volume3: 0
```

### Test 4B - Two Releases:
**Form:**
- Release 1: 09:00, 40L
- Release 2: 15:00, 60L

**Expected MQTT:**
```javascript
schedule_time1: "09:00"
schedule_volume1: 40
schedule_time2: "15:00"
schedule_volume2: 60
schedule_time3: ""
schedule_volume3: 0
```

### Test 4C - Three Releases:
**Form:**
- Release 1: 08:00, 30L
- Release 2: 12:00, 40L
- Release 3: 16:00, 30L

**Expected MQTT:**
```javascript
schedule_time1: "08:00"
schedule_volume1: 30
schedule_time2: "12:00"
schedule_volume2: 40
schedule_time3: "16:00"
schedule_volume3: 30
```

---

## Test Case 5: MQTT Connection Issues

### Simulating Failure:
1. Stop/disable internet connection briefly
2. Create a schedule
3. Re-enable connection

### Expected Results:
✅ Schedule still saves to database
⚠️ Error message: "Schedule saved but ESP32 communication had issues"
✅ Console shows MQTT connection error
✅ User can retry by editing and re-saving schedule

---

## Console Commands for Verification

### Check MQTT Connection Status:
Open browser console and run:
```javascript
// Check if MQTT service is connected (in development tools)
```

### Monitor MQTT Messages:
All MQTT publish events are logged. Look for:
```
Published to [topic]: [value]
```

### Check Database:
```sql
-- View latest schedules
SELECT s.*, c.customerName, t.tunnelName, i.itemName
FROM "ScheduleV2" s
JOIN "Customer" c ON s."customerId" = c.id
JOIN "Tunnel" t ON s."tunnelId" = t.id
JOIN "Item" i ON s."fertilizerTypeId" = i.id
ORDER BY s."createdAt" DESC
LIMIT 5;

-- View releases for a schedule
SELECT * FROM "ScheduleV2Release" 
WHERE "scheduleV2Id" = '[schedule-id]'
ORDER BY "time";

-- Check tank configurations
SELECT tc.*, t.tunnelName, i.itemName
FROM "TankConfiguration" tc
JOIN "Tunnel" t ON tc."tunnelId" = t.id
LEFT JOIN "Item" i ON tc."itemId" = i.id
ORDER BY t.tunnelName, tc.tankName;
```

---

## Expected MQTT Broker Behavior

Since we're using **broker.hivemq.com**, you can verify messages are being sent by:

1. Using an MQTT client tool (like MQTT Explorer)
2. Connecting to `broker.hivemq.com`
3. Subscribing to these topics:
   - `fertilizer_1`
   - `fertilizer_2`
   - `fertilizer_3`
   - `water_volume`
   - `schedule_time1`
   - `schedule_volume1`
   - `schedule_time2`
   - `schedule_volume2`
   - `schedule_time3`
   - `schedule_volume3`

When you create a schedule, you should see the messages appear in real-time!

---

## Troubleshooting

### Issue: MQTT notification doesn't appear
**Solution:** Check browser console for errors, ensure MQTT service connected

### Issue: All fertilizer values are 0
**Solution:** Check tank configuration - fertilizer might not be mapped to any tank

### Issue: "Cannot read properties of undefined (reading 'create')"
**Solution:** Run `npx prisma generate` to regenerate Prisma client

### Issue: Schedule saves but no MQTT messages
**Solution:** Check internet connection, verify HiveMQ broker is accessible

---

## Success Indicators

When everything works correctly, you should see:

1. ✅ **Database**: Schedule and releases saved
2. ✅ **UI**: Success message with MQTT confirmation
3. ✅ **Console**: All 10 topics published successfully
4. ✅ **Notification**: Green popup showing published topics
5. ✅ **MQTT Broker**: Messages received (if monitoring)

---

## Performance Notes

- Each schedule publishes 10 MQTT messages
- 100ms delay added between publishes to avoid overwhelming ESP32
- MQTT operations are non-blocking (schedule saves even if MQTT fails)
- Connection reuses existing WebSocket connection (no new connections per publish)

---

## Next Test: ESP32 Integration

To fully test with actual ESP32:

1. Flash ESP32 with the provided code
2. Ensure ESP32 connects to `broker.hivemq.com`
3. ESP32 should subscribe to all 10 topics
4. Create a schedule from the web interface
5. Verify ESP32 receives all values and executes the schedule

**Note:** ESP32 code should log received messages for debugging!

---

**Happy Testing! 🚀**


