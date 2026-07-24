'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { axiosInstance } from "@/lib/axios";
import {
    ArrowLeft, Activity, Cpu, Database, HardDrive,
    DownloadCloud, UploadCloud, RefreshCw, Calendar, AlertCircle
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

type TimeframeOption = '24h' | '7d' | '30d' | '6m';
type MetricTab = 'cpu' | 'ram' | 'disk' | 'incoming' | 'outgoing';

interface HealthData {
    summary: {
        currentCpu: number;
        currentRamPercent: number;
        currentRamMB: number;
        totalRamMB: number;
        currentDiskPercent: number;
        currentDiskGB: number;
        totalDiskGB: number;
        incomingMbps: number;
        outgoingMbps: number;
    };
    history: Array<{
        timestamp: string;
        cpuUsage: number;
        ramUsage: number;
        ramUsedMB: number;
        diskUsage: number;
        diskUsedGB: number;
        incomingMbps: number;
        outgoingMbps: number;
    }>;
}

export default function VpsHealthPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [healthData, setHealthData] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter and Tab States (Default set to '24h' and 'cpu')
    const [timeframe, setTimeframe] = useState<TimeframeOption>('24h');
    const [activeTab, setActiveTab] = useState<MetricTab>('cpu');

    useEffect(() => {
        fetchHealthMetrics();
    }, [id, timeframe]);

    const fetchHealthMetrics = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await axiosInstance.get(`/hostinger/vps/${id}/health?timeframe=${timeframe}`);
            if (res.data.success) {
                setHealthData(res.data);
            } else {
                setError(res.data.message || 'Failed to fetch health metrics');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    // Configuration map for tabs
    const getTabConfig = () => {
        switch (activeTab) {
            case 'cpu':
                return {
                    title: 'CPU Utilization',
                    dataKey: 'cpuUsage',
                    unit: '%',
                    color: '#4f46e5', // Indigo
                    gradientId: 'cpuGrad',
                    description: 'Percentage of allocated vCPU processing capacity used.',
                };
            case 'ram':
                return {
                    title: 'Memory (RAM) Usage',
                    dataKey: 'ramUsage',
                    unit: '%',
                    color: '#10b981', // Emerald
                    gradientId: 'ramGrad',
                    description: 'Percentage of total system RAM consumed.',
                };
            case 'disk':
                return {
                    title: 'Disk Space Usage',
                    dataKey: 'diskUsage',
                    unit: '%',
                    color: '#0284c7', // Sky
                    gradientId: 'diskGrad',
                    description: 'Storage occupied on the primary SSD partition.',
                };
            case 'incoming':
                return {
                    title: 'Incoming Traffic (Rx)',
                    dataKey: 'incomingMbps',
                    unit: ' Mbps',
                    color: '#8b5cf6', // Purple
                    gradientId: 'inGrad',
                    description: 'Data throughput received by the virtual server.',
                };
            case 'outgoing':
                return {
                    title: 'Outgoing Traffic (Tx)',
                    dataKey: 'outgoingMbps',
                    unit: ' Mbps',
                    color: '#f59e0b', // Amber
                    gradientId: 'outGrad',
                    description: 'Data throughput sent out from the virtual server.',
                };
        }
    };

    const currentTabConfig = getTabConfig();

    return (
        <div className="min-h-screen bg-slate-50/60 p-6 md:p-10 space-y-8 max-w-7xl mx-auto text-slate-800">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-indigo-600 transition mb-2"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to VPS Details
                    </button>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-indigo-600" />
                        Detailed VPS Health & Performance
                    </h1>
                    <p className="text-xs text-slate-500">
                        Real-time telemetry and resource usage history for VPS #{id}
                    </p>
                </div>

                {/* Timeframe Selector (Filter) */}
                <div className="flex items-center gap-1 bg-white p-1.5 border border-slate-200 rounded-xl shadow-sm self-start sm:self-auto">
                    <Calendar className="w-4 h-4 text-slate-400 ml-2 mr-1" />
                    {[
                        { label: '24 Hours', value: '24h' },
                        { label: 'Last Week', value: '7d' },
                        { label: 'Last Month', value: '30d' },
                        { label: 'Last 6 Months', value: '6m' },
                    ].map((time) => (
                        <button
                            key={time.value}
                            onClick={() => setTimeframe(time.value as TimeframeOption)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${timeframe === time.value
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            {time.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                    <button
                        onClick={fetchHealthMetrics}
                        className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-semibold"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Top Metric Cards Overview */}
            {healthData && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {/* CPU Card */}
                    <button
                        onClick={() => setActiveTab('cpu')}
                        className={`p-4 rounded-2xl border text-left transition ${activeTab === 'cpu'
                                ? 'bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/20'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
                            <Cpu className="w-4 h-4 text-indigo-600" /> CPU
                        </div>
                        <div className="text-xl font-bold text-slate-900">
                            {healthData.summary.currentCpu}%
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Current Load</p>
                    </button>

                    {/* RAM Card */}
                    <button
                        onClick={() => setActiveTab('ram')}
                        className={`p-4 rounded-2xl border text-left transition ${activeTab === 'ram'
                                ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
                            <Database className="w-4 h-4 text-emerald-600" /> RAM
                        </div>
                        <div className="text-xl font-bold text-slate-900">
                            {healthData.summary.currentRamPercent}%
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                            {healthData.summary.currentRamMB} MB / {healthData.summary.totalRamMB} MB
                        </p>
                    </button>

                    {/* Disk Card */}
                    <button
                        onClick={() => setActiveTab('disk')}
                        className={`p-4 rounded-2xl border text-left transition ${activeTab === 'disk'
                                ? 'bg-sky-50/60 border-sky-300 ring-2 ring-sky-500/20'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
                            <HardDrive className="w-4 h-4 text-sky-600" /> Storage
                        </div>
                        <div className="text-xl font-bold text-slate-900">
                            {healthData.summary.currentDiskPercent}%
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                            {healthData.summary.currentDiskGB} GB / {healthData.summary.totalDiskGB} GB
                        </p>
                    </button>

                    {/* Incoming Traffic Card */}
                    <button
                        onClick={() => setActiveTab('incoming')}
                        className={`p-4 rounded-2xl border text-left transition ${activeTab === 'incoming'
                                ? 'bg-purple-50/60 border-purple-300 ring-2 ring-purple-500/20'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
                            <DownloadCloud className="w-4 h-4 text-purple-600" /> Inbound
                        </div>
                        <div className="text-xl font-bold text-slate-900">
                            {healthData.summary.incomingMbps} <span className="text-xs font-normal">Mbps</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Rx Rate</p>
                    </button>

                    {/* Outgoing Traffic Card */}
                    <button
                        onClick={() => setActiveTab('outgoing')}
                        className={`p-4 rounded-2xl border text-left transition col-span-2 md:col-span-1 ${activeTab === 'outgoing'
                                ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-500/20'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
                            <UploadCloud className="w-4 h-4 text-amber-600" /> Outbound
                        </div>
                        <div className="text-xl font-bold text-slate-900">
                            {healthData.summary.outgoingMbps} <span className="text-xs font-normal">Mbps</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Tx Rate</p>
                    </button>
                </div>
            )}

            {/* Main Interactive Chart Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">
                            {currentTabConfig.title}
                        </h2>
                        <p className="text-xs text-slate-400">{currentTabConfig.description}</p>
                    </div>
                    {loading && (
                        <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Fetching metrics...
                        </div>
                    )}
                </div>

                {/* Graph Area */}
                <div className="h-80 w-full pt-2">
                    {healthData && healthData.history.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={healthData.history}>
                                <defs>
                                    <linearGradient id={currentTabConfig.gradientId} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={currentTabConfig.color} stopOpacity={0.35} />
                                        <stop offset="95%" stopColor={currentTabConfig.color} stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={11}
                                    tickLine={false}
                                    unit={currentTabConfig.unit}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#ffffff',
                                        borderRadius: '12px',
                                        borderColor: '#e2e8f0',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    }}
                                    labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey={currentTabConfig.dataKey}
                                    name={currentTabConfig.title}
                                    stroke={currentTabConfig.color}
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill={`url(#${currentTabConfig.gradientId})`}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                            No telemetry history found for this timeframe.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}