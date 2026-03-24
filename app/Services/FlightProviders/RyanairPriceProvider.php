<?php

namespace App\Services\FlightProviders;

use App\Models\TrackedFlight;
use Illuminate\Support\Facades\Http;

class RyanairPriceProvider implements FlightPriceProviderInterface
{
    protected const TIME_TOLERANCE_MINUTES = 120;

    public function supports(TrackedFlight $flight): bool
    {
        $airline = mb_strtolower(trim($flight->airline));

        return str_contains($airline, 'ryanair');
    }

    public function getPriceForFlight(TrackedFlight $flight): array
    {
        $date = $flight->flight_date->format('Y-m-d');

        $fareResponse = Http::timeout(20)
            ->acceptJson()
            ->get('https://www.ryanair.com/api/farfnd/v4/oneWayFares', [
                'departureAirportIataCode' => $flight->origin_iata,
                'arrivalAirportIataCode' => $flight->destination_iata,
                'outboundDepartureDateFrom' => $date,
                'outboundDepartureDateTo' => $date,
                'market' => 'it-it',
                'language' => 'it',
            ]);

        if (! $fareResponse->successful()) {
            return [
                'price' => null,
                'currency' => 'EUR',
                'source' => 'ryanair-http-error',
                'matched_departure_time' => null,
                'matched_flight_reference' => null,
            ];
        }

        $fareData = $fareResponse->json();

        if (
            ! is_array($fareData) ||
            ! isset($fareData['fares']) ||
            ! is_array($fareData['fares']) ||
            count($fareData['fares']) === 0
        ) {
            return [
                'price' => null,
                'currency' => 'EUR',
                'source' => 'ryanair-no-results',
                'matched_departure_time' => null,
                'matched_flight_reference' => null,
            ];
        }

        $bestFare = $this->pickClosestFareByTime(
            fares: $fareData['fares'],
            targetTime: $flight->departure_time
        );

        if (! $bestFare || ! isset($bestFare['outbound']['price']['value'])) {
            return [
                'price' => null,
                'currency' => 'EUR',
                'source' => 'ryanair-no-price',
                'matched_departure_time' => null,
                'matched_flight_reference' => null,
            ];
        }

        $matchedDepartureTime = $this->extractTimeFromFare($bestFare);

        if (! $this->isWithinTimeTolerance($flight->departure_time, $matchedDepartureTime)) {
            return [
                'price' => null,
                'currency' => 'EUR',
                'source' => 'ryanair-time-mismatch',
                'matched_departure_time' => $matchedDepartureTime,
                'matched_flight_reference' => null,
                'match_confidence' => 'low',
            ];
        }

        $flightReference = $this->resolveFlightReference(
            flight: $flight,
            matchedDepartureTime: $matchedDepartureTime
        );

        return [
            'price' => number_format((float) $bestFare['outbound']['price']['value'], 2, '.', ''),
            'currency' => $bestFare['outbound']['price']['currencyCode'] ?? 'EUR',
            'source' => 'ryanair',
            'matched_departure_time' => $matchedDepartureTime,
            'matched_flight_reference' => $flightReference,
            'match_confidence' => $this->determineMatchConfidence($flightReference, $matchedDepartureTime),
        ];
    }

    protected function resolveFlightReference(TrackedFlight $flight, ?string $matchedDepartureTime): string
    {
        $referenceFromAvailability = $this->getReferenceFromAvailability($flight, $matchedDepartureTime);

        if ($referenceFromAvailability) {
            return $referenceFromAvailability;
        }

        return $this->buildFallbackFlightReference($flight, $matchedDepartureTime);
    }

    protected function getReferenceFromAvailability(TrackedFlight $flight, ?string $matchedDepartureTime): ?string
    {
        $date = $flight->flight_date->format('Y-m-d');

        $availabilityResponse = Http::timeout(20)
            ->acceptJson()
            ->get(
                "https://www.ryanair.com/api/farfnd/v4/oneWayFares/{$flight->origin_iata}/{$flight->destination_iata}/availabilities",
                [
                    'outboundDateFrom' => $date,
                    'outboundDateTo' => $date,
                    'market' => 'it-it',
                    'language' => 'it',
                ]
            );

        if (! $availabilityResponse->successful()) {
            return null;
        }

        $availabilityData = $availabilityResponse->json();

        $candidates = $this->extractAvailabilityFlights($availabilityData);

        if (empty($candidates)) {
            return null;
        }

        $bestCandidate = $this->pickClosestAvailabilityByTime($candidates, $matchedDepartureTime ?? $flight->departure_time);

        if (! $bestCandidate) {
            return null;
        }

        if (! empty($bestCandidate['flightNumber']) && is_string($bestCandidate['flightNumber'])) {
            return $bestCandidate['flightNumber'];
        }

        if (! empty($bestCandidate['flightKey']) && is_string($bestCandidate['flightKey'])) {
            return $bestCandidate['flightKey'];
        }

        return null;
    }

    protected function extractAvailabilityFlights(mixed $availabilityData): array
    {
        if (! is_array($availabilityData)) {
            return [];
        }

        $results = [];

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveArrayIterator($availabilityData),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $item) {
            if (! is_array($item)) {
                continue;
            }

            $hasTime =
                isset($item['time']) ||
                isset($item['departureTime']) ||
                isset($item['departureDate']) ||
                isset($item['dateTime']);

            $hasReference =
                isset($item['flightNumber']) ||
                isset($item['flightKey']);

            if ($hasTime && $hasReference) {
                $results[] = $item;
            }
        }

        return $results;
    }

    protected function pickClosestAvailabilityByTime(array $candidates, ?string $targetTime): ?array
    {
        if (empty($candidates)) {
            return null;
        }

        if (! $targetTime) {
            return $candidates[0];
        }

        $targetMinutes = $this->timeToMinutes($targetTime);

        if ($targetMinutes === null) {
            return $candidates[0];
        }

        $bestCandidate = null;
        $bestDiff = null;

        foreach ($candidates as $candidate) {
            $candidateTime = $this->extractTimeFromAvailabilityCandidate($candidate);

            if (! $candidateTime) {
                continue;
            }

            $candidateMinutes = $this->timeToMinutes($candidateTime);

            if ($candidateMinutes === null) {
                continue;
            }

            $diff = abs($candidateMinutes - $targetMinutes);

            if ($bestDiff === null || $diff < $bestDiff) {
                $bestDiff = $diff;
                $bestCandidate = $candidate;
            }
        }

        return $bestCandidate ?? $candidates[0];
    }

    protected function extractTimeFromAvailabilityCandidate(array $candidate): ?string
    {
        $possibleFields = [
            $candidate['time'] ?? null,
            $candidate['departureTime'] ?? null,
            $candidate['departureDate'] ?? null,
            $candidate['dateTime'] ?? null,
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

    protected function pickClosestFareByTime(array $fares, ?string $targetTime): ?array
    {
        if (empty($fares)) {
            return null;
        }

        if (! $targetTime) {
            return $fares[0];
        }

        $targetMinutes = $this->timeToMinutes($targetTime);

        if ($targetMinutes === null) {
            return $fares[0];
        }

        $bestFare = null;
        $bestDiff = null;

        foreach ($fares as $fare) {
            $fareTime = $this->extractTimeFromFare($fare);

            if (! $fareTime) {
                continue;
            }

            $fareMinutes = $this->timeToMinutes($fareTime);

            if ($fareMinutes === null) {
                continue;
            }

            $diff = abs($fareMinutes - $targetMinutes);

            if ($bestDiff === null || $diff < $bestDiff) {
                $bestDiff = $diff;
                $bestFare = $fare;
            }
        }

        return $bestFare ?? $fares[0];
    }

    protected function extractTimeFromFare(array $fare): ?string
    {
        $departureDate = $fare['outbound']['departureDate'] ?? null;

        if (! is_string($departureDate) || strlen($departureDate) < 16) {
            return null;
        }

        return substr($departureDate, 11, 5);
    }

    protected function timeToMinutes(?string $time): ?int
    {
        if (! $time || ! preg_match('/^\d{2}:\d{2}/', $time)) {
            return null;
        }

        [$hours, $minutes] = explode(':', substr($time, 0, 5));

        return ((int) $hours * 60) + (int) $minutes;
    }

    protected function isWithinTimeTolerance(?string $savedTime, ?string $foundTime, int $toleranceMinutes = self::TIME_TOLERANCE_MINUTES): bool
    {
        if (! $savedTime || ! $foundTime) {
            return true;
        }

        $savedMinutes = $this->timeToMinutes($savedTime);
        $foundMinutes = $this->timeToMinutes($foundTime);

        if ($savedMinutes === null || $foundMinutes === null) {
            return true;
        }

        return abs($savedMinutes - $foundMinutes) <= $toleranceMinutes;
    }

    protected function buildFallbackFlightReference(TrackedFlight $flight, ?string $matchedDepartureTime): string
    {
        $date = $flight->flight_date->format('Y-m-d');
        $time = $matchedDepartureTime ?? 'unknown';

        return sprintf(
            'ryanair_%s_%s_%s_%s',
            strtoupper($flight->origin_iata),
            strtoupper($flight->destination_iata),
            $date,
            $time
        );
    }

    protected function determineMatchConfidence(?string $flightReference, ?string $matchedDepartureTime): string
    {
        if ($flightReference && ! str_starts_with($flightReference, 'ryanair_')) {
            return 'high';
        }

        if ($matchedDepartureTime) {
            return 'medium';
        }

        return 'low';
    }
}