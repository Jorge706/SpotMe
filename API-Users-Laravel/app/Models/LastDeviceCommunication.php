<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Model;
use App\Models\Device;

class LastDeviceCommunication extends Model
{
    use HasFactory;

    protected $table = 'last_device_communication';
    protected $primaryKey = 'device_id';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'device_id',
        'latitude',
        'longitude',
        'date_time',
        'is_device_communicating',
        'was_inside_geofence',
        'geofence_id',
    ];

    protected $casts = [
        'date_time' => 'datetime',
        'created_at' => 'datetime',
        'was_inside_geofence' => 'boolean',
        'is_device_communicating' => 'boolean',
    ];

    public function device(): BelongsTo 
    {
        return $this->belongsTo(Device::class, 'device_id', 'device_id');
    }

    public function geofence(): BelongsTo
    {
        return $this->belongsTo(Geofence::class, 'geofence_id', 'geofence_id');
    }
}
