<?php

namespace App\Console\Commands;

use App\Models\TrackedFlight;
use App\Services\FlightPriceService;
use Illuminate\Console\Command;

class CheckFlightPrices extends Command
{
    protected $signature = 'flights:check-prices';

    protected $description = 'Check and store updated prices for active tracked flights';

    public function handle(FlightPriceService $flightPriceService): int
    {
        $flights = TrackedFlight::where('is_active', true)->get();

        if ($flights->isEmpty()) {
            $this->info('Nessun volo attivo da controllare.');
            return self::SUCCESS;
        }

        foreach ($flights as $flight) {
            $result = $flightPriceService->refreshAndStorePrice($flight);

            if (! $result['success']) {
                $reason = $result['data']['source'] ?? 'unknown';

                $this->warn(
                    "Nessun prezzo trovato per {$flight->origin_iata} -> {$flight->destination_iata} " .
                    "({$flight->flight_number}) [motivo: {$reason}]"
                );

                continue;
            }

            $priceData = $result['data'];

            $matchedTimeText = '';
            if (! empty($priceData['matched_departure_time'])) {
                $matchedTimeText = " - orario trovato: {$priceData['matched_departure_time']}";
            }

            $matchedReferenceText = '';
            if (! empty($priceData['matched_flight_reference'])) {
                $matchedReferenceText = " - reference: {$priceData['matched_flight_reference']}";
            }

            $this->info(
                "Prezzo salvato per volo {$flight->origin_iata} -> {$flight->destination_iata} " .
                "({$flight->flight_number}) = {$priceData['price']} {$priceData['currency']} " .
                "[fonte: {$priceData['source']}]{$matchedTimeText}{$matchedReferenceText}"
            );
        }

        $this->info('Controllo completato con successo.');

        return self::SUCCESS;
    }
}