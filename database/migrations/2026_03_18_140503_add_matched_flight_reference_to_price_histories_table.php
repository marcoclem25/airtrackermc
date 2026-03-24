<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('price_histories', function (Blueprint $table) {
            $table->string('matched_flight_reference')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('price_histories', function (Blueprint $table) {
            $table->dropColumn('matched_flight_reference');
        });
    }
};