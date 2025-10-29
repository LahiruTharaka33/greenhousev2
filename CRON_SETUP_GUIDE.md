# GitHub Actions Cron Job Setup Guide

## ✅ Step-by-Step Setup

### Step 1: Get Your Vercel Production URL
1. Go to Vercel Dashboard
2. Find your project's production URL (e.g., `greenhousev2.vercel.app`)
3. **Important**: Copy only the domain, WITHOUT `https://`
   - ✅ Correct: `greenhousev2.vercel.app`
   - ❌ Wrong: `https://greenhousev2.vercel.app`

### Step 2: Generate CRON_SECRET
Run this in PowerShell to generate a random secret:
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```
Copy the output (it will be a random string like `aB3dF9kL2mN...`)

### Step 3: Add Secrets to GitHub
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add these two secrets:

**Secret 1:**
- Name: `VERCEL_URL`
- Value: `your-domain.vercel.app` (from Step 1, no https://)

**Secret 2:**
- Name: `CRON_SECRET`
- Value: `[the random string from Step 2]`

### Step 4: Add CRON_SECRET to Vercel
1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
   - Key: `CRON_SECRET`
   - Value: `[same random string from Step 2]`
   - Environment: Check **Production** only
5. Click **Save**
6. **Redeploy** your project for the variable to take effect

### Step 5: Test the Setup
1. Go to GitHub → **Actions** tab
2. Click on **"Publish Daily Schedules"** workflow
3. Click **"Run workflow"** dropdown button
4. Click **"Run workflow"** to trigger manually
5. Wait ~30 seconds and refresh
6. Click on the workflow run to see logs

### Step 6: Check Logs
In the workflow logs, you should see:
```
Calling endpoint: https://your-domain.vercel.app/api/cron/publish-schedules
Response: {"success":true,"message":"..."}
Success: Schedules published!
```

## 🐛 Troubleshooting

### Error: "Unauthorized" (401)
**Cause**: CRON_SECRET mismatch between GitHub and Vercel
**Fix**: 
- Make sure both secrets are EXACTLY the same
- Redeploy Vercel after adding environment variable

### Error: "No schedules to publish for today"
**Cause**: No pending schedules for today's date
**Fix**: 
- Create a test schedule with today's date
- Make sure status is 'pending'

### Error: "404 Not Found"
**Cause**: URL is incorrect or deployment failed
**Fix**:
- Check VERCEL_URL secret (should NOT include https://)
- Verify deployment succeeded on Vercel
- Make sure file exists at `src/app/api/cron/publish-schedules/route.ts`

### Error: "Secret not found"
**Cause**: Secrets not set in GitHub
**Fix**: Follow Step 3 again

### Workflow doesn't run at scheduled time
**Note**: 
- GitHub Actions schedules can be delayed by 3-15 minutes during high load
- First scheduled run won't happen until after the next scheduled time (after you push)
- Use "Run workflow" button for immediate testing

## 🧪 Testing Checklist

- [ ] VERCEL_URL secret added to GitHub (without https://)
- [ ] CRON_SECRET secret added to GitHub
- [ ] CRON_SECRET environment variable added to Vercel (Production)
- [ ] Vercel project redeployed after adding env variable
- [ ] Test schedule created with today's date and status='pending'
- [ ] Workflow triggered manually from GitHub Actions
- [ ] Logs show successful response
- [ ] Schedule status changed from 'pending' to 'sent'

## 📞 Need Help?

If it still doesn't work after following all steps:
1. Copy the error message from GitHub Actions logs
2. Check Vercel deployment logs
3. Verify the endpoint works by testing it manually with curl

