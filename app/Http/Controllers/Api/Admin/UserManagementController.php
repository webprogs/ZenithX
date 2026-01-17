<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserManagementController extends Controller
{
    public function __construct(
        private readonly UserService $userService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($role = $request->input('role')) {
            $query->where('role', $role);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%");
            });
        }

        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $perPage = min($request->input('per_page', 15), 100);
        $users = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function show(User $user): JsonResponse
    {
        $user->load('invitationLink');

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    public function updateStatus(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:active,inactive,disabled'],
        ]);

        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot change your own status.',
            ], 403);
        }

        $this->userService->changeStatus($user, $validated['status'], $request->user());

        return response()->json([
            'success' => true,
            'message' => 'User status updated.',
            'data' => $user->fresh(),
        ]);
    }

    public function forceLogout(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot force logout yourself.',
            ], 403);
        }

        $this->userService->forceLogout($user, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'User has been logged out.',
            'data' => $user->fresh(),
        ]);
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot reset your own password through this action.',
            ], 403);
        }

        $newPassword = $this->userService->resetPassword($user, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Password has been reset.',
            'data' => [
                'temporary_password' => $newPassword,
            ],
        ]);
    }

    public function toggleWithdrawalFreeze(Request $request, User $user): JsonResponse
    {
        $this->userService->toggleWithdrawalFreeze($user, $request->user());

        return response()->json([
            'success' => true,
            'message' => $user->fresh()->withdrawal_frozen
                ? 'Withdrawals have been frozen.'
                : 'Withdrawals have been unfrozen.',
            'data' => $user->fresh(),
        ]);
    }

    public function adjustInterestRate(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'interest_rate' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $this->userService->adjustInterestRate($user, $validated['interest_rate'], $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Interest rate updated.',
            'data' => $user->fresh(),
        ]);
    }
}
