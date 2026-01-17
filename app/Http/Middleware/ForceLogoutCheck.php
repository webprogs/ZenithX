<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceLogoutCheck
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        if ($user->force_logout_at) {
            $token = $user->currentAccessToken();

            if ($token && $token->created_at < $user->force_logout_at) {
                $token->delete();

                return response()->json([
                    'success' => false,
                    'message' => 'Your session has been terminated. Please log in again.',
                    'force_logout' => true,
                ], 401);
            }
        }

        return $next($request);
    }
}
