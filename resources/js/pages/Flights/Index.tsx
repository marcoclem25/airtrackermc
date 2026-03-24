import { Link, router } from '@inertiajs/react';
import {
    PlaneTakeoff,
    Plus,
    RefreshCw,
    ArrowRight,
    CalendarDays,
    ChartNoAxesCombined,
} from 'lucide-react';
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
    latest_price?: string | null;
    latest_currency?: string | null;
    last_checked_at?: string | null;
    price_difference?: string | null;
    price_insights?: {
        min?: string | null;
        avg?: string | null;
        trend?: 'up' | 'down' | 'stable' | 'none' | string;
    };
};

type Props = {
    flights: Flight[];
};

function getDifferenceLabel(diff: string | null | undefined) {
    if (!diff) {
        return null;
    }

    const value = parseFloat(diff);

    if (value > 0) {
        return `+${diff}`;
    }

    if (value < 0) {
        return diff;
    }

    return '0.00';
}

function getDifferenceStyles(diff: string | null | undefined) {
    if (!diff) {
        return {
            backgroundColor: '#e2e8f0',
            color: '#334155',
            border: '1px solid #cbd5e1',
        };
    }

    const value = parseFloat(diff);

    if (value > 0) {
        return {
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fecaca',
        };
    }

    if (value < 0) {
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

function getTrendLabel(trend: string | null | undefined) {
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

function getTrendStyles(trend: string | null | undefined) {
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

export default function Index({ flights }: Props) {
    const refreshPrice = (flightId: number) => {
        router.post(`/flights/${flightId}/refresh-price`);
    };

    return (
        <AppLayout>
            <div className="page-shell">
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        gap: '20px',
                        flexWrap: 'wrap',
                        marginBottom: '28px',
                    }}
                >
                    <div className="page-header" style={{ marginBottom: 0 }}>
                        <h1 className="page-title">I miei voli</h1>
                        <p className="page-subtitle">
                            Controlla i prezzi aggiornati dei voli che stai monitorando.
                        </p>
                    </div>

                    <Link
                        href="/flights/create"
                        className="btn-primary"
                        style={{
                            boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)',
                        }}
                    >
                        <Plus size={18} />
                        Aggiungi volo
                    </Link>
                </div>

                {flights.length === 0 ? (
                    <div
                        className="app-card"
                        style={{
                            textAlign: 'center',
                            padding: '56px 32px',
                        }}
                    >
                        <div
                            style={{
                                width: '64px',
                                height: '64px',
                                margin: '0 auto 18px auto',
                                borderRadius: '18px',
                                backgroundColor: '#eff6ff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#2563eb',
                            }}
                        >
                            <PlaneTakeoff size={28} />
                        </div>

                        <h2
                            className="section-title"
                            style={{
                                marginTop: 0,
                                marginBottom: '10px',
                            }}
                        >
                            Nessun volo salvato
                        </h2>

                        <p
                            className="section-subtitle"
                            style={{
                                marginBottom: '22px',
                                maxWidth: '520px',
                                marginInline: 'auto',
                            }}
                        >
                            Inizia aggiungendo il tuo primo volo da monitorare.
                        </p>

                        <Link href="/flights/create" className="btn-primary">
                            <Plus size={18} />
                            Aggiungi il primo volo
                        </Link>
                    </div>
                ) : (
                    <>
                        <p
                            style={{
                                marginTop: 0,
                                marginBottom: '18px',
                                color: '#64748b',
                                fontSize: '14px',
                                fontWeight: 600,
                            }}
                        >
                            {flights.length} {flights.length === 1 ? 'volo monitorato' : 'voli monitorati'}
                        </p>

                        <div className="responsive-grid">
                            {flights.map((flight) => {
                                const insights = flight.price_insights;

                                return (
                                    <div
                                        key={flight.id}
                                        className="app-card"
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            minHeight: '100%',
                                            height: '100%',
                                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow =
                                                '0 16px 40px rgba(15,23,42,0.12)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow =
                                                '0 8px 24px rgba(15, 23, 42, 0.05)';
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'grid',
                                                gap: '18px',
                                                flex: 1,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    gap: '14px',
                                                    flexWrap: 'nowrap',
                                                    minHeight: '92px',
                                                }}
                                            >
                                                <div style={{ minWidth: 0 }}>
                                                    <h2
                                                        className="page-title"
                                                        style={{
                                                            fontSize: 'clamp(1.9rem, 4vw, 2.125rem)',
                                                            marginBottom: '10px',
                                                        }}
                                                    >
                                                        {flight.origin_iata} → {flight.destination_iata}
                                                    </h2>

                                                    <div className="meta-row" style={{ marginTop: 0 }}>
                                                        <span>
                                                            {flight.airline} • {flight.flight_number}
                                                        </span>
                                                    </div>
                                                </div>

                                                <span
                                                    style={{
                                                        fontSize: '12px',
                                                        padding: '8px 12px',
                                                        borderRadius: '999px',
                                                        backgroundColor: flight.is_active ? '#dcfce7' : '#e2e8f0',
                                                        color: flight.is_active ? '#166534' : '#334155',
                                                        fontWeight: 700,
                                                        whiteSpace: 'nowrap',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {flight.is_active ? 'Attivo' : 'In pausa'}
                                                </span>
                                            </div>

                                            <div
                                                className="meta-row"
                                                style={{
                                                    alignItems: 'center',
                                                    minHeight: '28px',
                                                }}
                                            >
                                                <CalendarDays size={16} />
                                                <span>
                                                    {flight.flight_date}
                                                    {flight.departure_time ? ` • ${flight.departure_time}` : ''}
                                                </span>
                                            </div>

                                            {flight.latest_price ? (
                                                <div
                                                    style={{
                                                        minHeight: '180px',
                                                        display: 'grid',
                                                        alignContent: 'start',
                                                        gap: '12px',
                                                    }}
                                                >
                                                    <p className="price-main" style={{ margin: 0 }}>
                                                        {flight.latest_price}
                                                        <span className="price-currency">
                                                            {flight.latest_currency}
                                                        </span>
                                                    </p>

                                                    <div
                                                        style={{
                                                            fontSize: '14px',
                                                            color: '#64748b',
                                                            lineHeight: 1.5,
                                                        }}
                                                    >
                                                        Aggiornato: {flight.last_checked_at}
                                                    </div>

                                                    {insights && (insights.min || insights.avg) && (
                                                        <div
                                                            className="meta-row"
                                                            style={{
                                                                fontSize: '14px',
                                                                gap: '14px',
                                                            }}
                                                        >
                                                            <span>
                                                                Min storico:{' '}
                                                                <strong style={{ color: '#0f172a' }}>
                                                                    {insights.min
                                                                        ? `${insights.min} ${flight.latest_currency}`
                                                                        : '—'}
                                                                </strong>
                                                            </span>

                                                            <span>
                                                                Media:{' '}
                                                                <strong style={{ color: '#0f172a' }}>
                                                                    {insights.avg
                                                                        ? `${insights.avg} ${flight.latest_currency}`
                                                                        : '—'}
                                                                </strong>
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div
                                                        className="actions-row"
                                                        style={{
                                                            gap: '10px',
                                                        }}
                                                    >
                                                        {flight.price_difference !== null && (
                                                            <span
                                                                style={{
                                                                    display: 'inline-block',
                                                                    padding: '7px 11px',
                                                                    borderRadius: '999px',
                                                                    fontWeight: 700,
                                                                    fontSize: '14px',
                                                                    ...getDifferenceStyles(flight.price_difference),
                                                                }}
                                                            >
                                                                {getDifferenceLabel(flight.price_difference)}{' '}
                                                                {flight.latest_currency}
                                                            </span>
                                                        )}

                                                        {insights?.trend && insights.trend !== 'none' && (
                                                            <span
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    padding: '7px 11px',
                                                                    borderRadius: '999px',
                                                                    fontWeight: 700,
                                                                    fontSize: '14px',
                                                                    ...getTrendStyles(insights.trend),
                                                                }}
                                                            >
                                                                <ChartNoAxesCombined size={14} />
                                                                {getTrendLabel(insights.trend)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    style={{
                                                        minHeight: '180px',
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                    }}
                                                >
                                                    <p className="section-subtitle" style={{ margin: 0 }}>
                                                        Nessun prezzo registrato
                                                    </p>
                                                </div>
                                            )}

                                            {flight.notes && (
                                                <div className="note-box">
                                                    <div
                                                        style={{
                                                            fontSize: '14px',
                                                            color: '#475569',
                                                            lineHeight: 1.5,
                                                        }}
                                                    >
                                                        {flight.notes}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div
                                            className="actions-row space-between"
                                            style={{
                                                marginTop: '24px',
                                                gap: '18px',
                                                paddingTop: '4px',
                                            }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => refreshPrice(flight.id)}
                                                className="btn-primary"
                                                style={{
                                                    padding: '11px 15px',
                                                }}
                                            >
                                                <RefreshCw size={16} />
                                                Aggiorna prezzo
                                            </button>

                                            <Link
                                                href={`/flights/${flight.id}`}
                                                style={{
                                                    fontWeight: 700,
                                                    color: '#0f172a',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    fontSize: '15px',
                                                    textDecoration: 'none',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                Visualizza dettagli
                                                <ArrowRight size={16} />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}