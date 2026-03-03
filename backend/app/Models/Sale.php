<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number', 'branch_id', 'customer_id', 'user_id',
        'subtotal', 'discount', 'tax_amount', 'total',
        'payment_method', 'status', 'invoice_type',
        'zatca_uuid', 'zatca_status', 'notes',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function zatcaLog()
    {
        return $this->hasOne(ZatcaLog::class);
    }

    public static function generateInvoiceNumber(int $branchId): string
    {
        $prefix = 'INV-' . str_pad($branchId, 2, '0', STR_PAD_LEFT);
        $lastSale = static::where('branch_id', $branchId)
            ->orderBy('id', 'desc')
            ->first();

        $nextNumber = $lastSale ? intval(substr($lastSale->invoice_number, -6)) + 1 : 1;

        return $prefix . '-' . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    }
}
