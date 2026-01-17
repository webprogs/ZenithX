<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class InvitationLink extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'created_by',
        'interest_rate',
        'assigned_role',
        'max_uses',
        'times_used',
        'expires_at',
        'is_active',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'interest_rate' => 'decimal:2',
            'max_uses' => 'integer',
            'times_used' => 'integer',
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->code)) {
                $model->code = static::generateUniqueCode();
            }
        });
    }

    public static function generateUniqueCode(): string
    {
        do {
            $code = Str::upper(Str::random(8));
        } while (static::where('code', $code)->exists());

        return $code;
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(User::class, 'invited_by_link_id');
    }

    public function isValid(): bool
    {
        return $this->is_active && !$this->isExpired() && !$this->hasReachedMaxUses();
    }

    public function isExpired(): bool
    {
        if ($this->expires_at === null) {
            return false;
        }

        return $this->expires_at->isPast();
    }

    public function hasReachedMaxUses(): bool
    {
        if ($this->max_uses === null) {
            return false;
        }

        return $this->times_used >= $this->max_uses;
    }

    public function markUsed(): void
    {
        $this->increment('times_used');

        if ($this->hasReachedMaxUses()) {
            $this->update(['is_active' => false]);
        }
    }

    public function getRemainingUsesAttribute(): ?int
    {
        if ($this->max_uses === null) {
            return null;
        }

        return max(0, $this->max_uses - $this->times_used);
    }

    public function getFullUrlAttribute(): string
    {
        return url("/register/{$this->code}");
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeValid($query)
    {
        return $query->active()
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->where(function ($q) {
                $q->whereNull('max_uses')
                    ->orWhereColumn('times_used', '<', 'max_uses');
            });
    }
}
