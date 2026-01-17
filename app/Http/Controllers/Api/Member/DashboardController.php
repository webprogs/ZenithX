<?php

namespace App\Http\Controllers\Api\Member;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $dashboardService
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => $this->dashboardService->getMemberDashboard($user),
        ]);
    }

    public function chart(Request $request): JsonResponse
    {
        $user = $request->user();
        $months = min($request->input('months', 12), 24);

        return response()->json([
            'success' => true,
            'data' => $this->dashboardService->getInvestmentGrowthChart($user, $months),
        ]);
    }
}
