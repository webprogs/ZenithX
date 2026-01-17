<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'key' => 'minimum_topup',
                'value' => '1000',
                'type' => 'integer',
                'group' => 'topup',
                'description' => 'Minimum top-up amount in PHP',
            ],
            [
                'key' => 'maximum_topup',
                'value' => '1000000',
                'type' => 'integer',
                'group' => 'topup',
                'description' => 'Maximum top-up amount in PHP',
            ],
            [
                'key' => 'minimum_withdrawal',
                'value' => '500',
                'type' => 'integer',
                'group' => 'withdrawal',
                'description' => 'Minimum withdrawal amount in PHP',
            ],
            [
                'key' => 'max_withdrawal_per_day',
                'value' => '100000',
                'type' => 'integer',
                'group' => 'withdrawal',
                'description' => 'Maximum withdrawal amount per day in PHP',
            ],
            [
                'key' => 'default_interest_rate',
                'value' => '5.00',
                'type' => 'decimal',
                'group' => 'interest',
                'description' => 'Default monthly interest rate in percentage',
            ],
            [
                'key' => 'interest_calculation_day',
                'value' => '1',
                'type' => 'integer',
                'group' => 'interest',
                'description' => 'Day of month to calculate interest (1-28)',
            ],
            [
                'key' => 'withdrawal_processing_days',
                'value' => '3',
                'type' => 'integer',
                'group' => 'withdrawal',
                'description' => 'Expected number of days to process withdrawals',
            ],
            [
                'key' => 'app_name',
                'value' => 'ZenithX',
                'type' => 'string',
                'group' => 'general',
                'description' => 'Application name',
            ],
            [
                'key' => 'currency',
                'value' => 'PHP',
                'type' => 'string',
                'group' => 'general',
                'description' => 'Currency code',
            ],
            [
                'key' => 'currency_symbol',
                'value' => '₱',
                'type' => 'string',
                'group' => 'general',
                'description' => 'Currency symbol',
            ],
            [
                'key' => 'require_email_verification',
                'value' => 'false',
                'type' => 'boolean',
                'group' => 'general',
                'description' => 'Require email verification for new users',
            ],
            [
                'key' => 'allow_multiple_pending_topups',
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'topup',
                'description' => 'Allow multiple pending top-up requests',
            ],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
