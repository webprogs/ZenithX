<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule daily interest calculation
// Runs every day at 00:05 (5 minutes past midnight)
// Checks both today and yesterday to catch any missed calculations
Schedule::command('interest:calculate')
    ->dailyAt('00:05')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/interest-calculation.log'))
    ->onSuccess(function () {
        info('Daily interest calculation completed successfully');
    })
    ->onFailure(function () {
        error('Daily interest calculation failed');
    });
