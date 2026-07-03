<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Action;

class Auditlog extends Model
{
    use HasFactory;

    protected $table = 'auditlog';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'module',
        'action_id',
        'notes',
    ];

    protected $casts = [
        'date_time' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo 
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function actions(): BelongsTo 
    {
        return $this->belongsTo(Action::class, 'action_id', 'action_id');
    }
}
