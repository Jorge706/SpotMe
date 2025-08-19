<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TwoFactorController;
use App\Http\Controllers\Auth\UserController as AuthUserController;
use App\Http\Controllers\CompleteRegistrationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Auth\CustomOAuthController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\AlarmsController;
use App\Http\Controllers\RolesController;
use App\Http\Controllers\Auth\PasswordController;


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('jwt.auth')->get('/user', function (Request $request) {
    return $request->user();
});

// =========================
// OAUTH2 CUSTOM FLOW
// =========================

// OAuth2 Custom Flow
Route::post('/oauth/auth', [CustomOAuthController::class, 'initiateAuth']);
Route::post('/oauth/token', [CustomOAuthController::class, 'completeAuth']);
Route::get('/oauth/config', [CustomOAuthController::class, 'getClientConfig']);

// OAuth2 Logout Routes (protected)
Route::middleware(['jwt.auth'])->group(function () {
    Route::post('/oauth/logout', [CustomOAuthController::class, 'logout']);
});

// =========================
// USER MANAGEMENT ROUTES
// =========================

// User Registration & Management
Route::post('/auth/register', [AuthUserController::class, 'registerUser']);
Route::patch('/complete/user/register', [CompleteRegistrationController::class, 'completeUserRegistration']);

// =========================
// TWO FACTOR AUTHENTICATION
// =========================

Route::post('/two-factor/send', [TwoFactorController::class, 'sendCode']);
Route::post('/two-factor/verify', [TwoFactorController::class, 'verifyCode']);

// =========================
// PASSWORD MANAGEMENT
// =========================

// Password change routes (protected with JWT)
Route::middleware(['jwt.auth'])->group(function () {
    Route::patch('/user/change-password', [PasswordController::class, 'changePassword']);
});

// Password reset route (public - no JWT required)
// Single endpoint handles both: request code and reset password
Route::post('/auth/reset-password', [PasswordController::class, 'resetPassword']);



Route::group(['middleware' => ['jwt.auth']], function () {

    // =========================
    // USER MANAGEMENT ROUTES
    // =========================

    Route::prefix('users')->group(function () {
        Route::post('/', [UserController::class, 'store']);
        Route::get('/', [UserController::class, 'index']);
        Route::get('/{id}', [UserController::class, 'show']);
        Route::patch('/{id}', [UserController::class,'update']);
        Route::delete('/{id}', [UserController::class, 'destroy']);
    });

    // =========================
    // VEHICLE MANAGEMENT ROUTES
    // =========================

    // Vehicle CRUD operations (protected routes)
    Route::prefix('vehicles')->group(function () {
        Route::get('/', [VehicleController::class, 'index']);
        Route::post('/', [VehicleController::class, 'store']);
        Route::get('/{id}', [VehicleController::class, 'show']);
        Route::patch('/{id}', [VehicleController::class, 'update']);
        Route::delete('/{id}', [VehicleController::class, 'destroy']);
    });

    // =========================
    // DEVICE MANAGEMENT ROUTES
    // =========================

    // Device CRUD operations (protected routes) - JWT COMENTADO PARA PRUEBAS
    Route::prefix('devices')->group(function () {
        Route::get('/', [DeviceController::class, 'index']);
        Route::post('/', [DeviceController::class, 'store']);
        Route::get('/{id}', [DeviceController::class, 'show']);
        Route::patch('/{id}', [DeviceController::class, 'update']);
        Route::delete('/{id}', [DeviceController::class, 'destroy']);
    });

    // =========================
    // ALARM MANAGEMENT ROUTES
    // =========================

    Route::prefix('alarms')->group(function () { 
        Route::get('/', [AlarmsController::class,'index']);
        Route::get('/{id}', [AlarmsController::class,'show']);
        Route::post('/', [AlarmsController::class,'store']);
        Route::patch('/{id}', [AlarmsController::class,'update']);
        Route::delete('/{id}', [AlarmsController::class,'destroy']);
    });

    // =========================
    // ROLE MANAGEMENT ROUTES
    // =========================

    Route::prefix('roles')->group( function () {
        Route::get('/', [RolesController::class,'getAllRoles']);
        Route::get('/{id}', [RolesController::class,'getRole']);
    });
});
