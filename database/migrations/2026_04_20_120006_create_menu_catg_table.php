<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_catg', function (Blueprint $table): void {
            $table->id();
            $table->string('catg_name', 30);
            $table->string('image', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_catg');
    }
};
