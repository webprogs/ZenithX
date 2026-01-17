<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditService
{
    public function log(
        string $action,
        Model $auditable,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $description = null,
        ?User $user = null
    ): AuditLog {
        $user = $user ?? Auth::user();

        return AuditLog::create([
            'user_id' => $user?->id,
            'action' => $action,
            'auditable_type' => get_class($auditable),
            'auditable_id' => $auditable->id,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'description' => $description,
        ]);
    }

    public function logCreate(Model $auditable, ?string $description = null, ?User $user = null): AuditLog
    {
        return $this->log(
            action: 'create',
            auditable: $auditable,
            oldValues: null,
            newValues: $auditable->toArray(),
            description: $description,
            user: $user
        );
    }

    public function logUpdate(Model $auditable, array $oldValues, ?string $description = null, ?User $user = null): AuditLog
    {
        return $this->log(
            action: 'update',
            auditable: $auditable,
            oldValues: $oldValues,
            newValues: $auditable->toArray(),
            description: $description,
            user: $user
        );
    }

    public function logDelete(Model $auditable, ?string $description = null, ?User $user = null): AuditLog
    {
        return $this->log(
            action: 'delete',
            auditable: $auditable,
            oldValues: $auditable->toArray(),
            newValues: null,
            description: $description,
            user: $user
        );
    }

    public function logStatusChange(Model $auditable, string $oldStatus, string $newStatus, ?string $description = null, ?User $user = null): AuditLog
    {
        return $this->log(
            action: 'status_change',
            auditable: $auditable,
            oldValues: ['status' => $oldStatus],
            newValues: ['status' => $newStatus],
            description: $description ?? "Status changed from {$oldStatus} to {$newStatus}",
            user: $user
        );
    }

    public function logApproval(Model $auditable, ?string $description = null, ?User $user = null): AuditLog
    {
        return $this->log(
            action: 'approve',
            auditable: $auditable,
            oldValues: ['status' => 'pending'],
            newValues: ['status' => 'approved'],
            description: $description ?? 'Request approved',
            user: $user
        );
    }

    public function logRejection(Model $auditable, string $reason, ?string $description = null, ?User $user = null): AuditLog
    {
        return $this->log(
            action: 'reject',
            auditable: $auditable,
            oldValues: ['status' => 'pending'],
            newValues: ['status' => 'rejected', 'rejection_reason' => $reason],
            description: $description ?? "Request rejected: {$reason}",
            user: $user
        );
    }

    public function logInterestRateChange(User $targetUser, float $oldRate, float $newRate, ?string $description = null, ?User $admin = null): AuditLog
    {
        return $this->log(
            action: 'interest_rate_change',
            auditable: $targetUser,
            oldValues: ['default_interest_rate' => $oldRate],
            newValues: ['default_interest_rate' => $newRate],
            description: $description ?? "Interest rate changed from {$oldRate}% to {$newRate}%",
            user: $admin
        );
    }

    public function logWithdrawalFreeze(User $targetUser, bool $frozen, ?string $description = null, ?User $admin = null): AuditLog
    {
        $action = $frozen ? 'withdrawal_frozen' : 'withdrawal_unfrozen';

        return $this->log(
            action: $action,
            auditable: $targetUser,
            oldValues: ['withdrawal_frozen' => !$frozen],
            newValues: ['withdrawal_frozen' => $frozen],
            description: $description ?? ($frozen ? 'Withdrawals frozen' : 'Withdrawals unfrozen'),
            user: $admin
        );
    }

    public function logForceLogout(User $targetUser, ?string $description = null, ?User $admin = null): AuditLog
    {
        return $this->log(
            action: 'force_logout',
            auditable: $targetUser,
            oldValues: null,
            newValues: ['force_logout_at' => now()->toDateTimeString()],
            description: $description ?? 'User force logged out',
            user: $admin
        );
    }

    public function logPasswordReset(User $targetUser, ?string $description = null, ?User $admin = null): AuditLog
    {
        return $this->log(
            action: 'password_reset',
            auditable: $targetUser,
            oldValues: null,
            newValues: null,
            description: $description ?? 'Password reset by admin',
            user: $admin
        );
    }
}
