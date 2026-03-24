<?php

namespace App\Services\FlightProviders;

use App\Models\TrackedFlight;

interface FlightPriceProviderInterface
{
    public function supports(TrackedFlight $flight): bool;

    public function getPriceForFlight(TrackedFlight $flight): array;
}