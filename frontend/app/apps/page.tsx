'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    CheckCircle2,
    ExternalLink,
    ArrowRight,
    Sparkles,
    ShieldCheck,
    Database,
    Globe,
    Server,
    Zap,
    Flame,
    Cloud,
} from 'lucide-react';

interface IntegrationApp {
    id: string;
    name: string;
    category: string;
    description: string;
    icon: React.ReactNode;
    connected: boolean;
    popular?: boolean;
}

const EXPRESS_BACKEND_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:4000';

export default function AppSelectionOnboarding() {
    const searchParams = useSearchParams();

    const [apps, setApps] = useState<IntegrationApp[]>([
        {
            id: 'github',
            name: 'GitHub',
            category: 'Version Control',
            description: 'Connect repositories to automate workflow dispatch, PRs & deployments.',
            icon: (
                <svg className="w-6 h-6 fill-current text-slate-900 dark:text-slate-100" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
            ),
            connected: false,
            popular: true,
        },
        {
            id: 'neon',
            name: 'Neon DB',
            category: 'Database',
            description: 'Serverless Postgres database with instant branching capabilities.',
            icon: <Database className="w-6 h-6 text-emerald-500" />,
            connected: false,
            popular: true,
        },
        {
            id: 'hostinger',
            name: 'Hostinger',
            category: 'Hosting',
            description: 'Deploy web services and domains directly via API management.',
            icon: <Globe className="w-6 h-6 text-indigo-500" />,
            connected: false,
        },
        {
            id: 'vercel',
            name: 'Vercel',
            category: 'Deployment Platform',
            description: 'Automated frontend builds, preview deployments, and edge functions.',
            icon: <Zap className="w-6 h-6 text-slate-800 dark:text-slate-200" />,
            connected: false,
        },
        {
            id: 'aws',
            name: 'AWS',
            category: 'Cloud Infrastructure',
            description: 'Provision serverless computing, S3 buckets, and IAM roles.',
            icon: <Server className="w-6 h-6 text-amber-500" />,
            connected: false,
        },
        {
            id: 'supabase',
            name: 'Supabase',
            category: 'Backend as a Service',
            description: 'Open source Firebase alternative with Auth, DB, and Realtime.',
            icon: <Flame className="w-6 h-6 text-emerald-600" />,
            connected: false,
        },
        {
            id: 'cloudflare',
            name: 'Cloudflare',
            category: 'CDN & Security',
            description: 'Manage DNS records, DDoS protection, and Worker scripts.',
            icon: <Cloud className="w-6 h-6 text-orange-500" />,
            connected: false,
        },
    ]);

    // Handle redirect feedback from Express backend
    useEffect(() => {
        const status = searchParams.get('status');
        if (status === 'github_connected') {
            setApps((prev) =>
                prev.map((app) => (app.id === 'github' ? { ...app, connected: true } : app))
            );
        }
    }, [searchParams]);

    const handleConnect = (appId: string) => {
        if (appId === 'github') {
            window.location.href = `${EXPRESS_BACKEND_URL}/api/auth/github/connect`;
        } else {
            alert(`Integration flow for ${appId} initiated.`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        Step 2 of 3: Integrations Setup
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight sm:text-4xl">
                        Connect Your Development Stack
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                        Authorize your cloud platforms and code repositories to enable automated deployments.
                    </p>
                </div>

                {/* Integration App Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {apps.map((app) => (
                        <div
                            key={app.id}
                            className={`relative flex flex-col justify-between p-5 bg-white dark:bg-slate-900 border ${app.connected
                                ? 'border-emerald-500/50 ring-1 ring-emerald-500/20'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                } rounded-xl shadow-sm transition-all duration-200`}
                        >
                            <div>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                            {app.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                {app.name}
                                                {app.popular && (
                                                    <span className="text-[10px] px-1.5 py-0.5 font-medium bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800">
                                                        Popular
                                                    </span>
                                                )}
                                            </h3>
                                            <span className="text-[11px] font-medium text-slate-400">
                                                {app.category}
                                            </span>
                                        </div>
                                    </div>

                                    {app.connected && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                                    {app.description}
                                </p>
                            </div>

                            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> OAuth 2.0 Encrypted
                                </span>

                                <button
                                    type="button"
                                    onClick={() => handleConnect(app.id)}
                                    disabled={app.connected}
                                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${app.connected
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                                        }`}
                                >
                                    {app.connected ? 'Configured' : 'Connect'}
                                    {!app.connected && <ExternalLink className="w-3 h-3" />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action Controls */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
                    <button
                        type="button"
                        className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
                    >
                        Skip for now
                    </button>

                    <a
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition shadow-md"
                    >
                        Continue to Dashboard <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                </div>
            </div>
        </div>
    );
}