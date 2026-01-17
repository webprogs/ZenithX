<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    public function __construct(
        private readonly UserService $userService
    ) {}

    public function __invoke(LoginRequest $request): JsonResponse
    {
        $login = $request->input('login');
        $password = $request->input('password');

        $user = User::where('email', $login)
            ->orWhere('username', $login)
            ->first();

        if (!$user || !Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (!$user->isActive()) {
            $message = match ($user->status) {
                'inactive' => 'Your account is currently inactive. Please contact support.',
                'disabled' => 'Your account has been disabled. Please contact support.',
                default => 'Your account is not active.',
            };

            throw ValidationException::withMessages([
                'login' => [$message],
            ]);
        }

        $this->userService->updateLastLogin($user, $request->ip());

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
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
                ],
                'token' => $token,
            ],
        ]);
    }
}
