<?php

namespace App\Services;

use App\Models\InvitationLink;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class InvitationService
{
    public function __construct(
        private readonly AuditService $auditService
    ) {}

    public function create(
        User $creator,
        float $interestRate,
        string $assignedRole = 'member',
        ?int $maxUses = null,
        ?\DateTimeInterface $expiresAt = null,
        ?string $notes = null
    ): InvitationLink {
        $link = InvitationLink::create([
            'created_by' => $creator->id,
            'interest_rate' => $interestRate,
            'assigned_role' => $assignedRole,
            'max_uses' => $maxUses,
            'expires_at' => $expiresAt,
            'notes' => $notes,
            'is_active' => true,
        ]);

        $this->auditService->logCreate($link, 'Invitation link created');

        return $link;
    }

    public function validate(string $code): InvitationLink
    {
        $link = InvitationLink::where('code', $code)->first();

        if (!$link) {
            throw ValidationException::withMessages([
                'code' => ['Invalid invitation code.'],
            ]);
        }

        if (!$link->is_active) {
            throw ValidationException::withMessages([
                'code' => ['This invitation link has been deactivated.'],
            ]);
        }

        if ($link->isExpired()) {
            throw ValidationException::withMessages([
                'code' => ['This invitation link has expired.'],
            ]);
        }

        if ($link->hasReachedMaxUses()) {
            throw ValidationException::withMessages([
                'code' => ['This invitation link has reached its maximum usage limit.'],
            ]);
        }

        return $link;
    }

    public function useLink(InvitationLink $link): void
    {
        $link->markUsed();
    }

    public function deactivate(InvitationLink $link, User $admin): void
    {
        $oldValues = $link->toArray();
        $link->update(['is_active' => false]);

        $this->auditService->logUpdate(
            $link,
            $oldValues,
            'Invitation link deactivated',
            $admin
        );
    }

    public function update(
        InvitationLink $link,
        User $admin,
        array $data
    ): InvitationLink {
        $oldValues = $link->toArray();

        $link->update($data);

        $this->auditService->logUpdate(
            $link,
            $oldValues,
            'Invitation link updated',
            $admin
        );

        return $link->fresh();
    }

    public function getValidLink(string $code): ?InvitationLink
    {
        return InvitationLink::valid()->where('code', $code)->first();
    }

    public function deactivateExpired(): int
    {
        return InvitationLink::where('is_active', true)
            ->where('expires_at', '<', now())
            ->update(['is_active' => false]);
    }
}
