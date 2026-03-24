<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PriceHistory extends Model
{
    protected $fillable = [
        'tracked_flight_id',
        'price',
        'currency',
        'checked_at',
        'source',
        'matched_departure_time',
        'matched_flight_reference',
        'match_confidence',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'checked_at' => 'datetime',
        'matched_departure_time' => 'string',
        'matched_flight_reference' => 'string',
        'match_confidence' => 'string',
    ];

    public function trackedFlight(): BelongsTo
    {
        return $this->belongsTo(TrackedFlight::class);
    }
}