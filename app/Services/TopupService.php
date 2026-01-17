<?php

namespace App\Services;

use App\Models\Investment;
use App\Models\Setting;
use App\Models\TopupRequest;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TopupService
{
    public function __construct(
        private readonly AuditService $auditService,
        private readonly NotificationService $notificationService
    ) {}

    public function create(
        User $user,
        float $amount,
        UploadedFile $proofOfPayment,
        ?string $paymentMethod = null,
        ?string $notes = null
    ): TopupRequest {
        $minTopup = Setting::get('minimum_topup', 1000);

        if ($amount < $minTopup) {
            throw ValidationException::withMessages([
                'amount' => ["Minimum top-up amount is ₱" . number_format($minTopup, 2)],
            ]);
        }

        $proofPath = $proofOfPayment->store('topup-proofs', 'public');

        $request = TopupRequest::create([
            'user_id' => $user->id,
            'amount' => $amount,
            'payment_method' => $paymentMethod,
            'proof_of_payment' => $proofPath,
            'notes' => $notes,
            'status' => 'pending',
        ]);

        $this->notificationService->notifyTopupSubmitted($request);

        return $request;
    }

    public function approve(TopupRequest $request, User $admin, ?string $remarks = null): Investment
    {
        if (!$request->isPending()) {
            throw ValidationException::withMessages([
                'status' => ['This request has already been processed.'],
            ]);
        }

        return DB::transaction(function () use ($request, $admin, $remarks) {
            $request->approve($admin, $remarks);

            $user = $request->user;
            $interestRate = $user->default_interest_rate ?? Setting::get('default_interest_rate', 5.00);

            $investment = Investment::create([
                'user_id' => $user->id,
                'topup_request_id' => $request->id,
                'amount' => $request->amount,
                'interest_rate' => $interestRate,
                'interest_earned' => 0,
                'status' => 'active',
                'start_date' => now()->toDateString(),
            ]);

            $this->auditService->logApproval($request, "Top-up approved: ₱" . number_format($request->amount, 2));
            $this->notificationService->notifyTopupApproved($request);

            return $investment;
        });
    }

    public function reject(TopupRequest $request, User $admin, string $reason, ?string $remarks = null): TopupRequest
    {
        if (!$request->isPending()) {
            throw ValidationException::withMessages([
                'status' => ['This request has already been processed.'],
            ]);
        }

        $request->reject($admin, $reason, $remarks);

        $this->auditService->logRejection($request, $reason);
        $this->notificationService->notifyTopupRejected($request, $reason);

        return $request;
    }

    public function getPendingRequests()
    {
        return TopupRequest::pending()
            ->with('user')
            ->orderBy('created_at', 'asc')
            ->get();
    }

    public function getRequestsForUser(User $user)
    {
        return TopupRequest::forUser($user->id)
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
