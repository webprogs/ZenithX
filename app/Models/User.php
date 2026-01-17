<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'username',
        'name',
        'email',
        'password',
        'role',
        'status',
        'default_interest_rate',
        'withdrawal_frozen',
        'last_login_at',
        'last_login_ip',
        'force_logout_at',
        'phone',
        'invited_by_link_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'default_interest_rate' => 'decimal:2',
            'withdrawal_frozen' => 'boolean',
            'last_login_at' => 'datetime',
            'force_logout_at' => 'datetime',
        ];
    }

    public function invitationLink(): BelongsTo
    {
        return $this->belongsTo(InvitationLink::class, 'invited_by_link_id');
    }

    public function investments(): HasMany
    {
        return $this->hasMany(Investment::class);
    }

    public function topupRequests(): HasMany
    {
        return $this->hasMany(TopupRequest::class);
    }

    public function withdrawalRequests(): HasMany
    {
        return $this->hasMany(WithdrawalRequest::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(UserNotification::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function createdInvitationLinks(): HasMany
    {
        return $this->hasMany(InvitationLink::class, 'created_by');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isMember(): bool
    {
        return $this->role === 'member';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isInactive(): bool
    {
        return $this->status === 'inactive';
    }

    public function isDisabled(): bool
    {
        return $this->status === 'disabled';
    }

    public function canWithdraw(): bool
    {
        return $this->isActive() && !$this->withdrawal_frozen;
    }

    public function getTotalInvestedAttribute(): float
    {
        return $this->investments()
            ->whereIn('status', ['active', 'paused'])
            ->sum('amount');
    }

    public function getTotalInterestEarnedAttribute(): float
    {
        return $this->investments()->sum('interest_earned');
    }

    public function getAvailableBalanceAttribute(): float
    {
        $totalInvested = $this->total_invested;
        $totalInterest = $this->total_interest_earned;
        $pendingWithdrawals = $this->withdrawalRequests()
            ->whereIn('status', ['pending', 'approved'])
            ->sum('amount');
        $paidWithdrawals = $this->withdrawalRequests()
            ->where('status', 'paid')
            ->sum('amount');

        return ($totalInvested + $totalInterest) - $pendingWithdrawals - $paidWithdrawals;
    }

    public function getTotalWithdrawnAttribute(): float
    {
        return $this->withdrawalRequests()
            ->where('status', 'paid')
            ->sum('amount');
    }

    public function getPendingWithdrawalsAttribute(): float
    {
        return $this->withdrawalRequests()
            ->whereIn('status', ['pending', 'approved'])
            ->sum('amount');
    }
}
