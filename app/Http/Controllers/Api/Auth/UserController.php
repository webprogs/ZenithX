<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(
        private readonly NotificationService $notificationService
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'phone' => $user->phone,
                    'default_interest_rate' => $user->default_interest_rate,
                    'withdrawal_frozen' => $user->withdrawal_frozen,
                    'last_login_at' => $user->last_login_at?->toIso8601String(),
                ],
                'unread_notifications' => $this->notificationService->getUnreadCount($user),
            ],
        ]);
    }
}
