<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TripsController;
use App\Http\Controllers\ExceptionsController;
use App\Http\Controllers\DriverChangesController;
use App\Http\Controllers\LastDeviceCommunicationController;
use App\Http\Controllers\GeofencesController;

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

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware(['jwt.auth'])->group(function() {
    // Trips
    Route::prefix('trips')->group(function () {
        Route::get('/search/devices', [TripsController::class, 'getTripsByDeviceAtDay']);
        Route::get('/search/dates-range', [TripsController::class, 'getTripsByDateRanges']);
        Route::get('/search/devices/date-range', [TripsController::class, 'getTripsByDeviceAndDateRanges']);
    });

    // Exceptions
    Route::prefix('exceptions')->group(function() {
        Route::get('/search/device', [ExceptionsController::class, 'getExceptionsByDeviceAtDay']);
        Route::get('/search/dates-range', [ExceptionsController::class,'getExceptionsByDateRanges']);
        Route::get('/search/devices/date-range', [ExceptionsController::class,'getExceptionsByDeviceAndDateRanges']);
        Route::post('/insert/virtual-button', [ExceptionsController::class, 'insertVirtualButtonException']);
    });

    // DriverChanges
    Route::prefix('driver-changes')->group(function() {
        Route::get('/search/vehicle', [DriverChangesController::class,'getDriverChangesByVehicleAtDay']);
        Route::get('/search/date-ranges', [DriverChangesController::class,'getDriverChangesByDateRanges']);
        Route::get('/search/vehicle/date-ranges', [DriverChangesController::class,'getDriverChangesByVehicleAndDateRanges']);
    });

    // LastDeviceCommunication
    Route::prefix('last-device-communication')->group(function() {
        Route::get('/search', [LastDeviceCommunicationController::class,'getLastDeviceCommunication']);
    });

    // Geofences
    Route::prefix('geofences')->group(function(){
        Route::get('/', [GeofencesController::class, 'index']);
        Route::post('/', [GeofencesController::class, 'store']);
        Route::get('/{id}', [GeofencesController::class, 'show']);
        Route::patch('/{id}', [GeofencesController::class, 'update']);
        Route::delete('/{id}', [GeofencesController::class, 'destroy']);
    });
});

// // Websockets / Broadcast
// Broadcast::routes(['middleware' => ['jwt.auth']]);

// Trips
Route::post('/trips/insert', [TripsController::class, 'insertTrips']);

// Exceptions
Route::post('/exceptions/insert', [ExceptionsController::class,'insertExceptions']);

// DriverChanges
Route::post('/driver-changes/insert', [DriverChangesController::class, 'insertDriverChanges']);