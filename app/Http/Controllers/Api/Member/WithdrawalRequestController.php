<?php

namespace App\Http\Controllers\Api\Member;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\WithdrawalRequest;
use App\Services\WithdrawalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WithdrawalRequestController extends Controller
{
    public function __construct(
        private readonly WithdrawalService $withdrawalService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = WithdrawalRequest::forUser($user->id);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $query->orderBy('created_at', 'desc');

        $perPage = min($request->input('per_page', 15), 100);
        $requests = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $requests->items(),
            'meta' => [
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
                'per_page' => $requests->perPage(),
                'total' => $requests->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:1'],
            'destination_type' => ['required', 'in:gcash,bank'],
            'account_name' => ['required', 'string', 'max:255'],
            'account_number' => ['required', 'string', 'max:50'],
            'bank_name' => ['required_if:destination_type,bank', 'nullable', 'string', 'max:100'],
        ]);

        $withdrawalRequest = $this->withdrawalService->create(
            $request->user(),
            $validated['amount'],
            $validated['destination_type'],
            $validated['account_name'],
            $validated['account_number'],
            $validated['bank_name'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => 'Withdrawal request submitted successfully.',
            'data' => $withdrawalRequest,
        ], 201);
    }

    public function show(Request $request, WithdrawalRequest $withdrawalRequest): JsonResponse
    {
        if ($withdrawalRequest->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Withdrawal request not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $withdrawalRequest,
        ]);
    }

    public function balance(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'available_balance' => $user->available_balance,
                'total_invested' => $user->total_invested,
                'total_interest' => $user->total_interest_earned,
                'pending_withdrawals' => $user->pending_withdrawals,
                'can_withdraw' => $user->canWithdraw(),
            ],
        ]);
    }

    public function limits(Request $request): JsonResponse
    {
        $user = $request->user();
        $availableBalance = $user->available_balance;

        $minAmount = Setting::get('minimum_withdrawal', 500);
        $maxPerDay = Setting::get('max_withdrawal_per_day', 100000);

        // Max amount is the lesser of the daily limit or available balance
        $maxAmount = min($maxPerDay, $availableBalance);

        return response()->json([
            'success' => true,
            'data' => [
                'min_amount' => $minAmount,
                'max_amount' => max(0, $maxAmount),
                'available_balance' => $availableBalance,
                'withdrawal_frozen' => $user->withdrawal_frozen,
            ],
        ]);
    }
}
