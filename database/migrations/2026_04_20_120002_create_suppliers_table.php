<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suppliers', function (Blueprint $table): void {
            $table->id();
            $table->string('sup_name', 100);
            $table->string('contact_tel', 15);
            $table->string('contact_person', 50);
            $table->string('sup_address', 255);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
