<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'name_en', 'barcode', 'category_id', 'unit',
        'purchase_price', 'sale_price', 'tax_rate', 'min_stock_alert',
        'description', 'is_active',
    ];

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function branchStock()
    {
        return $this->hasMany(BranchStock::class);
    }

    public function stockInBranch(int $branchId)
    {
        return $this->branchStock()->where('branch_id', $branchId)->first();
    }

    public function totalStock(): int
    {
        return $this->branchStock()->sum('quantity');
    }
}
