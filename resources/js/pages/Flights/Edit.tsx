import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, PlaneTakeoff } from 'lucide-react';
import { useState } from 'react';
import AirportAutocomplete from '../../components/AirportAutocomplete';
import { airports } from '../../data/airports';
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
};

type Props = {
    flight: Flight;
};

const airlineOptions = [{ value: 'Ryanair', label: 'Ryanair' }];


export default function Edit({ flight }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        origin_iata: flight.origin_iata,
        destination_iata: flight.destination_iata,
        flight_date: flight.flight_date,
        departure_time: flight.departure_time ?? '',
        airline: flight.airline,
        flight_number: flight.flight_number,
        notes: flight.notes ?? '',
        is_active: flight.is_active,
    });

    const [originDisplay, setOriginDisplay] = useState(flight.origin_iata);
    const [destinationDisplay, setDestinationDisplay] = useState(flight.destination_iata);

    const inputStyle = {
        width: '100%',
        padding: '13px 14px',
        marginTop: '8px',
        borderRadius: '12px',
        border: '1px solid #cbd5e1',
        backgroundColor: 'white',
        fontSize: '15px',
        color: '#0f172a',
        boxSizing: 'border-box' as const,
    };

    const labelStyle = {
        fontWeight: 700,
        fontSize: '14px',
        color: '#334155',
    };

    const errorStyle = {
        color: '#b91c1c',
        marginTop: '6px',
        fontSize: '13px',
        fontWeight: 600,
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/flights/${flight.id}`);
    };

    return (
        <AppLayout>
            <div className="page-shell">
                <Link href={`/flights/${flight.id}`} className="page-back-link">
                    <ArrowLeft size={16} />
                    Torna al dettaglio
                </Link>

                <div className="page-header">
                    <h1 className="page-title">Modifica volo</h1>

                    <p className="page-subtitle">
                        Aggiorna i dati del volo che stai monitorando mantenendo la tua lista
                        ordinata e sempre corretta.
                    </p>
                </div>

                <div className="app-card">
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '24px',
                            flexWrap: 'wrap',
                        }}
                    >
                        <div
                            style={{
                                width: '46px',
                                height: '46px',
                                borderRadius: '14px',
                                backgroundColor: '#eff6ff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#2563eb',
                                flexShrink: 0,
                            }}
                        >
                            <PlaneTakeoff size={22} />
                        </div>

                        <div>
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: '22px',
                                    color: '#0f172a',
                                }}
                            >
                                Dati del volo
                            </h2>

                            <p
                                style={{
                                    margin: '4px 0 0 0',
                                    color: '#64748b',
                                    fontSize: '14px',
                                }}
                            >
                                Modifica i campi principali del volo monitorato.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={submit}>
                        <div className="form-grid">
                            <AirportAutocomplete
                                label="Aeroporto di partenza"
                                required
                                value={data.origin_iata}
                                displayValue={originDisplay}
                                onDisplayValueChange={(value) => {
                                    setOriginDisplay(value);
                                    setData('origin_iata', '');
                                }}
                                onSelect={(airport) => {
                                    setOriginDisplay(
                                        `${airport.city} • ${airport.name} (${airport.iata})`
                                    );
                                    setData('origin_iata', airport.iata);
                                }}
                                options={airports}
                                error={errors.origin_iata}
                            />

                            <AirportAutocomplete
                                label="Aeroporto di arrivo"
                                required
                                value={data.destination_iata}
                                displayValue={destinationDisplay}
                                onDisplayValueChange={(value) => {
                                    setDestinationDisplay(value);
                                    setData('destination_iata', '');
                                }}
                                onSelect={(airport) => {
                                    setDestinationDisplay(
                                        `${airport.city} • ${airport.name} (${airport.iata})`
                                    );
                                    setData('destination_iata', airport.iata);
                                }}
                                options={airports}
                                error={errors.destination_iata}
                            />

                            <div>
                                <label style={labelStyle}>Data del volo *</label>
                                <input
                                    type="date"
                                    value={data.flight_date}
                                    onChange={(e) => setData('flight_date', e.target.value)}
                                    style={inputStyle}
                                />
                                {errors.flight_date && (
                                    <div style={errorStyle}>{errors.flight_date}</div>
                                )}
                            </div>

                            <div>
                                <label style={labelStyle}>Orario di partenza *</label>
                                <input
                                    type="time"
                                    value={data.departure_time}
                                    onChange={(e) => setData('departure_time', e.target.value)}
                                    style={inputStyle}
                                />
                                {errors.departure_time && (
                                    <div style={errorStyle}>{errors.departure_time}</div>
                                )}
                            </div>

                            <div>
                                <label style={labelStyle}>Compagnia aerea *</label>
                                <select
                                    value={data.airline}
                                    onChange={(e) => setData('airline', e.target.value)}
                                    style={inputStyle}
                                >
                                    {airlineOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.airline && <div style={errorStyle}>{errors.airline}</div>}
                            </div>

                            <div>
                                <label style={labelStyle}>Numero volo *</label>
                                <input
                                    type="text"
                                    value={data.flight_number}
                                    onChange={(e) =>
                                        setData('flight_number', e.target.value.toUpperCase())
                                    }
                                    placeholder="Es. FR1234"
                                    style={inputStyle}
                                />
                                {errors.flight_number && (
                                    <div style={errorStyle}>{errors.flight_number}</div>
                                )}
                            </div>
                        </div>

                        <div style={{ marginTop: '22px' }}>
                            <label style={labelStyle}>Note personali</label>
                            <textarea
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Aggiungi note facoltative sul volo, sul motivo del viaggio o altri dettagli utili"
                                style={{
                                    ...inputStyle,
                                    minHeight: '110px',
                                    resize: 'vertical' as const,
                                }}
                            />
                            {errors.notes && <div style={errorStyle}>{errors.notes}</div>}
                        </div>

                        <div className="actions-row" style={{ marginTop: '28px' }}>
                            <button
                                type="submit"
                                disabled={processing}
                                className="btn-primary"
                                style={{
                                    opacity: processing ? 0.7 : 1,
                                    cursor: processing ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)',
                                }}
                            >
                                <Save size={18} />
                                {processing ? 'Salvataggio...' : 'Salva modifiche'}
                            </button>

                            <Link href={`/flights/${flight.id}`} className="btn-secondary">
                                Annulla
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}