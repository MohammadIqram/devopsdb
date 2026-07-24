'use client';

import { useState, useEffect, useMemo, useCallback, ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { axiosInstance } from '@/lib/axios';
import { useRepoStore } from '@/lib/store';
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
    Play,
    AlertOctagon,
    Clock,
    GitBranch,
    Terminal,
    X,
    Plus,
    Users,
    Link as LinkIcon
} from 'lucide-react';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export type Environment = 'staging' | 'production';

export interface Repository {
    id: string | number;
    name: string;
}

export interface Deployment {
    id: string | number;
    name: string;
    status: 'in_progress' | 'completed' | 'queued' | string;
    conclusion?: 'success' | 'failure' | 'cancelled' | string;
    branch: string;
    commit: string;
    url: string;
}

export interface Bug {
    id: string | number;
    number: number;
    title: string;
    author: string;
    url: string;
}

export interface ActiveLog {
    id: string | number;
    name: string;
    content: string;
}

export interface WebSocketEvent {
    type: string;
    repo: string;
}

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

export default function DevOpsDashboard() {
    const { repos, selectedRepo, fetchRepos, setSelectedRepo, loading } = useRepoStore();
    const [selectedBranch] = useState<string>('main');

    // Fetch repos once on app startup
    useEffect(() => {
        fetchRepos();
    }, [fetchRepos]);

    // DevOps dashboard states
    const [deployments, setDeployments] = useState<Deployment[]>([]);
    const [bugs, setBugs] = useState<Bug[]>([]);
    const [devopsLoading, setDevopsLoading] = useState<boolean>(false);
    const [deploying, setDeploying] = useState<boolean>(false);

    // Terminal logs state
    const [activeLog, setActiveLog] = useState<ActiveLog | null>(null);
    const [logLoading, setLogLoading] = useState<boolean>(false);

    // Hostinger dashboard states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [hostingerLoading, setHostingerLoading] = useState<boolean>(true);
    const [hostingerRefreshing, setHostingerRefreshing] = useState<boolean>(false);
    const [isManualRefreshing, setIsManualRefreshing] = useState<boolean>(false);

    // Live counts state from Express Backend
    const [counts, setCounts] = useState({
        projectsCount: 0,
        domainsCount: 0,
        vpsCount: 0,
        emailsCount: 0,
        databasesCount: 0,
    });

    const router = useRouter();

    // --- 1. Fetch Hostinger API Data ---
    const fetchHostingerData = useCallback(async (isManual = false) => {
        if (isManual) setHostingerRefreshing(true);
        else setHostingerLoading(true);

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
            }
        } catch (error: any) {
            console.error('Failed to sync with Hostinger API:', error);
            toast.error(error.response?.data?.message || 'Failed to sync with Hostinger API');
        } finally {
            setHostingerLoading(false);
            setHostingerRefreshing(false);
        }
    }, []);

    // --- 2. Fetch DevOps API Data ---
    const fetchDevOpsData = useCallback(async (isManual = false) => {
        if (!selectedRepo) return;
        if (isManual) setIsManualRefreshing(true);
        else setDevopsLoading(true);

        try {
            const [deployRes, bugRes] = await Promise.all([
                axiosInstance.get<Deployment[]>('/repo/deployments', {
                    params: { repo: selectedRepo },
                }),
                axiosInstance.get<Bug[]>('/bug', {
                    params: { repo: selectedRepo },
                }),
            ]);

            setDeployments(deployRes.data);
            setBugs(bugRes.data);
        } catch (err: any) {
            console.error('Failed to fetch DevOps dashboard data:', err);
            toast.error('Failed to sync with DevOps API');
        } finally {
            setDevopsLoading(false);
            setIsManualRefreshing(false);
        }
    }, [selectedRepo]);

    // Load Hostinger data on mount
    useEffect(() => {
        fetchHostingerData();
    }, [fetchHostingerData]);

    // Load DevOps data when selectedRepo changes
    useEffect(() => {
        fetchDevOpsData();
    }, [fetchDevOpsData, selectedRepo]);

    // --- 3. WebSocket updates for DevOps repository events ---
    useEffect(() => {
        if (!selectedRepo) return;

        const ws = new WebSocket('ws://localhost:4000');

        ws.onmessage = (event: MessageEvent) => {
            try {
                const data: WebSocketEvent = JSON.parse(event.data);
                if (data.type === 'GITHUB_EVENT' && data.repo === selectedRepo) {
                    fetchDevOpsData();
                }
            } catch (err) {
                console.error('WebSocket parsing error:', err);
            }
        };

        return () => ws.close();
    }, [selectedRepo, fetchDevOpsData]);

    // --- 4. Synchronize All Dashboards ---
    const handleSyncAll = async () => {
        setIsManualRefreshing(true);
        try {
            await Promise.all([
                fetchHostingerData(true),
                fetchDevOpsData(true)
            ]);
            toast.success('Console metrics synchronized!');
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setIsManualRefreshing(false);
        }
    };

    // --- 5. Trigger DevOps Deployment ---
    const triggerDeploy = async (env: Environment): Promise<void> => {
        if (!selectedRepo) return;
        setDeploying(true);

        try {
            await axiosInstance.post('/deploy', {
                repo: selectedRepo,
                environment: env,
                ref: selectedBranch,
                user: 'DevOps Lead',
            });

            toast.success(`Deployment triggered for ${selectedRepo} (${env}) on ${selectedBranch}!`);
            setTimeout(fetchDevOpsData, 2000);
        } catch (err) {
            toast.error('Failed to trigger deployment');
        } finally {
            setDeploying(false);
        }
    };

    // --- 6. Fetch Job Logs ---
    const viewLogs = async (jobId: string | number, runName: string): Promise<void> => {
        setLogLoading(true);
        setActiveLog({ id: jobId, name: runName, content: 'Fetching logs from GitHub...' });

        try {
            const { data } = await axiosInstance.get<string>(`/logs/${jobId}`, {
                params: { repo: selectedRepo },
                responseType: 'text',
            });

            setActiveLog({
                id: jobId,
                name: runName,
                content: data || 'No log text returned.',
            });
        } catch (err) {
            setActiveLog({
                id: jobId,
                name: runName,
                content: 'Failed to retrieve logs.',
            });
        } finally {
            setLogLoading(false);
        }
    };

    // Environment health status helper
    const latestSuccess = useMemo(() => {
        return deployments.find((d) => d.conclusion === 'success');
    }, [deployments]);

    // --- 7. Dynamic Hostinger Resource Metric Strips ---
    const stats: ResourceMetric[] = useMemo(() => {
        const totalActiveResources =
            counts.projectsCount +
            counts.domainsCount +
            counts.vpsCount +
            counts.emailsCount;

        return [
            {
                label: 'Active Infrastructure',
                value: hostingerLoading ? '...' : `${totalActiveResources} Resources`,
                trend: 'Live API Synced',
                status: 'healthy',
                percentage: 100,
            },
            {
                label: 'Virtual Servers',
                value: hostingerLoading ? '...' : `${counts.vpsCount} Nodes`,
                trend: 'Hostinger Cloud VPS',
                status: 'healthy',
                percentage: counts.vpsCount > 0 ? 100 : 0,
            },
            {
                label: 'Active Domains',
                value: hostingerLoading ? '...' : `${counts.domainsCount} Registered`,
                trend: 'DNS & TLD Records',
                status: 'info',
                percentage: counts.domainsCount > 0 ? 100 : 0,
            },
            {
                label: 'Mail & Accounts',
                value: hostingerLoading ? '...' : `${counts.emailsCount} Mailboxes`,
                trend: `${counts.projectsCount} Hosting Accounts`,
                status: 'healthy',
                percentage: 100,
            },
        ];
    }, [counts, hostingerLoading]);

    // --- 8. Hostinger Service Cards ---
    const services: HostingerServiceCard[] = useMemo(() => {
        return [
            {
                id: 'domains',
                title: 'Domains & DNS',
                category: 'core',
                description: 'Manage registered domains, transfer status, and TLD auto-renewals.',
                icon: <Globe className="w-5 h-5 text-indigo-500" />,
                countLabel: 'Active Domains',
                countValue: hostingerLoading ? '...' : counts.domainsCount,
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
                countValue: hostingerLoading ? '...' : counts.vpsCount,
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
                countValue: hostingerLoading ? '...' : counts.projectsCount,
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
                countValue: hostingerLoading ? '...' : counts.emailsCount,
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
                countValue: hostingerLoading ? '...' : counts.databasesCount,
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
                countValue: hostingerLoading ? '...' : counts.domainsCount,
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
                countValue: hostingerLoading ? '...' : counts.domainsCount,
                statusText: 'Edge Network Synced',
                statusType: 'info',
                href: '/hostinger/dns',
                color: 'orange',
                accentBg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/60',
            },
        ];
    }, [counts, hostingerLoading]);

    // --- 9. Filtering Logic for Hostinger ---
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
        <div className="min-h-screen py-4 px-1 sm:px-2 space-y-8">
            {/* Repo Selector */}
            <div className="relative flex items-center min-w-[200px]">
                <GitBranch className="absolute left-3 w-3.5 h-3.5 text-indigo-500 pointer-events-none z-10" />
                <select
                    value={selectedRepo}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedRepo(e.target.value)}
                    disabled={loading}
                    className="w-full pl-8 pr-8 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 appearance-none"
                >
                    {loading && <option>Loading...</option>}
                    {!loading && repos.length === 0 && <option>No repositories</option>}
                    {repos.map((r) => (
                        <option key={r.id} value={r.name} className="bg-white dark:bg-slate-900">
                            {r.name}
                        </option>
                    ))}
                </select>
            </div>
            {/* Top Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-xs font-semibold mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                        Unified DevOps & Cloud Console
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                        Infrastructure Hub Dashboard
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {selectedRepo
                            ? `Real-time pipelines for ${selectedRepo} integrated with Hostinger service modules.`
                            : 'Please select a repository from the header dropdown to view development pipelines.'
                        }
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSyncAll}
                        disabled={isManualRefreshing || hostingerRefreshing || devopsLoading}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition shadow-xs disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isManualRefreshing || hostingerRefreshing || devopsLoading ? 'animate-spin' : ''}`} />
                        <span>{isManualRefreshing || hostingerRefreshing || devopsLoading ? 'Syncing...' : 'Sync Console'}</span>
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

            {/* Live Operational Status & Resource Stats Strip */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                        Live Infrastructure Metrics
                    </h2>
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        All Systems Operational
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                    {/* 1. Env Status */}
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Environment</span>
                            <Activity className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                            <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                                Production
                            </div>
                            <div className="flex items-center gap-1 mt-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Operational</span>
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-emerald-500 h-1.5 rounded-full w-full" />
                        </div>
                    </div>

                    {/* 2. Active Build */}
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Build</span>
                            <GitBranch className="w-4 h-4 text-violet-500" />
                        </div>
                        <div>
                            <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 truncate">
                                {devopsLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                ) : (
                                    deployments[0]?.branch || 'main'
                                )}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                                <span>{latestSuccess ? `Commit: ${latestSuccess.commit.substring(0, 7)}` : 'No runs'}</span>
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-violet-500 h-1.5 rounded-full w-full" />
                        </div>
                    </div>

                    {/* 3. Incidents */}
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Incidents</span>
                            <AlertOctagon className={`w-4 h-4 ${bugs.length > 0 ? 'text-rose-500 animate-bounce' : 'text-slate-400'}`} />
                        </div>
                        <div>
                            <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                                {devopsLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                ) : (
                                    `${bugs.length} Critical`
                                )}
                            </div>
                            <div className={`flex items-center gap-1 mt-0.5 text-[11px] font-medium ${bugs.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                <span>{bugs.length > 0 ? 'Attention Required' : 'All Clear'}</span>
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-1.5 rounded-full transition-all duration-500 ${bugs.length > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: bugs.length > 0 ? '100%' : '0%' }} />
                        </div>
                    </div>

                    {/* Hostinger stats */}
                    {stats.map((metric, idx) => (
                        <div
                            key={idx}
                            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3"
                        >
                            <div className="flex items-center justify-between text-slate-450">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    {metric.label}
                                </span>
                                {idx === 0 && <Layers className="w-4 h-4 text-emerald-500" />}
                                {idx === 1 && <Cpu className="w-4 h-4 text-violet-500" />}
                                {idx === 2 && <Globe className="w-4 h-4 text-amber-500" />}
                                {idx === 3 && <Mail className="w-4 h-4 text-teal-500" />}
                            </div>

                            <div>
                                <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    {hostingerLoading ? (
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

            {/* Quick Links Section */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5 text-indigo-500" />
                        Quick Navigation Links
                    </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {[
                        {
                            label: 'Webhook Manager',
                            href: '/webhook-manager',
                            description: 'Configure and test GitHub webhook integrations.',
                            icon: <Network className="w-5 h-5 text-indigo-500" />,
                            bg: 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40 hover:border-indigo-300 dark:hover:border-indigo-800',
                        },
                        {
                            label: 'Repositories List',
                            href: '/repo',
                            description: 'Configure connected codebases and settings.',
                            icon: <GitBranch className="w-5 h-5 text-violet-500" />,
                            bg: 'bg-violet-50/50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/40 hover:border-violet-300 dark:hover:border-violet-800',
                        },
                        {
                            label: 'Contributors Hub',
                            href: '/contributers',
                            description: 'Monitor repository developer contributions.',
                            icon: <Users className="w-5 h-5 text-emerald-500" />,
                            bg: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-800',
                        },
                        {
                            label: 'Add Contributor',
                            href: '/contributers/add',
                            description: 'Register a new developer to a repository.',
                            icon: <Plus className="w-5 h-5 text-sky-500" />,
                            bg: 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/40 hover:border-sky-300 dark:hover:border-sky-800',
                        },
                        {
                            label: 'Hostinger hPanel',
                            href: 'https://hpanel.hostinger.com',
                            description: 'Access the external official hosting dashboard.',
                            icon: <ExternalLink className="w-5 h-5 text-amber-500" />,
                            isExternal: true,
                            bg: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40 hover:border-amber-300 dark:hover:border-amber-800',
                        },
                    ].map((link, idx) => {
                        const CardContent = (
                            <div className={`p-4 bg-white dark:bg-slate-900 border rounded-2xl shadow-xs transition-all duration-200 group flex items-start gap-3 h-full cursor-pointer hover:shadow-md ${link.bg}`}>
                                <div className="p-2 rounded-xl bg-white dark:bg-slate-950 shadow-2xs border border-slate-100 dark:border-slate-800/80">
                                    {link.icon}
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {link.label}
                                        {link.isExternal && <ExternalLink className="w-3 h-3 text-slate-400" />}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                                        {link.description}
                                    </p>
                                </div>
                            </div>
                        );

                        if (link.isExternal) {
                            return (
                                <a key={idx} href={link.href} target="_blank" rel="noreferrer" className="block h-full">
                                    {CardContent}
                                </a>
                            );
                        }

                        return (
                            <Link key={idx} href={link.href} className="block h-full">
                                {CardContent}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Main Dashboard Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: DevOps Deployments & History (lg:col-span-5) */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                            <Server className="w-3.5 h-3.5 text-indigo-500" />
                            DevOps Pipeline Control
                        </h2>
                    </div>

                    {/* Action Target Deploy Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-xl border bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/60">
                                <Cpu className="w-5 h-5 text-violet-500" />
                            </div>

                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                Repo: {selectedRepo || 'Unselected'}
                            </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                            Deploy Target: <span className="text-indigo-600 dark:text-indigo-400">{selectedRepo || 'Select Repository'}</span>
                        </h3>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                            Triggers custom SSH & Docker deployment runners on hosting servers for branch <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px] font-semibold text-slate-700 dark:text-slate-300">{selectedBranch}</span>.
                        </p>

                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/85 flex flex-col sm:flex-row gap-3">
                            <button
                                disabled={deploying || !selectedRepo}
                                onClick={() => triggerDeploy('staging')}
                                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                            >
                                {deploying ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Play className="w-3.5 h-3.5" />
                                )}
                                Deploy to Staging
                            </button>
                            <button
                                disabled={deploying || !selectedRepo}
                                onClick={() => triggerDeploy('production')}
                                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                            >
                                {deploying ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Play className="w-3.5 h-3.5" />
                                )}
                                Deploy to Production
                            </button>
                        </div>
                    </div>

                    {/* Pipelines execution history card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-500" /> Pipeline History
                        </h3>

                        <div className="space-y-3">
                            {deployments.length === 0 ? (
                                <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                    <p className="text-xs text-slate-450 dark:text-slate-500">No recent workflow runs found.</p>
                                </div>
                            ) : (
                                deployments.map((run) => (
                                    <div
                                        key={run.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 gap-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            {run.status === 'in_progress' ? (
                                                <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                                            ) : run.conclusion === 'success' ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <AlertOctagon className="w-4 h-4 text-rose-500" />
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-bold text-xs text-slate-850 dark:text-slate-200 truncate">{run.name}</p>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                    {run.branch} • <span className="font-mono text-[9px] bg-slate-200/50 dark:bg-slate-800/60 px-1 py-0.2 rounded font-semibold text-slate-700 dark:text-slate-300">{run.commit.substring(0, 7)}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => viewLogs(run.id, run.name)}
                                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold transition cursor-pointer"
                                            >
                                                <Terminal className="w-3 h-3 text-indigo-500" />
                                                Logs
                                            </button>
                                            <a
                                                href={run.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white text-slate-700 dark:text-slate-200 text-[10px] font-bold transition"
                                            >
                                                GitHub
                                                <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Incident Bugs Tracker Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-rose-500 mb-4 flex items-center gap-2">
                            <AlertOctagon className="w-4 h-4 animate-pulse" /> Incident Tracker ({bugs.length})
                        </h3>

                        {bugs.length === 0 ? (
                            <div className="text-center py-6 border border-dashed border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/10 dark:bg-emerald-950/5 rounded-xl">
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    All repositories stable. No critical incidents.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {bugs.map((bug) => (
                                    <div
                                        key={bug.id}
                                        className="p-3.5 bg-rose-50/50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40 rounded-xl group hover:border-rose-355 dark:hover:border-rose-700/80 transition duration-150"
                                    >
                                        <a
                                            href={bug.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs font-bold text-rose-950 dark:text-rose-200 hover:underline block leading-snug group-hover:text-rose-700 dark:group-hover:text-rose-350 transition-colors"
                                        >
                                            #{bug.number}: {bug.title}
                                        </a>
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-rose-100/50 dark:border-rose-900/20 text-[10px] text-rose-600 dark:text-rose-455/80">
                                            <span>Opened by <span className="font-bold">{bug.author}</span></span>
                                            <span className="flex items-center gap-0.5 font-bold hover:underline">
                                                View Bug <ExternalLink className="w-2.5 h-2.5" />
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* LOG TERMINAL MODAL */}
            {activeLog && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-slate-950 text-slate-100 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-850 bg-slate-900/50">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-5 h-5 text-indigo-400" />
                                <h3 className="font-mono text-xs font-semibold">{activeLog.name} (Job #{activeLog.id})</h3>
                            </div>
                            <button
                                onClick={() => setActiveLog(null)}
                                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Content / Terminal Output */}
                        <div className="p-5 font-mono text-xs overflow-y-auto flex-1 bg-slate-950 text-emerald-450 whitespace-pre-wrap leading-relaxed">
                            {logLoading ? (
                                <div className="flex items-center gap-2 text-amber-400">
                                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> Fetching raw logs from GitHub Actions...
                                </div>
                            ) : (
                                activeLog.content
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}