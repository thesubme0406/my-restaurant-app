<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('buffet_tiers', function (Blueprint $table): void {
            $table->id();
            $table->string('tier_name', 25);
            $table->decimal('price', 10, 2);
            $table->text('description')->nullable();
            $table->string('image', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('buffet_tiers');
    }
};
