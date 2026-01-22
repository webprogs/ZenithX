<?php

namespace App\Models;

use Carbon\Carbon;
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

    /**
     * Calculate monthly interest (annual rate / 12)
     */
    public function calculateMonthlyInterest(): float
    {
        return $this->amount * ($this->interest_rate / 100) / 12;
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

    /**
     * Get the anniversary day of the month for this investment
     * If the investment started on the 31st, but the current month only has 28-30 days,
     * use the last day of the current month.
     */
    public function getAnniversaryDayForMonth(Carbon $date): int
    {
        $investmentDay = $this->start_date->day;
        $lastDayOfMonth = $date->copy()->endOfMonth()->day;

        return min($investmentDay, $lastDayOfMonth);
    }

    /**
     * Check if interest is due on a specific date
     * Interest is due when:
     * 1. The date matches the anniversary day of the investment
     * 2. At least one month has passed since start_date
     * 3. Interest hasn't been calculated for this month yet
     */
    public function isInterestDueOn(Carbon $date): bool
    {
        // Check if at least one month has passed since start date
        if ($date->lt($this->start_date->copy()->addMonth())) {
            return false;
        }

        // Check if today is the anniversary day
        $anniversaryDay = $this->getAnniversaryDayForMonth($date);
        if ($date->day !== $anniversaryDay) {
            return false;
        }

        // Check if interest was already calculated for this month
        if ($this->last_accrual_date) {
            // If last accrual was in the same month and year, skip
            if ($this->last_accrual_date->year === $date->year &&
                $this->last_accrual_date->month === $date->month) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get the number of months since investment started
     */
    public function getMonthsSinceStart(): int
    {
        return $this->start_date->diffInMonths(now());
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

    /**
     * Scope to find investments that have their anniversary on a specific day of month
     */
    public function scopeWithAnniversaryOn($query, int $day)
    {
        return $query->whereDay('start_date', $day);
    }

    /**
     * Scope to find investments that might be due for interest on a date
     * This checks for investments where:
     * - start_date day matches the given date's day (or is higher for end-of-month handling)
     * - last_accrual_date is not in the same month
     */
    public function scopeDueForInterestOn($query, Carbon $date)
    {
        $day = $date->day;
        $lastDayOfMonth = $date->copy()->endOfMonth()->day;
        $isLastDay = $day === $lastDayOfMonth;

        return $query->where(function ($q) use ($day, $isLastDay, $date) {
            // Match exact day
            $q->whereDay('start_date', $day);

            // If it's the last day of month, also include investments with higher start days
            if ($isLastDay) {
                $q->orWhereDay('start_date', '>', $day);
            }
        })->where(function ($q) use ($date) {
            // No previous accrual
            $q->whereNull('last_accrual_date')
              // Or last accrual was not in the current month
              ->orWhere(function ($q2) use ($date) {
                  $q2->whereYear('last_accrual_date', '!=', $date->year)
                     ->orWhereMonth('last_accrual_date', '!=', $date->month);
              });
        });
    }
}
