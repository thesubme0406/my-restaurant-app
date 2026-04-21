<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tables', function (Blueprint $table): void {
            $table->id();
            $table->string('table_no', 10)->unique();
            $table->tinyInteger('capacity');
            $table->enum('status', ['available', 'occupied', 'maintenance']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tables');
    }
};
