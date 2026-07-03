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
        Schema::create('auditlog', function (Blueprint $table) {
            // Create columns with datatypes.
            $table->unsignedInteger('user_id');
            $table->string('module');
            $table->unsignedInteger('action_id');
            $table->dateTime('date_time');
            $table->string('notes');
            $table->dateTime('created_at')->useCurrent()->nullable();

            // Create relationships With Foreign keys.
            $table->foreign('user_id')->references('user_id')->on('users');
            $table->foreign('action_id')->references('action_id')->on('actions');

            // Create indexes to perform queries.
            $table->index(['user_id', 'module']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('auditlog', function(Blueprint $table){
            // Drop foreign relation to avoid problems on drop table.
            $table->dropForeign(['user_id']);
            $table->dropForeign(['action_id']);
        });

        Schema::dropIfExists('auditlog');
    }
};
