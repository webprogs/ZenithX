<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Investment;
use App\Models\TopupRequest;
use App\Models\User;
use App\Models\WithdrawalRequest;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function __construct(
        private readonly InterestService $interestService
    ) {}

    public function getAdminStats(): array
    {
        return [
            'total_invested' => Investment::whereIn('status', ['active', 'paused'])->sum('amount'),
            'total_interest_paid' => $this->interestService->getTotalInterestPaid(),
            'total_interest_pending' => $this->interestService->getTotalPendingInterest(),
            'pending_topups' => TopupRequest::pending()->count(),
            'pending_withdrawals' => WithdrawalRequest::pending()->count(),
            'approved_withdrawals' => WithdrawalRequest::approved()->count(),
            'active_users' => User::where('role', 'member')->where('status', 'active')->count(),
            'inactive_users' => User::where('role', 'member')->where('status', 'inactive')->count(),
            'disabled_users' => User::where('role', 'member')->where('status', 'disabled')->count(),
            'total_members' => User::where('role', 'member')->count(),
        ];
    }

    public function getMonthlyInvestmentChart(int $months = 12): array
    {
        $data = [];
        $startDate = Carbon::now()->subMonths($months - 1)->startOfMonth();

        for ($i = 0; $i < $months; $i++) {
            $date = $startDate->copy()->addMonths($i);
            $monthStart = $date->copy()->startOfMonth();
            $monthEnd = $date->copy()->endOfMonth();

            $investments = TopupRequest::approved()
                ->whereBetween('processed_at', [$monthStart, $monthEnd])
                ->sum('amount');

            $withdrawals = WithdrawalRequest::paid()
                ->whereBetween('processed_at', [$monthStart, $monthEnd])
                ->sum('amount');

            $data[] = [
                'month' => $date->format('M Y'),
                'investments' => round($investments, 2),
                'withdrawals' => round($withdrawals, 2),
            ];
        }

        return $data;
    }

    public function getRecentActivity(int $limit = 20): array
    {
        $activities = [];

        $recentTopups = TopupRequest::with('user', 'processor')
            ->whereNotNull('processed_at')
            ->orderBy('processed_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'type' => 'topup',
                    'action' => $item->status,
                    'user' => $item->user->name,
                    'amount' => $item->amount,
                    'processor' => $item->processor?->name,
                    'date' => $item->processed_at,
                ];
            });

        $recentWithdrawals = WithdrawalRequest::with('user', 'processor')
            ->whereNotNull('processed_at')
            ->orderBy('processed_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'type' => 'withdrawal',
                    'action' => $item->status,
                    'user' => $item->user->name,
                    'amount' => $item->amount,
                    'processor' => $item->processor?->name,
                    'date' => $item->processed_at,
                ];
            });

        $activities = $recentTopups->concat($recentWithdrawals)
            ->sortByDesc('date')
            ->take($limit)
            ->values()
            ->toArray();

        return $activities;
    }

    public function getMemberDashboard(User $user): array
    {
        $projections = $this->interestService->getProjectedEarnings($user, 6);

        return [
            'total_invested' => $user->total_invested,
            'total_interest_earned' => $user->total_interest_earned,
            'available_balance' => $user->available_balance,
            'total_withdrawn' => $user->total_withdrawn,
            'pending_withdrawals' => $user->pending_withdrawals,
            'active_investments' => $user->investments()->active()->count(),
            'pending_topups' => $user->topupRequests()->pending()->count(),
            'pending_withdrawal_requests' => $user->withdrawalRequests()->pending()->count(),
            'interest_rate' => $user->default_interest_rate,
            'projections' => $projections,
            'unread_notifications' => $user->notifications()->unread()->count(),
        ];
    }

    public function getInvestmentGrowthChart(User $user, int $months = 12): array
    {
        $data = [];
        $startDate = Carbon::now()->subMonths($months - 1)->startOfMonth();

        $runningBalance = 0;

        for ($i = 0; $i < $months; $i++) {
            $date = $startDate->copy()->addMonths($i);
            $monthEnd = $date->copy()->endOfMonth();

            $investments = Investment::forUser($user->id)
                ->where('start_date', '<=', $monthEnd)
                ->get();

            $totalValue = 0;
            foreach ($investments as $investment) {
                $totalValue += $investment->amount + $investment->interest_earned;
            }

            $withdrawals = WithdrawalRequest::forUser($user->id)
                ->paid()
                ->where('processed_at', '<=', $monthEnd)
                ->sum('amount');

            $data[] = [
                'month' => $date->format('M Y'),
                'value' => round($totalValue - $withdrawals, 2),
            ];
        }

        return $data;
    }
}
