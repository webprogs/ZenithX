<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->unique()->after('id');
            $table->enum('role', ['admin', 'member'])->default('member')->after('password');
            $table->enum('status', ['active', 'inactive', 'disabled'])->default('active')->after('role');
            $table->decimal('default_interest_rate', 5, 2)->nullable()->after('status');
            $table->boolean('withdrawal_frozen')->default(false)->after('default_interest_rate');
            $table->timestamp('last_login_at')->nullable()->after('withdrawal_frozen');
            $table->string('last_login_ip')->nullable()->after('last_login_at');
            $table->timestamp('force_logout_at')->nullable()->after('last_login_ip');
            $table->string('phone')->nullable()->after('force_logout_at');
            $table->unsignedBigInteger('invited_by_link_id')->nullable()->after('phone');

            $table->index('role');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropIndex(['status']);
            $table->dropColumn([
                'username',
                'role',
                'status',
                'default_interest_rate',
                'withdrawal_frozen',
                'last_login_at',
                'last_login_ip',
                'force_logout_at',
                'phone',
                'invited_by_link_id',
            ]);
        });
    }
};
