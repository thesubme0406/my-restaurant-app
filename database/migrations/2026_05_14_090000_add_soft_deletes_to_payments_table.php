<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table): void {
            $table->softDeletes();
            $table->text('deletion_reason')->nullable()->after('note');
            $table->foreignId('deleted_by_staff_id')->nullable()->after('deletion_reason')
                ->constrained('staffs')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table): void {
            $table->dropForeign(['deleted_by_staff_id']);
            $table->dropColumn(['deleted_at', 'deletion_reason', 'deleted_by_staff_id']);
        });
    }
};
