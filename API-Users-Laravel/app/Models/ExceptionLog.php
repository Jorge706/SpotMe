<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Alarm;
use App\Models\Device;

class ExceptionLog extends Model
{
    use HasFactory;

    protected $table = 'exceptions';
    protected $primaryKey = 'exception_id';
    public $incrementing = true;
    public $timestamps = false;

    protected $fillable = [
        'device_id',
        'alarm_id',
        'geofence_id',
        'latitude',
        'longitude',
        'date_time',
        'user_id',
        'created_at',
    ];

    protected $casts = [
        'date_time' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo 
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function alarm(): BelongsTo 
    {
        return $this->belongsTo(Alarm::class, 'alarm_id', 'alarm_id');
    }

    public function device(): BelongsTo 
    {
        return $this->belongsTo(Device::class, 'device_id', 'device_id');
    }

    public function geofence(): BelongsTo
    {
        return $this->belongsTo(Geofence::class, 'geofence_id', 'geofence_id');
    }
}
