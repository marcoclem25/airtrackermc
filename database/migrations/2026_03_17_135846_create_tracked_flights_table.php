<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tracked_flights', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('origin_iata', 3);
            $table->string('destination_iata', 3);

            $table->date('flight_date');
            $table->time('departure_time')->nullable();

            $table->string('airline');
            $table->string('flight_number');

            $table->text('notes')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index(['user_id', 'flight_date']);
            $table->index(['origin_iata', 'destination_iata']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tracked_flights');
    }
};