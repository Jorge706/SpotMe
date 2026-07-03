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
        Schema::create('last_device_communication', function (Blueprint $table) {
            // Create columns with datatypes.
            $table->unsignedInteger('device_id')->primary();
            $table->double('latitude');
            $table->double('longitude');
            $table->dateTime('date_time');
            $table->boolean('is_device_communicating');
            $table->boolean('was_inside_geofence')->default(false);
            $table->unsignedBigInteger('geofence_id')->nullable();
            $table->dateTime('created_at')->useCurrent()->nullable();

            // Create relationships With Foreign keys.
            $table->foreign('device_id')->references('device_id')->on('devices');
            $table->foreign('geofence_id')->references('geofence_id')->on('geofences')->onDelete('set null');

            // Create indexes to perform queries.
            $table->index(['device_id', 'date_time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('last_device_communication', function(Blueprint $table){
            // Drop foreign relation to avoid problems on drop table.
            $table->dropForeign(['device_id']);
            $table->dropForeign(['geofence_id']);
        });
        
        Schema::dropIfExists('last_device_communication');
    }
};
