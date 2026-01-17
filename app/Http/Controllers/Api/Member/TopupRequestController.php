<?php

namespace App\Http\Controllers\Api\Member;

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
        $user = $request->user();

        $query = TopupRequest::forUser($user->id);

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
            'payment_method' => ['nullable', 'string', 'max:100'],
            'proof_of_payment' => ['required', 'image', 'max:5120'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $topupRequest = $this->topupService->create(
            $request->user(),
            $validated['amount'],
            $request->file('proof_of_payment'),
            $validated['payment_method'] ?? null,
            $validated['notes'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => 'Top-up request submitted successfully.',
            'data' => $topupRequest,
        ], 201);
    }

    public function show(Request $request, TopupRequest $topupRequest): JsonResponse
    {
        if ($topupRequest->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Top-up request not found.',
            ], 404);
        }

        $topupRequest->load('investment');

        return response()->json([
            'success' => true,
            'data' => $topupRequest,
        ]);
    }
}
