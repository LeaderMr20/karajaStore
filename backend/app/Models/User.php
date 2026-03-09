<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'phone', 'password', 'branch_id', 'role', 'is_active',
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'password' => 'hashed',
    ];

    // JWT Methods
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [
            'role' => $this->role,
            'branch_id' => $this->branch_id,
        ];
    }

    // Relationships
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    // Helpers
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isBranchManager(): bool
    {
        return $this->role === 'branch_manager';
    }

    public function isCashier(): bool
    {
        return $this->role === 'cashier';
    }

    public function isAccountant(): bool
    {
        return $this->role === 'accountant';
    }

    public function canAccessBranch(int $branchId): bool
    {
        return $this->isAdmin() || $this->branch_id === $branchId;
    }
}
