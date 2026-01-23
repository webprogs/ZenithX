<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
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
        $query = WithdrawalRequest::with(['user', 'processor']);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($userId = $request->input('user_id')) {
            $query->where('user_id', $userId);
        }

        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

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

    public function show(WithdrawalRequest $withdrawalRequest): JsonResponse
    {
        $withdrawalRequest->load(['user', 'processor']);

        return response()->json([
            'success' => true,
            'data' => $withdrawalRequest,
        ]);
    }

    public function approve(Request $request, WithdrawalRequest $withdrawalRequest): JsonResponse
    {
        $request->validate([
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->withdrawalService->approve(
            $withdrawalRequest,
            $request->user(),
            $request->input('remarks')
        );

        return response()->json([
            'success' => true,
            'message' => 'Withdrawal request approved.',
            'data' => $withdrawalRequest->fresh(['user', 'processor']),
        ]);
    }

    public function markPaid(Request $request, WithdrawalRequest $withdrawalRequest): JsonResponse
    {
        $request->validate([
            'payout_proof' => ['nullable', 'image', 'max:5120'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->withdrawalService->markPaid(
            $withdrawalRequest,
            $request->user(),
            $request->file('payout_proof'),
            $request->input('remarks')
        );

        return response()->json([
            'success' => true,
            'message' => 'Withdrawal marked as paid.',
            'data' => $withdrawalRequest->fresh(['user', 'processor']),
        ]);
    }

    public function reject(Request $request, WithdrawalRequest $withdrawalRequest): JsonResponse
    {
        $request->validate([
            'rejection_reason' => ['required', 'string', 'max:1000'],
            'admin_remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->withdrawalService->reject(
            $withdrawalRequest,
            $request->user(),
            $request->input('rejection_reason'),
            $request->input('admin_remarks')
        );

        return response()->json([
            'success' => true,
            'message' => 'Withdrawal request rejected.',
            'data' => $withdrawalRequest->fresh(['user', 'processor']),
        ]);
    }
}
