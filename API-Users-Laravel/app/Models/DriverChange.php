<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Vehicle;

class DriverChange extends Model
{
    use HasFactory;

    protected $table = 'driverchanges';
    protected $primaryKey = 'driver_change_id';
    public $incrementing = true;
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'vehicle_id',
    ];

    protected $casts = [
        'date_time' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo 
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function vehicle(): BelongsTo 
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id', 'vehicle_id');
    }
}
