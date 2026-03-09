<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JournalEntry extends Model
{
    protected $fillable = [
        'branch_id', 'entry_date', 'description',
        'reference_type', 'reference_id', 'created_by',
    ];

    protected $casts = ['entry_date' => 'date'];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function lines()
    {
        return $this->hasMany(JournalEntryLine::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
