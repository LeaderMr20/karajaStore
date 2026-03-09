<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ZatcaLog extends Model
{
    protected $fillable = [
        'sale_id', 'uuid', 'invoice_hash', 'xml_content',
        'qr_code', 'status', 'response', 'error_message',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }
}
