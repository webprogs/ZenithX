<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (!$user->isActive()) {
            $message = match ($user->status) {
                'inactive' => 'Your account is currently inactive. Please contact support.',
                'disabled' => 'Your account has been disabled. Please contact support.',
                default => 'Your account is not active.',
            };

            return response()->json([
                'success' => false,
                'message' => $message,
                'status' => $user->status,
            ], 403);
        }

        return $next($request);
    }
}
