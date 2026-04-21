<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staffs', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 25);
            $table->string('surname', 25);
            $table->string('username', 25)->unique();
            $table->string('password', 255);
            $table->enum('role', ['manager', 'staff']);
            $table->string('image', 255)->nullable();
            $table->text('address')->nullable();
            $table->string('phone')->unique();
            $table->timestamps();
            $table->rememberToken();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staffs');
    }
};
