<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Trip;
use App\Models\Role;
use App\Models\DriverChange;
use App\Models\Auditlog;
use App\Models\ExceptionLog;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'users';
    protected $primaryKey = 'user_id';
    public $incrementing = true;
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'last_name',
        'user_name',
        'email',
        'password',
        'verification_code',
        'verification_code_expiration_date',
        'nss',
        'phone',
        'is_active',
        'is_complete',
        'token',
        'token_expiration_date',
        'role_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'verification_code_expiration_date' => 'datetime',
        'token_expiration_date' => 'datetime',
        'deleted_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function role(): BelongsTo 
    {
        return $this->belongsTo(Role::class, 'role_id', 'role_id');
    }

    public function exceptionLogs(): HasMany 
    {
        return $this->hasMany(ExceptionLog::class, 'user_id', 'user_id');
    }

    public function trips(): HasMany 
    {
        return $this->hasMany(Trip::class, 'user_id', 'user_id');
    }

    public function driverChanges(): HasMany 
    {
        return $this->hasMany(DriverChange::class, 'user_id', 'user_id');
    }

    public function auditLogs(): HasMany 
    {
        return $this->hasMany(Auditlog::class, 'user_id', 'user_id');
    }
}
