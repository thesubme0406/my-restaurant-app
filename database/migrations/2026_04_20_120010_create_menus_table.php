<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menus', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('catg_id')->constrained('menu_catg')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('name', 25);
            $table->text('description')->nullable();
            $table->string('image', 255)->nullable();
            $table->boolean('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menus');
    }
};
