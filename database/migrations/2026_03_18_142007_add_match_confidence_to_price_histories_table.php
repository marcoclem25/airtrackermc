<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('price_histories', function (Blueprint $table) {
            $table->string('match_confidence')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('price_histories', function (Blueprint $table) {
            $table->dropColumn('match_confidence');
        });
    }
};