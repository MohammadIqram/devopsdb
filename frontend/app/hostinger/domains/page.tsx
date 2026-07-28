'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';
import { toast } from 'react-hot-toast';

export interface HostingerDomain {
    id: number;
    domain: string;
    type: string;
    status: 'active' | 'expired' | string;
    created_at: string;
    expires_at: string;
}

export interface BackendDomainsResponse {
    success: boolean;
    data: HostingerDomain[];
}

const fetchDomains = async (): Promise<HostingerDomain[]> => {
    const response = await axiosInstance.get<BackendDomainsResponse>('/hostinger/domains');
    return response.data.data || [];
};

export default function DomainsPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

    const {
        data: domains = [],
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ['hostingerDomains'],
        queryFn: fetchDomains,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    const handleRefresh = async () => {
        try {
            await refetch();
            toast.success('Domains synced with Hostinger!');
        } catch {
            toast.error('Failed to sync domains');
        }
    };

    const filteredDomains = domains.filter((item) =>
        item.domain.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // High-level Stats Calculation
    const activeCount = domains.filter((d) => d.status.toLowerCase() === 'active').length;
    const expiredCount = domains.filter((d) => d.status.toLowerCase() === 'expired').length;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Purchased Domains</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Manage your registered domains and DNS infrastructure hosted on Hostinger.
                    </p>
                </div>

                <button
                    onClick={handleRefresh}
                    disabled={isFetching}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
                >
                    {isFetching ? (
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Syncing...
                        </span>
                    ) : (
                        'Sync Domains'
                    )}
                </button>
            </div>

            {/* Metrics Row */}
            {!isLoading && !isError && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Domains</span>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{domains.length}</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Active Domains</span>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Expired / Issues</span>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{expiredCount}</p>
                    </div>
                </div>
            )}

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                    <input
                        type="text"
                        placeholder="Search domain name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 pl-9 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                    <svg
                        className="w-4 h-4 text-slate-400 absolute left-3 top-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <span className="text-xs font-medium text-slate-500 self-end sm:self-center">
                    Showing {filteredDomains.length} of {domains.length} domain(s)
                </span>
            </div>

            {/* Loading Skeleton */}
            {isLoading && (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400 animate-pulse bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    Loading Hostinger domain records...
                </div>
            )}

            {/* Error View */}
            {isError && (
                <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-600 dark:text-red-400 text-sm">
                    Failed to load domains: {(error as Error)?.message || 'Unknown error'}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && filteredDomains.length === 0 && (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No domain records found.</p>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            Clear search filter
                        </button>
                    )}
                </div>
            )}

            {/* Redesigned Table */}
            {!isLoading && !isError && filteredDomains.length > 0 && (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="py-3.5 px-4">Domain Name</th>
                                <th className="py-3.5 px-4">Type</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4">Purchased On</th>
                                <th className="py-3.5 px-4">Expires On</th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                            {filteredDomains.map((item) => (
                                <tr
                                    key={item.id}
                                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer group"
                                    onClick={() => router.push(`/hostinger/domains/${item.domain}`)}
                                >
                                    {/* Domain Name with Link */}
                                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                                        <Link
                                            href={`/hostinger/domains/${item.domain}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
                                        >
                                            {item.domain}
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 text-xs">→</span>
                                        </Link>
                                    </td>

                                    {/* Type */}
                                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 capitalize">
                                        {item.type}
                                    </td>

                                    {/* Status Badge */}
                                    <td className="py-3.5 px-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${item.status.toLowerCase() === 'active'
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                                }`}
                                        >
                                            {item.status}
                                        </span>
                                    </td>

                                    {/* Created Date */}
                                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </td>

                                    {/* Expiration Date */}
                                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                                        {new Date(item.expires_at).toLocaleDateString()}
                                    </td>

                                    {/* Actions */}
                                    <td className="py-3.5 px-4 text-right space-x-3" onClick={(e) => e.stopPropagation()}>
                                        <Link
                                            href={`/hostinger/domains/${item.domain}`}
                                            className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded transition"
                                        >
                                            Manage
                                        </Link>

                                        <a
                                            href={`https://${item.domain}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                                        >
                                            Visit ↗
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}