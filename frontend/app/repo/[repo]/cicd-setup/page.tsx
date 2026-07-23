'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    FileCode2,
    GitPullRequest,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
} from 'lucide-react';
import { axiosInstance } from '@/lib/axios';

const DEFAULT_YAML = `name: Deploy Application

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install & Build
        run: |
          npm ci
          npm run build
`;

export default function CicdSetupPage({
    params,
}: {
    params: Promise<{ repo: string }>;
}) {
    const { repo } = use(params);
    const router = useRouter();

    const [yamlContent, setYamlContent] = useState(DEFAULT_YAML);
    const [filename, setFilename] = useState('deploy.yml');
    const [branchName, setBranchName] = useState(`cicd/deploy-script-${Date.now().toString().slice(-4)}`);
    const [commitMessage, setCommitMessage] = useState('ci: add GitHub Actions deployment workflow');
    const [prTitle, setPrTitle] = useState('Add CI/CD Deployment Workflow');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [prResult, setPrResult] = useState<{ prUrl: string; prNumber: number } | null>(null);

    const handleDeploy = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!yamlContent.trim()) {
            setError('Please paste a valid YAML workflow configuration.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Ensure file ends with .yml or .yaml
            let cleanFilename = filename.trim();
            if (!cleanFilename.endsWith('.yml') && !cleanFilename.endsWith('.yaml')) {
                cleanFilename += '.yml';
            }

            const response = await axiosInstance.post('/repo/cicd/create-pr', {
                repo,
                filename: cleanFilename,
                yamlContent,
                branchName: branchName.trim(),
                commitMessage: commitMessage.trim(),
                prTitle: prTitle.trim(),
            });

            setPrResult({
                prUrl: response.data.prUrl,
                prNumber: response.data.prNumber,
            });
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create deployment PR.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Navigation */}
            <Link
                href={`/repo/${encodeURIComponent(repo)}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
            >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Repository
            </Link>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <FileCode2 className="w-5 h-5 text-indigo-500" /> CI/CD Deployment Setup
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Configure automated deployments for <span className="font-semibold">{repo}</span>.
                    </p>
                </div>

                {/* Success Alert Banner */}
                {prResult ? (
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 p-5 rounded-xl space-y-3">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Pull Request Created Successfully!
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                            Your workflow file has been committed to branch <code className="font-mono">{branchName}</code> and a PR has been opened.
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                            <a
                                href={prResult.prUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition"
                            >
                                View Pull Request #{prResult.prNumber} <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                                onClick={() => setPrResult(null)}
                                className="text-xs font-medium text-slate-500 hover:underline"
                            >
                                Create Another Workflow
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleDeploy} className="space-y-5">
                        {error && (
                            <div className="flex items-center gap-2 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-lg text-xs font-medium text-rose-700 dark:text-rose-400">
                                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                                {error}
                            </div>
                        )}

                        {/* Workflow Code Editor */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Workflow YML Script
                                </label>
                                <span className="text-[11px] text-slate-400">
                                    Target Path: .github/workflows/{filename || 'deploy.yml'}
                                </span>
                            </div>
                            <textarea
                                value={yamlContent}
                                onChange={(e) => setYamlContent(e.target.value)}
                                rows={14}
                                required
                                className="w-full font-mono text-xs p-3.5 bg-slate-900 text-slate-100 rounded-lg border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Paste your GitHub Actions .yml code here..."
                            />
                        </div>

                        {/* Custom Inputs Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Workflow Filename
                                </label>
                                <input
                                    type="text"
                                    value={filename}
                                    onChange={(e) => setFilename(e.target.value)}
                                    placeholder="e.g. deploy.yml"
                                    required
                                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    New Branch Name
                                </label>
                                <input
                                    type="text"
                                    value={branchName}
                                    onChange={(e) => setBranchName(e.target.value)}
                                    placeholder="e.g. cicd/deploy-script"
                                    required
                                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Commit Message
                                </label>
                                <input
                                    type="text"
                                    value={commitMessage}
                                    onChange={(e) => setCommitMessage(e.target.value)}
                                    placeholder="e.g. ci: add deploy workflow"
                                    required
                                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Pull Request Title
                                </label>
                                <input
                                    type="text"
                                    value={prTitle}
                                    onChange={(e) => setPrTitle(e.target.value)}
                                    placeholder="e.g. Add CI/CD Workflow"
                                    required
                                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Submit Action */}
                        <div className="pt-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Creating PR...
                                    </>
                                ) : (
                                    <>
                                        <GitPullRequest className="w-4 h-4" /> Deploy & Create PR
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}