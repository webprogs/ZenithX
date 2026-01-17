<?php

use Illuminate\Support\Facades\Route;

// SPA catch-all route - React Router handles routing
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
