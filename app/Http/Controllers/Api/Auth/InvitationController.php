<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\InvitationLink;
use Illuminate\Http\JsonResponse;

class InvitationController extends Controller
{
    public function __invoke(string $code): JsonResponse
    {
        $link = InvitationLink::where('code', $code)->first();

        if (!$link) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid invitation code.',
            ], 404);
        }

        if (!$link->isValid()) {
            $message = 'This invitation link is no longer valid.';

            if (!$link->is_active) {
                $message = 'This invitation link has been deactivated.';
            } elseif ($link->isExpired()) {
                $message = 'This invitation link has expired.';
            } elseif ($link->hasReachedMaxUses()) {
                $message = 'This invitation link has reached its maximum usage limit.';
            }

            return response()->json([
                'success' => false,
                'message' => $message,
            ], 410);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'code' => $link->code,
                'interest_rate' => $link->interest_rate,
                'assigned_role' => $link->assigned_role,
                'expires_at' => $link->expires_at?->toIso8601String(),
                'remaining_uses' => $link->remaining_uses,
            ],
        ]);
    }
}
