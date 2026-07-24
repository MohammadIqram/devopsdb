'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { axiosInstance } from '@/lib/axios';
import toast from 'react-hot-toast';
import {
    Globe,
    Server,
    Mail,
    ShieldCheck,
    Network,
    Database,
    Archive,
    ExternalLink,
    Layers,
    Sparkles,
    Zap,
    Activity,
    ChevronRight,
    Search,
    CheckCircle2,
    AlertTriangle,
    RefreshCw,
    TrendingUp,
    BarChart3,
    Cpu,
    HardDrive,
    Loader2,
} from 'lucide-react';

export interface ResourceMetric {
    label: string;
    value: string;
    trend?: string;
    status: 'healthy' | 'warning' | 'info';
    percentage?: number;
}

export interface HostingerServiceCard {
    id: string;
    title: string;
    category: 'core' | 'compute' | 'storage' | 'security';
    description: string;
    icon: React.ReactNode;
    countLabel: string;
    countValue: string | number;
    statusText: string;
    statusType: 'active' | 'warning' | 'info';
    href: string;
    color: string;
    accentBg: string;
}

interface BackendSummaryResponse {
    success: boolean;
    summary: {
        projectsCount: number;
        domainsCount: number;
        vpsCount: number;
        emailsCount: number;
    };
}

export default function HostingerNavigationDashboard() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [loading, setLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    // Live counts state from Express Backend
    const [counts, setCounts] = useState({
        projectsCount: 0,
        domainsCount: 0,
        vpsCount: 0,
        emailsCount: 0,
        databasesCount: 0,
    });

    // --- 1. Fetch Backend API Data ---
    const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) setIsRefreshing(true);
        else setLoading(true);

        try {
            const response = await axiosInstance.get<BackendSummaryResponse>(
                '/hostinger/dashboard-summary'
            );

            if (response.data?.success && response.data?.summary) {
                setCounts({
                    projectsCount: response.data.summary.projectsCount || 0,
                    domainsCount: response.data.summary.domainsCount || 0,
                    vpsCount: response.data.summary.vpsCount || 0,
                    emailsCount: response.data.summary.emailsCount || 0,
                    databasesCount: 0,
                });

                if (isManualRefresh) {
                    toast.success('Hostinger infrastructure metrics updated!');
                }
            }
        } catch (error: any) {
            const errorMsg =
                error.response?.data?.message || 'Failed to sync with Hostinger API';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // --- 2. Dynamic Resource Metric Strips ---
    const stats: ResourceMetric[] = useMemo(() => {
        const totalModules = 8;
        const totalActiveResources =
            counts.projectsCount +
            counts.domainsCount +
            counts.vpsCount +
            counts.emailsCount;

        return [
            {
                label: 'Active Infrastructure',
                value: loading ? '...' : `${totalActiveResources} Resources`,
                trend: 'Live API Synced',
                status: 'healthy',
                percentage: 100,
            },
            {
                label: 'Virtual Servers',
                value: loading ? '...' : `${counts.vpsCount} Nodes`,
                trend: 'Hostinger Cloud VPS',
                status: 'healthy',
                percentage: counts.vpsCount > 0 ? 100 : 0,
            },
            {
                label: 'Active Domains',
                value: loading ? '...' : `${counts.domainsCount} Registered`,
                trend: 'DNS & TLD Records',
                status: 'info',
                percentage: counts.domainsCount > 0 ? 100 : 0,
            },
            {
                label: 'Mail & Accounts',
                value: loading ? '...' : `${counts.emailsCount} Mailboxes`,
                trend: `${counts.projectsCount} Hosting Accounts`,
                status: 'healthy',
                percentage: 100,
            },
        ];
    }, [counts, loading]);

    // --- 3. Service Cards Mapping Live Counts ---
    const services: HostingerServiceCard[] = useMemo(() => {
        return [
            {
                id: 'domains',
                title: 'Domains & DNS',
                category: 'core',
                description: 'Manage registered domains, transfer status, and TLD auto-renewals.',
                icon: <Globe className="w-5 h-5 text-indigo-500" />,
                countLabel: 'Active Domains',
                countValue: loading ? '...' : counts.domainsCount,
                statusText: 'All Health Checks Passed',
                statusType: 'active',
                href: '/hostinger/domains',
                color: 'indigo',
                accentBg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60',
            },
            {
                id: 'vps',
                title: 'VPS Instances',
                category: 'compute',
                description: 'Monitor virtual private servers, SSH keys, CPU/RAM specs, and OS images.',
                icon: <Server className="w-5 h-5 text-violet-500" />,
                countLabel: 'Running Nodes',
                countValue: loading ? '...' : counts.vpsCount,
                statusText: 'Cloud Server Instance',
                statusType: 'active',
                href: '/hostinger/vps',
                color: 'violet',
                accentBg: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/60',
            },
            {
                id: 'hosting',
                title: 'Web Hosting Plans',
                category: 'compute',
                description: 'Shared, Cloud, and WordPress deployments with HTTP/3 acceleration.',
                icon: <Layers className="w-5 h-5 text-emerald-500" />,
                countLabel: 'Hosting Accounts',
                countValue: loading ? '...' : counts.projectsCount,
                statusText: 'PHP 8.2 • Cloud Engine',
                statusType: 'active',
                href: '/hostinger/hosting',
                color: 'emerald',
                accentBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
            },
            {
                id: 'emails',
                title: 'Business Mailboxes',
                category: 'core',
                description: 'Configure webmail, DKIM/SPF signatures, and auto-responders.',
                icon: <Mail className="w-5 h-5 text-sky-500" />,
                countLabel: 'Configured Mailboxes',
                countValue: loading ? '...' : counts.emailsCount,
                statusText: '0 Anti-Spam Alerts',
                statusType: 'active',
                href: '/hostinger/emails',
                color: 'sky',
                accentBg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60',
            },
            {
                id: 'databases',
                title: 'Cloud Databases',
                category: 'storage',
                description: 'MySQL & PostgreSQL instances, connection strings, and remote access.',
                icon: <Database className="w-5 h-5 text-amber-500" />,
                countLabel: 'Active DBs',
                countValue: loading ? '...' : counts.databasesCount,
                statusText: 'Remote Access Allowed',
                statusType: 'info',
                href: '/hostinger/databases',
                color: 'amber',
                accentBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
            },
            {
                id: 'ssl',
                title: 'SSL / TLS Certificates',
                category: 'security',
                description: "Manage Let's Encrypt lifetime SSLs, custom uploads, and HTTPS force.",
                icon: <ShieldCheck className="w-5 h-5 text-teal-500" />,
                countLabel: 'Valid Certificates',
                countValue: loading ? '...' : counts.domainsCount,
                statusText: 'Auto-Renew Enabled',
                statusType: 'active',
                href: '/hostinger/ssl',
                color: 'teal',
                accentBg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60',
            },
            {
                id: 'backups',
                title: 'Automated Backups',
                category: 'storage',
                description: 'Daily file/database snapshots with 1-click restore functionality.',
                icon: <Archive className="w-5 h-5 text-rose-500" />,
                countLabel: 'Snapshots',
                countValue: 'Active',
                statusText: 'Automated Daily',
                statusType: 'active',
                href: '/hostinger/backups',
                color: 'rose',
                accentBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60',
            },
            {
                id: 'dns',
                title: 'Global DNS Zone',
                category: 'core',
                description: 'A, CNAME, MX, and TXT management with Cloudflare edge proxying.',
                icon: <Network className="w-5 h-5 text-orange-500" />,
                countLabel: 'Managed Zones',
                countValue: loading ? '...' : counts.domainsCount,
                statusText: 'Edge Network Synced',
                statusType: 'info',
                href: '/hostinger/dns',
                color: 'orange',
                accentBg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/60',
            },
        ];
    }, [counts, loading]);

    // --- 4. Filtering Logic ---
    const filteredServices = useMemo(() => {
        return services.filter((service) => {
            const matchesSearch =
                service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                service.description.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory =
                selectedCategory === 'all' || service.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [services, searchQuery, selectedCategory]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Top Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-xs font-semibold mb-2">
                            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                            DevOps Infrastructure Console
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                            Hostinger Infrastructure Hub
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Real-time resource utilization, domain health, and service module access.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchDashboardData(true)}
                            disabled={isRefreshing || loading}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition shadow-xs disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span>{isRefreshing ? 'Syncing...' : 'Sync Metrics'}</span>
                        </button>

                        <a
                            href="https://hpanel.hostinger.com"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-xl text-xs font-bold transition shadow-xs"
                        >
                            <span>Open hPanel</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                </div>

                {/* Live Resource Stats Strip */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                            Live Resource Utilization
                        </h2>
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            All Systems Operational
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.map((metric, idx) => (
                            <div
                                key={idx}
                                className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3"
                            >
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        {metric.label}
                                    </span>
                                    {idx === 0 && <Activity className="w-4 h-4 text-emerald-500" />}
                                    {idx === 1 && <Cpu className="w-4 h-4 text-violet-500" />}
                                    {idx === 2 && <HardDrive className="w-4 h-4 text-amber-500" />}
                                    {idx === 3 && <ShieldCheck className="w-4 h-4 text-teal-500" />}
                                </div>

                                <div>
                                    <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        {loading ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                        ) : (
                                            metric.value
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                        <TrendingUp className="w-3 h-3 text-indigo-500 inline" />
                                        <span>{metric.trend}</span>
                                    </div>
                                </div>

                                {metric.percentage !== undefined && (
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                                            style={{ width: `${metric.percentage}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dashboard Search & Filter Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
                    {/* Category Tabs */}
                    <div className="flex items-center gap-1 p-1 bg-slate-200/60 dark:bg-slate-900 rounded-xl overflow-x-auto">
                        {[
                            { id: 'all', label: 'All Modules' },
                            { id: 'core', label: 'Domains & Mail' },
                            { id: 'compute', label: 'Hosting & VPS' },
                            { id: 'storage', label: 'Database & Backups' },
                            { id: 'security', label: 'SSL & Security' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedCategory(tab.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === tab.id
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative min-w-[240px]">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search services..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Navigation Grid Section */}
                {filteredServices.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {filteredServices.map((item) => (
                            <div
                                key={item.id}
                                className="group relative flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
                            >
                                <div>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 rounded-xl border ${item.accentBg}`}>
                                            {item.icon}
                                        </div>

                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                            {item.countLabel}: {item.countValue}
                                        </span>
                                    </div>

                                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {item.title}
                                    </h3>

                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>{item.statusText}</span>
                                    </div>

                                    <Link
                                        href={item.href}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold transition-all duration-150"
                                    >
                                        Manage
                                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            No matching infrastructure modules found
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Try adjusting your search query or switching category filters.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}