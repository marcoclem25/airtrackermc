import { Link } from '@inertiajs/react';
import { Plane, PlaneTakeoff, ArrowRight, Plus, BadgeInfo } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';

type Props = {
    stats: {
        totalFlights: number;
    };
};

export default function Dashboard({ stats }: Props) {
    const hasFlights = stats.totalFlights > 0;

    return (
        <AppLayout>
            <div className="page-shell">
                <div className="page-header">
                    <h1
                        className="page-title"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            flexWrap: 'wrap',
                        }}
                    >
                        <PlaneTakeoff size={34} />
                        AirTrackerMC
                    </h1>

                    <p className="page-subtitle" style={{ maxWidth: '900px' }}>
                        Monitora i tuoi voli e tieni sotto controllo l’andamento dei prezzi.
                    </p>
                </div>

                {hasFlights ? (
                    <div className="stack-24">
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                gap: '24px',
                            }}
                        >
                            <div className="app-card">
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        marginBottom: '18px',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '42px',
                                            height: '42px',
                                            borderRadius: '12px',
                                            backgroundColor: '#eff6ff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#1d4ed8',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Plane size={18} />
                                    </div>

                                    <p
                                        style={{
                                            margin: 0,
                                            color: '#64748b',
                                            fontSize: '15px',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Voli monitorati
                                    </p>
                                </div>

                                <h2
                                    className="price-main"
                                    style={{
                                        margin: 0,
                                    }}
                                >
                                    {stats.totalFlights}
                                </h2>
                            </div>

                            <div className="app-card">
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        marginBottom: '18px',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '42px',
                                            height: '42px',
                                            borderRadius: '12px',
                                            backgroundColor: '#eff6ff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#1d4ed8',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <BadgeInfo size={18} />
                                    </div>

                                    <p
                                        style={{
                                            margin: 0,
                                            color: '#64748b',
                                            fontSize: '15px',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Compagnia supportata
                                    </p>
                                </div>

                                <h2
                                    style={{
                                        margin: 0,
                                        fontSize: '30px',
                                        fontWeight: 800,
                                        color: '#0f172a',
                                        lineHeight: 1.1,
                                    }}
                                >
                                    Ryanair
                                </h2>

                                <p
                                    style={{
                                        margin: '10px 0 0 0',
                                        color: '#64748b',
                                        fontSize: '15px',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    Attualmente è l’unica compagnia disponibile per il monitoraggio
                                    dei prezzi.
                                </p>
                            </div>
                        </div>

                        <div className="app-card">
                            <h2 className="section-title" style={{ marginBottom: '10px' }}>
                                Azioni rapide
                            </h2>

                            <p
                                className="section-subtitle"
                                style={{
                                    marginTop: '10px',
                                    marginBottom: '24px',
                                    fontSize: '17px',
                                }}
                            >
                                Accedi velocemente alle funzioni principali di AirTrackerMC.
                            </p>

                            <div className="actions-row">
                                <Link
                                    href="/flights"
                                    className="btn-primary"
                                    style={{
                                        padding: '15px 24px',
                                        fontSize: '17px',
                                    }}
                                >
                                    <ArrowRight size={18} />
                                    Vai ai miei voli
                                </Link>

                                <Link
                                    href="/flights/create"
                                    className="btn-secondary"
                                    style={{
                                        padding: '15px 24px',
                                        fontSize: '17px',
                                        backgroundColor: '#e2e8f0',
                                        color: '#0f172a',
                                    }}
                                >
                                    <Plus size={18} />
                                    Aggiungi un volo
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="stack-24">
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                gap: '24px',
                            }}
                        >
                            <div className="app-card">
                                <h2 className="section-title" style={{ marginBottom: '10px' }}>
                                    Nessun volo monitorato
                                </h2>

                                <p
                                    className="section-subtitle"
                                    style={{
                                        marginBottom: 0,
                                        maxWidth: '680px',
                                    }}
                                >
                                    Inizia aggiungendo il tuo primo volo per monitorare il prezzo
                                    nel tempo e tenere tutto sotto controllo da un’unica dashboard.
                                </p>
                            </div>

                            <div className="app-card">
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        marginBottom: '18px',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '42px',
                                            height: '42px',
                                            borderRadius: '12px',
                                            backgroundColor: '#eff6ff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#1d4ed8',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <BadgeInfo size={18} />
                                    </div>

                                    <p
                                        style={{
                                            margin: 0,
                                            color: '#64748b',
                                            fontSize: '15px',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Compagnia supportata
                                    </p>
                                </div>

                                <h2
                                    style={{
                                        margin: 0,
                                        fontSize: '30px',
                                        fontWeight: 800,
                                        color: '#0f172a',
                                        lineHeight: 1.1,
                                    }}
                                >
                                    Ryanair
                                </h2>

                                <p
                                    style={{
                                        margin: '10px 0 0 0',
                                        color: '#64748b',
                                        fontSize: '15px',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    Per ora il monitoraggio dei prezzi è disponibile solo per i voli
                                    Ryanair.
                                </p>
                            </div>
                        </div>

                        <div className="app-card">
                            <div className="actions-row">
                                <Link href="/flights/create" className="btn-primary">
                                    <Plus size={18} />
                                    Aggiungi il primo volo
                                </Link>

                                <Link href="/flights" className="btn-secondary">
                                    <ArrowRight size={18} />
                                    Vai ai miei voli
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}