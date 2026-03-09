<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseItem extends Model
{
    protected $fillable = [
        'purchase_id', 'product_id', 'quantity', 'unit_price', 'tax_amount', 'total',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
