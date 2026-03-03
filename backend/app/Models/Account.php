<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    protected $fillable = ['code', 'name', 'name_en', 'type', 'parent_id', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function parent()
    {
        return $this->belongsTo(Account::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Account::class, 'parent_id');
    }

    public function journalLines()
    {
        return $this->hasMany(JournalEntryLine::class);
    }

    public function balance(): float
    {
        $debits = $this->journalLines()->sum('debit');
        $credits = $this->journalLines()->sum('credit');

        if (in_array($this->type, ['asset', 'expense'])) {
            return $debits - $credits;
        }

        return $credits - $debits;
    }
}
