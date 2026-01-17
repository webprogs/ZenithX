<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberController extends Controller
{
    public function __construct(
        private readonly UserService $userService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = User::where('role', 'member')
            ->with('invitationLink');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $perPage = min($request->input('per_page', 15), 100);
        $members = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $members->items(),
            'meta' => [
                'current_page' => $members->currentPage(),
                'last_page' => $members->lastPage(),
                'per_page' => $members->perPage(),
                'total' => $members->total(),
            ],
        ]);
    }

    public function show(User $member): JsonResponse
    {
        if (!$member->isMember()) {
            return response()->json([
                'success' => false,
                'message' => 'User is not a member.',
            ], 404);
        }

        $member->load(['invitationLink', 'investments', 'topupRequests', 'withdrawalRequests']);

        $stats = $this->userService->getMemberStats($member);

        return response()->json([
            'success' => true,
            'data' => [
                'member' => $member,
                'stats' => $stats,
            ],
        ]);
    }

    public function transactions(User $member): JsonResponse
    {
        if (!$member->isMember()) {
            return response()->json([
                'success' => false,
                'message' => 'User is not a member.',
            ], 404);
        }

        $topups = $member->topupRequests()
            ->with('processor')
            ->orderBy('created_at', 'desc')
            ->get();

        $withdrawals = $member->withdrawalRequests()
            ->with('processor')
            ->orderBy('created_at', 'desc')
            ->get();

        $investments = $member->investments()
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'topups' => $topups,
                'withdrawals' => $withdrawals,
                'investments' => $investments,
            ],
        ]);
    }

    public function export(Request $request): JsonResponse
    {
        $query = User::where('role', 'member');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $members = $query->get()->map(function ($member) {
            return [
                'ID' => $member->id,
                'Username' => $member->username,
                'Name' => $member->name,
                'Email' => $member->email,
                'Phone' => $member->phone,
                'Status' => $member->status,
                'Interest Rate' => $member->default_interest_rate . '%',
                'Total Invested' => $member->total_invested,
                'Total Interest' => $member->total_interest_earned,
                'Available Balance' => $member->available_balance,
                'Total Withdrawn' => $member->total_withdrawn,
                'Registered At' => $member->created_at->toDateTimeString(),
                'Last Login' => $member->last_login_at?->toDateTimeString(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $members,
        ]);
    }
}
