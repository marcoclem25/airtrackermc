<?php

namespace App\Services;

use App\Models\TrackedFlight;
use App\Services\FlightProviders\EasyJetPriceProvider;
use App\Services\FlightProviders\RyanairPriceProvider;
use Illuminate\Support\Facades\Log; // Assicurati di importare Log

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
                $priceData = $provider->getPriceForFlight($flight);

                // Aggiungi il log per tracciare gli orari
                Log::info('Orario di partenza:', [
                    'flight_time' => $flight->departure_time,
                    'matched_departure_time' => $priceData['matched_departure_time'],
                ]);

                // Aggiungi la tolleranza per l'orario (esempio: 5 minuti)
                $flightTime = Carbon::parse($flight->departure_time);
                $matchedDepartureTime = Carbon::parse($priceData['matched_departure_time']);

                if ($flightTime->diffInMinutes($matchedDepartureTime) <= 5) {
                    Log::info('Orario corrispondente (con tolleranza):', [
                        'flight_time' => $flight->departure_time,
                        'matched_departure_time' => $priceData['matched_departure_time'],
                    ]);
                } else {
                    Log::warning('Orario non corrispondente:', [
                        'flight_time' => $flight->departure_time,
                        'matched_departure_time' => $priceData['matched_departure_time'],
                    ]);
                }

                return $priceData;
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

        // Aggiungi il log per tracciare i dati del volo e del prezzo
        Log::info('Dati del volo:', [
            'flight_number' => $flight->flight_number,
            'departure_time' => $flight->departure_time,
            'price' => $priceData['price'],
            'matched_departure_time' => $priceData['matched_departure_time'],
        ]);

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