import { Link, router, usePage } from '@inertiajs/react';
import type { ReactNode, CSSProperties } from 'react';

type Props = {
    children: ReactNode;
};

type PageProps = {
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

export default function AppLayout({ children }: Props) {
    const { props, url } = usePage<PageProps>();
    const successMessage = props.flash?.success;
    const errorMessage = props.flash?.error;

    const logout = () => {
        router.post(
            '/logout',
            {},
            {
                onSuccess: () => {
                    window.location.href = '/login';
                },
            }
        );
    };

    const isDashboardActive = url === '/dashboard';
    const isFlightsActive = url === '/flights' || url.startsWith('/flights/');
    const isCreateFlightActive = url === '/flights/create';

    const getNavLinkStyle = (isActive: boolean): CSSProperties => ({
        color: isActive ? 'white' : '#cbd5e1',
        textDecoration: 'none',
        fontWeight: isActive ? 700 : 600,
        fontSize: '15px',
        padding: '10px 14px',
        borderRadius: '12px',
        backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
        border: isActive ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
    });

    return (
        <div
            style={{
                minHeight: '100vh',
                backgroundColor: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <header
                style={{
                    background: 'linear-gradient(90deg, #08142f 0%, #0f172a 55%, #111c36 100%)',
                    color: 'white',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 10px 30px rgba(2, 6, 23, 0.18)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                }}
            >
                <div className="topbar-inner">
                    <div className="topbar-left">
                        <Link
                            href="/dashboard"
                            style={{
                                color: 'white',
                                textDecoration: 'none',
                                fontWeight: 800,
                                fontSize: '22px',
                                letterSpacing: '-0.03em',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            AirTrackerMC
                        </Link>

                        <nav className="topbar-nav">
                            <Link href="/dashboard" style={getNavLinkStyle(isDashboardActive)}>
                                Dashboard
                            </Link>

                            <Link
                                href="/flights"
                                style={getNavLinkStyle(isFlightsActive && !isCreateFlightActive)}
                            >
                                I miei voli
                            </Link>

                            <Link
                                href="/flights/create"
                                style={getNavLinkStyle(isCreateFlightActive)}
                            >
                                Aggiungi volo
                            </Link>
                        </nav>
                    </div>

                    <button
                        type="button"
                        onClick={logout}
                        style={{
                            padding: '10px 16px',
                            backgroundColor: 'white',
                            color: '#0f172a',
                            borderRadius: '12px',
                            border: 'none',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main
                style={{
                    width: '100%',
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: '40px 24px',
                    flex: 1,
                    boxSizing: 'border-box',
                }}
            >
                {successMessage && (
                    <div
                        style={{
                            marginBottom: '20px',
                            padding: '14px 16px',
                            borderRadius: '12px',
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                            border: '1px solid #86efac',
                            fontWeight: 600,
                        }}
                    >
                        {successMessage}
                    </div>
                )}

                {errorMessage && (
                    <div
                        style={{
                            marginBottom: '20px',
                            padding: '14px 16px',
                            borderRadius: '12px',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            border: '1px solid #fecaca',
                            fontWeight: 600,
                        }}
                    >
                        {errorMessage}
                    </div>
                )}

                {children}
            </main>

            <footer
                style={{
                    background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
                    color: '#cbd5e1',
                    padding: '20px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                <div className="footer-inner">
                    <p style={{ margin: 0, fontSize: '15px' }}>
                        Non perdere mai il momento giusto per prenotare.
                    </p>

                    <p style={{ marginTop: '6px', fontSize: '12px', color: '#94a3b8' }}>
                        © AirTrackerMC {new Date().getFullYear()}
                    </p>
                </div>
            </footer>
        </div>
    );
}