<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\TrackedFlight;
use App\Services\FlightPriceService;
use Illuminate\Validation\Rule;

class TrackedFlightController extends Controller
{
    public function index(): Response
    {
        $flights = auth()->user()
            ->trackedFlights()
            ->with(['priceHistories' => function ($query) {
                $query->latest('checked_at');
            }])
            ->latest()
            ->get()
            ->map(function ($flight) {
                $latestPrice = $flight->priceHistories->get(0);
                $previousPrice = $flight->priceHistories->get(1);

                $priceDifference = null;

                if ($latestPrice && $previousPrice) {
                    $priceDifference = (float) $latestPrice->price - (float) $previousPrice->price;
                }

                return [
                    'id' => $flight->id,
                    'origin_iata' => $flight->origin_iata,
                    'destination_iata' => $flight->destination_iata,
                    'flight_date' => $flight->flight_date->format('Y-m-d'),
                    'departure_time' => $flight->departure_time,
                    'airline' => $flight->airline,
                    'flight_number' => $flight->flight_number,
                    'notes' => $flight->notes,
                    'is_active' => $flight->is_active,
                    'latest_price' => $latestPrice ? number_format((float) $latestPrice->price, 2, '.', '') : null,
                    'latest_currency' => $latestPrice?->currency,
                    'last_checked_at' => $latestPrice?->checked_at?->format('Y-m-d H:i'),
                    'price_difference' => $priceDifference !== null
                        ? number_format($priceDifference, 2, '.', '')
                        : null,
                    'price_insights' => [
                        'min' => $flight->price_insights['min'] !== null
                            ? number_format((float) $flight->price_insights['min'], 2, '.', '')
                            : null,
                        'avg' => $flight->price_insights['avg'] !== null
                            ? number_format((float) $flight->price_insights['avg'], 2, '.', '')
                            : null,
                        'trend' => $flight->price_insights['trend'],
                    ],
                ];
            });

        return Inertia::render('Flights/Index', [
            'flights' => $flights,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Flights/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'origin_iata' => ['required', 'string', 'size:3'],
            'destination_iata' => ['required', 'string', 'size:3'],
            'flight_date' => ['required', 'date'],
            'departure_time' => ['nullable', 'date_format:H:i'],
            'airline' => 'required|string|in:Ryanair',
            'flight_number' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $request->user()->trackedFlights()->create([
            'origin_iata' => strtoupper($validated['origin_iata']),
            'destination_iata' => strtoupper($validated['destination_iata']),
            'flight_date' => $validated['flight_date'],
            'departure_time' => $validated['departure_time'] ?? null,
            'airline' => $validated['airline'],
            'flight_number' => strtoupper($validated['flight_number']),
            'notes' => $validated['notes'] ?? null,
            'is_active' => true,
        ]);

        return redirect()->route('flights.index')->with('success', 'Volo creato con successo.');
    }

    public function show(TrackedFlight $flight): Response
    {
        abort_if($flight->user_id !== auth()->id(), 403);

        $prices = $flight->priceHistories()
            ->latest('checked_at')
            ->get()
            ->map(function ($price) {
                return [
                    'id' => $price->id,
                    'price' => number_format((float) $price->price, 2, '.', ''),
                    'currency' => $price->currency,
                    'checked_at' => $price->checked_at->format('Y-m-d H:i'),
                    'source' => $price->source,
                    'matched_departure_time' => $price->matched_departure_time,
                    'matched_flight_reference' => $price->matched_flight_reference,
                    'match_confidence' => $price->match_confidence,
                ];
            });

        $latestPrice = $flight->priceHistories()
            ->latest('checked_at')
            ->first();

        return Inertia::render('Flights/Show', [
            'flight' => [
                'id' => $flight->id,
                'origin_iata' => $flight->origin_iata,
                'destination_iata' => $flight->destination_iata,
                'flight_date' => $flight->flight_date->format('Y-m-d'),
                'departure_time' => $flight->departure_time,
                'airline' => $flight->airline,
                'flight_number' => $flight->flight_number,
                'notes' => $flight->notes,
                'is_active' => $flight->is_active,
                'price_insights' => [
                    'latest' => $flight->price_insights['latest'] !== null
                        ? number_format((float) $flight->price_insights['latest'], 2, '.', '')
                        : null,
                    'previous' => $flight->price_insights['previous'] !== null
                        ? number_format((float) $flight->price_insights['previous'], 2, '.', '')
                        : null,
                    'min' => $flight->price_insights['min'] !== null
                        ? number_format((float) $flight->price_insights['min'], 2, '.', '')
                        : null,
                    'avg' => $flight->price_insights['avg'] !== null
                        ? number_format((float) $flight->price_insights['avg'], 2, '.', '')
                        : null,
                    'trend' => $flight->price_insights['trend'],
                    'delta' => $flight->price_insights['delta'] !== null
                        ? number_format((float) $flight->price_insights['delta'], 2, '.', '')
                        : null,
                ],
            ],
            'prices' => $prices,
            'latest_check' => $latestPrice ? [
                'price' => number_format((float) $latestPrice->price, 2, '.', ''),
                'currency' => $latestPrice->currency,
                'checked_at' => $latestPrice->checked_at->format('Y-m-d H:i'),
                'source' => $latestPrice->source,
                'matched_departure_time' => $latestPrice->matched_departure_time,
                'matched_flight_reference' => $latestPrice->matched_flight_reference,
                'match_confidence' => $latestPrice->match_confidence,
            ] : null,
        ]);
    }

    public function refreshPrice(TrackedFlight $flight, FlightPriceService $flightPriceService)
    {
        abort_if($flight->user_id !== auth()->id(), 403);

        $result = $flightPriceService->refreshAndStorePrice($flight);

        if (! $result['success']) {
            $reason = $result['data']['source'] ?? 'unknown';

            return back()->with('error', "Nessun prezzo trovato [motivo: {$reason}]");
        }

        return back()->with('success', 'Prezzo aggiornato con successo.');
    }

    public function storePrice(Request $request, TrackedFlight $flight)
    {
        abort_if($flight->user_id !== auth()->id(), 403);

        $validated = $request->validate([
            'price' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'checked_at' => ['required', 'date'],
            'source' => ['nullable', 'string', 'max:255'],
        ]);

        $flight->priceHistories()->create([
            'price' => $validated['price'],
            'currency' => strtoupper($validated['currency']),
            'checked_at' => $validated['checked_at'],
            'source' => $validated['source'] ?? null,
        ]);

        return redirect()->route('flights.show', $flight->id)->with('success', 'Prezzo aggiunto con successo.');
    }

    public function edit(TrackedFlight $flight): Response
    {
        abort_if($flight->user_id !== auth()->id(), 403);

        return Inertia::render('Flights/Edit', [
            'flight' => [
                'id' => $flight->id,
                'origin_iata' => $flight->origin_iata,
                'destination_iata' => $flight->destination_iata,
                'flight_date' => $flight->flight_date->format('Y-m-d'),
                'departure_time' => $flight->departure_time,
                'airline' => $flight->airline,
                'flight_number' => $flight->flight_number,
                'notes' => $flight->notes,
                'is_active' => $flight->is_active,
            ],
        ]);
    }

    public function update(Request $request, TrackedFlight $flight)
    {
        abort_if($flight->user_id !== auth()->id(), 403);

        $validated = $request->validate([
            'origin_iata' => ['required', 'string', 'size:3'],
            'destination_iata' => ['required', 'string', 'size:3'],
            'flight_date' => ['required', 'date'],
            'departure_time' => ['nullable', 'date_format:H:i'],
            'airline' => 'required|string|in:Ryanair',
            'flight_number' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);

        $flight->update([
            'origin_iata' => strtoupper($validated['origin_iata']),
            'destination_iata' => strtoupper($validated['destination_iata']),
            'flight_date' => $validated['flight_date'],
            'departure_time' => $validated['departure_time'] ?? null,
            'airline' => $validated['airline'],
            'flight_number' => strtoupper($validated['flight_number']),
            'notes' => $validated['notes'] ?? null,
            'is_active' => $validated['is_active'],
        ]);

        return redirect()->route('flights.show', $flight->id)->with('success', 'Volo aggiornato con successo.');
    }

    public function destroy(TrackedFlight $flight)
    {
        abort_if($flight->user_id !== auth()->id(), 403);

        $flight->delete();

        return redirect()->route('flights.index')->with('success', 'Volo eliminato con successo.');
    }
}