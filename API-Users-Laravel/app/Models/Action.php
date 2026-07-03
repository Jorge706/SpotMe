<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Model;
use App\Models\Auditlog;

class Action extends Model
{
    use HasFactory;

    protected $table = 'actions';
    protected $primaryKey = 'action_id';
    public $incrementing = true;
    public $timestamps = false;

    protected $fillable = [
        'action_name'
    ];

    public function auditlog(): HasMany 
    {
        return $this->hasMany(Auditlog::class, 'action_id', 'action_id');
    }
}
