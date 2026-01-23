<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\User;
use App\Models\WithdrawalRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

class WithdrawalService
{
    public function __construct(
        private readonly AuditService $auditService,
        private readonly NotificationService $notificationService
    ) {}

    public function create(
        User $user,
        float $amount,
        string $destinationType,
        string $accountName,
        string $accountNumber,
        ?string $bankName = null
    ): WithdrawalRequest {
        $this->validateWithdrawal($user, $amount);

        if ($destinationType === 'bank' && empty($bankName)) {
            throw ValidationException::withMessages([
                'bank_name' => ['Bank name is required for bank transfers.'],
            ]);
        }

        $request = WithdrawalRequest::create([
            'user_id' => $user->id,
            'amount' => $amount,
            'destination_type' => $destinationType,
            'account_name' => $accountName,
            'account_number' => $accountNumber,
            'bank_name' => $bankName,
            'status' => 'pending',
        ]);

        $this->notificationService->notifyWithdrawalSubmitted($request);

        return $request;
    }

    private function validateWithdrawal(User $user, float $amount): void
    {
        if (!$user->canWithdraw()) {
            if ($user->withdrawal_frozen) {
                throw ValidationException::withMessages([
                    'withdrawal' => ['Your withdrawal privileges have been frozen. Please contact support.'],
                ]);
            }

            throw ValidationException::withMessages([
                'withdrawal' => ['Your account is not eligible for withdrawals.'],
            ]);
        }

        $minWithdrawal = Setting::get('minimum_withdrawal', 500);
        if ($amount < $minWithdrawal) {
            throw ValidationException::withMessages([
                'amount' => ["Minimum withdrawal amount is $" . number_format($minWithdrawal, 2)],
            ]);
        }

        $availableBalance = $user->available_balance;
        if ($amount > $availableBalance) {
            throw ValidationException::withMessages([
                'amount' => ["Insufficient balance. Available: $" . number_format($availableBalance, 2)],
            ]);
        }

        $maxPerDay = Setting::get('max_withdrawal_per_day', 100000);
        $todayWithdrawals = $user->withdrawalRequests()
            ->whereIn('status', ['pending', 'approved', 'paid'])
            ->whereDate('created_at', today())
            ->sum('amount');

        if (($todayWithdrawals + $amount) > $maxPerDay) {
            throw ValidationException::withMessages([
                'amount' => ["Daily withdrawal limit exceeded. Remaining: $" . number_format($maxPerDay - $todayWithdrawals, 2)],
            ]);
        }
    }

    public function approve(WithdrawalRequest $request, User $admin, ?string $remarks = null): WithdrawalRequest
    {
        if (!$request->isPending()) {
            throw ValidationException::withMessages([
                'status' => ['This request has already been processed.'],
            ]);
        }

        $request->approve($admin, $remarks);

        $this->auditService->logApproval($request, "Withdrawal approved: $" . number_format($request->amount, 2));
        $this->notificationService->notifyWithdrawalApproved($request);

        return $request;
    }

    public function markPaid(
        WithdrawalRequest $request,
        User $admin,
        ?UploadedFile $payoutProof = null,
        ?string $remarks = null
    ): WithdrawalRequest {
        if (!$request->isApproved()) {
            throw ValidationException::withMessages([
                'status' => ['Only approved requests can be marked as paid.'],
            ]);
        }

        $proofPath = null;
        if ($payoutProof) {
            $proofPath = $payoutProof->store('payout-proofs', 'public');
        }

        $request->markPaid($admin, $proofPath, $remarks);

        $this->auditService->log(
            'mark_paid',
            $request,
            ['status' => 'approved'],
            ['status' => 'paid'],
            "Withdrawal marked as paid: $" . number_format($request->amount, 2)
        );
        $this->notificationService->notifyWithdrawalPaid($request);

        return $request;
    }

    public function reject(WithdrawalRequest $request, User $admin, string $reason, ?string $remarks = null): WithdrawalRequest
    {
        if (!$request->isPending() && !$request->isApproved()) {
            throw ValidationException::withMessages([
                'status' => ['This request cannot be rejected.'],
            ]);
        }

        $request->reject($admin, $reason, $remarks);

        $this->auditService->logRejection($request, $reason);
        $this->notificationService->notifyWithdrawalRejected($request, $reason);

        return $request;
    }

    public function getPendingRequests()
    {
        return WithdrawalRequest::pending()
            ->with('user')
            ->orderBy('created_at', 'asc')
            ->get();
    }

    public function getApprovedRequests()
    {
        return WithdrawalRequest::approved()
            ->with('user')
            ->orderBy('created_at', 'asc')
            ->get();
    }

    public function getRequestsForUser(User $user)
    {
        return WithdrawalRequest::forUser($user->id)
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
