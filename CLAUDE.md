# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Initial setup (install dependencies, generate key, run migrations, build frontend)
composer setup

# Start development servers (Laravel server, queue listener, logs, Vite dev server)
composer dev

# Run tests
composer test

# Run a single test file
php artisan test tests/Feature/ExampleTest.php

# Run a single test method
php artisan test --filter test_the_application_returns_a_successful_response

# Code formatting with Laravel Pint
./vendor/bin/pint

# Database operations
php artisan migrate                    # Run migrations
php artisan migrate:fresh --seed       # Reset database and seed
php artisan db:seed                    # Run seeders

# Generate code
php artisan make:model ModelName -mfc  # Model with migration, factory, controller
php artisan make:controller ControllerName --api  # API controller
php artisan make:migration create_table_name_table

# Interest calculation
php artisan interest:calculate           # Calculate monthly interest for all active investments
php artisan interest:calculate --dry-run # Preview without making changes
php artisan schedule:list                # View all scheduled tasks
php artisan schedule:run                 # Manually run scheduled tasks
```

## Architecture Overview

### Backend (Laravel 12)
- **app/Http/Controllers/**: API and web controllers
- **app/Models/**: Eloquent models
- **database/migrations/**: Database schema definitions
- **database/factories/**: Model factories for testing
- **routes/web.php**: Web routes (Blade views)
- **routes/api.php**: API routes (to be created for React frontend)

### Frontend (React + Vite)
- **resources/js/**: React application entry point
- **resources/css/app.css**: Tailwind CSS with custom theme
- **resources/views/**: Blade templates (minimal, mainly for SPA entry)

### Build System
- Vite bundles frontend assets to `public/build/`
- Laravel Vite plugin handles asset versioning and hot reload
- Tailwind CSS 4 configured via `@tailwindcss/vite` plugin

### Database
- MySQL (development/production)
- SQLite in-memory (testing via phpunit.xml)
- Session, cache, and queue all use database driver

---

## Project Requirements

### System Theme
- Crypto investment platform
- Registration requires username, password, and valid invitation code
- Philippine Peso (PHP) currency
- Role-based access control: Admin and Members
- Full audit logs for all admin actions

### Admin Panel Features

**Dashboard**: Total invested, interest paid/pending, pending requests, active users, monthly charts, activity feed

**Members Management**: Registration date, name, email/username, interest rate, investment totals, account status (Active/Inactive/Disabled), search/filter, CSV/Excel export, transaction history

**Top-Up Requests**: Request ID, date, member, amount, proof of payment image, status (Pending/Approved/Rejected), processor info, rejection reason required, auto interest start on approval

**Withdrawal Requests**: Date, member, amount, destination (GCASH/Bank), account details, status (Pending/Approved/Paid/Rejected), minimum enforcement, payout proof upload

**Invitation Links**: Generate unique links with interest rate, expiration, max uses, role assignment, registration tracking, auto-disable when expired/exhausted

**Settings**: Interest calculation settings, system configuration

**Users Management**: Profile data, status control, registration source, last login, force logout, password reset, withdrawal freeze, interest rate adjustments with audit trail

### Member Dashboard Features

**Dashboard**: Invested amount, interest earned, available balance, withdrawn amount, pending withdrawals, growth chart, accrual frequency, earnings projection, notifications

**Investments**: Date, amount, rate, earned interest, balance, status (Active/Completed), monthly grouping, downloadable reports

**Top-Up**: Amount, payment method, proof upload, notes, min/max limits, receipt preview, status tracking, admin remarks visible

**Withdrawals**: Amount, destination (GCASH number or bank details), confirmation step, balance calculation, history view

### Interest Calculation
- **Anniversary-Based**: Interest credited on the same day each month as the investment start date (e.g., invested Jan 22 → interest on Feb 22, Mar 22, etc.)
- **Daily Cron**: Runs daily at 00:05, checks today and yesterday for eligible investments
- **Formula**: Investment Amount × (Interest Rate ÷ 100) ÷ 12
- **Locked Rates**: Interest rate locked at investment creation (no retroactive changes)
- **Active Only**: Only processes active investments and active users
- **Duplicate Prevention**: Tracks `last_accrual_date` to prevent double interest per month
- **End-of-Month Handling**: Investments on 31st get interest on last day of shorter months
- **Manual Trigger**: `php artisan interest:calculate`
- **Cron Setup Required**: Add to server crontab: `* * * * * cd /path/to/project && php artisan schedule:run`
- **Documentation**: See [INTEREST_CALCULATION.md](INTEREST_CALCULATION.md) for full details

### Notifications
- In-app and email for: top-up submission/approval/rejection, withdrawal approval/payout, account status changes
