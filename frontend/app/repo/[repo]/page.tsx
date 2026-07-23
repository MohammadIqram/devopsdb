'use client';

import { useEffect, useState, use, useRef } from 'react';
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
    Copy,
    Check,
    Download,
    Terminal,
    Laptop,
    FileCode2,
    MoreVertical,
    GitPullRequest,
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
    sshUrl?: string;
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
    const { repo } = use(params);

    const [data, setData] = useState<RepoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Clone Widget State
    const [cloneType, setCloneType] = useState<'https' | 'ssh' | 'cli'>('https');
    const [copied, setCopied] = useState(false);
    const [downloadingZip, setDownloadingZip] = useState(false);

    // Inside your RepoPage component state:
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadZip = async () => {
        if (!data) return;
        setDownloadingZip(true);
        try {
            const response = await axiosInstance.get(
                `/repo/download-zip?repo=${encodeURIComponent(repo)}&ref=${data.details.defaultBranch}`,
                { responseType: 'blob' }
            );

            // Create invisible downloadable blob link
            const blob = new Blob([response.data], { type: 'application/zip' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${data.details.name}-${data.details.defaultBranch}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('ZIP download failed:', err);
            alert('Failed to download repository ZIP archive.');
        } finally {
            setDownloadingZip(false);
        }
    };

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
                    href="/repo"
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

    // Derived Clone Strings
    const httpsUrl = `${details.htmlUrl}.git`;
    const sshUrl = details.sshUrl || `git@github.com:${details.fullName}.git`;
    const cliCommand = `gh repo clone ${details.fullName}`;

    const activeCloneCommand =
        cloneType === 'https' ? httpsUrl : cloneType === 'ssh' ? sshUrl : cliCommand;

    // URL protocol to launch GitHub Desktop client
    const githubDesktopUrl = `x-github-client://openRepo/${details.htmlUrl}`;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
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
                            <a
                                href={details.htmlUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition"
                            >
                                GitHub <ExternalLink className="w-3.5 h-3.5" />
                            </a>
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

                    <div className='flex gap-2'>
                        <a
                            href={details.htmlUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition"
                        >
                            GitHub <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        {/* 3-Dot Actions Menu */}
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setMenuOpen((prev) => !prev)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition"
                                title="More options"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>

                            {menuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 py-1">
                                    <Link
                                        href={`/repo/${encodeURIComponent(repo)}/cicd-setup`}
                                        onClick={() => setMenuOpen(false)}
                                        className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition"
                                    >
                                        <FileCode2 className="w-4 h-4 text-indigo-500" />
                                        Add deployment script
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Clone & Export Section */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Terminal className="w-4 h-4 text-indigo-500" /> Clone Repository
                        </span>

                        {/* Clone Protocol Selector Tabs */}
                        <div className="flex items-center bg-slate-200/60 dark:bg-slate-800 p-0.5 rounded-md text-[11px] font-medium">
                            <button
                                onClick={() => setCloneType('https')}
                                className={`px-2.5 py-1 rounded-sm transition ${cloneType === 'https'
                                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                    }`}
                            >
                                HTTPS
                            </button>
                            <button
                                onClick={() => setCloneType('ssh')}
                                className={`px-2.5 py-1 rounded-sm transition ${cloneType === 'ssh'
                                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                    }`}
                            >
                                SSH
                            </button>
                            <button
                                onClick={() => setCloneType('cli')}
                                className={`px-2.5 py-1 rounded-sm transition ${cloneType === 'cli'
                                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                    }`}
                            >
                                GitHub CLI
                            </button>
                        </div>
                    </div>

                    {/* Copy Input Bar */}
                    <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5">
                            <input
                                type="text"
                                readOnly
                                value={activeCloneCommand}
                                className="w-full text-xs font-mono text-slate-700 dark:text-slate-300 bg-transparent outline-none select-all"
                            />
                        </div>
                        <button
                            onClick={() => handleCopy(activeCloneCommand)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium transition shrink-0"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-3.5 h-3.5" /> Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3.5 h-3.5" /> Copy
                                </>
                            )}
                        </button>
                    </div>

                    {/* Additional Desktop & Archive Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
                        <a
                            href={githubDesktopUrl}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-md text-xs font-medium transition"
                        >
                            <Laptop className="w-3.5 h-3.5 text-slate-500" /> Open in GitHub Desktop
                        </a>

                        <button
                            onClick={handleDownloadZip}
                            disabled={downloadingZip}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-md text-xs font-medium transition disabled:opacity-50"
                        >
                            {downloadingZip ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                            ) : (
                                <Download className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                            Download ZIP
                        </button>
                    </div>
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
                        <div className="flex items-center gap-2">
                            {/* Secondary Action: Raised PRs */}
                            <Link
                                href={`/repo/${repo}/prs?author=${details.name}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60 transition-all duration-150"
                            >
                                <GitPullRequest className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                <span>Raised PRs</span>
                            </Link>

                            {/* Primary Action: Manage All Branches */}
                            <Link
                                href={`/repo/${repo}/branches`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-sm shadow-indigo-500/20 active:scale-[0.98] transition-all duration-150"
                            >
                                <GitBranch className="w-3.5 h-3.5" />
                                <span>Manage All</span>
                            </Link>
                        </div>
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