'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
    FolderGit2,
    GitBranch,
    GitCommit,
    Star,
    GitFork,
    AlertCircle,
    ExternalLink,
    Shield,
    Clock,
    ArrowLeft,
    Loader2,
    Code2,
} from 'lucide-react';
import { axiosInstance } from '@/lib/axios';

interface RepoDetails {
    id: number;
    name: string;
    fullName: string;
    private: boolean;
    description: string | null;
    defaultBranch: string;
    stars: number;
    forks: number;
    openIssues: number;
    size: number;
    htmlUrl: string;
    createdAt: string;
    updatedAt: string;
}

interface Branch {
    name: string;
    sha: string;
}

interface Commit {
    sha: string;
    message: string;
    author: string;
    date: string;
}

interface RepoData {
    details: RepoDetails;
    branches: Branch[];
    recentCommits: Commit[];
    languages: Record<string, number>;
}

export default function RepoPage({
    params,
}: {
    params: Promise<{ repo: string }>;
}) {
    // 1. Unwrap the `repo` parameter matching /repo/[repo]
    const { repo } = use(params);

    const [data, setData] = useState<RepoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axiosInstance.get(`/repo/details/${encodeURIComponent(repo)}`);
                setData(res.data);
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to load repository details');
            } finally {
                setLoading(false);
            }
        };

        if (repo) {
            fetchDetails();
        }
    }, [repo]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="text-xs font-medium">Loading details for {repo}...</span>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Link
                    href="/repos"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline mb-4"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Repositories
                </Link>
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 p-6 rounded-xl text-center">
                    <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">
                        {error || `Repository "${repo}" not found`}
                    </p>
                </div>
            </div>
        );
    }

    const { details, branches, recentCommits, languages } = data;
    const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0);

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Navigation */}
            <Link
                href="/repo"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
            >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Repositories
            </Link>

            {/* Main Header */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <FolderGit2 className="w-6 h-6 text-indigo-500" />
                            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                {details.name}
                            </h1>
                            {details.private ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                                    <Shield className="w-2.5 h-2.5" /> Private
                                </span>
                            ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    Public
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {details.description || 'No description provided.'}
                        </p>
                    </div>

                    <a
                        href={details.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition"
                    >
                        GitHub <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>

                {/* Quick Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <Star className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{details.stars} Stars</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <GitFork className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>{details.forks} Forks</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{details.openIssues} Open Issues</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Updated {new Date(details.updatedAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {/* Languages Distribution */}
            {totalBytes > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-indigo-500" /> Languages
                    </h3>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        {Object.entries(languages).map(([lang, bytes], idx) => {
                            const pct = ((bytes / totalBytes) * 100).toFixed(1);
                            const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500'];
                            return (
                                <div
                                    key={lang}
                                    style={{ width: `${pct}%` }}
                                    className={`h-full ${colors[idx % colors.length]}`}
                                    title={`${lang}: ${pct}%`}
                                />
                            );
                        })}
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                        {Object.entries(languages).map(([lang, bytes]) => (
                            <span key={lang} className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{lang}</span>
                                <span>{((bytes / totalBytes) * 100).toFixed(1)}%</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Branches & Recent Commits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Branches */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <GitBranch className="w-4 h-4 text-indigo-500" /> Active Branches
                        </h3>
                        <Link
                            href={`/repo/${repo}/branches`}
                            className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                        >
                            Manage All →
                        </Link>
                    </div>

                    <div className="space-y-2">
                        {branches.map((b) => (
                            <div
                                key={b.name}
                                className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 text-xs"
                            >
                                <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                                    <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                                    {b.name}
                                    {b.name === details.defaultBranch && (
                                        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.2 rounded border border-indigo-200 dark:border-indigo-900">
                                            default
                                        </span>
                                    )}
                                </div>
                                <span className="font-mono text-slate-400 text-[11px]">
                                    {b.sha.substring(0, 7)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Commits */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <GitCommit className="w-4 h-4 text-indigo-500" /> Recent Commits
                    </h3>

                    <div className="space-y-2">
                        {recentCommits.map((c) => (
                            <div
                                key={c.sha}
                                className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                                        {c.sha}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        {new Date(c.date).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 font-medium truncate">
                                    {c.message}
                                </p>
                                <p className="text-[10px] text-slate-400">By {c.author}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}