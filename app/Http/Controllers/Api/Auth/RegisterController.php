<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use App\Services\InvitationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RegisterController extends Controller
{
    public function __construct(
        private readonly InvitationService $invitationService
    ) {}

    public function __invoke(RegisterRequest $request): JsonResponse
    {
        $invitationLink = $this->invitationService->validate($request->input('invitation_code'));

        $user = DB::transaction(function () use ($request, $invitationLink) {
            $user = User::create([
                'username' => $request->input('username'),
                'name' => $request->input('name'),
                'email' => $request->input('email'),
                'phone' => $request->input('phone'),
                'password' => Hash::make($request->input('password')),
                'role' => $invitationLink->assigned_role,
                'status' => 'active',
                'default_interest_rate' => $invitationLink->interest_rate,
                'invited_by_link_id' => $invitationLink->id,
            ]);

            $this->invitationService->useLink($invitationLink);

            return $user;
        });

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration successful.',
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
        ], 201);
    }
}
