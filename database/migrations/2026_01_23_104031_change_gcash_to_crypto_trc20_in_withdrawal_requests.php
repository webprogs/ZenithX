<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update existing gcash records to crypto_trc20
        DB::table('withdrawal_requests')
            ->where('destination_type', 'gcash')
            ->update(['destination_type' => 'crypto_trc20']);

        // Modify the enum to include crypto_trc20 and remove gcash
        DB::statement("ALTER TABLE withdrawal_requests MODIFY COLUMN destination_type ENUM('crypto_trc20', 'bank') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Update crypto_trc20 records back to gcash
        DB::table('withdrawal_requests')
            ->where('destination_type', 'crypto_trc20')
            ->update(['destination_type' => 'gcash']);

        // Revert the enum
        DB::statement("ALTER TABLE withdrawal_requests MODIFY COLUMN destination_type ENUM('gcash', 'bank') NOT NULL");
    }
};
