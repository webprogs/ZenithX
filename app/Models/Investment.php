<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Investment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'topup_request_id',
        'amount',
        'interest_rate',
        'interest_earned',
        'status',
        'start_date',
        'last_accrual_date',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'interest_rate' => 'decimal:2',
            'interest_earned' => 'decimal:2',
            'start_date' => 'date',
            'last_accrual_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function topupRequest(): BelongsTo
    {
        return $this->belongsTo(TopupRequest::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isPaused(): bool
    {
        return $this->status === 'paused';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function pause(): void
    {
        $this->update(['status' => 'paused']);
    }

    public function resume(): void
    {
        $this->update(['status' => 'active']);
    }

    public function complete(): void
    {
        $this->update(['status' => 'completed']);
    }

    public function calculateMonthlyInterest(): float
    {
        return $this->amount * ($this->interest_rate / 100);
    }

    public function addInterest(float $amount): void
    {
        $this->increment('interest_earned', $amount);
        $this->update(['last_accrual_date' => now()->toDateString()]);
    }

    public function getCurrentBalanceAttribute(): float
    {
        return $this->amount + $this->interest_earned;
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePaused($query)
    {
        return $query->where('status', 'paused');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}
