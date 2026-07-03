<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Model;
use App\Models\Trip;
use App\Models\Vehicle;
use App\Models\ExceptionLog;
use App\Models\LastDeviceCommunication;

class Device extends Model
{
    use HasFactory;

    protected $table = 'devices';
    protected $primaryKey = 'device_id';
    public $incrementing = true;
    public $timestamps = false;

    protected $fillable = [
        'vehicle_id',
        'serial_number',
        'is_active',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected $casts = [
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function vehicle(): BelongsTo 
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id', 'vehicle_id');
    }

    public function trips(): HasMany 
    {
        return $this->hasMany(Trip::class, 'device_id', 'device_id');
    }

    public function exceptionsLog(): HasMany 
    {
        return $this->hasMany(ExceptionLog::class, 'device_id', 'device_id');
    }

    public function lastDeviceCommunications(): HasMany 
    {
        return $this->hasMany(LastDeviceCommunication::class, 'device_id', 'device_id');
    }

    public function latestCommunication(): HasOne
    {
        return $this->hasOne(LastDeviceCommunication::class, 'device_id', 'device_id')
                    ->orderBy('date_time', 'desc');
    }

    public function geofences(): HasMany
    {
        return $this->hasMany(Geofence::class, 'device_id', 'device_id');
    }
}
