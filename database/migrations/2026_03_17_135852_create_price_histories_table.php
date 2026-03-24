<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_histories', function (Blueprint $table) {
            $table->id();

            $table->foreignId('tracked_flight_id')->constrained()->cascadeOnDelete();

            $table->decimal('price', 8, 2);
            $table->string('currency', 3)->default('EUR');

            $table->timestamp('checked_at');

            $table->string('source')->nullable();

            $table->timestamps();

            $table->index(['tracked_flight_id', 'checked_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_histories');
    }
};