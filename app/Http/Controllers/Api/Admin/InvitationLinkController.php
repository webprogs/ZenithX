<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\InvitationLink;
use App\Services\InvitationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvitationLinkController extends Controller
{
    public function __construct(
        private readonly InvitationService $invitationService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = InvitationLink::with(['creator', 'registrations']);

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $perPage = min($request->input('per_page', 15), 100);
        $links = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $links->items(),
            'meta' => [
                'current_page' => $links->currentPage(),
                'last_page' => $links->lastPage(),
                'per_page' => $links->perPage(),
                'total' => $links->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'interest_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'assigned_role' => ['required', 'in:admin,member'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'expires_at' => ['nullable', 'date', 'after:now'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $link = $this->invitationService->create(
            $request->user(),
            $validated['interest_rate'],
            $validated['assigned_role'],
            $validated['max_uses'] ?? null,
            isset($validated['expires_at']) ? new \DateTime($validated['expires_at']) : null,
            $validated['notes'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => 'Invitation link created successfully.',
            'data' => $link->load('creator'),
        ], 201);
    }

    public function show(InvitationLink $invitationLink): JsonResponse
    {
        $invitationLink->load(['creator', 'registrations']);

        return response()->json([
            'success' => true,
            'data' => $invitationLink,
        ]);
    }

    public function update(Request $request, InvitationLink $invitationLink): JsonResponse
    {
        $validated = $request->validate([
            'interest_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'expires_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $link = $this->invitationService->update(
            $invitationLink,
            $request->user(),
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Invitation link updated successfully.',
            'data' => $link->load('creator'),
        ]);
    }

    public function destroy(Request $request, InvitationLink $invitationLink): JsonResponse
    {
        $this->invitationService->deactivate($invitationLink, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Invitation link deactivated.',
        ]);
    }
}
