<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    protected $fillable = [
        'branch_id', 'product_id', 'type', 'quantity',
        'balance_after', 'reference_type', 'reference_id',
        'notes', 'created_by',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
