import { useEffect, useMemo, useRef, useState } from 'react';
import type { AirportOption } from '../data/airports';

type Props = {
    label: string;
    required?: boolean;
    value: string;
    displayValue: string;
    onSelect: (airport: AirportOption) => void;
    onDisplayValueChange: (value: string) => void;
    options: AirportOption[];
    placeholder?: string;
    error?: string;
    helperText?: string;
};

export default function AirportAutocomplete({
    label,
    required = false,
    value,
    displayValue,
    onSelect,
    onDisplayValueChange,
    options,
    placeholder = 'Cerca città, aeroporto o codice IATA',
    error,
    helperText,
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    const filteredOptions = useMemo(() => {
        const query = displayValue.trim().toLowerCase();

        if (!query) {
            return options.slice(0, 8);
        }

        return options
            .filter((airport) => {
                const city = airport.city.toLowerCase();
                const name = airport.name.toLowerCase();
                const iata = airport.iata.toLowerCase();
                const country = airport.country?.toLowerCase() ?? '';

                return (
                    city.includes(query) ||
                    name.includes(query) ||
                    iata.includes(query) ||
                    country.includes(query)
                );
            })
            .slice(0, 8);
    }, [displayValue, options]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!wrapperRef.current) {
                return;
            }

            if (!wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    const labelStyle = {
        fontWeight: 700,
        fontSize: '14px',
        color: '#334155',
    };

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

    const helperStyle = {
        marginTop: '6px',
        fontSize: '13px',
        color: '#64748b',
        lineHeight: 1.5,
    };

    const errorStyle = {
        color: '#b91c1c',
        marginTop: '6px',
        fontSize: '13px',
        fontWeight: 600,
    };

    const selectOption = (airport: AirportOption) => {
        onSelect(airport);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative' }}>
            <label style={labelStyle}>
                {label} {required ? '*' : ''}
            </label>

            <input
                type="text"
                value={displayValue}
                onChange={(e) => {
                    onDisplayValueChange(e.target.value);
                    setHighlightedIndex(0);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={(e) => {
                    if (!filteredOptions.length) {
                        return;
                    }

                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setIsOpen(true);
                        setHighlightedIndex((prev) =>
                            prev < filteredOptions.length - 1 ? prev + 1 : prev
                        );
                    }

                    if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                    }

                    if (e.key === 'Enter' && isOpen) {
                        e.preventDefault();
                        selectOption(filteredOptions[highlightedIndex]);
                    }

                    if (e.key === 'Escape') {
                        setIsOpen(false);
                    }
                }}
                placeholder={placeholder}
                style={inputStyle}
            />

            {value && (
                <div style={{ ...helperStyle, fontWeight: 600 }}>
                    Codice selezionato: {value}
                </div>
            )}

            {!value && helperText && <div style={helperStyle}>{helperText}</div>}
            {error && <div style={errorStyle}>{error}</div>}

            {isOpen && displayValue.trim().length > 2 && filteredOptions.length > 0 && (
                    <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '8px',
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        boxShadow: '0 12px 30px rgba(15,23,42,0.10)',
                        overflow: 'hidden',
                        zIndex: 30,
                    }}
                >
                    {filteredOptions.map((airport, index) => {
                        const isHighlighted = index === highlightedIndex;

                        return (
                            <button
                                key={`${airport.iata}-${airport.name}`}
                                type="button"
                                onClick={() => selectOption(airport)}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '12px 14px',
                                    border: 'none',
                                    backgroundColor: isHighlighted ? '#f8fafc' : 'white',
                                    cursor: 'pointer',
                                    borderBottom:
                                        index !== filteredOptions.length - 1
                                            ? '1px solid #f1f5f9'
                                            : 'none',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        color: '#0f172a',
                                    }}
                                >
                                    {airport.city} {airport.name ? `• ${airport.name}` : ''} ({airport.iata})
                                </div>

                                {airport.country && (
                                    <div
                                        style={{
                                            marginTop: '2px',
                                            fontSize: '13px',
                                            color: '#64748b',
                                        }}
                                    >
                                        {airport.country}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {isOpen && displayValue.trim() && filteredOptions.length === 0 && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '8px',
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        boxShadow: '0 12px 30px rgba(15,23,42,0.10)',
                        padding: '12px 14px',
                        zIndex: 30,
                        fontSize: '14px',
                        color: '#64748b',
                    }}
                >
                    Nessun aeroporto trovato.
                </div>
            )}
        </div>
    );
}