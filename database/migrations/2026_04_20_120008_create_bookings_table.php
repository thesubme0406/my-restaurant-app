<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('tier_id')->constrained('buffet_tiers')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('queue_no', 10);
            $table->tinyInteger('guest_count');
            $table->dateTime('expected_time');
            $table->enum('status', ['pending', 'called', 'skipped', 'cancelled', 'completed']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
