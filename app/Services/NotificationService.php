<?php

namespace App\Services;

use App\Models\TopupRequest;
use App\Models\User;
use App\Models\UserNotification;
use App\Models\WithdrawalRequest;

class NotificationService
{
    public function create(
        User $user,
        string $type,
        string $title,
        string $message,
        ?array $data = null
    ): UserNotification {
        return UserNotification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);
    }

    public function notifyTopupSubmitted(TopupRequest $request): void
    {
        $this->create(
            $request->user,
            'topup_submitted',
            'Top-Up Request Submitted',
            "Your top-up request of ₱" . number_format($request->amount, 2) . " has been submitted and is pending review.",
            ['topup_request_id' => $request->id]
        );
    }

    public function notifyTopupApproved(TopupRequest $request): void
    {
        $this->create(
            $request->user,
            'topup_approved',
            'Top-Up Request Approved',
            "Your top-up request of ₱" . number_format($request->amount, 2) . " has been approved. Your investment is now active.",
            ['topup_request_id' => $request->id]
        );
    }

    public function notifyTopupRejected(TopupRequest $request, string $reason): void
    {
        $this->create(
            $request->user,
            'topup_rejected',
            'Top-Up Request Rejected',
            "Your top-up request of ₱" . number_format($request->amount, 2) . " has been rejected. Reason: {$reason}",
            ['topup_request_id' => $request->id, 'reason' => $reason]
        );
    }

    public function notifyWithdrawalSubmitted(WithdrawalRequest $request): void
    {
        $this->create(
            $request->user,
            'withdrawal_submitted',
            'Withdrawal Request Submitted',
            "Your withdrawal request of ₱" . number_format($request->amount, 2) . " has been submitted and is pending approval.",
            ['withdrawal_request_id' => $request->id]
        );
    }

    public function notifyWithdrawalApproved(WithdrawalRequest $request): void
    {
        $this->create(
            $request->user,
            'withdrawal_approved',
            'Withdrawal Request Approved',
            "Your withdrawal request of ₱" . number_format($request->amount, 2) . " has been approved and is being processed.",
            ['withdrawal_request_id' => $request->id]
        );
    }

    public function notifyWithdrawalPaid(WithdrawalRequest $request): void
    {
        $this->create(
            $request->user,
            'withdrawal_paid',
            'Withdrawal Completed',
            "Your withdrawal of ₱" . number_format($request->amount, 2) . " has been sent to your {$request->destination_type} account.",
            ['withdrawal_request_id' => $request->id]
        );
    }

    public function notifyWithdrawalRejected(WithdrawalRequest $request, string $reason): void
    {
        $this->create(
            $request->user,
            'withdrawal_rejected',
            'Withdrawal Request Rejected',
            "Your withdrawal request of ₱" . number_format($request->amount, 2) . " has been rejected. Reason: {$reason}",
            ['withdrawal_request_id' => $request->id, 'reason' => $reason]
        );
    }

    public function notifyAccountStatusChange(User $user, string $oldStatus, string $newStatus): void
    {
        $this->create(
            $user,
            'account_status_changed',
            'Account Status Updated',
            "Your account status has been changed from {$oldStatus} to {$newStatus}.",
            ['old_status' => $oldStatus, 'new_status' => $newStatus]
        );
    }

    public function notifyInterestRateChange(User $user, float $oldRate, float $newRate): void
    {
        $this->create(
            $user,
            'interest_rate_changed',
            'Interest Rate Updated',
            "Your interest rate has been updated from {$oldRate}% to {$newRate}%.",
            ['old_rate' => $oldRate, 'new_rate' => $newRate]
        );
    }

    public function notifyWithdrawalFrozen(User $user): void
    {
        $this->create(
            $user,
            'withdrawal_frozen',
            'Withdrawal Privileges Frozen',
            "Your withdrawal privileges have been temporarily frozen. Please contact support for more information.",
            []
        );
    }

    public function notifyWithdrawalUnfrozen(User $user): void
    {
        $this->create(
            $user,
            'withdrawal_unfrozen',
            'Withdrawal Privileges Restored',
            "Your withdrawal privileges have been restored. You can now submit withdrawal requests.",
            []
        );
    }

    public function getUnreadCount(User $user): int
    {
        return UserNotification::forUser($user->id)->unread()->count();
    }

    public function getNotifications(User $user, int $limit = 20)
    {
        return UserNotification::forUser($user->id)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    public function markAsRead(UserNotification $notification): void
    {
        $notification->markAsRead();
    }

    public function markAllAsRead(User $user): int
    {
        return UserNotification::forUser($user->id)
            ->unread()
            ->update(['read_at' => now()]);
    }

    public function clearAll(User $user): int
    {
        return UserNotification::forUser($user->id)->delete();
    }

    public function delete(UserNotification $notification): void
    {
        $notification->delete();
    }
}
