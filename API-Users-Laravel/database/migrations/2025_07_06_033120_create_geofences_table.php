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
        Schema::create('geofences', function (Blueprint $table) {
            $table->id('geofence_id');
            $table->unsignedInteger('device_id');
            $table->string('name')->nullable();
            $table->double('latitude');
            $table->double('longitude');
            $table->double('radius');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            // Create foreign key relationship.
            $table->foreign('device_id')->references('device_id')->on('devices');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('geofences', function (Blueprint $table) {
            // Drop foreign relation to avoid problems on drop table.
            $table->dropForeign(['device_id']);
        });
        Schema::dropIfExists('geofences');
    }
};
