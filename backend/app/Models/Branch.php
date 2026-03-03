<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'name_en', 'location', 'phone', 'address',
        'vat_number', 'cr_number', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }

    public function stock()
    {
        return $this->hasMany(BranchStock::class);
    }

    public function zatcaConfig()
    {
        return $this->hasOne(ZatcaConfig::class);
    }
}
