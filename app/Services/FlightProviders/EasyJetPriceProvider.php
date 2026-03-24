<?php

namespace App\Services\FlightProviders;

use App\Models\TrackedFlight;
use Illuminate\Support\Facades\Http;

class EasyJetPriceProvider implements FlightPriceProviderInterface
{
    protected const TIME_TOLERANCE_MINUTES = 120;

    public function supports(TrackedFlight $flight): bool
    {
        $airline = mb_strtolower(trim($flight->airline));

        return str_contains($airline, 'easyjet') || str_contains($airline, 'easy jet');
    }

    public function getPriceForFlight(TrackedFlight $flight): array
    {
        $endpoint = config('services.easyjet.search_url');

        if (! $endpoint) {
            return [
                'price' => null,
                'currency' => 'EUR',
                'source' => 'easyjet-not-configured',
                'matched_departure_time' => null,
                'matched_flight_reference' => null,
                'match_confidence' => 'low',
            ];
        }

        $date = $flight->flight_date->format('Y-m-d');

        $payload = [
            'journey' => [
                'outboundWindow' => 1,
                'outboundDate' => $date,
                'departureAirportOrMarketCode' => strtoupper($flight->origin_iata),
                'arrivalAirportOrMarketCode' => strtoupper($flight->destination_iata),
                'outReturnWindow' => 1,
            ],
            'passengerMix' => [
                'ADT' => 1,
                'CHD' => 0,
                'INF' => 0,
            ],
            'languageCode' => 'it',
        ];

        $response = Http::timeout(20)
            ->withHeaders([
                'User-Agent' => 'Mozilla/5.0',
                'Accept' => 'application/json, text/plain, */*',
                'Content-Type' => 'application/json',
                'Origin' => 'https://www.easyjet.com',
                'Referer' => 'https://www.easyjet.com/',
                'X-Requested-With' => 'XMLHttpRequest',
            ])
            ->post($endpoint, $payload);

        

        if (! $response->successful()) {
            return [
                'price' => null,
                'currency' => 'EUR',
                'source' => 'easyjet-http-error',
                'matched_departure_time' => null,
                'matched_flight_reference' => null,
                'match_confidence' => 'low',
            ];
        }

        $data = $response->json();

        if (! is_array($data)) {
            return [
                'price' => null,
                'currency' => 'EUR',
                'source' => 'easyjet-invalid-response',
                'matched_departure_time' => null,
                'matched_flight_reference' => null,
                'match_confidence' => 'low',
            ];
        }

        $candidates = $this->extractFlights($data, $date);

        if (empty($candidates)) {
            return [
                'price' => null,
                'currency' => 'EUR',
                'source' => 'easyjet-no-results',
                'matched_departure_time' => null,
                'matched_flight_reference' => null,
                'match_confidence' => 'low',
            ];
        }

        $bestFlight = $this->pickBestCandidate(
            $candidates,
            $flight->departure_time,
            $flight->flight_number
        );

        if (! $bestFlight) {
            return [
                'price' => null,
                'currency' => 'EUR',
                'source' => 'easyjet-no-match',
                'matched_departure_time' => null,
                'matched_flight_reference' => null,
                'match_confidence' => 'low',
            ];
        }

        $price = data_get($bestFlight, 'fares.ADT.STANDARD.unitPrice.grossPrice');
        $currency = data_get($bestFlight, 'currency', 'EUR');
        $matchedDepartureTime = $this->extractDepartureTime($bestFlight);
        $flightReference = $this->extractFlightReference($bestFlight);

        if (! is_numeric($price)) {
            return [
                'price' => null,
                'currency' => $currency,
                'source' => 'easyjet-no-price',
                'matched_departure_time' => $matchedDepartureTime,
                'matched_flight_reference' => $flightReference,
                'match_confidence' => 'low',
            ];
        }

        if (! $this->isWithinTimeTolerance($flight->departure_time, $matchedDepartureTime)) {
            return [
                'price' => null,
                'currency' => $currency,
                'source' => 'easyjet-time-mismatch',
                'matched_departure_time' => $matchedDepartureTime,
                'matched_flight_reference' => $flightReference,
                'match_confidence' => 'low',
            ];
        }

        return [
            'price' => number_format((float) $price, 2, '.', ''),
            'currency' => $currency,
            'source' => 'easyjet',
            'matched_departure_time' => $matchedDepartureTime,
            'matched_flight_reference' => $flightReference,
            'match_confidence' => $this->determineMatchConfidence($flight, $flightReference, $matchedDepartureTime),
        ];
    }

    protected function extractFlights(array $data, string $date): array
    {
        $journeyPairs = data_get($data, 'journeyPairs', []);

        if (! is_array($journeyPairs)) {
            return [];
        }

        $results = [];

        foreach ($journeyPairs as $pair) {
            $flightsByDate = data_get($pair, 'outbound.flights', []);

            if (! is_array($flightsByDate)) {
                continue;
            }

            $dailyFlights = $flightsByDate[$date] ?? [];

            if (! is_array($dailyFlights)) {
                continue;
            }

            foreach ($dailyFlights as $flight) {
                if (is_array($flight)) {
                    $results[] = $flight;
                }
            }
        }

        return $results;
    }

    protected function pickBestCandidate(array $candidates, ?string $targetTime, ?string $flightNumber): ?array
    {
        if (empty($candidates)) {
            return null;
        }

        $normalizedInput = $this->normalizeFlightNumber($flightNumber);

        if ($normalizedInput) {
            $matchingByNumber = array_values(array_filter($candidates, function (array $candidate) use ($normalizedInput) {
                $candidateReference = $this->normalizeFlightNumber($this->extractFlightReference($candidate));
                $candidateRawNumber = $this->normalizeFlightNumber((string) data_get($candidate, 'flightNumber', ''));

                if ($candidateReference && (
                    $candidateReference === $normalizedInput ||
                    str_ends_with($candidateReference, $normalizedInput) ||
                    str_ends_with($normalizedInput, $candidateReference)
                )) {
                    return true;
                }

                if ($candidateRawNumber && (
                    $candidateRawNumber === $normalizedInput ||
                    str_ends_with($normalizedInput, $candidateRawNumber)
                )) {
                    return true;
                }

                return false;
            }));

            if (! empty($matchingByNumber)) {
                return $this->pickClosestByTime($matchingByNumber, $targetTime) ?? $matchingByNumber[0];
            }
        }

        return $this->pickClosestByTime($candidates, $targetTime) ?? $candidates[0];
    }

    protected function pickClosestByTime(array $candidates, ?string $targetTime): ?array
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
            $candidateTime = $this->extractDepartureTime($candidate);

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

    protected function extractDepartureTime(array $candidate): ?string
    {
        $dateTime = data_get($candidate, 'localDepartureDateTime');

        if (! is_string($dateTime)) {
            return null;
        }

        if (preg_match('/T(\d{2}:\d{2})/', $dateTime, $matches)) {
            return $matches[1];
        }

        return null;
    }

    protected function extractFlightReference(array $candidate): ?string
    {
        $carrierIata = strtoupper((string) data_get($candidate, 'iataCarrierCode', ''));
        $flightNumber = strtoupper((string) data_get($candidate, 'flightNumber', ''));

        if ($carrierIata && $flightNumber) {
            return $carrierIata . $flightNumber;
        }

        if ($flightNumber) {
            return $flightNumber;
        }

        return null;
    }

    protected function determineMatchConfidence(TrackedFlight $flight, ?string $matchedReference, ?string $matchedDepartureTime): string
    {
        $input = $this->normalizeFlightNumber($flight->flight_number);
        $matched = $this->normalizeFlightNumber($matchedReference);

        if ($input && $matched) {
            if (
                $input === $matched ||
                str_ends_with($matched, $input) ||
                str_ends_with($input, $matched)
            ) {
                return 'high';
            }
        }

        if ($this->isWithinTimeTolerance($flight->departure_time, $matchedDepartureTime)) {
            return 'medium';
        }

        return 'low';
    }

    protected function isWithinTimeTolerance(?string $targetTime, ?string $matchedTime): bool
    {
        if (! $targetTime || ! $matchedTime) {
            return true;
        }

        $targetMinutes = $this->timeToMinutes($targetTime);
        $matchedMinutes = $this->timeToMinutes($matchedTime);

        if ($targetMinutes === null || $matchedMinutes === null) {
            return true;
        }

        return abs($targetMinutes - $matchedMinutes) <= self::TIME_TOLERANCE_MINUTES;
    }

    protected function timeToMinutes(?string $time): ?int
    {
        if (! $time || ! preg_match('/^(\d{2}):(\d{2})$/', $time, $matches)) {
            return null;
        }

        return ((int) $matches[1] * 60) + (int) $matches[2];
    }

    protected function normalizeFlightNumber(?string $flightNumber): ?string
    {
        if (! $flightNumber) {
            return null;
        }

        $normalized = strtoupper(trim($flightNumber));
        $normalized = preg_replace('/\s+/', '', $normalized);

        return $normalized ?: null;
    }
}