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
        Schema::create('users', function (Blueprint $table) {
            $table->increments('user_id');
            $table->unsignedInteger('role_id');
            $table->string('name');
            $table->string('last_name');
            $table->string('username');
            $table->string('email')->unique();
            $table->unsignedBigInteger('nss')->unique();
            $table->unsignedBigInteger('phone');
            $table->string('password');
            $table->string('verification_code')->nullable();
            $table->dateTime('verification_code_expiration_date')->nullable();
            $table->boolean('is_active');
            $table->boolean('is_complete');
            $table->string('token')->nullable();
            $table->dateTime('token_expiration_date')->nullable();
            $table->dateTime('updated_at')->nullable();
            $table->dateTime('deleted_at')->nullable();
            $table->dateTime('created_at')->useCurrent()->nullable();


            // Create relationships With Foreign keys.
            $table->foreign('role_id')->references('role_id')->on('roles');

            // Create indexes to perform queries.
            $table->index(['email', 'username']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function(Blueprint $table){
            // Drop foreign relation to avoid problems on drop table.
            $table->dropForeign(['role_id']);
        });
        
        Schema::dropIfExists('users');
    }
};
