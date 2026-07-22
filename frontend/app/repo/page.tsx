'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    FolderGit2,
    Search,
    ExternalLink,
    ChevronRight,
    Shield,
    Star,
    GitFork,
} from 'lucide-react';
import { useRepoStore } from '@/lib/store';

export interface Repository {
    id: number | string;
    name: string;
    full_name?: string;
    private?: boolean;
    description?: string | null;
    html_url?: string;
    stargazers_count?: number;
    forks_count?: number;
}

export default function RepositoriesPage() {
    const router = useRouter();

    // 1. Fetch repos and selection setter from Zustand store
    const repos = useRepoStore((state: any) => state.repos as Repository[]) || [];
    const setSelectedRepo = useRepoStore((state: any) => state.setSelectedRepo);

    // Search filter state
    const [searchTerm, setSearchTerm] = useState('');

    // Filter repos based on user input
    const filteredRepos = repos.filter((repo) =>
        repo.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle navigating to repository page
    const handleSelectRepo = (repoName: string) => {
        // Update active repository in Zustand store
        if (setSelectedRepo) {
            setSelectedRepo(repoName);
        }
        // Navigate to /repo/${reponame}
        router.push(`/repo/${encodeURIComponent(repoName)}`);
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <FolderGit2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            Your Repositories
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Select a repository to manage branches, commits, and collaborators.
                        </p>
                    </div>
                </div>

                {/* Repositories Counter Badge */}
                <span className="self-start sm:self-center px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-700">
                    {repos.length} {repos.length === 1 ? 'Repository' : 'Repositories'}
                </span>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search repositories by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition shadow-sm"
                />
            </div>

            {/* Repositories Grid */}
            {filteredRepos.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
                    <FolderGit2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        No repositories found
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        {searchTerm
                            ? `No repository matches "${searchTerm}"`
                            : 'Your Zustand store has no repositories loaded.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRepos.map((repo) => (
                        <div
                            key={repo.id}
                            onClick={() => handleSelectRepo(repo.name)}
                            className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 p-5 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                        >
                            <div>
                                {/* Repository Title & Visibility */}
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition flex items-center gap-1.5 truncate">
                                        <FolderGit2 className="w-4 h-4 text-indigo-500 shrink-0" />
                                        <span className="truncate">{repo.name}</span>
                                    </h2>

                                    {repo.private ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 shrink-0">
                                            <Shield className="w-2.5 h-2.5" /> Private
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                                            Public
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[2rem]">
                                    {repo.description || 'No description provided.'}
                                </p>
                            </div>

                            {/* Card Footer */}
                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                                <div className="flex items-center gap-3">
                                    {typeof repo.stargazers_count === 'number' && (
                                        <span className="flex items-center gap-1">
                                            <Star className="w-3.5 h-3.5 text-amber-400" />
                                            {repo.stargazers_count}
                                        </span>
                                    )}
                                    {typeof repo.forks_count === 'number' && (
                                        <span className="flex items-center gap-1">
                                            <GitFork className="w-3.5 h-3.5" />
                                            {repo.forks_count}
                                        </span>
                                    )}
                                </div>

                                {/* Arrow Navigation Indicator */}
                                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium group-hover:translate-x-1 transition-transform">
                                    View <ChevronRight className="w-3.5 h-3.5" />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}