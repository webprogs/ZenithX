<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\TopupRequest;
use App\Services\TopupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TopupRequestController extends Controller
{
    public function __construct(
        private readonly TopupService $topupService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = TopupRequest::with(['user', 'processor']);

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

    public function show(TopupRequest $topupRequest): JsonResponse
    {
        $topupRequest->load(['user', 'processor', 'investment']);

        return response()->json([
            'success' => true,
            'data' => $topupRequest,
        ]);
    }

    public function approve(Request $request, TopupRequest $topupRequest): JsonResponse
    {
        $request->validate([
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        $investment = $this->topupService->approve(
            $topupRequest,
            $request->user(),
            $request->input('remarks')
        );

        return response()->json([
            'success' => true,
            'message' => 'Top-up request approved successfully.',
            'data' => [
                'topup_request' => $topupRequest->fresh(['user', 'processor']),
                'investment' => $investment,
            ],
        ]);
    }

    public function reject(Request $request, TopupRequest $topupRequest): JsonResponse
    {
        $request->validate([
            'rejection_reason' => ['required', 'string', 'max:1000'],
            'admin_remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->topupService->reject(
            $topupRequest,
            $request->user(),
            $request->input('rejection_reason'),
            $request->input('admin_remarks')
        );

        return response()->json([
            'success' => true,
            'message' => 'Top-up request rejected.',
            'data' => $topupRequest->fresh(['user', 'processor']),
        ]);
    }
}
