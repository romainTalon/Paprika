# Supabase Edge Functions

This directory contains Supabase Edge Functions (serverless functions running on Deno).

## Available Functions

### `reset-imports`

**Purpose**: Automatically reset the monthly import counter for all users.

**Schedule**: Should run daily (the function checks if month changed before resetting).

**What it does**:
- Calls the PostgreSQL function `reset_imports_counter()`
- Resets `imports_this_month` to 0 for users whose `last_import_reset` is older than current month
- Updates `last_import_reset` to now
- Returns count of users affected

---

## Deployment Methods

### Method 1: Via Supabase Dashboard (Easiest - No CLI needed)

1. **Go to** Supabase Dashboard → Edge Functions (in sidebar)
2. **Click** "Create a new function"
3. **Name**: `reset-imports`
4. **Copy/paste** the content of `supabase/functions/reset-imports/index.ts`
5. **Deploy**

Then schedule it:
1. **Go to** Database → Cron Jobs
2. **Create new job**:
   - Name: `reset-monthly-imports`
   - Schedule: `0 1 * * *` (daily at 1 AM UTC)
   - Command: Call the Edge Function via HTTP

---

### Method 2: Via Supabase CLI (If you have it installed)

**Note**: Supabase CLI cannot be installed via npm anymore. Use one of these methods:
- **Windows**: `scoop install supabase` or download from [GitHub Releases](https://github.com/supabase/cli/releases)
- **macOS**: `brew install supabase/tap/supabase`
- **Linux**: Download from [GitHub Releases](https://github.com/supabase/cli/releases)

Once installed:

```bash
# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy reset-imports

# Create a cron job (requires pg_cron extension - Pro plan)
# Or use Supabase Dashboard → Database → Cron Jobs
```

---

### Method 3: Manual HTTP Call (For Testing)

You can test the function manually:

```bash
curl -L -X POST 'https://your-project-ref.supabase.co/functions/v1/reset-imports' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

Or via JavaScript:

```typescript
const { data, error } = await supabase.functions.invoke('reset-imports');
console.log(data); // { success: true, usersReset: 5, timestamp: '...' }
```

---

## Scheduling Options

### Option A: Supabase Cron Jobs (Recommended)

**Free Tier**:
- Go to Dashboard → Database → Cron Jobs
- Click "Enable Cron Jobs" (free on all plans)
- Create a new job that calls the Edge Function

**Example SQL for Cron Job**:
```sql
SELECT
  net.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/reset-imports',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) AS response;
```

Schedule: `0 1 * * *` (Daily at 1 AM UTC)

### Option B: External Cron Services

Use free services like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- GitHub Actions scheduled workflows
- Vercel Cron Jobs

Point them to your Edge Function URL with a cron schedule.

### Option C: GitHub Actions (Free)

Create `.github/workflows/reset-imports.yml`:

```yaml
name: Reset Monthly Imports
on:
  schedule:
    - cron: '0 1 * * *' # Daily at 1 AM UTC
  workflow_dispatch: # Manual trigger

jobs:
  reset:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST '${{ secrets.SUPABASE_FUNCTION_URL }}/reset-imports' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}'
```

---

## Testing the Function

### Test locally (if you have Supabase CLI):

```bash
supabase functions serve reset-imports
```

Then call it:
```bash
curl -X POST http://localhost:54321/functions/v1/reset-imports
```

### Test in production:

Just call the deployed function URL with your anon key.

---

## Monitoring

Check the Edge Function logs in Supabase Dashboard:
- Go to Edge Functions → reset-imports → Logs
- You'll see execution history, errors, and success messages

---

## Troubleshooting

### "Function not found"
➡️ Make sure you deployed the function correctly via Dashboard or CLI

### "Permission denied"
➡️ Check that your service role key is correct in the request

### "reset_imports_counter function does not exist"
➡️ Make sure you ran the `schema.sql` that includes this PostgreSQL function

### Function runs but nothing happens
➡️ The function only resets users whose `last_import_reset` is before the current month. If it's the same month, nothing will be reset (this is by design).

---

## Cost

**Edge Functions**: 2M invocations/month FREE
- Running daily = ~30 invocations/month
- Well within free tier! 🎉

**Cron Jobs via pg_net**: Included in free tier
- No additional cost

---

## Next Steps

1. ✅ Deploy the function via Supabase Dashboard
2. ✅ Set up a cron job to call it daily
3. ✅ Test manually to verify it works
4. ✅ Monitor logs to ensure it runs correctly

Done! Your imports will auto-reset every month 🚀
