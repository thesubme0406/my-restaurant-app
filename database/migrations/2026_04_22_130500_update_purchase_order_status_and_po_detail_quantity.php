<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table): void {
            $table->enum('po_status', ['Pending', 'Ordered', 'Received'])->default('Pending')->change();
        });

        Schema::table('po_detail', function (Blueprint $table): void {
            $table->decimal('quantity', 10, 2)->change();
        });
    }

    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table): void {
            $table->string('po_status', 10)->change();
        });

        Schema::table('po_detail', function (Blueprint $table): void {
            $table->unsignedInteger('quantity')->change();
        });
    }
};

