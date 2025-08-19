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
        Schema::create('alarms', function (Blueprint $table) {
            // Create columns with datatypes.
            $table->increments('alarm_id');
            $table->string('alarm_name');
            $table->string('description');
            $table->string('alarm_code');
            $table->boolean('is_active')->default(true);
            $table->dateTime('updated_at')->useCurrentOnUpdate()->nullable();
            $table->dateTime('created_at')->useCurrent()->nullable();
            $table->dateTime('deleted_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alarms');
    }
};
