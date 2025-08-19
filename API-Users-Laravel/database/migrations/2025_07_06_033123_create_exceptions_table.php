<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('exceptions', function (Blueprint $table) {
            // Create columns with datatypes.
            $table->bigIncrements('exception_id');
            $table->unsignedInteger('device_id');
            $table->unsignedInteger('alarm_id');
            $table->unsignedBigInteger('geofence_id')->nullable();
            $table->double('latitude');
            $table->double('longitude');
            $table->dateTime('date_time');
            $table->unsignedInteger('user_id');
            $table->dateTime('created_at')->useCurrent()->nullable();

            // Create relationships With Foreign keys.
            $table->foreign('device_id')->references('device_id')->on('devices');
            $table->foreign('user_id')->references('user_id')->on('users');
            $table->foreign('alarm_id')->references('alarm_id')->on('alarms');
            $table->foreign('geofence_id')->references('geofence_id')->on('geofences')->onDelete('set null');

            // Create indexes to perform queries.
            $table->index(['device_id', 'alarm_id', 'date_time', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exceptions', function(Blueprint $table){
            // Drop foreign relation to avoid problems on drop table.
            $table->dropForeign(['device_id']);
            $table->dropForeign(['user_id']);
            $table->dropForeign(['alarm_id']);
            $table->dropForeign(['geofence_id']);
        });

        Schema::dropIfExists('exceptions');
    }
};
