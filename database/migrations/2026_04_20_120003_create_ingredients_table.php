<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredients', function (Blueprint $table): void {
            $table->id();
            $table->string('ing_name', 100);
            $table->string('ing_unit', 20);
            $table->decimal('ing_quantity', 10, 2);
            $table->decimal('ing_min', 10, 2);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredients');
    }
};
