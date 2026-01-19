<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule monthly interest calculation
// Runs on the 1st day of each month at 00:00 (midnight)
Schedule::command('interest:calculate')
    ->monthlyOn(1, '00:00')
    ->withoutOverlapping()
    ->onSuccess(function () {
        info('Monthly interest calculation completed successfully');
    })
    ->onFailure(function () {
        error('Monthly interest calculation failed');
    });
