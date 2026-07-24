'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { axiosInstance } from "@/lib/axios";
import {
    Server, Cpu, HardDrive, Activity, ShieldCheck, ExternalLink,
    ArrowLeft, Eye, EyeOff, RefreshCw, Key, Globe, Clock, Calendar,
    DownloadCloud, UploadCloud, Database, Radio, CheckCircle, AlertCircle,
    ArrowRight,
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import Link from 'next/link';

interface VpsDetailData {
    id: number;
    plan: string;
    hostname: string;
    state: string;
    cpus: number;
    memory: number;
    disk: number;
    bandwidth: number;
    ns1: string;
    ns2: string;
    created_at: string;
    expires_at: string;
    auto_renewal: boolean;
    server_location: string;
    backup_schedule: string;
    ipv4: Array<{ address: string; ptr: string }>;
    ipv6: Array<{ address: string; ptr: string }>;
    template: {
        name: string;
        description: string;
        documentation: string;
    };
    metrics: {
        cpuUsagePercent: number;
        memoryUsedMB: number;
        memoryTotalMB: number;
        diskUsedGB: number;
        diskTotalGB: number;
        incomingTrafficMbps: number;
        outgoingTrafficMbps: number;
        bandwidthUsedGB: number;
        bandwidthTotalGB: number;
        uptimeSeconds: number;
        historicalUsage: Array<{
            time: string;
            cpu: number;
            memory: number;
            incoming: number;
            outgoing: number;
        }>;
    };
}

export default function VpsDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [vps, setVps] = useState<VpsDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Password reset modal state
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [resettingPass, setResettingPass] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [resetMsg, setResetMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchVpsDetails();
    }, [id]);

    const fetchVpsDetails = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get(`/hostinger/vps/${id}`);
            if (res.data.success) {
                setVps(res.data.data);
            } else {
                setError(res.data.message || 'Failed to load VPS details');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Server connection error');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setResettingPass(true);
            setResetMsg(null);
            const res = await axiosInstance.post(`/hostinger/vps/${id}/reset-password`, { newPassword });
            if (res.data.success) {
                setResetMsg({ type: 'success', text: 'Root password updated successfully!' });
                setTimeout(() => setIsPasswordModalOpen(false), 2000);
            }
        } catch (err: any) {
            setResetMsg({
                type: 'error',
                text: err.response?.data?.message || 'Password reset failed.'
            });
        } finally {
            setResettingPass(false);
        }
    };

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        return `${days}d ${hours}h`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500">
                <div className="animate-spin w-8 h-8 border-[3px] border-indigo-600 border-t-transparent rounded-full mb-3"></div>
                <p className="text-sm font-semibold">Loading VPS Instance Details...</p>
            </div>
        );
    }

    if (error || !vps) {
        return (
            <div className="max-w-4xl mx-auto my-12 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700">
                <h3 className="font-semibold text-lg mb-1">Unable to load VPS #{id}</h3>
                <p className="text-sm mb-4">{error}</p>
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold rounded-lg transition"
                >
                    <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
            </div>
        );
    }

    const mainIp = vps.ipv4?.[0]?.address || 'N/A';
    const cloudPanelUrl = `https://${mainIp}:8443`;

    return (
        <div className="min-h-screen bg-slate-50/60 p-6 md:p-10 space-y-8 max-w-7xl mx-auto text-slate-800">
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to VPS List
                </button>
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {vps.state}
                    </span>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* BOX 1: OVERVIEW & CONTROL PANEL ACCESS */}
            {/* ========================================================================= */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                            <Server className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">{vps.hostname}</h1>
                            <p className="text-xs text-slate-500">
                                Operating System: <span className="font-semibold text-slate-700">{vps.template?.name}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                        <div>
                            SSH User: <code className="bg-slate-100 px-2 py-0.5 rounded text-indigo-700 font-mono">root</code>
                        </div>
                        <div>
                            IPv4: <code className="bg-slate-100 px-2 py-0.5 rounded font-mono">{mainIp}</code>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition"
                    >
                        <Key className="w-4 h-4 text-slate-500" />
                        Reset Root Password
                    </button>
                    <a
                        href={cloudPanelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                    >
                        Manage Panel <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* BOX 2: USAGE METRICS, PROGRESS BARS & HISTORICAL GRAPHS */}
            {/* ========================================================================= */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-base font-semibold text-slate-900">Resource Usage & Traffic Metrics</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Live Telemetry</span>
                        <Link href={`/hostinger/vps/${vps.id}/metrics`} className='text-xs font-medium cursor-pointer hover:underline text-indigo-500 flex gap-1 items-center'>get detailed stats <ArrowRight size='12px' /></Link>
                    </div>
                </div>

                {/* Progress Bar Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* CPU Usage */}
                    <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="flex items-center gap-1.5 text-slate-600">
                                <Cpu className="w-4 h-4 text-indigo-500" /> CPU Usage
                            </span>
                            <span className="text-slate-900 font-bold">{vps.metrics.cpuUsagePercent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-indigo-600 h-full transition-all duration-500"
                                style={{ width: `${vps.metrics.cpuUsagePercent}%` }}
                            />
                        </div>
                        <p className="text-[11px] text-slate-400">{vps.cpus} vCPU Core(s) allocated</p>
                    </div>

                    {/* RAM Usage */}
                    <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="flex items-center gap-1.5 text-slate-600">
                                <Database className="w-4 h-4 text-emerald-500" /> RAM Usage
                            </span>
                            <span className="text-slate-900 font-bold">
                                {((vps.metrics.memoryUsedMB / vps.metrics.memoryTotalMB) * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-emerald-500 h-full transition-all duration-500"
                                style={{ width: `${(vps.metrics.memoryUsedMB / vps.metrics.memoryTotalMB) * 100}%` }}
                            />
                        </div>
                        <p className="text-[11px] text-slate-400">
                            {vps.metrics.memoryUsedMB} MB / {vps.metrics.memoryTotalMB} MB
                        </p>
                    </div>

                    {/* Disk Usage */}
                    <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="flex items-center gap-1.5 text-slate-600">
                                <HardDrive className="w-4 h-4 text-sky-500" /> Storage Usage
                            </span>
                            <span className="text-slate-900 font-bold">
                                {((vps.metrics.diskUsedGB / vps.metrics.diskTotalGB) * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-sky-500 h-full transition-all duration-500"
                                style={{ width: `${(vps.metrics.diskUsedGB / vps.metrics.diskTotalGB) * 100}%` }}
                            />
                        </div>
                        <p className="text-[11px] text-slate-400">
                            {vps.metrics.diskUsedGB} GB / {vps.metrics.diskTotalGB} GB
                        </p>
                    </div>
                </div>

                {/* Bandwidth & Traffic Rate Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                            <DownloadCloud className="w-3.5 h-3.5 text-emerald-600" /> Incoming Rate
                        </span>
                        <p className="text-base font-semibold text-slate-800 mt-1">{vps.metrics.incomingTrafficMbps} Mbps</p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                            <UploadCloud className="w-3.5 h-3.5 text-sky-600" /> Outgoing Rate
                        </span>
                        <p className="text-base font-semibold text-slate-800 mt-1">{vps.metrics.outgoingTrafficMbps} Mbps</p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg col-span-2 md:col-span-1">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Radio className="w-3.5 h-3.5 text-indigo-600" /> Monthly Bandwidth Used
                        </span>
                        <p className="text-base font-semibold text-slate-800 mt-1">
                            {vps.metrics.bandwidthUsedGB} GB / {vps.metrics.bandwidthTotalGB} GB
                        </p>
                    </div>
                </div>

                {/* Performance Chart */}
                <div className="pt-2">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                        Historical CPU & Memory Utilization
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={vps.metrics.historicalUsage}>
                                <defs>
                                    <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0' }}
                                    labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                                />
                                <Area type="monotone" dataKey="cpu" name="CPU %" stroke="#4f46e5" fillOpacity={1} fill="url(#cpuGrad)" />
                                <Area type="monotone" dataKey="memory" name="Memory %" stroke="#10b981" fillOpacity={1} fill="url(#memGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Grid for Box 3 & Box 4 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* ========================================================================= */}
                {/* BOX 3: VPS CONFIGURATION & SERVER DETAILS */}
                {/* ========================================================================= */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Globe className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-base font-semibold text-slate-900">Server Configuration</h2>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs">
                        <div className="py-2.5 flex justify-between items-center">
                            <span className="text-slate-500">Server Location</span>
                            <span className="font-semibold text-slate-800">{vps.server_location}</span>
                        </div>
                        <div className="py-2.5 flex justify-between items-center">
                            <span className="text-slate-500">Operating System</span>
                            <span className="font-semibold text-slate-800">{vps.template?.name}</span>
                        </div>
                        <div className="py-2.5 flex justify-between items-center">
                            <span className="text-slate-500">Hostname</span>
                            <span className="font-mono text-slate-800">{vps.hostname}</span>
                        </div>
                        <div className="py-2.5 flex justify-between items-center">
                            <span className="text-slate-500">System Uptime</span>
                            <span className="font-semibold text-slate-800">{formatUptime(vps.metrics.uptimeSeconds)}</span>
                        </div>
                        <div className="py-2.5 flex justify-between items-center">
                            <span className="text-slate-500">SSH Username</span>
                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-indigo-700">root</span>
                        </div>
                        <div className="py-2.5 flex justify-between items-center">
                            <span className="text-slate-500">IPv4 Address</span>
                            <span className="font-mono text-slate-800">{mainIp}</span>
                        </div>
                        <div className="py-2.5 flex justify-between items-center">
                            <span className="text-slate-500">IPv6 Address</span>
                            <span className="font-mono text-slate-800 truncate max-w-[180px]">
                                {vps.ipv6?.[0]?.address || 'N/A'}
                            </span>
                        </div>
                        <div className="py-2.5 flex justify-between items-center">
                            <span className="text-slate-500">Backup Schedule</span>
                            <span className="font-medium text-slate-800 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-indigo-500" /> {vps.backup_schedule}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* BOX 4: PLAN DETAILS & SUBSCRIPTION */}
                {/* ========================================================================= */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-base font-semibold text-slate-900">Plan & Subscription</h2>
                        </div>
                        <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold text-xs rounded-full">
                            {vps.plan}
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs">
                        <div className="py-2.5 flex justify-between items-center">
                            <span className="text-slate-500">Current Plan</span>
                            <span className="font-semibold text-slate-800">{vps.plan}</span>
                        </div>
                        <div className="py-2.5 flex justify-between items-center">
                            <span className="text-slate-500">Expiration Date</span>
                            <span className="font-semibold text-slate-800">
                                {new Date(vps.expires_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                        <div className="py-2.5 flex justify-between items-center">
                            <span className="text-slate-500">Auto Renewal</span>
                            <span className={`font-semibold ${vps.auto_renewal ? 'text-emerald-600' : 'text-slate-500'}`}>
                                {vps.auto_renewal ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        <div className="py-2.5 flex justify-between items-center">
                            <span className="text-slate-500">CPU Cores</span>
                            <span className="font-semibold text-slate-800">{vps.cpus} vCPU</span>
                        </div>
                        <div className="py-2.5 flex justify-between items-center">
                            <span className="text-slate-500">Allocated RAM</span>
                            <span className="font-semibold text-slate-800">{(vps.memory / 1024).toFixed(1)} GB</span>
                        </div>
                        <div className="py-2.5 flex justify-between items-center">
                            <span className="text-slate-500">Disk Space</span>
                            <span className="font-semibold text-slate-800">{(vps.disk / 1024).toFixed(0)} GB SSD</span>
                        </div>
                        <div className="py-2.5 flex justify-between items-center">
                            <span className="text-slate-500">Monthly Bandwidth Limit</span>
                            <span className="font-semibold text-slate-800">{(vps.bandwidth / 1024).toFixed(0)} GB</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* RESET PASSWORD MODAL */}
            {/* ========================================================================= */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                <Key className="w-4 h-4 text-indigo-600" /> Reset VPS Root Password
                            </h3>
                            <button
                                onClick={() => setIsPasswordModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-xs"
                            >
                                ✕
                            </button>
                        </div>

                        {resetMsg && (
                            <div
                                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${resetMsg.type === 'success'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}
                            >
                                {resetMsg.type === 'success' ? (
                                    <CheckCircle className="w-4 h-4 shrink-0" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                )}
                                <span>{resetMsg.text}</span>
                            </div>
                        )}

                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    New Root Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={8}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter strong password"
                                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-9"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-2 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsPasswordModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={resettingPass}
                                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition inline-flex items-center gap-1.5"
                                >
                                    {resettingPass && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                    <span>Reset Password</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}