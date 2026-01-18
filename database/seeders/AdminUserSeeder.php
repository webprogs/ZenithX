<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@zenithx.com'],
            [
                'username' => 'admin',
                'name' => 'System Administrator',
                'email' => 'admin@admin.com',
                'password' => Hash::make('admin'),
                'role' => 'admin',
                'status' => 'active',
                'default_interest_rate' => 5.00,
                'email_verified_at' => now(),
            ]
        );
    }
}
