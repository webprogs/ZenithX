# Interest Calculation System

## Overview

ZenithX calculates and credits interest based on each investment's **anniversary date**. Interest is credited on the same day of the month that the investment was made.

## How It Works

### Anniversary-Based Interest

- **Example**: If you invest on **January 22**, your interest will be credited on:
  - February 22
  - March 22
  - April 22
  - ... and so on every month

- **End-of-Month Handling**: If you invested on the 31st, but a month only has 28-30 days, interest is credited on the last day of that month.
  - Example: Invested on Jan 31 → Feb 28/29, Mar 31, Apr 30, May 31...

### Interest Formula

```
Monthly Interest = Investment Amount × (Interest Rate ÷ 100) ÷ 12
```

**Example:**
- Investment: $100,000
- Annual Rate: 12%
- Monthly Interest: $100,000 × 0.12 ÷ 12 = **$1,000/month**

### Eligibility Rules

Interest is credited only when ALL conditions are met:

1. **Investment Status**: Must be `active` (not paused or completed)
2. **User Status**: User must be `active` (not inactive or disabled)
3. **Anniversary Date**: Today must match the investment's anniversary day
4. **No Duplicate**: Interest not already credited this month
5. **Minimum Period**: At least 1 month has passed since investment start

### Duplicate Prevention

The system prevents double interest through multiple checks:
- `last_accrual_date` tracks when interest was last credited
- If interest was already credited in the current month, it's skipped
- The cron also checks the previous day to catch any missed calculations

## Daily Cron Schedule

The system runs **daily at 00:05** (5 minutes past midnight) and:
1. Checks all investments with today's anniversary date
2. Also checks yesterday to catch any missed calculations
3. Only credits eligible investments
4. Logs all activity

### Server Setup (REQUIRED)

Add this to your server's crontab:

```bash
# Open crontab
crontab -e

# Add this line:
* * * * * cd /path/to/zenithx && php artisan schedule:run >> /dev/null 2>&1
```

**Important**: Replace `/path/to/zenithx` with your actual project path.

## Command Reference

### Calculate Interest
```bash
# Run calculation for today (checks today + yesterday)
php artisan interest:calculate

# Preview without making changes
php artisan interest:calculate --dry-run

# Process a specific date
php artisan interest:calculate --date=2026-01-22
```

### View Schedule
```bash
# List scheduled tasks
php artisan schedule:list

# Manually trigger scheduler
php artisan schedule:run
```

## Example Timeline

**Scenario: User invests $100,000 on January 22 at 12% annual rate**

| Date | Event | Interest |
|------|-------|----------|
| Jan 22 | Investment created | - |
| Feb 22 | First interest credited | $1,000 |
| Mar 22 | Second interest credited | $1,000 |
| Apr 22 | Third interest credited | $1,000 |
| ... | Continues monthly | $1,000/month |

**Total after 1 year**: $12,000 in interest

## Sample Output

### Normal Run
```
Interest Calculation - 2026-01-22
Checking today and yesterday for eligible investments...

Interest Calculation Complete!

+----------------+----------+
| Metric         | Value    |
+----------------+----------+
| Date           | 2026-01-22 |
| Processed      | 5        |
| Skipped        | 12       |
| Total Interest | $15,000  |
| Errors         | 0        |
+----------------+----------+

Processed (today):
+---------------+-------------+------------+------------------+
| Investment ID | User        | Amount     | Interest Credited |
+---------------+-------------+------------+------------------+
| #1            | John Doe    | $100,000   | $1,000           |
| #5            | Jane Smith  | $50,000    | $500             |
+---------------+-------------+------------+------------------+

Completed in 0.45 seconds
```

### Dry Run
```
DRY RUN MODE - No changes will be made

Preview Results:

+----------------+----------+
| Metric         | Value    |
+----------------+----------+
| Date           | 2026-01-22 |
| Would Process  | 5        |
| Would Skip     | 0        |
| Total Interest | $15,000  |
+----------------+----------+

Investments that would receive interest:
+--------+--------+-------------+------------+-------+------------+-----------+
| Period | Inv ID | User        | Amount     | Rate  | Start Date | Interest  |
+--------+--------+-------------+------------+-------+------------+-----------+
| today  | #1     | John Doe    | $100,000   | 12%   | 2025-12-22 | $1,000    |
| today  | #5     | Jane Smith  | $50,000    | 12%   | 2025-11-22 | $500      |
+--------+--------+-------------+------------+-------+------------+-----------+
```

## Technical Details

### Investment Model Methods

```php
// Check if interest is due on a specific date
$investment->isInterestDueOn(Carbon::parse('2026-02-22'));

// Get the anniversary day for a month (handles end-of-month)
$investment->getAnniversaryDayForMonth(Carbon::now());

// Calculate monthly interest
$investment->calculateMonthlyInterest();

// Credit interest
$investment->addInterest($amount);
```

### InterestService Methods

```php
// Daily calculation (checks today + yesterday)
$results = $interestService->calculateDailyInterest();

// Preview without changes
$preview = $interestService->previewDailyInterest();

// Process specific date
$results = $interestService->processInterestForDate(Carbon::parse('2026-01-22'));

// Check eligibility
$eligible = $interestService->isEligibleForInterest($investment, $date);

// Get investments due today
$investments = $interestService->getInvestmentsDueToday();
```

## Logs

Interest calculations are logged to:
- `storage/logs/laravel.log` - General application log
- `storage/logs/interest-calculation.log` - Dedicated interest log

### Log Format
```
[2026-01-22 00:05:01] production.INFO: Interest credited {
    "investment_id": 1,
    "user_id": 5,
    "amount": 100000,
    "interest": 1000,
    "new_total_earned": 3000
}
```

## Notifications

When interest is credited, the user receives an in-app notification:
> "Monthly interest of $1,000.00 has been credited to your account."

## Pausing Interest

### For Individual Users
Admins can pause interest by:
1. Setting user status to `inactive` or `disabled`
2. Investments will be skipped during daily calculation

### For Individual Investments
```php
$interestService->pauseInterestForUser($user);  // Pause all
$interestService->resumeInterestForUser($user); // Resume all
```

## Troubleshooting

### No Interest Being Credited

1. **Check Investment Status**
   ```sql
   SELECT * FROM investments WHERE status = 'active';
   ```

2. **Check User Status**
   ```sql
   SELECT u.status FROM users u
   JOIN investments i ON u.id = i.user_id;
   ```

3. **Check Anniversary Date**
   ```bash
   php artisan interest:calculate --dry-run
   ```

4. **Check Last Accrual**
   ```sql
   SELECT id, start_date, last_accrual_date FROM investments;
   ```

### Cron Not Running

1. Verify crontab entry:
   ```bash
   crontab -l
   ```

2. Check Laravel schedule:
   ```bash
   php artisan schedule:list
   ```

3. Check logs:
   ```bash
   tail -f storage/logs/interest-calculation.log
   ```

## Production Checklist

- [ ] Set up server cron: `* * * * * cd /path/to/project && php artisan schedule:run`
- [ ] Verify with: `php artisan schedule:list`
- [ ] Test dry run: `php artisan interest:calculate --dry-run`
- [ ] Monitor first real run
- [ ] Set up log monitoring/alerts
