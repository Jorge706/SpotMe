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
        Schema::create('trips', function (Blueprint $table) {
            // Create columns with datatypes.
            $table->bigIncrements('trip_id');
            $table->unsignedInteger('device_id');
            $table->double('latitude');
            $table->double('longitude');
            $table->dateTime('date_time');
            $table->unsignedInteger('user_id');
            $table->dateTime('created_at')->useCurrent()->nullable();

            // Create relationships With Foreign keys.
            $table->foreign('device_id')->references('device_id')->on('devices');
            $table->foreign('user_id')->references('user_id')->on('users');

            // Create indexes to perform queries.
            $table->index(['device_id', 'date_time', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            // Drop foreign relation to avoid problems on drop table.
            $table->dropForeign(['device_id']);
            $table->dropForeign(['user_id']);
        });

        Schema::dropIfExists('trips');
    }
};
