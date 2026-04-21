<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnUpdate()->restrictOnDelete();
            $table->dateTime('start_time')->useCurrent();
            $table->dateTime('end_time')->nullable();
            $table->enum('status', ['in_service', 'completed']);
            $table->string('service_code', 10)->unique();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
