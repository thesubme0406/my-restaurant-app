<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('menus')) {
            return;
        }
        if (Schema::hasColumn('menus', 'category_id')) {
            return;
        }
        if (! Schema::hasColumn('menus', 'catg_id')) {
            return;
        }

        Schema::table('menus', function (Blueprint $table): void {
            $table->renameColumn('catg_id', 'category_id');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('menus')) {
            return;
        }
        if (Schema::hasColumn('menus', 'catg_id')) {
            return;
        }
        if (! Schema::hasColumn('menus', 'category_id')) {
            return;
        }

        Schema::table('menus', function (Blueprint $table): void {
            $table->renameColumn('category_id', 'catg_id');
        });
    }
};
