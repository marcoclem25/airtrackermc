<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\TrackedFlightController;
use Inertia\Inertia;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/dashboard', function () {
        $user = auth()->user();

        $trackedFlights = $user->trackedFlights();
        $totalFlights = $trackedFlights->count();
        $activeFlights = $user->trackedFlights()->where('is_active', true)->count();

        return Inertia::render('dashboard', [
            'stats' => [
                'totalFlights' => $totalFlights,
                'activeFlights' => $activeFlights,
            ],
        ]);
    })->name('dashboard');

    Route::get('/flights', [TrackedFlightController::class, 'index'])->name('flights.index');
    Route::get('/flights/create', [TrackedFlightController::class, 'create'])->name('flights.create');
    Route::post('/flights', [TrackedFlightController::class, 'store'])->name('flights.store');
    Route::get('/flights/{flight}', [TrackedFlightController::class, 'show'])->name('flights.show');
    Route::post('/flights/{flight}/prices', [TrackedFlightController::class, 'storePrice'])->name('flights.prices.store');
    Route::post('/flights/{flight}/refresh-price', [TrackedFlightController::class, 'refreshPrice'])->name('flights.refresh-price');
    Route::get('/flights/{flight}/edit', [TrackedFlightController::class, 'edit'])->name('flights.edit');
    Route::put('/flights/{flight}', [TrackedFlightController::class, 'update'])->name('flights.update');
    Route::delete('/flights/{flight}', [TrackedFlightController::class, 'destroy'])->name('flights.destroy');
});

require __DIR__.'/settings.php';