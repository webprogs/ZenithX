<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserService
{
    public function __construct(
        private readonly AuditService $auditService,
        private readonly NotificationService $notificationService,
        private readonly InterestService $interestService
    ) {}

    public function changeStatus(User $targetUser, string $newStatus, User $admin): User
    {
        $oldStatus = $targetUser->status;

        if ($oldStatus === $newStatus) {
            return $targetUser;
        }

        $targetUser->update(['status' => $newStatus]);

        if ($newStatus === 'active' && in_array($oldStatus, ['inactive', 'disabled'])) {
            $this->interestService->resumeInterestForUser($targetUser);
        } elseif (in_array($newStatus, ['inactive', 'disabled']) && $oldStatus === 'active') {
            $this->interestService->pauseInterestForUser($targetUser);
        }

        $this->auditService->logStatusChange($targetUser, $oldStatus, $newStatus, null, $admin);
        $this->notificationService->notifyAccountStatusChange($targetUser, $oldStatus, $newStatus);

        return $targetUser->fresh();
    }

    public function forceLogout(User $targetUser, User $admin): User
    {
        $targetUser->update(['force_logout_at' => now()]);

        $targetUser->tokens()->delete();

        $this->auditService->logForceLogout($targetUser, null, $admin);

        return $targetUser->fresh();
    }

    public function resetPassword(User $targetUser, User $admin): string
    {
        $newPassword = Str::random(12);

        $targetUser->update([
            'password' => Hash::make($newPassword),
            'force_logout_at' => now(),
        ]);

        $targetUser->tokens()->delete();

        $this->auditService->logPasswordReset($targetUser, null, $admin);

        return $newPassword;
    }

    public function toggleWithdrawalFreeze(User $targetUser, User $admin): User
    {
        $frozen = !$targetUser->withdrawal_frozen;

        $targetUser->update(['withdrawal_frozen' => $frozen]);

        $this->auditService->logWithdrawalFreeze($targetUser, $frozen, null, $admin);

        if ($frozen) {
            $this->notificationService->notifyWithdrawalFrozen($targetUser);
        } else {
            $this->notificationService->notifyWithdrawalUnfrozen($targetUser);
        }

        return $targetUser->fresh();
    }

    public function adjustInterestRate(User $targetUser, float $newRate, User $admin): User
    {
        $oldRate = $targetUser->default_interest_rate ?? 0;

        $targetUser->update(['default_interest_rate' => $newRate]);

        $this->auditService->logInterestRateChange($targetUser, $oldRate, $newRate, null, $admin);
        $this->notificationService->notifyInterestRateChange($targetUser, $oldRate, $newRate);

        return $targetUser->fresh();
    }

    public function updateLastLogin(User $user, string $ipAddress): void
    {
        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $ipAddress,
        ]);
    }

    public function getMembers()
    {
        return User::where('role', 'member')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getMemberStats(User $user): array
    {
        return [
            'total_invested' => $user->total_invested,
            'total_interest_earned' => $user->total_interest_earned,
            'available_balance' => $user->available_balance,
            'total_withdrawn' => $user->total_withdrawn,
            'pending_withdrawals' => $user->pending_withdrawals,
            'active_investments_count' => $user->investments()->active()->count(),
            'pending_topups_count' => $user->topupRequests()->pending()->count(),
            'pending_withdrawals_count' => $user->withdrawalRequests()->pending()->count(),
        ];
    }
}
