import { Link } from '@inertiajs/react';
import { PlaneTakeoff } from 'lucide-react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh items-center justify-center bg-[#f8fafc] px-6 py-10">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <Link
                        href={home()}
                        className="inline-flex items-center justify-center gap-3 text-3xl font-bold tracking-tight text-[#0f172a]"
                    >
                        <PlaneTakeoff size={28} />
                        <span>AirTrackerMC</span>
                    </Link>

                    <p className="mt-3 text-[15px] text-slate-500">
                     Monitora i tuoi voli e prenota al momento giusto                  
                       </p>
                </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.10)]">                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-bold text-[#0f172a]">{title}</h1>
                        <p className="mt-2 text-sm text-slate-500">{description}</p>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}