<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Device;

class Trip extends Model
{
    use HasFactory;

    protected $table = 'trips';
    protected $primaryKey = 'trip_id';
    public $incrementing = true;
    public $timestamps = false;

    protected $fillable = [
        'device_id',
        'latitude',
        'longitude',
        'user_id',
    ];

    protected $casts = [
        'date_time' => 'datetime',
        'created_at' => 'datetime'
    ];

    public function user(): BelongsTo 
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function device(): BelongsTo 
    {
        return $this->belongsTo(Device::class, 'device_id', 'device_id');
    }
}
