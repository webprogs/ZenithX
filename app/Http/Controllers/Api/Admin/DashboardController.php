<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $dashboardService
    ) {}

    public function __invoke(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $this->dashboardService->getAdminStats(),
                'chart' => $this->dashboardService->getMonthlyInvestmentChart(),
                'recent_activity' => $this->dashboardService->getRecentActivity(),
            ],
        ]);
    }
}
