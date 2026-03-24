<?php

namespace App\Services\FlightProviders;

use App\Models\TrackedFlight;
use Illuminate\Support\Facades\Http;

class WizzAirPriceProvider implements FlightPriceProviderInterface
{
    public function supports(TrackedFlight $flight): bool
    {
        $airline = mb_strtolower(trim($flight->airline));

        return str_contains($airline, 'wizz');
    }

    public function getPriceForFlight(TrackedFlight $flight): array
    {
        $date = $flight->flight_date->format('Y-m-d');

        $payload = [
            'flightList' => [
                [
                    'departureStation' => strtoupper($flight->origin_iata),
                    'arrivalStation' => strtoupper($flight->destination_iata),
                    'from' => $date,
                    'to' => $date,
                ],
                [
                    'departureStation' => strtoupper($flight->destination_iata),
                    'arrivalStation' => strtoupper($flight->origin_iata),
                    'from' => $date,
                    'to' => $date,
                ],
            ],
            'priceType' => 'regular',
            'adultCount' => 1,
            'childCount' => 0,
            'infantCount' => 0,
        ];

        $response = Http::timeout(20)
            ->withHeaders([
                'User-Agent' => 'Mozilla/5.0',
                'Content-Type' => 'application/json;charset=UTF-8',
                'Referer' => 'https://wizzair.com/en-gb/flights/timetable',
                'Accept' => 'application/json, text/plain, */*',
            ])
            ->post('https://be.wizzair.com/10.1.0/Api/search/timetable', $payload);

        if (! $response->successful()) {
            return [
                'price' => null,
                'currency' => 'EUR',
                'source' => 'wizzair-http-error',
                'matched_departure_time' => null,
                'matched_flight_reference' => null,
                'match_confidence' => 'low',
            ];
        }

        $data = $response->json();

        $outboundFlights = $data['outboundFlights'] ?? [];

        if (! is_array($outboundFlights) || count($outboundFlights) === 0) {
            return [
                'price' => null,
                'currency' => 'EUR',
                'source' => 'wizzair-no-results',
                'matched_departure_time' => null,
                'matched_flight_reference' => null,
                'match_confidence' => 'low',
            ];
        }

        $bestFlight = $this->pickClosestFlightByTime(
            flights: $outboundFlights,
            targetTime: $flight->departure_time
        );

        if (! $bestFlight) {
            return [
                'price' => null,
                'currency' => 'EUR',
                'source' => 'wizzair-no-match',
                'matched_departure_time' => null,
                'matched_flight_reference' => null,
                'match_confidence' => 'low',
            ];
        }

        $price = $bestFlight['price']['amount'] ?? null;
        $currency = $bestFlight['price']['currencyCode'] ?? 'EUR';
        $matchedDepartureTime = $this->extractTimeFromWizzFlight($bestFlight);

        if ($price === null) {
            return [
                'price' => null,
                'currency' => $currency,
                'source' => 'wizzair-no-price',
                'matched_departure_time' => $matchedDepartureTime,
                'matched_flight_reference' => null,
                'match_confidence' => 'low',
            ];
        }

        $flightReference = $this->extractFlightReference($bestFlight, $flight, $matchedDepartureTime);

        return [
            'price' => number_format((float) $price, 2, '.', ''),
            'currency' => $currency,
            'source' => 'wizzair',
            'matched_departure_time' => $matchedDepartureTime,
            'matched_flight_reference' => $flightReference,
            'match_confidence' => $this->determineMatchConfidence($flightReference, $matchedDepartureTime),
        ];
    }

    protected function pickClosestFlightByTime(array $flights, ?string $targetTime): ?array
    {
        if (empty($flights)) {
            return null;
        }

        if (! $targetTime) {
            return $flights[0];
        }

        $targetMinutes = $this->timeToMinutes($targetTime);

        if ($targetMinutes === null) {
            return $flights[0];
        }

        $bestFlight = null;
        $bestDiff = null;

        foreach ($flights as $flight) {
            $flightTime = $this->extractTimeFromWizzFlight($flight);

            if (! $flightTime) {
                continue;
            }

            $flightMinutes = $this->timeToMinutes($flightTime);

            if ($flightMinutes === null) {
                continue;
            }

            $diff = abs($flightMinutes - $targetMinutes);

            if ($bestDiff === null || $diff < $bestDiff) {
                $bestDiff = $diff;
                $bestFlight = $flight;
            }
        }

        return $bestFlight ?? $flights[0];
    }

    protected function extractTimeFromWizzFlight(array $flight): ?string
    {
        $possibleFields = [
            $flight['departureDateTime'] ?? null,
            $flight['departureDate'] ?? null,
            $flight['std'] ?? null,
        ];

        foreach ($possibleFields as $field) {
            if (! is_string($field)) {
                continue;
            }

            if (preg_match('/(\d{2}:\d{2})/', $field, $matches)) {
                return $matches[1];
            }
        }

        return null;
    }

    protected function extractFlightReference(array $wizzFlight, TrackedFlight $flight, ?string $matchedDepartureTime): string
    {
        $possibleKeys = [
            $wizzFlight['flightNumber'] ?? null,
            $wizzFlight['flightCode'] ?? null,
            $wizzFlight['flightKey'] ?? null,
        ];

        foreach ($possibleKeys as $key) {
            if (is_string($key) && trim($key) !== '') {
                return trim($key);
            }
        }

        return sprintf(
            'wizzair_%s_%s_%s_%s',
            strtoupper($flight->origin_iata),
            strtoupper($flight->destination_iata),
            $flight->flight_date->format('Y-m-d'),
            $matchedDepartureTime ?? 'unknown'
        );
    }

    protected function determineMatchConfidence(?string $flightReference, ?string $matchedDepartureTime): string
    {
        if ($flightReference && !str_starts_with($flightReference, 'wizzair_')) {
            return 'high';
        }

        if ($matchedDepartureTime) {
            return 'medium';
        }

        return 'low';
    }

    protected function timeToMinutes(?string $time): ?int
    {
        if (! $time || ! preg_match('/^\d{2}:\d{2}/', $time)) {
            return null;
        }

        [$hours, $minutes] = explode(':', substr($time, 0, 5));

        return ((int) $hours * 60) + (int) $minutes;
    }
}