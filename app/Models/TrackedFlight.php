<?php
 //questo modello rappresenta un volo tracciato dall'utente, con i dettagli del volo e le relazioni con l'utente e la cronologia dei prezzi. Include anche un accessor per calcolare le statistiche sui prezzi del volo.
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TrackedFlight extends Model
{
    protected $fillable = [
        'user_id',
        'origin_iata',
        'destination_iata',
        'flight_date',
        'departure_time',
        'airline',
        'flight_number',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'flight_date' => 'date',
        'departure_time' => 'string',
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'price_insights',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function priceHistories(): HasMany
    {
        return $this->hasMany(PriceHistory::class);
    }

    public function getPriceInsightsAttribute(): array  // Calcola le statistiche sui prezzi per questo volo, come l'ultimo prezzo, il precedente, il minimo, la media, la tendenza e la differenza
    {
        $histories = $this->priceHistories()
            ->orderBy('checked_at')
            ->get();

        if ($histories->isEmpty()) {
            return [
                'latest' => null,
                'previous' => null,
                'min' => null,
                'avg' => null,
                'trend' => 'none',
                'delta' => null,
            ];
        }

        $prices = $histories
            ->pluck('price')
            ->map(fn ($price) => (float) $price)
            ->values();

        $latest = $prices->last();
        $previous = $prices->count() > 1 ? $prices[$prices->count() - 2] : null;

        $trend = 'stable';
        $delta = null;

        if ($previous !== null) {
            $delta = round($latest - $previous, 2);

            if ($latest > $previous) {
                $trend = 'up';
            } elseif ($latest < $previous) {
                $trend = 'down';
            }
        }

        return [
            'latest' => round($latest, 2),
            'previous' => $previous !== null ? round($previous, 2) : null,
            'min' => round($prices->min(), 2),
            'avg' => round($prices->avg(), 2),
            'trend' => $trend,
            'delta' => $delta,
        ];
    }
}