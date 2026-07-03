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
        Schema::create('driverchanges', function (Blueprint $table) {
            // Create columns with datatypes.
            $table->bigIncrements('driver_change_id');
            $table->unsignedInteger('user_id');
            $table->unsignedInteger('vehicle_id');
            $table->dateTime('date_time');
            $table->dateTime('created_at')->useCurrent()->nullable();

            // Create relationships With Foreign keys.
            $table->foreign('user_id')->references('user_id')->on('users');
            $table->foreign('vehicle_id')->references('vehicle_id')->on('vehicles');

            // Create indexes to perform queries.
            $table->index(['user_id', 'vehicle_id', 'date_time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('driverchanges', function(Blueprint $table){
            // Drop foreign relation to avoid problems on drop table.
            $table->dropForeign(['user_id']);
            $table->dropForeign(['vehicle_id']);
        });

        Schema::dropIfExists('driverchanges');
    }
};
