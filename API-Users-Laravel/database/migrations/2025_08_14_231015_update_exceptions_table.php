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
        Schema::table('exceptions', function (Blueprint $table) {
            // 🔹 Elimina la foreign key existente (si ya existe)
            $table->dropForeign(['geofence_id']);

            // 🔹 Cambia el tipo de columna para que coincida con BIGINT UNSIGNED
            $table->unsignedBigInteger('geofence_id')->nullable()->change();

            // 🔹 Vuelve a crear el índice y la foreign key correcta
            $table->index('geofence_id', 'exceptions_geofence_id_idx');
            $table->foreign('geofence_id', 'exceptions_geofence_id_fk')
                  ->references('geofence_id')
                  ->on('geofences')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exceptions', function (Blueprint $table) {
            // 🔹 Elimina la foreign key creada
            $table->dropForeign('exceptions_geofence_id_fk');
            $table->dropIndex('exceptions_geofence_id_idx');

            // 🔹 Vuelve al tipo original UNSIGNED INT
            $table->unsignedInteger('geofence_id')->nullable()->change();

            // 🔹 Si quieres restaurar la FK original
            $table->foreign('geofence_id')
                  ->references('geofence_id')
                  ->on('geofences')
                  ->onDelete('set null');
        });
    }
};
