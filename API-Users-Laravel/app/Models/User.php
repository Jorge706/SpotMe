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
use Tymon\JWTAuth\Contracts\JWTSubject;
use App\Models\Role;
use App\Models\Trip;
use App\Models\DriverChange;
use App\Models\Auditlog;
use App\Models\ExceptionLog;

class User extends Authenticatable implements JWTSubject
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $table = 'users';
    protected $primaryKey = 'user_id';
    public $incrementing = true;
    public $timestamps = false;

    protected $fillable = [
        'name',
        'last_name',
        'username',
        'last_name',
        'username',
        'email',
        'nss',
        'phone',
        'role_id',
        'verification_code',
        'verification_code_expiration_date',
        'nss',
        'phone',
        'is_active',
        'is_complete',
        'token',
        'token_expirationd_date',
        'role_id',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'updated_at',
        'is_complete',
        'verification_code',
        'verification_code_expiration_date',
        'token',
        'token_expiration_date',
        'deleted_at',
        'email_verified_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        // 'email_verified_at' => 'datetime',
        'verification_code_expiration_date' => 'datetime',
        'token_expiration_date' => 'datetime',
        'deleted_at' => 'datetime',
        'created_at' => 'datetime',
    ];
    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     * @return mixed
     */
       public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key value array, containing any custom claims to be added to the JWT.
     * @return array
     */
    public function getJWTCustomClaims()
    {
        return [];
    }

    public function role(): BelongsTo {
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