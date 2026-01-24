<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WithdrawalRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'amount',
        'destination_type',
        'account_name',
        'account_number',
        'bank_name',
        'status',
        'processed_by',
        'processed_at',
        'payout_proof',
        'rejection_reason',
        'admin_remarks',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'processed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function isCryptoTrc20(): bool
    {
        return $this->destination_type === 'crypto_trc20';
    }

    public function isBank(): bool
    {
        return $this->destination_type === 'bank';
    }

    public function approve(User $admin, ?string $remarks = null): void
    {
        $this->update([
            'status' => 'approved',
            'processed_by' => $admin->id,
            'processed_at' => now(),
            'admin_remarks' => $remarks,
        ]);
    }

    public function markPaid(User $admin, ?string $payoutProof = null, ?string $remarks = null): void
    {
        $this->update([
            'status' => 'paid',
            'processed_by' => $admin->id,
            'processed_at' => now(),
            'payout_proof' => $payoutProof,
            'admin_remarks' => $remarks,
        ]);
    }

    public function reject(User $admin, string $reason, ?string $remarks = null): void
    {
        $this->update([
            'status' => 'rejected',
            'processed_by' => $admin->id,
            'processed_at' => now(),
            'rejection_reason' => $reason,
            'admin_remarks' => $remarks,
        ]);
    }

    public function getPayoutProofUrlAttribute(): ?string
    {
        if (!$this->payout_proof) {
            return null;
        }

        return asset('storage/' . $this->payout_proof);
    }

    public function getDestinationDetailsAttribute(): string
    {
        if ($this->isCryptoTrc20()) {
            return "Crypto TRC 20: {$this->account_number} ({$this->account_name})";
        }

        return "{$this->bank_name}: {$this->account_number} ({$this->account_name})";
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}
