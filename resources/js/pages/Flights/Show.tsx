import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';

type Flight = {
    id: number;
    origin_iata: string;
    destination_iata: string;
    flight_date: string;
    departure_time?: string | null;
    airline: string;
    flight_number: string;
    notes?: string | null;
    is_active: boolean;
    price_insights?: {
        latest?: string | null;
        previous?: string | null;
        min?: string | null;
        avg?: string | null;
        trend?: 'up' | 'down' | 'stable' | 'none' | string;
        delta?: string | null;
    };
};

type Price = {
    id: number;
    price: string;
    currency: string;
    checked_at: string;
    source?: string | null;
    matched_departure_time?: string | null;
    matched_flight_reference?: string | null;
    match_confidence?: string | null;
};

type Props = {
    flight: Flight;
    prices: Price[];
    latest_check?: {
        price: string;
        currency: string;
        checked_at: string;
        source?: string | null;
        matched_departure_time?: string | null;
        matched_flight_reference?: string | null;
        match_confidence?: string | null;
    } | null;
};

function buildChartPoints(prices: { price: string }[], width = 600, height = 220) {
    if (prices.length === 0) {
        return '';
    }

    const values = prices.map((p) => parseFloat(p.price));
    const min = Math.min(...values);
    const max = Math.max(...values);

    const padding = 30;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;

    return values
        .map((value, index) => {
            const x =
                prices.length === 1
                    ? width / 2
                    : padding + (index / (prices.length - 1)) * innerWidth;

            const y =
                max === min
                    ? height / 2
                    : padding + ((max - value) / (max - min)) * innerHeight;

            return `${x},${y}`;
        })
        .join(' ');
}

function getChartBounds(prices: { price: string }[]) {
    if (prices.length === 0) {
        return { min: 0, max: 0 };
    }

    const values = prices.map((p) => parseFloat(p.price));

    return {
        min: Math.min(...values),
        max: Math.max(...values),
    };
}

function getTrendLabel(trend?: string | null) {
    if (trend === 'up') {
        return '↑ In aumento';
    }

    if (trend === 'down') {
        return '↓ In calo';
    }

    if (trend === 'stable') {
        return '= Stabile';
    }

    return '— Nessun trend';
}

function getTrendStyles(trend?: string | null) {
    if (trend === 'up') {
        return {
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fecaca',
        };
    }

    if (trend === 'down') {
        return {
            backgroundColor: '#dcfce7',
            color: '#166534',
            border: '1px solid #86efac',
        };
    }

    return {
        backgroundColor: '#e2e8f0',
        color: '#334155',
        border: '1px solid #cbd5e1',
    };
}

function getSegmentColor(current: number, previous: number) {
    if (current < previous) {
        return '#16a34a';
    }

    if (current > previous) {
        return '#dc2626';
    }

    return '#94a3b8';
}

function getPointColor(current: number, previous?: number) {
    if (previous === undefined) {
        return '#94a3b8';
    }

    return getSegmentColor(current, previous);
}

export default function Show({ flight, prices, latest_check }: Props) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [hoveredPoint, setHoveredPoint] = useState<{
        x: number;
        y: number;
        checked_at: string;
        price: string;
        currency: string;
    } | null>(null);

    const refreshPrice = () => {
        router.post(`/flights/${flight.id}/refresh-price`);
    };

    const openDeleteModal = () => {
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
    };

    const confirmDeleteFlight = () => {
        router.delete(`/flights/${flight.id}`);
    };

    const chartPrices = [...prices].reverse();
    const chartPoints = buildChartPoints(chartPrices);
    const { min, max } = getChartBounds(chartPrices);
    const insights = flight.price_insights;

    return (
        <AppLayout>
            <div className="page-shell">
                <Link href="/flights" className="page-back-link">
                    ← Torna ai voli
                </Link>

                <div className="page-header">
                    <h1 className="page-title">
                        {flight.origin_iata} → {flight.destination_iata}
                    </h1>

                    <div className="meta-row" style={{ marginTop: '10px' }}>
                        <span>{flight.airline}</span>
                        <span>•</span>
                        <span>{flight.flight_number}</span>
                        <span>•</span>
                        <span>{flight.flight_date}</span>
                        {flight.departure_time && (
                            <>
                                <span>•</span>
                                <span>{flight.departure_time}</span>
                            </>
                        )}
                    </div>
                </div>

                {latest_check && (
                    <div className="app-card">
                        <h2 className="section-title">Riepilogo prezzo</h2>

                        <p className="price-main" style={{ marginBottom: '14px' }}>
                            {latest_check.price}
                            <span className="price-currency">{latest_check.currency}</span>
                        </p>

                        {insights?.trend && insights.trend !== 'none' && (
                            <div
                                style={{
                                    display: 'inline-block',
                                    padding: '7px 12px',
                                    borderRadius: '999px',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    marginBottom: '18px',
                                    ...getTrendStyles(insights.trend),
                                }}
                            >
                                {getTrendLabel(insights.trend)}
                                {insights.delta
                                    ? ` (${parseFloat(insights.delta) > 0 ? '+' : ''}${insights.delta} ${latest_check.currency})`
                                    : ''}
                            </div>
                        )}

                        <div className="info-grid">
                            <div>
                                <div className="label-sm">Min storico</div>
                                <div className="value-md">
                                    {insights?.min ? `${insights.min} ${latest_check.currency}` : '—'}
                                </div>
                            </div>

                            <div>
                                <div className="label-sm">Media</div>
                                <div className="value-md">
                                    {insights?.avg ? `${insights.avg} ${latest_check.currency}` : '—'}
                                </div>
                            </div>

                            <div>
                                <div className="label-sm">Ultimo aggiornamento</div>
                                <div className="value-md">{latest_check.checked_at}</div>
                            </div>
                        </div>
                    </div>
                )}

                {latest_check && (
                    <div className="app-card" style={{ marginTop: '24px' }}>
                        <h2 className="section-title">Ultimo controllo</h2>

                        <div className="info-grid">
                            <div>
                                <div className="label-sm">Prezzo rilevato</div>
                                <div className="value-md">
                                    {latest_check.price} {latest_check.currency}
                                </div>
                            </div>

                            <div>
                                <div className="label-sm">Data controllo</div>
                                <div className="value-md">{latest_check.checked_at}</div>
                            </div>

                            <div>
                                <div className="label-sm">Fonte</div>
                                <div className="value-md">{latest_check.source ?? 'N/A'}</div>
                            </div>

                            <div>
                                <div className="label-sm">Orario trovato</div>
                                <div className="value-md">
                                    {latest_check.matched_departure_time ?? 'Non disponibile'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="app-card" style={{ marginTop: '24px' }}>
                    <h2 className="section-title">Andamento prezzo</h2>

                    {prices.length === 0 ? (
                        <p className="section-subtitle">Nessun dato disponibile per il grafico.</p>
                    ) : (
                        <>
                            <div
                                className="meta-row"
                                style={{
                                    marginBottom: '16px',
                                    gap: '12px',
                                    fontSize: '14px',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <span
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: '999px',
                                        backgroundColor: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                    }}
                                >
                                    <strong>Prezzo minimo:</strong> {min.toFixed(2)}{' '}
                                    {chartPrices[0]?.currency}
                                </span>

                                <span
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: '999px',
                                        backgroundColor: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                    }}
                                >
                                    <strong>Prezzo massimo:</strong> {max.toFixed(2)}{' '}
                                    {chartPrices[0]?.currency}
                                </span>
                            </div>

                            <div
                                className="chart-box"
                                style={{
                                    backgroundColor: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '20px',
                                    padding: '18px',
                                    position: 'relative',
                                    overflow: 'visible',
                                    paddingTop: '44px',
                                }}
                            >
                                <svg
                                    viewBox="0 0 600 220"
                                    style={{
                                        width: '100%',
                                        maxWidth: '100%',
                                        height: 'auto',
                                        display: 'block',
                                    }}
                                >
                                    <line x1="30" y1="30" x2="570" y2="30" stroke="#e5e7eb" strokeWidth="1" />
                                    <line x1="30" y1="110" x2="570" y2="110" stroke="#e5e7eb" strokeWidth="1" />
                                    <line x1="30" y1="190" x2="570" y2="190" stroke="#e5e7eb" strokeWidth="1" />

                                    {chartPoints.split(' ').map((point, index, arr) => {
                                        if (index === arr.length - 1) {
                                            return null;
                                        }

                                        const [x1, y1] = point.split(',').map(Number);
                                        const [x2, y2] = arr[index + 1].split(',').map(Number);

                                        const currentPrice = parseFloat(chartPrices[index].price);
                                        const nextPrice = parseFloat(chartPrices[index + 1].price);

                                        const segmentColor = getSegmentColor(nextPrice, currentPrice);
                                        const segmentWidth = segmentColor === '#94a3b8' ? 2.5 : 3.5;

                                        return (
                                            <line
                                                key={`segment-${chartPrices[index].id}`}
                                                x1={x1}
                                                y1={y1}
                                                x2={x2}
                                                y2={y2}
                                                stroke={segmentColor}
                                                strokeWidth={segmentWidth}
                                                strokeLinecap="round"
                                            />
                                        );
                                    })}

                                    {chartPoints.split(' ').map((point, index) => {
                                        const [cx, cy] = point.split(',').map(Number);
                                        const priceItem = chartPrices[index];
                                        const currentPrice = parseFloat(priceItem.price);
                                        const previousPrice =
                                            index > 0 ? parseFloat(chartPrices[index - 1].price) : undefined;

                                        const pointColor = getPointColor(currentPrice, previousPrice);

                                        const isHovered =
                                            hoveredPoint?.checked_at === priceItem.checked_at &&
                                            hoveredPoint?.price === priceItem.price;

                                        return (
                                            <g key={priceItem.id}>
                                                {isHovered && (
                                                    <circle
                                                        cx={cx}
                                                        cy={cy}
                                                        r="11"
                                                        fill={`${pointColor}20`}
                                                    />
                                                )}

                                                <circle
                                                    cx={cx}
                                                    cy={cy}
                                                    r="5.5"
                                                    fill="#ffffff"
                                                    stroke={pointColor}
                                                    strokeWidth="3"
                                                    style={{ cursor: 'pointer' }}
                                                    onMouseEnter={() =>
                                                        setHoveredPoint({
                                                            x: cx,
                                                            y: cy,
                                                            checked_at: priceItem.checked_at,
                                                            price: priceItem.price,
                                                            currency: priceItem.currency,
                                                        })
                                                    }
                                                    onMouseLeave={() => setHoveredPoint(null)}
                                                />
                                            </g>
                                        );
                                    })}
                                </svg>

                                {hoveredPoint &&
                                    (() => {
                                        const hoveredIndex = chartPrices.findIndex(
                                            (item) =>
                                                item.checked_at === hoveredPoint.checked_at &&
                                                item.price === hoveredPoint.price
                                        );

                                        const currentValue = parseFloat(hoveredPoint.price);
                                        const previousValue =
                                            hoveredIndex > 0 ? parseFloat(chartPrices[hoveredIndex - 1].price) : null;

                                        const delta = previousValue !== null ? currentValue - previousValue : null;

                                        const deltaColor =
                                            delta === null
                                                ? '#cbd5e1'
                                                : delta < 0
                                                  ? '#86efac'
                                                  : delta > 0
                                                    ? '#fca5a5'
                                                    : '#cbd5e1';

                                        return (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    left: `${(hoveredPoint.x / 600) * 100}%`,
                                                    top: `${(hoveredPoint.y / 220) * 100}%`,
                                                    transform: 'translate(-50%, -110%)',
                                                    backgroundColor: '#0f172a',
                                                    color: 'white',
                                                    padding: '10px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '13px',
                                                    lineHeight: 1.45,
                                                    whiteSpace: 'nowrap',
                                                    pointerEvents: 'none',
                                                    boxShadow: '0 14px 30px rgba(15,23,42,0.18)',
                                                    zIndex: 10,
                                                }}
                                            >
                                                <div style={{ fontWeight: 700 }}>
                                                    {hoveredPoint.price} {hoveredPoint.currency}
                                                </div>

                                                {delta !== null && (
                                                    <div
                                                        style={{
                                                            color: deltaColor,
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {delta > 0 ? '+' : ''}
                                                        {delta.toFixed(2)} {hoveredPoint.currency}
                                                    </div>
                                                )}

                                                <div style={{ opacity: 0.85 }}>{hoveredPoint.checked_at}</div>
                                            </div>
                                        );
                                    })()}
                            </div>
                        </>
                    )}
                </div>

                <div className="actions-row" style={{ marginTop: '24px' }}>
                    <button type="button" onClick={refreshPrice} className="btn-primary">
                        Aggiorna prezzo
                    </button>

                    <Link href={`/flights/${flight.id}/edit`} className="btn-secondary">
                        Modifica volo
                    </Link>

                    <button
                        type="button"
                        onClick={openDeleteModal}
                        className="btn-danger"
                        style={{
                            backgroundColor: '#dc2626',
                            border: '1px solid #b91c1c',
                            boxShadow: '0 10px 20px rgba(185, 28, 28, 0.14)',
                        }}
                    >
                        Elimina volo
                    </button>
                </div>
            </div>

            {showDeleteModal && (
                <div
                    onClick={closeDeleteModal}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.55)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        zIndex: 1000,
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: '460px',
                            backgroundColor: 'white',
                            borderRadius: '22px',
                            padding: '28px',
                            boxShadow: '0 24px 70px rgba(15, 23, 42, 0.22)',
                            border: '1px solid #e2e8f0',
                        }}
                    >
                        <div
                            style={{
                                width: '52px',
                                height: '52px',
                                borderRadius: '16px',
                                backgroundColor: '#fee2e2',
                                color: '#b91c1c',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '22px',
                                fontWeight: 700,
                                marginBottom: '18px',
                            }}
                        >
                            !
                        </div>

                        <h2
                            style={{
                                margin: 0,
                                fontSize: '26px',
                                fontWeight: 800,
                                color: '#0f172a',
                                lineHeight: 1.2,
                            }}
                        >
                            Eliminare questo volo?
                        </h2>

                        <p
                            style={{
                                margin: '12px 0 0 0',
                                color: '#64748b',
                                fontSize: '15px',
                                lineHeight: 1.6,
                            }}
                        >
                            Stai per rimuovere definitivamente il volo{' '}
                            <strong>
                                {flight.origin_iata} → {flight.destination_iata}
                            </strong>{' '}
                            del <strong>{flight.flight_date}</strong>. Questa operazione non può
                            essere annullata.
                        </p>

                        <div
                            style={{
                                display: 'flex',
                                gap: '12px',
                                justifyContent: 'flex-end',
                                flexWrap: 'wrap',
                                marginTop: '26px',
                            }}
                        >
                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                style={{
                                    padding: '12px 18px',
                                    borderRadius: '12px',
                                    border: '1px solid #cbd5e1',
                                    backgroundColor: '#f8fafc',
                                    color: '#0f172a',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    cursor: 'pointer',
                                }}
                            >
                                Annulla
                            </button>

                            <button
                                type="button"
                                onClick={confirmDeleteFlight}
                                style={{
                                    padding: '12px 18px',
                                    borderRadius: '12px',
                                    border: '1px solid #b91c1c',
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    cursor: 'pointer',
                                    boxShadow: '0 10px 20px rgba(185, 28, 28, 0.18)',
                                }}
                            >
                                Elimina volo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}