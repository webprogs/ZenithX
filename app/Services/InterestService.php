<?php

namespace App\Services;

use App\Models\Investment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InterestService
{
    /**
     * Calculate interest for all eligible investments for a specific date
     * Also checks the previous day to catch any missed calculations
     */
    public function calculateDailyInterest(?Carbon $date = null): array
    {
        $date = $date ?? now();
        $results = [
            'date' => $date->toDateString(),
            'processed' => 0,
            'skipped' => 0,
            'total_interest' => 0,
            'errors' => [],
            'details' => [],
        ];

        // Process for today
        $todayResults = $this->processInterestForDate($date);
        $this->mergeResults($results, $todayResults, 'today');

        // Also check yesterday to catch any missed calculations
        $yesterday = $date->copy()->subDay();
        $yesterdayResults = $this->processInterestForDate($yesterday);
        $this->mergeResults($results, $yesterdayResults, 'yesterday');

        return $results;
    }

    /**
     * Process interest calculation for a specific date
     */
    public function processInterestForDate(Carbon $date): array
    {
        $results = [
            'processed' => 0,
            'skipped' => 0,
            'total_interest' => 0,
            'errors' => [],
            'investments' => [],
        ];

        // Get all active investments that might be due for interest on this date
        $investments = Investment::active()
            ->with('user')
            ->dueForInterestOn($date)
            ->get();

        foreach ($investments as $investment) {
            try {
                // Double-check eligibility with the model method
                if (!$this->isEligibleForInterest($investment, $date)) {
                    $results['skipped']++;
                    continue;
                }

                $interest = $this->creditInterestForInvestment($investment, $date);

                if ($interest > 0) {
                    $results['total_interest'] += $interest;
                    $results['processed']++;
                    $results['investments'][] = [
                        'investment_id' => $investment->id,
                        'user_id' => $investment->user_id,
                        'user_name' => $investment->user->name ?? 'Unknown',
                        'amount' => $investment->amount,
                        'interest_credited' => $interest,
                    ];
                } else {
                    $results['skipped']++;
                }
            } catch (\Exception $e) {
                $results['errors'][] = [
                    'investment_id' => $investment->id,
                    'error' => $e->getMessage(),
                ];
                Log::error("Interest calculation failed for investment {$investment->id}: " . $e->getMessage());
            }
        }

        return $results;
    }

    /**
     * Check if an investment is eligible for interest on a specific date
     */
    public function isEligibleForInterest(Investment $investment, Carbon $date): bool
    {
        // Investment must be active
        if (!$investment->isActive()) {
            return false;
        }

        // User must be active
        $user = $investment->user;
        if (!$user || !$user->isActive()) {
            return false;
        }

        // Check if interest is due on this date
        if (!$investment->isInterestDueOn($date)) {
            return false;
        }

        return true;
    }

    /**
     * Credit interest for a specific investment
     */
    public function creditInterestForInvestment(Investment $investment, Carbon $date): float
    {
        if (!$this->isEligibleForInterest($investment, $date)) {
            return 0;
        }

        $interest = $investment->calculateMonthlyInterest();

        DB::transaction(function () use ($investment, $interest) {
            $investment->addInterest($interest);
        });

        Log::info("Interest credited", [
            'investment_id' => $investment->id,
            'user_id' => $investment->user_id,
            'amount' => $investment->amount,
            'interest' => $interest,
            'new_total_earned' => $investment->fresh()->interest_earned,
        ]);

        return $interest;
    }

    /**
     * Merge results from date processing into main results
     */
    private function mergeResults(array &$main, array $sub, string $period): void
    {
        $main['processed'] += $sub['processed'];
        $main['skipped'] += $sub['skipped'];
        $main['total_interest'] += $sub['total_interest'];
        $main['errors'] = array_merge($main['errors'], $sub['errors']);

        if (!empty($sub['investments'])) {
            $main['details'][$period] = $sub['investments'];
        }
    }

    /**
     * Legacy method - Calculate interest for all investments (deprecated)
     * Use calculateDailyInterest() instead
     */
    public function calculateMonthlyInterestForAll(): array
    {
        return $this->calculateDailyInterest();
    }

    /**
     * Calculate interest for a single investment (manual trigger)
     */
    public function calculateInterestForInvestment(Investment $investment): float
    {
        $date = now();

        if (!$this->isEligibleForInterest($investment, $date)) {
            return 0;
        }

        return $this->creditInterestForInvestment($investment, $date);
    }

    /**
     * Pause interest accrual for a user
     */
    public function pauseInterestForUser(User $user): int
    {
        return Investment::where('user_id', $user->id)
            ->where('status', 'active')
            ->update(['status' => 'paused']);
    }

    /**
     * Resume interest accrual for a user
     */
    public function resumeInterestForUser(User $user): int
    {
        return Investment::where('user_id', $user->id)
            ->where('status', 'paused')
            ->update(['status' => 'active']);
    }

    /**
     * Get projected earnings for a user
     */
    public function getProjectedEarnings(User $user, int $months = 12): array
    {
        $projections = [];
        $currentDate = now();

        $activeInvestments = $user->investments()->active()->get();

        for ($i = 1; $i <= $months; $i++) {
            $date = $currentDate->copy()->addMonths($i);
            $monthlyInterest = 0;

            foreach ($activeInvestments as $investment) {
                $monthlyInterest += $investment->calculateMonthlyInterest();
            }

            $projections[] = [
                'month' => $date->format('M Y'),
                'projected_interest' => round($monthlyInterest, 2),
                'cumulative' => round(array_sum(array_column($projections, 'projected_interest')) + $monthlyInterest, 2),
            ];
        }

        return $projections;
    }

    /**
     * Get total interest paid across all investments
     */
    public function getTotalInterestPaid(): float
    {
        return Investment::sum('interest_earned');
    }

    /**
     * Get total pending interest (investments due for interest this month)
     */
    public function getTotalPendingInterest(): float
    {
        $today = now();
        $pending = 0;

        // Get all active investments
        $investments = Investment::active()->with('user')->get();

        foreach ($investments as $investment) {
            // Check if interest hasn't been credited this month yet
            if (!$investment->last_accrual_date ||
                $investment->last_accrual_date->month !== $today->month ||
                $investment->last_accrual_date->year !== $today->year) {

                // Check if user is active
                if ($investment->user && $investment->user->isActive()) {
                    $pending += $investment->calculateMonthlyInterest();
                }
            }
        }

        return $pending;
    }

    /**
     * Get investments that are due for interest today
     */
    public function getInvestmentsDueToday(): \Illuminate\Database\Eloquent\Collection
    {
        return Investment::active()
            ->with('user')
            ->dueForInterestOn(now())
            ->get()
            ->filter(function ($investment) {
                return $this->isEligibleForInterest($investment, now());
            });
    }

    /**
     * Preview interest calculation without making changes
     */
    public function previewDailyInterest(?Carbon $date = null): array
    {
        $date = $date ?? now();
        $results = [
            'date' => $date->toDateString(),
            'would_process' => 0,
            'would_skip' => 0,
            'total_interest' => 0,
            'investments' => [],
        ];

        // Check today
        $this->previewForDate($results, $date, 'today');

        // Check yesterday
        $this->previewForDate($results, $date->copy()->subDay(), 'yesterday');

        return $results;
    }

    /**
     * Preview interest for a specific date
     */
    private function previewForDate(array &$results, Carbon $date, string $period): void
    {
        $investments = Investment::active()
            ->with('user')
            ->dueForInterestOn($date)
            ->get();

        foreach ($investments as $investment) {
            if ($this->isEligibleForInterest($investment, $date)) {
                $interest = $investment->calculateMonthlyInterest();
                $results['would_process']++;
                $results['total_interest'] += $interest;
                $results['investments'][] = [
                    'period' => $period,
                    'investment_id' => $investment->id,
                    'user_id' => $investment->user_id,
                    'user_name' => $investment->user->name ?? 'Unknown',
                    'amount' => $investment->amount,
                    'interest_rate' => $investment->interest_rate,
                    'start_date' => $investment->start_date->toDateString(),
                    'interest_would_credit' => round($interest, 2),
                ];
            } else {
                $results['would_skip']++;
            }
        }
    }
}
