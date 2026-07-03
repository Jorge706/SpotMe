<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Model;
use App\Models\ExceptionLog;

class Alarm extends Model
{
    use HasFactory;

    protected $table = 'alarms';
    protected $primaryKey = 'alarm_id';
    public $incrementing = true;
    public $timestamps = false;

    protected $fillable = [
        'alarm_name',
        'description',
        'alarm_code',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime'
    ];

    public function exceptionLogs(): HasMany 
    {
        return $this->hasMany(ExceptionLog::class, 'alarm_id', 'alarm_id');
    }
}
