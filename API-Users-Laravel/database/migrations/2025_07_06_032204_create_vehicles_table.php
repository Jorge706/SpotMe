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
        Schema::create('vehicles', function (Blueprint $table) {
            // Create columns with datatypes.
            $table->increments('vehicle_id');
            $table->string('vehicle_name');
            $table->string('vin')->unique();
            $table->string('mark');
            $table->string('model');
            $table->smallInteger('year');
            $table->boolean('is_active');
            $table->dateTime('updated_at')->nullable();
            $table->dateTime('deleted_at')->nullable();
            $table->dateTime('created_at')->useCurrent()->nullable();

            // Create indexes to perform queries.
            $table->index(['vehicle_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
