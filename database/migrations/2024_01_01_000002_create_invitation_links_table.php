<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invitation_links', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->decimal('interest_rate', 5, 2);
            $table->enum('assigned_role', ['admin', 'member'])->default('member');
            $table->integer('max_uses')->nullable();
            $table->integer('times_used')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['code', 'is_active']);
            $table->index('expires_at');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('invited_by_link_id')
                ->references('id')
                ->on('invitation_links')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['invited_by_link_id']);
        });

        Schema::dropIfExists('invitation_links');
    }
};
