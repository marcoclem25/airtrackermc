<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(\Illuminate\Foundation\Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('flights:check-prices')->dailyAt('08:00');    // Esegue il comando per controllare i prezzi dei voli ogni giorno alle 8:00