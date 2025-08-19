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
        Schema::create('devices', function (Blueprint $table) {
            // Create columns with datatypes.
            $table->increments('device_id');
            $table->unsignedInteger('vehicle_id');
            $table->string('serial_number');
            $table->boolean('is_active');
            $table->dateTime('updated_at')->nullable();
            $table->dateTime('deleted_at')->nullable();
            $table->dateTime('created_at')->useCurrent()->nullable();

            // Create relationships With Foreign keys.
            $table->foreign('vehicle_id')->references('vehicle_id')->on('vehicles');

            // Create indexes to perform queries.
            $table->index(['serial_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('devices', function(Blueprint $table){
            // Drop foreign relation to avoid problems on drop table.
            $table->dropForeign(['vehicle_id']);
        });

        Schema::dropIfExists('devices');
    }
};
