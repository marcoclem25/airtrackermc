<?php

namespace App\Services;

use App\Models\TrackedFlight;
use App\Services\FlightProviders\EasyJetPriceProvider;
use App\Services\FlightProviders\RyanairPriceProvider;

class FlightPriceService
{
    protected array $providers;

    public function __construct()
    {
        $this->providers = [
            new RyanairPriceProvider(),
            new EasyJetPriceProvider(),
        ];
    }

    public function getPriceForFlight(TrackedFlight $flight): array
    {
        foreach ($this->providers as $provider) {
            if ($provider->supports($flight)) {
                return $provider->getPriceForFlight($flight);
            }
        }

        return [
            'price' => null,
            'currency' => 'EUR',
            'source' => 'unsupported-airline',
            'matched_departure_time' => null,
            'matched_flight_reference' => null,
            'match_confidence' => null,
        ];
    }

    public function refreshAndStorePrice(TrackedFlight $flight): array
    {
        $priceData = $this->getPriceForFlight($flight);

        if (empty($priceData['price'])) {
            return [
                'success' => false,
                'message' => 'Nessun prezzo trovato.',
                'data' => $priceData,
                'price_history' => null,
            ];
        }

        $priceHistory = $flight->priceHistories()->create([
            'price' => $priceData['price'],
            'currency' => $priceData['currency'] ?? 'EUR',
            'checked_at' => now(),
            'source' => $priceData['source'] ?? 'unknown',
            'matched_departure_time' => $priceData['matched_departure_time'] ?? null,
            'matched_flight_reference' => $priceData['matched_flight_reference'] ?? null,
            'match_confidence' => $priceData['match_confidence'] ?? null,
        ]);

        return [
            'success' => true,
            'message' => 'Prezzo aggiornato con successo.',
            'data' => $priceData,
            'price_history' => $priceHistory,
        ];
    }
}