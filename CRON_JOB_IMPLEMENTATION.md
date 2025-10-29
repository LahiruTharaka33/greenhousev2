# Cron Job Implementation for Schedule Publishing

## 🎯 Overview
Successfully implemented a Vercel cron job that automatically publishes schedules to ESP32 devices at 5:00 AM UTC on their scheduled date.

## 📝 What Was Implemented

### 1. **Cron Job API Endpoint** (`src/app/api/cron/publish-schedules/route.ts`)
- **Trigger**: Called daily at 5:00 AM UTC by Vercel Cron
- **Functionality**:
  - Queries all `ScheduleV2` records with `scheduledDate` = current date and `status` = 'pending'
  - For each schedule:
    - Fetches tank configuration for the tunnel
    - Maps fertilizer to correct tank (Tank A, B, or C)
    - Builds MQTT topic data with 10 topics
    - Publishes to MQTT broker via `scheduleV2Publisher`
    - Updates status to 'sent' on success
    - Logs errors and moves on (no retry) on failure
  - Returns detailed summary of published and failed schedules

**Security Features**:
- Verifies `CRON_SECRET` environment variable in production
- Uses Bearer token authentication
- Rejects unauthorized requests

**Error Handling**:
- Individual schedule failures don't block other schedules
- Detailed logging for debugging
- Returns comprehensive error report

### 2. **Updated `vercel.json`**
Added cron configuration:
```json
{
  "crons": [
    {
      "path": "/api/cron/publish-schedules",
      "schedule": "0 5 * * *"
    }
  ]
}
```

**Schedule Details**:
- `0 5 * * *` = Every day at 5:00 AM UTC
- Only runs on production deployments (not previews)

### 3. **Modified Schedule Creation** (`src/app/api/schedules-v2/route.ts`)
**Changes**:
- ❌ Removed immediate MQTT publishing on schedule creation
- ❌ Removed `scheduleV2Publisher` import (no longer needed)
- ✅ Schedules are saved with `status: 'pending'`
- ✅ Will be published by cron job on scheduled date

**Response**: Returns only the created schedule (no MQTT results)

### 4. **Updated Frontend** (`src/app/schedules-v2/page.tsx`)
**Changes**:
- Removed MQTT notification state and components
- Removed `MQTTTerminalNotification` and `PublishSummary` imports
- Updated success message to inform user: "Schedule will be sent to ESP32 at 5:00 AM UTC on the scheduled date"
- Simplified response handling

## 🔄 How It Works

### Schedule Creation Flow
1. User creates schedule via UI
2. Schedule saved to database with `status: 'pending'`
3. User receives confirmation: "Schedule will be sent at 5:00 AM UTC on scheduled date"
4. No immediate ESP32 communication

### Daily Cron Job Flow
1. **5:00 AM UTC**: Vercel triggers cron job
2. **Query**: Find all schedules where:
   - `scheduledDate` = today
   - `status` = 'pending'
3. **Process Each Schedule**:
   - Get tank configuration
   - Map fertilizer → tank
   - Build MQTT payload
   - Publish to ESP32
   - Update status to 'sent' (if successful)
   - Log error and continue (if failed)
4. **Return Summary**: Published count, failed count, details

## 📊 Schedule Status Flow

```
pending → sent (successful publishing)
pending → pending (failed publishing - stays pending, error logged)
```

## 🔒 Security

### Environment Variables Required
Add to your Vercel project:
```
CRON_SECRET=your-random-secret-token-here
```

**How to Set**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `CRON_SECRET` with a strong random value
3. Apply to Production environment
4. Redeploy

### Authorization Check
```typescript
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return 401 Unauthorized
}
```

## 🧪 Testing

### Test Cron Job Locally
You can test the endpoint manually:
```bash
curl http://localhost:3000/api/cron/publish-schedules \
  -H "Authorization: Bearer your-secret"
```

### Test on Vercel
After deployment, manually trigger via:
```bash
curl https://your-domain.vercel.app/api/cron/publish-schedules \
  -H "Authorization: Bearer your-secret"
```

### Check Cron Execution
- Go to Vercel Dashboard → Your Project → Cron Jobs
- View execution history, logs, and status

## 📋 MQTT Topics Published (10 Topics)

Each schedule publishes to:
```
fertilizer_1       → Tank A quantity (or 0)
fertilizer_2       → Tank B quantity (or 0)
fertilizer_3       → Tank C quantity (or 0)
water_volume       → Total water in liters
schedule_time1     → First release time (HHmm format)
schedule_volume1   → First release quantity (liters)
schedule_time2     → Second release time (HHmm format)
schedule_volume2   → Second release quantity (liters)
schedule_time3     → Third release time (HHmm format)
schedule_volume3   → Third release quantity (liters)
```

## ⚠️ Important Notes

### Vercel Hobby Plan
- ✅ Cron jobs are supported on Hobby plan
- ⚠️ Limited to 1 cron job (we use exactly 1)
- ⚠️ May have execution time limits
- 📚 [Vercel Cron Pricing](https://vercel.com/docs/cron-jobs)

### Time Zone
- Cron runs at **5:00 AM UTC**
- Make sure scheduled dates are in correct timezone
- Schedule query uses UTC date comparison

### Failed Schedules
- Failed schedules remain in `pending` status
- Errors are logged but not retried automatically
- Admin can manually retry by re-publishing if needed
- Consider adding manual retry button in UI if needed

### Schedule Updates
- Editing a schedule does NOT change its status
- If a 'sent' schedule is edited, it remains 'sent' (won't be re-sent)
- Consider adding status reset logic if needed

## 🚀 Deployment

1. **Push Changes**:
   ```bash
   git add .
   git commit -m "Add cron job for scheduled publishing"
   git push
   ```

2. **Set Environment Variable**:
   - Add `CRON_SECRET` in Vercel Dashboard

3. **Deploy**:
   - Vercel automatically deploys to production
   - Cron job activates on production deployment

4. **Verify**:
   - Check Vercel Dashboard → Cron Jobs
   - First execution will be at next 5:00 AM UTC

## 📝 Logs & Monitoring

### Console Logs
The cron job produces detailed logs:
- `🕐 Cron job started: Publishing schedules for today...`
- `Found X schedules to publish for today`
- `✅ Successfully published schedule {id}`
- `❌ Failed to publish schedule {id} - logging error and moving on`
- `🎉 Cron job completed: {summary}`

### View Logs
- Vercel Dashboard → Your Project → Deployments → Functions
- Filter by `/api/cron/publish-schedules`

## 🎉 Benefits

✅ **Timely Execution**: Schedules sent exactly when needed (not weeks in advance)

✅ **Fresh Data**: ESP32 receives current schedule data on the day it's needed

✅ **Simplified Creation**: No MQTT connection required during schedule creation

✅ **Error Isolation**: One failed schedule doesn't block others

✅ **Audit Trail**: Clear status tracking (pending → sent)

✅ **Scalable**: Handles multiple schedules per day efficiently

✅ **Automatic**: Zero manual intervention required

---

## 🔧 Future Enhancements (Optional)

Consider adding:
- Manual "Publish Now" button for testing
- Email/notification on cron failures
- Retry mechanism for failed schedules
- Dashboard showing cron execution history
- Status filter in UI (pending, sent, failed)
- Ability to reset schedule status
- Multiple cron times if needed

