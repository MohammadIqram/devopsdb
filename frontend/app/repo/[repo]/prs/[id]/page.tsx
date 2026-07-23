'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    GitPullRequest,
    GitMerge,
    FileText,
    MessageSquare,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Plus,
    Minus,
    FileCode2,
} from 'lucide-react';
import { axiosInstance } from '@/lib/axios';

interface PRDetail {
    number: number;
    title: string;
    body: string;
    state: string;
    merged: boolean;
    mergeable: boolean | null;
    mergeableState: string;
    user: string;
    userAvatar: string;
    head: string;
    base: string;
    createdAt: string;
    additions: number;
    deletions: number;
    changedFilesCount: number;
}

interface ChangedFile {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    patch?: string;
}

interface Comment {
    id: number;
    user: string;
    userAvatar: string;
    body: string;
    createdAt: string;
}

export default function PRDetailPage({
    params,
}: {
    params: Promise<{ repo: string; id: string }>;
}) {
    const { repo, id: prNumber } = use(params);

    const [activeTab, setActiveTab] = useState<'conversation' | 'files'>('conversation');
    const [pr, setPr] = useState<PRDetail | null>(null);
    const [files, setFiles] = useState<ChangedFile[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Merge state
    const [mergeMethod, setMergeMethod] = useState<'merge' | 'squash' | 'rebase'>('merge');
    const [merging, setMerging] = useState(false);
    const [mergeSuccess, setMergeSuccess] = useState<string | null>(null);

    useEffect(() => {
        const fetchPRDetails = async () => {
            setLoading(true);
            setError(null);

            try {
                const { data } = await axiosInstance.get(
                    `/repo/${encodeURIComponent(repo)}/pulls/${prNumber}`
                );

                setPr(data.pr);
                setFiles(data.files || []);
                setComments(data.comments || []);
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to load Pull Request details.');
            } finally {
                setLoading(false);
            }
        };

        fetchPRDetails();
    }, [repo, prNumber]);

    const handleMerge = async () => {
        if (!pr) return;
        setMerging(true);
        setError(null);

        try {
            const { data } = await axiosInstance.post(
                `/repo/${encodeURIComponent(repo)}/pulls/${pr.number}/merge`,
                {
                    mergeMethod,
                    commitTitle: `Merge pull request #${pr.number} from ${pr.head}`,
                }
            );

            setMergeSuccess(data.message || 'Pull request merged successfully!');
            setPr((prev) => (prev ? { ...prev, state: 'closed', merged: true } : null));
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to merge pull request.');
        } finally {
            setMerging(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> Loading PR #{prNumber}...
            </div>
        );
    }

    if (error || !pr) {
        return (
            <div className="max-w-5xl mx-auto p-6 space-y-4">
                <Link
                    href={`/repo/${encodeURIComponent(repo)}/prs`}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:underline"
                >
                    <ArrowLeft className="w-3 h-3" /> Back to Pull Requests
                </Link>
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-lg text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    {error || 'Pull Request not found.'}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Back Navigation */}
            <Link
                href={`/repo/${encodeURIComponent(repo)}/prs`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
            >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Pull Requests
            </Link>

            {/* PR Title & Status Header */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            {pr.title} <span className="text-slate-400 font-mono text-base">#{pr.number}</span>
                        </h1>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{pr.user}</span>
                            <span>wants to merge into</span>
                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {pr.base}
                            </span>
                            <span>from</span>
                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {pr.head}
                            </span>
                        </div>
                    </div>

                    {/* Badge */}
                    <div>
                        {pr.merged ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold">
                                <GitMerge className="w-3.5 h-3.5 text-purple-500" /> Merged
                            </span>
                        ) : pr.state === 'open' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-semibold">
                                <GitPullRequest className="w-3.5 h-3.5 text-emerald-500" /> Open
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-full text-xs font-semibold">
                                Closed
                            </span>
                        )}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-medium pt-2">
                    <button
                        onClick={() => setActiveTab('conversation')}
                        className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${activeTab === 'conversation'
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                    >
                        <MessageSquare className="w-4 h-4" /> Conversation ({comments.length + 1})
                    </button>
                    <button
                        onClick={() => setActiveTab('files')}
                        className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition ${activeTab === 'files'
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                    >
                        <FileText className="w-4 h-4" /> Files Changed ({pr.changedFilesCount})
                    </button>
                </div>

                {/* Tab 1: Conversation */}
                {activeTab === 'conversation' && (
                    <div className="space-y-4 pt-2">
                        {/* PR Main Description */}
                        <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-950 space-y-2">
                            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {pr.user} commented
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                                {pr.body || 'No description provided.'}
                            </p>
                        </div>

                        {/* List Comments */}
                        {comments.map((comment) => (
                            <div
                                key={comment.id}
                                className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-1.5"
                            >
                                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {comment.user}
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                                    {comment.body}
                                </p>
                            </div>
                        ))}

                        {/* Merge Control Panel */}
                        {pr.state === 'open' && !pr.merged && (
                            <div className="mt-6 p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-4">
                                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <GitMerge className="w-4 h-4 text-indigo-500" /> Merge Pull Request
                                </h3>

                                {mergeSuccess && (
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-lg text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {mergeSuccess}
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-3 items-end">
                                    <div className="space-y-1 flex-1">
                                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                            Merge Strategy
                                        </label>
                                        <select
                                            value={mergeMethod}
                                            onChange={(e: any) => setMergeMethod(e.target.value)}
                                            className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500"
                                        >
                                            <option value="merge">Create a merge commit</option>
                                            <option value="squash">Squash and merge</option>
                                            <option value="rebase">Rebase and merge</option>
                                        </select>
                                    </div>

                                    <button
                                        onClick={handleMerge}
                                        disabled={merging}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition"
                                    >
                                        {merging ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <GitMerge className="w-4 h-4" /> Confirm Merge
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 2: Files Changed */}
                {activeTab === 'files' && (
                    <div className="space-y-4 pt-2">
                        <div className="text-xs text-slate-500 font-medium flex items-center gap-3">
                            <span className="flex items-center gap-1 text-emerald-600">
                                <Plus className="w-3.5 h-3.5" /> +{pr.additions}
                            </span>
                            <span className="flex items-center gap-1 text-rose-600">
                                <Minus className="w-3.5 h-3.5" /> -{pr.deletions}
                            </span>
                        </div>

                        {files.map((file) => (
                            <div
                                key={file.filename}
                                className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm"
                            >
                                {/* File Header */}
                                <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 font-mono text-slate-700 dark:text-slate-300">
                                        <FileCode2 className="w-4 h-4 text-indigo-500" />
                                        {file.filename}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-mono">
                                        <span className="text-emerald-600">+{file.additions}</span>
                                        <span className="text-rose-600">-{file.deletions}</span>
                                    </div>
                                </div>

                                {/* Diff Patch Viewer */}
                                {file.patch ? (
                                    <pre className="p-4 bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed">
                                        {file.patch}
                                    </pre>
                                ) : (
                                    <div className="p-4 text-xs text-slate-400 italic">
                                        Binary or large file hidden.
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}