<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('news', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('staff_id')->constrained('staffs')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('title', 50);
            $table->text('content');
            $table->string('image', 255)->nullable();
            $table->enum('status', ['draft', 'published', 'expired']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('news');
    }
};
