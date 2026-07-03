<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Model;
use App\Models\DriverChange;
use App\Models\Device;

class Vehicle extends Model
{
    use HasFactory;

    protected $table = 'vehicles';
    protected $primaryKey = 'vehicle_id';
    public $incrementing = true;
    public $timestamps = false;

    protected $fillable = [
        'vehicle_name',
        'vin',
        'mark',
        'model',
        'year',
        'is_active',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected $casts = [
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'created_at' => 'datetime'
    ];

    public function driverChanges(): HasMany 
    {
        return $this->hasMany(DriverChange::class, 'vehicle_id', 'vehicle_id');
    }

    public function device(): HasOne 
    {
        return $this->hasOne(Device::class, 'vehicle_id', 'vehicle_id');
    }
}
