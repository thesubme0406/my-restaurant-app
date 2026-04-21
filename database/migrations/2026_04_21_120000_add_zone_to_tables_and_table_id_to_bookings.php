<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tables', function (Blueprint $table): void {
            $table->string('zone', 32)->default('standard')->after('capacity');
        });

        Schema::table('bookings', function (Blueprint $table): void {
            $table->foreignId('table_id')->nullable()->after('tier_id')->constrained('tables')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('table_id');
        });

        Schema::table('tables', function (Blueprint $table): void {
            $table->dropColumn('zone');
        });
    }
};
