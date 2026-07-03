<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class Geofence extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'geofences';
    protected $primaryKey = 'geofence_id';
    public $incrementing = true;
    public $timestamps = true;

    protected $fillable = [
        'device_id',
        'name',
        'latitude',
        'longitude',
        'radius',
        'is_active',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function device()
    {
        return $this->belongsTo('App\Models\Device', 'device_id', 'device_id');
    }

    public function exceptionLogs()
    {
        return $this->hasMany('App\Models\ExceptionLog', 'geofence_id', 'geofence_id');
    }
}
