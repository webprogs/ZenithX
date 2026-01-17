<?php

namespace App\Services;

use App\Models\Investment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InterestService
{
    public function calculateMonthlyInterestForAll(): array
    {
        $results = [
            'processed' => 0,
            'skipped' => 0,
            'total_interest' => 0,
            'errors' => [],
        ];

        $investments = Investment::active()
            ->with('user')
            ->get();

        foreach ($investments as $investment) {
            try {
                if (!$this->shouldCalculateInterest($investment)) {
                    $results['skipped']++;
                    continue;
                }

                $interest = $this->calculateInterestForInvestment($investment);
                $results['total_interest'] += $interest;
                $results['processed']++;
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

    public function calculateInterestForInvestment(Investment $investment): float
    {
        if (!$investment->isActive()) {
            return 0;
        }

        $user = $investment->user;
        if (!$user->isActive()) {
            return 0;
        }

        $interest = $investment->calculateMonthlyInterest();

        DB::transaction(function () use ($investment, $interest) {
            $investment->addInterest($interest);
        });

        return $interest;
    }

    private function shouldCalculateInterest(Investment $investment): bool
    {
        if (!$investment->isActive()) {
            return false;
        }

        $user = $investment->user;
        if (!$user->isActive()) {
            return false;
        }

        if ($investment->last_accrual_date && $investment->last_accrual_date->isCurrentMonth()) {
            return false;
        }

        return true;
    }

    public function pauseInterestForUser(User $user): int
    {
        return Investment::where('user_id', $user->id)
            ->where('status', 'active')
            ->update(['status' => 'paused']);
    }

    public function resumeInterestForUser(User $user): int
    {
        return Investment::where('user_id', $user->id)
            ->where('status', 'paused')
            ->update(['status' => 'active']);
    }

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

    public function getTotalInterestPaid(): float
    {
        return Investment::sum('interest_earned');
    }

    public function getTotalPendingInterest(): float
    {
        $activeInvestments = Investment::active()->get();
        $pending = 0;

        foreach ($activeInvestments as $investment) {
            if (!$investment->last_accrual_date || !$investment->last_accrual_date->isCurrentMonth()) {
                $pending += $investment->calculateMonthlyInterest();
            }
        }

        return $pending;
    }
}
