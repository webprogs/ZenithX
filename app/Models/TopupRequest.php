<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class TopupRequest extends Model
{
    use HasFactory;

    protected $appends = ['proof_of_payment_url'];

    protected $fillable = [
        'user_id',
        'amount',
        'payment_method',
        'proof_of_payment',
        'notes',
        'status',
        'processed_by',
        'processed_at',
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

    public function investment(): HasOne
    {
        return $this->hasOne(Investment::class);
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
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

    public function getProofOfPaymentUrlAttribute(): ?string
    {
        if (!$this->proof_of_payment) {
            return null;
        }

        return asset('storage/' . $this->proof_of_payment);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
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
