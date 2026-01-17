<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('investments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('topup_request_id')->nullable()->constrained('topup_requests')->onDelete('set null');
            $table->decimal('amount', 15, 2);
            $table->decimal('interest_rate', 5, 2);
            $table->decimal('interest_earned', 15, 2)->default(0);
            $table->enum('status', ['active', 'paused', 'completed'])->default('active');
            $table->date('start_date');
            $table->date('last_accrual_date')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('start_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('investments');
    }
};
