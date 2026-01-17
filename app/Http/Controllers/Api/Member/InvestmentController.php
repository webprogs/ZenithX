<?php

namespace App\Http\Controllers\Api\Member;

use App\Http\Controllers\Controller;
use App\Models\Investment;
use App\Services\InterestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvestmentController extends Controller
{
    public function __construct(
        private readonly InterestService $interestService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Investment::forUser($user->id);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $perPage = min($request->input('per_page', 15), 100);
        $paginator = $query->paginate($perPage);

        $investments = collect($paginator->items());

        $grouped = $investments->groupBy(function ($investment) {
            return optional($investment->start_date)->format('F Y');
        });

        return response()->json([
            'success' => true,

            // PRIMARY LIST (shared UI expects this)
            'data' => $investments,

            // CONSISTENT META
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],

            // EXTRA DATA (dashboard-specific)
            'extras' => [
                'grouped' => $grouped,
                'summary' => [
                    'total_invested' => (float) $query->clone()->sum('amount'),
                    'total_interest' => (float) $query->clone()->sum('interest_earned'),
                    'active_count' => $query->clone()->where('status', 'active')->count(),
                ],
            ],
        ]);
    }

    public function show(Request $request, Investment $investment): JsonResponse
    {
        if ($investment->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Investment not found.',
            ], 404);
        }

        $investment->load('topupRequest');

        return response()->json([
            'success' => true,
            'data' => [
                'investment' => $investment,
                'current_balance' => $investment->current_balance,
                'monthly_interest' => $investment->calculateMonthlyInterest(),
            ],
        ]);
    }

    public function projections(Request $request): JsonResponse
    {
        $user = $request->user();
        $months = min($request->input('months', 12), 24);

        return response()->json([
            'success' => true,
            'data' => $this->interestService->getProjectedEarnings($user, $months),
        ]);
    }
}
