<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_detail', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('service_id')->constrained('services')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('table_id')->constrained('tables')->cascadeOnUpdate()->restrictOnDelete();
            $table->unique(['service_id', 'table_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_detail');
    }
};
