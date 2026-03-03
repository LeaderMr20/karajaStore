<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ZatcaConfig extends Model
{
    protected $fillable = [
        'branch_id', 'certificate', 'private_key', 'csr',
        'production_csid', 'compliance_csid', 'is_production',
    ];

    protected $casts = [
        'is_production' => 'boolean',
    ];

    protected $hidden = [
        'certificate', 'private_key', 'csr',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
