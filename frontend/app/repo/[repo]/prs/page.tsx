'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
    GitPullRequest,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle,
    GitMerge,
    GitPullRequestClosed,
} from 'lucide-react';
import { axiosInstance } from '@/lib/axios';

interface PRItem {
    id: number;
    number: number;
    title: string;
    state: string;
    user: string;
    userAvatar: string;
    head: string;
    base: string;
    createdAt: string;
    draft: boolean;
}

export default function PullRequestsListPage({
    params,
}: {
    params: Promise<{ repo: string }>;
}) {
    const { repo } = use(params);

    const [prs, setPrs] = useState<PRItem[]>([]);
    const [filterState, setFilterState] = useState<'open' | 'closed' | 'all'>('open');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPRs = async () => {
            setLoading(true);
            setError(null);

            try {
                const { data } = await axiosInstance.get(`/repo/${encodeURIComponent(repo)}/pulls`, {
                    params: { page, limit: 10, state: filterState },
                });

                setPrs(data.prs || []);
                setHasMore(data.hasMore);
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to load pull requests.');
            } finally {
                setLoading(false);
            }
        };

        fetchPRs();
    }, [repo, page, filterState]);

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Back Link */}
            <Link
                href={`/repo/${encodeURIComponent(repo)}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
            >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Repository
            </Link>

            {/* Main Container */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                {/* Header and Filter Controls */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <GitPullRequest className="w-5 h-5 text-indigo-500" /> Pull Requests
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Manage and review proposed code changes for <span className="font-semibold">{repo}</span>
                        </p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium self-start sm:self-auto">
                        {(['open', 'closed', 'all'] as const).map((st) => (
                            <button
                                key={st}
                                onClick={() => {
                                    setFilterState(st);
                                    setPage(1);
                                }}
                                className={`px-3 py-1 rounded-md capitalize transition ${filterState === st
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                            >
                                {st}
                            </button>
                        ))}
                    </div>
                </div>

                {/* PR List Body */}
                {loading ? (
                    <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> Loading pull requests...
                    </div>
                ) : error ? (
                    <div className="p-6 m-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-lg flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" /> {error}
                    </div>
                ) : prs.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs">
                        No {filterState !== 'all' ? filterState : ''} pull requests found.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {prs.map((pr) => (
                            <Link
                                key={pr.id}
                                href={`/repo/${encodeURIComponent(repo)}/prs/${pr.number}`}
                                className="p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group block"
                            >
                                {/* PR Status Icon */}
                                <div className="mt-0.5">
                                    {pr.state === 'open' ? (
                                        <GitPullRequest className="w-4 h-4 text-emerald-500" />
                                    ) : pr.state === 'merged' ? (
                                        <GitMerge className="w-4 h-4 text-purple-500" />
                                    ) : (
                                        <GitPullRequestClosed className="w-4 h-4 text-rose-500" />
                                    )}
                                </div>

                                {/* PR Meta */}
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                                            {pr.title}
                                        </span>
                                        <span className="text-xs font-mono text-slate-400">#{pr.number}</span>
                                    </div>

                                    <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                                        <span>
                                            opened by <span className="font-medium text-slate-700 dark:text-slate-300">{pr.user}</span>
                                        </span>
                                        <span>•</span>
                                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                                            {pr.head}
                                        </span>
                                        <span>into</span>
                                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                                            {pr.base}
                                        </span>
                                        <span>•</span>
                                        <span>{new Date(pr.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span>Page {page}</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" /> Previous
                        </button>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={!hasMore || loading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition"
                        >
                            Next <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}