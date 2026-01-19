# Interest Calculation System

## Overview

ZenithX automatically calculates and credits monthly interest to all active investments. The system uses Laravel's task scheduling to run the calculation process automatically.

## How It Works

### 1. **Interest Calculation Logic**

The `InterestService` handles all interest calculations:

- **Monthly Interest Formula**: `Investment Amount × Interest Rate ÷ 12`
- **Active Investments Only**: Only processes investments with status `active`
- **Active Users Only**: Skips calculations for inactive/disabled users
- **Once Per Month**: Prevents duplicate calculations in the same month using `last_accrual_date`
- **Locked Interest Rates**: Uses the interest rate locked at investment creation time

### 2. **Automatic Scheduling**

The system is configured to automatically calculate interest on the **1st day of every month at midnight** (00:00).

**Schedule Configuration** ([routes/console.php](routes/console.php)):
```php
Schedule::command('interest:calculate')
    ->monthlyOn(1, '00:00')    // Runs on the 1st at midnight
    ->withoutOverlapping()      // Prevents concurrent runs
    ->onSuccess/onFailure       // Logs results
```

### 3. **Manual Execution**

You can manually trigger interest calculation anytime:

```bash
# Calculate interest for all active investments
php artisan interest:calculate

# Dry run (see what would happen without making changes)
php artisan interest:calculate --dry-run
```

## Server Setup (REQUIRED for Automatic Calculation)

For the automatic monthly calculation to work, you **MUST** set up a cron job on your server.

### Step 1: Add Cron Job

Open your server's crontab:
```bash
crontab -e
```

Add this line:
```bash
* * * * * cd /path/to/zenithx && php artisan schedule:run >> /dev/null 2>&1
```

**Important**: Replace `/path/to/zenithx` with your actual project path.

### Step 2: Verify Setup

Test the scheduler:
```bash
# Check scheduled tasks
php artisan schedule:list

# Run the scheduler manually
php artisan schedule:run
```

You should see `interest:calculate` in the list of scheduled commands.

## Interest Calculation Flow

1. **Investment Created**: When a top-up is approved, an investment record is created with:
   - `amount`: The top-up amount
   - `interest_rate`: Locked rate from user's profile
   - `status`: Set to `active`
   - `last_accrual_date`: NULL (first calculation pending)

2. **Monthly Calculation** (1st of each month):
   - System finds all active investments
   - Checks if user is active
   - Checks if interest already calculated this month
   - Calculates: `amount × interest_rate ÷ 12`
   - Credits interest to investment
   - Updates `last_accrual_date` to current date
   - Updates `interest_earned` total

3. **Interest Available**:
   - Interest is added to `available_balance`
   - Member can withdraw anytime (subject to withdrawal settings)

## Example Calculation

**Scenario:**
- Investment Amount: ₱100,000
- Interest Rate: 12% per year
- Monthly Interest: ₱100,000 × 0.12 ÷ 12 = **₱1,000/month**

**Timeline:**
- Jan 15: Member deposits ₱100,000 (approved)
- Feb 1: System credits ₱1,000 interest
- Mar 1: System credits ₱1,000 interest
- Apr 1: System credits ₱1,000 interest
- ... continues monthly

## Command Options

### Calculate Interest
```bash
# Normal run
php artisan interest:calculate

# Dry run (preview without changes)
php artisan interest:calculate --dry-run
```

### Output Example
```
Interest Calculation Complete!

+-------------------+----------+
| Metric            | Value    |
+-------------------+----------+
| Processed         | 150      |
| Skipped           | 25       |
| Total Interest    | ₱125,000 |
| Errors            | 0        |
+-------------------+----------+

Completed in 2.35 seconds
```

## Pausing Interest for Users

Admins can pause interest accrual for specific users:

**Via User Management:**
1. Go to Admin Panel → User Management
2. Select user
3. Change status to `inactive` or `disabled`
4. Interest calculation will be skipped for that user

**Programmatically:**
```php
$interestService = app(InterestService::class);
$interestService->pauseInterestForUser($user);  // Pauses
$interestService->resumeInterestForUser($user); // Resumes
```

## Monitoring & Logs

### Check Logs
```bash
# View Laravel logs
tail -f storage/logs/laravel.log

# Check for interest calculation logs
grep "interest" storage/logs/laravel.log
```

### Successful Run
```
[2026-01-19 00:00:00] production.INFO: Monthly interest calculation completed successfully
```

### Failed Run
```
[2026-01-19 00:00:00] production.ERROR: Monthly interest calculation failed
[2026-01-19 00:00:00] local.ERROR: Interest calculation failed for investment 123: ...
```

## Testing

### Test in Development
```bash
# Run calculation manually
php artisan interest:calculate

# Check the results
php artisan tinker
>>> \App\Models\Investment::latest('updated_at')->first()->interest_earned
```

### Verify Schedule
```bash
# List all scheduled tasks
php artisan schedule:list

# Test schedule (runs all due tasks)
php artisan schedule:run
```

## Production Deployment Checklist

- [ ] Set up server cron job: `* * * * * cd /path/to/project && php artisan schedule:run`
- [ ] Verify cron is running: `php artisan schedule:list`
- [ ] Test manual calculation: `php artisan interest:calculate --dry-run`
- [ ] Monitor logs after first automatic run
- [ ] Set up monitoring/alerts for failed calculations

## Troubleshooting

### Interest Not Calculating

1. **Check Cron Job**:
   ```bash
   crontab -l  # Should show the schedule:run command
   ```

2. **Check Schedule**:
   ```bash
   php artisan schedule:list  # Should list interest:calculate
   ```

3. **Run Manually**:
   ```bash
   php artisan interest:calculate
   ```

4. **Check Logs**:
   ```bash
   tail -f storage/logs/laravel.log
   ```

### Common Issues

- **Cron not set up**: Automatic calculation won't work without cron
- **User inactive**: Interest skipped for inactive/disabled users
- **Already calculated**: System prevents duplicate calculations in same month
- **Investment inactive**: Only active investments receive interest

## Additional Notes

- Interest rates are **locked** when investment is created (changing user's rate doesn't affect existing investments)
- System uses **simple interest**, not compound
- Calculations are idempotent (safe to run multiple times)
- Failed calculations are logged but don't stop the process for other investments
