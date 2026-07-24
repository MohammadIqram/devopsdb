'use client';

import React, { useState, useEffect, MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { axiosInstance } from "@/lib/axios";
import { Copy, Check, Server, ChevronDown, ChevronUp, Cpu, HardDrive, Activity, Database, ExternalLink } from 'lucide-react';

// Interfaces aligned with your Hostinger API structure
export interface IPv4 {
    id: number;
    address: string;
    ptr: string;
}

export interface IPv6 {
    id: number;
    address: string;
    ptr: string;
}

export interface Template {
    id: number;
    name: string;
    description: string;
    documentation: string;
}

export interface VpsInstance {
    id: number;
    firewall_group_id: number | null;
    subscription_id: string;
    data_center_id: number;
    plan: string;
    hostname: string;
    state: 'running' | 'stopped' | 'processing' | string;
    actions_lock: string;
    cpus: number;
    memory: number; // in MB
    disk: number; // in MB
    bandwidth: number; // in MB/GB
    ns1: string;
    ns2: string;
    ipv4: IPv4[];
    ipv6: IPv6[];
    template: Template;
    created_at: string;
}

interface ApiResponse {
    success: boolean;
    data: VpsInstance[];
    message?: string;
}

export const VpsTable: React.FC = () => {
    const [vpsList, setVpsList] = useState<VpsInstance[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedIp, setCopiedIp] = useState<string | null>(null);
    const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

    const router = useRouter();

    useEffect(() => {
        fetchVpsInstances();
    }, []);

    const fetchVpsInstances = async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const response = await axiosInstance.get<ApiResponse>('/hostinger/vps');

            if (response.data.success) {
                setVpsList(response.data.data);
            } else {
                setError(response.data.message || 'Failed to fetch VPS list');
            }
        } catch (err) {
            const axiosError = err as AxiosError<ApiResponse>;
            const errorMessage =
                axiosError.response?.data?.message ||
                axiosError.message ||
                'Network error while connecting to server';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Copy IP address to clipboard
    const handleCopyIp = (e: MouseEvent<HTMLButtonElement>, ip: string): void => {
        e.stopPropagation();
        if (!ip) return;

        navigator.clipboard.writeText(ip);
        setCopiedIp(ip);
        setTimeout(() => setCopiedIp(null), 2000);
    };

    // Toggle health details dropdown
    const toggleHealth = (e: MouseEvent<HTMLButtonElement>, id: number): void => {
        e.stopPropagation();
        setExpandedRows((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const handleRowClick = (vpsId: number): void => {
        router.push(`/hostinger/vps/${vpsId}`);
    };

    const getStatusBadge = (state: string): string => {
        switch (state?.toLowerCase()) {
            case 'running':
            case 'active':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'stopped':
            case 'inactive':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'processing':
            case 'provisioning':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            default:
                return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    // Utility formatting helpers
    const formatMemory = (mb: number): string => {
        return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
    };

    const formatDisk = (mb: number): string => {
        return mb >= 1024 ? `${(mb / 1024).toFixed(0)} GB` : `${mb} MB`;
    };

    const formatBandwidth = (mb: number): string => {
        return mb >= 1024 ? `${(mb / 1024).toFixed(0)} GB` : `${mb} MB`;
    };

    if (loading) {
        return (
            <div className="w-full p-8 text-center text-slate-500">
                <div className="animate-spin inline-block w-6 h-6 border-[3px] border-indigo-600 border-t-transparent text-indigo-600 rounded-full mb-2"></div>
                <p className="text-sm font-medium">Loading Virtual Private Servers...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
                <p className="text-sm font-medium">Error: {error}</p>
                <button
                    type="button"
                    onClick={fetchVpsInstances}
                    className="mt-3 px-4 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold rounded-lg transition"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                        <Server className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">VPS Instances</h2>
                        <p className="text-xs text-slate-500">Manage and monitor your hostinger servers</p>
                    </div>
                </div>
                <span className="text-xs font-medium px-3 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded-full">
                    Total: {vpsList.length}
                </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                        <tr>
                            <th className="py-3.5 px-6">Hostname & Plan</th>
                            <th className="py-3.5 px-6">IP Address</th>
                            <th className="py-3.5 px-6">Status</th>
                            <th className="py-3.5 px-6">OS / Template</th>
                            <th className="py-3.5 px-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {vpsList.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-slate-400">
                                    No virtual private servers found.
                                </td>
                            </tr>
                        ) : (
                            vpsList.map((vps) => {
                                const mainIp = vps.ipv4?.[0]?.address || 'N/A';
                                const isExpanded = !!expandedRows[vps.id];

                                return (
                                    <React.Fragment key={vps.id}>
                                        <tr
                                            onClick={() => handleRowClick(vps.id)}
                                            className={`hover:bg-slate-50/80 cursor-pointer transition-colors duration-150 group ${isExpanded ? 'bg-slate-50/40' : ''
                                                }`}
                                        >
                                            {/* Hostname & Plan */}
                                            <td className="py-4 px-6">
                                                <div className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                    {vps.hostname}
                                                </div>
                                                <div className="text-xs text-slate-500">{vps.plan}</div>
                                            </td>

                                            {/* IP Address */}
                                            <td className="py-4 px-6">
                                                <div className="inline-flex items-center gap-2">
                                                    <span className="font-mono text-xs text-slate-800">{mainIp}</span>
                                                    {mainIp !== 'N/A' && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleCopyIp(e, mainIp)}
                                                            title="Copy IP Address"
                                                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                                        >
                                                            {copiedIp === mainIp ? (
                                                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-4 px-6">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${getStatusBadge(
                                                        vps.state
                                                    )}`}
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                    {vps.state}
                                                </span>
                                            </td>

                                            {/* Template */}
                                            <td className="py-4 px-6 text-slate-500 text-xs max-w-xs truncate">
                                                {vps.template?.name || 'N/A'}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 px-6 text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => toggleHealth(e, vps.id)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition"
                                                    >
                                                        <Activity className="w-3.5 h-3.5" />
                                                        <span>{isExpanded ? 'Hide Health' : 'Show Health'}</span>
                                                        {isExpanded ? (
                                                            <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
                                                        ) : (
                                                            <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expandable System Health Row */}
                                        {isExpanded && (
                                            <tr className="bg-slate-50/70 border-t-0">
                                                <td colSpan={5} className="p-6">
                                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                                        <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-3 flex items-center justify-between">
                                                            <span>Server Specifications & Health</span>
                                                            {vps.template?.documentation && (
                                                                <a
                                                                    href={vps.template.documentation}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="normal-case text-indigo-600 hover:underline inline-flex items-center gap-1"
                                                                >
                                                                    Docs <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            )}
                                                        </div>

                                                        {/* Resource Metrics Grid */}
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                            {/* CPU */}
                                                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                                                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                                                                    <Cpu className="w-4 h-4 text-indigo-500" />
                                                                    <span>vCPU Cores</span>
                                                                </div>
                                                                <div className="text-base font-semibold text-slate-800">
                                                                    {vps.cpus} {vps.cpus === 1 ? 'Core' : 'Cores'}
                                                                </div>
                                                            </div>

                                                            {/* RAM */}
                                                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                                                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                                                                    <Database className="w-4 h-4 text-emerald-500" />
                                                                    <span>Memory (RAM)</span>
                                                                </div>
                                                                <div className="text-base font-semibold text-slate-800">
                                                                    {formatMemory(vps.memory)}
                                                                </div>
                                                            </div>

                                                            {/* Disk Storage */}
                                                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                                                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                                                                    <HardDrive className="w-4 h-4 text-sky-500" />
                                                                    <span>Disk Storage</span>
                                                                </div>
                                                                <div className="text-base font-semibold text-slate-800">
                                                                    {formatDisk(vps.disk)}
                                                                </div>
                                                            </div>

                                                            {/* Bandwidth */}
                                                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                                                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                                                                    <Activity className="w-4 h-4 text-amber-500" />
                                                                    <span>Bandwidth</span>
                                                                </div>
                                                                <div className="text-base font-semibold text-slate-800">
                                                                    {formatBandwidth(vps.bandwidth)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default VpsTable;