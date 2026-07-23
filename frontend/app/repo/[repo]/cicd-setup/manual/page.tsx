'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Key,
    Plus,
    Trash2,
    FileCode2,
    GitPullRequest,
    Loader2,
    AlertCircle,
    CheckCircle2,
    FolderTree,
    Sparkles,
    ExternalLink,
    RotateCcw,
    Info,
} from 'lucide-react';
import { axiosInstance } from '@/lib/axios';

// 10 Popular Language / Framework Presets
const FRAMEWORK_PRESETS = [
    { id: 'nextjs', name: 'Next.js', category: 'Fullstack' },
    { id: 'nestjs', name: 'NestJS', category: 'Backend' },
    { id: 'express', name: 'Express.js', category: 'Backend' },
    { id: 'react', name: 'React (Vite)', category: 'Frontend' },
    { id: 'angular', name: 'Angular', category: 'Frontend' },
    { id: 'java', name: 'Java (Maven)', category: 'Backend' },
    { id: 'dotnet', name: 'C# (.NET)', category: 'Enterprise' },
    { id: 'python', name: 'Python (FastAPI/Django)', category: 'Backend' },
    { id: 'go', name: 'Go', category: 'Backend' },
    { id: 'rust', name: 'Rust', category: 'System' },
];

const generateYaml = (template: string, workDir: string) => {
    const dirPath = workDir.trim() && workDir !== '.' ? workDir : '.';
    const workingDirBlock =
        dirPath !== '.'
            ? `\n    defaults:\n      run:\n        working-directory: ${dirPath}`
            : '';

    switch (template) {
        case 'nextjs':
            return `name: Deploy Next.js App
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest${workingDirBlock}
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Build Next.js App
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: \${{ secrets.NEXT_PUBLIC_API_URL }}`;

        case 'nestjs':
            return `name: Deploy NestJS Service
on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest${workingDirBlock}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - run: npm run test`;

        case 'express':
            return `name: Express.js CI/CD
on:
  push:
    branches: [ main ]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest${workingDirBlock}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm test --if-present`;

        case 'java':
            return `name: Java Maven Build
on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest${workingDirBlock}
    steps:
      - uses: actions/checkout@v4
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      - name: Build with Maven
        run: mvn -B package --file pom.xml`;

        case 'dotnet':
            return `name: .NET Core Build & Test
on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest${workingDirBlock}
    steps:
      - uses: actions/checkout@v4
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: 8.0.x
      - name: Restore dependencies
        run: dotnet restore
      - name: Build
        run: dotnet build --no-restore`;

        case 'python':
            return `name: Python Application CI
on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest${workingDirBlock}
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt`;

        case 'go':
            return `name: Go CI/CD Pipeline
on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest${workingDirBlock}
    steps:
      - uses: actions/checkout@v4
      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'
      - name: Build
        run: go build -v ./...`;

        case 'rust':
            return `name: Rust CI Pipeline
on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest${workingDirBlock}
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: cargo build --verbose`;

        default:
            return `name: Generic CI Workflow
on:
  push:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu-latest${workingDirBlock}
    steps:
      - uses: actions/checkout@v4`;
    }
};

export default function ManualCicdPage({
    params,
}: {
    params: Promise<{ repo: string }>;
}) {
    const { repo } = use(params);
    const router = useRouter();

    // State
    const [selectedFramework, setSelectedFramework] = useState('nextjs');
    const [workingDir, setWorkingDir] = useState('.');
    const [yamlContent, setYamlContent] = useState('');
    const [filename, setFilename] = useState('deploy.yml');
    const [targetBranch, setTargetBranch] = useState('ci/manual-setup');
    const [commitMsg, setCommitMsg] = useState('ci: add manual workflow pipeline');

    // Repository Secrets Array
    const [secrets, setSecrets] = useState<{ key: string; value: string }[]>([
        { key: '', value: '' },
    ]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Success State
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [successData, setSuccessData] = useState<{
        prUrl?: string;
        branchName: string;
        filename: string;
        secretsConfigured: number;
    } | null>(null);

    // Sync Yaml preset whenever framework or working directory changes
    useEffect(() => {
        setYamlContent(generateYaml(selectedFramework, workingDir));
    }, [selectedFramework, workingDir]);

    const handleAddSecret = () => {
        setSecrets([...secrets, { key: '', value: '' }]);
    };

    const handleRemoveSecret = (index: number) => {
        setSecrets(secrets.filter((_, i) => i !== index));
    };

    const handleSecretChange = (
        index: number,
        field: 'key' | 'value',
        val: string
    ) => {
        const updated = [...secrets];
        updated[index][field] = val;
        setSecrets(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Filter out incomplete secret fields
            const validSecrets = secrets.filter(
                (s) => s.key.trim() !== '' && s.value.trim() !== ''
            );

            const payload = {
                repo,
                workflowFilename: filename,
                yamlContent,
                targetBranch,
                commitMessage: commitMsg,
                secrets: validSecrets,
            };

            const { data } = await axiosInstance.post('/repo/cicd/create-manual', payload);

            setSuccessData({
                prUrl: data.prUrl,
                branchName: targetBranch,
                filename,
                secretsConfigured: validSecrets.length,
            });
            setIsSubmitted(true);
        } catch (err: any) {
            // Handles both string errors and nested backend error object formats
            const backendError = err.response?.data?.error;
            if (typeof backendError === 'string') {
                setError(backendError);
            } else if (backendError?.message) {
                setError(backendError.message);
            } else {
                setError('Failed to dispatch workflow PR.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetForm = () => {
        setIsSubmitted(false);
        setSuccessData(null);
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Top Back Button */}
            <Link
                href={`/repo/${encodeURIComponent(repo)}/cicd-setup`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
            >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Quick Setup
            </Link>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
                <div>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500" /> Manual CI/CD Workflow Builder
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Build custom deployment pipelines from scratch with secret store integration.
                    </p>
                </div>

                {error && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-lg text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2 break-words">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                        <div className="flex-1">{error}</div>
                    </div>
                )}

                {/* Success Block */}
                {isSubmitted && successData ? (
                    <div className="p-6 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl space-y-5">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h2 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                                    Workflow Successfully Dispatched!
                                </h2>
                                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                                    Your custom GitHub Actions pipeline has been committed to branch{' '}
                                    <span className="font-mono font-semibold">{successData.branchName}</span>.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-white/80 dark:bg-slate-900/80 border border-emerald-100 dark:border-emerald-900/40 rounded-lg text-xs">
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase font-semibold">Workflow File</div>
                                <div className="font-mono font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                                    .github/workflows/{successData.filename}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase font-semibold">Secrets Synced</div>
                                <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                                    {successData.secretsConfigured} secret(s) configured
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase font-semibold">Target Repository</div>
                                <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                                    {repo}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                            {successData.prUrl ? (
                                <a
                                    href={successData.prUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                                >
                                    <GitPullRequest className="w-4 h-4" /> Open Pull Request <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            ) : (
                                <Link
                                    href={`/repo/${encodeURIComponent(repo)}/prs`}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                                >
                                    <GitPullRequest className="w-4 h-4" /> View Pull Requests
                                </Link>
                            )}

                            <button
                                type="button"
                                onClick={handleResetForm}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition"
                            >
                                <RotateCcw className="w-3.5 h-3.5" /> Create Another Workflow
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Form Content */
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Section 1: Framework Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                1. Choose Stack Template
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                {FRAMEWORK_PRESETS.map((fw) => (
                                    <button
                                        key={fw.id}
                                        type="button"
                                        onClick={() => setSelectedFramework(fw.id)}
                                        className={`p-2.5 rounded-lg border text-left transition ${selectedFramework === fw.id
                                                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                                            }`}
                                    >
                                        <div className="text-xs font-bold">{fw.name}</div>
                                        <div className="text-[10px] text-slate-400 font-medium">{fw.category}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Section 2: Codebase Path & Git Configuration */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <FolderTree className="w-3.5 h-3.5 text-indigo-500" /> Codebase Subfolder
                                </label>
                                <input
                                    type="text"
                                    value={workingDir}
                                    onChange={(e) => setWorkingDir(e.target.value)}
                                    placeholder="e.g. ./frontend or backend"
                                    className="w-full text-xs p-2 font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    Workflow Filename
                                </label>
                                <input
                                    type="text"
                                    value={filename}
                                    onChange={(e) => setFilename(e.target.value)}
                                    className="w-full text-xs p-2 font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    PR Branch Name
                                </label>
                                <input
                                    type="text"
                                    value={targetBranch}
                                    onChange={(e) => setTargetBranch(e.target.value)}
                                    className="w-full text-xs p-2 font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Section 3: Environment Secrets Store */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <Key className="w-3.5 h-3.5 text-amber-500" /> Repository Secrets (Environment Keys)
                                    </label>

                                    {/* Info Tag & Tooltip */}
                                    <div className="relative group flex items-center">
                                        <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help transition" />
                                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-72 p-2.5 bg-slate-900 dark:bg-slate-800 text-slate-100 text-[11px] rounded-lg shadow-xl z-20 pointer-events-none leading-normal">
                                            <p className="font-semibold mb-1 text-indigo-300">Secret Key Criteria:</p>
                                            <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                                                <li>Only letters (<code className="text-amber-300">A-Z, a-z</code>), numbers (<code className="text-amber-300">0-9</code>), or underscores (<code className="text-amber-300">_</code>).</li>
                                                <li>Must start with a letter or underscore.</li>
                                                <li><strong className="text-rose-400">No spaces allowed.</strong></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAddSecret}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline"
                                >
                                    <Plus className="w-3 h-3" /> Add Secret
                                </button>
                            </div>

                            <div className="space-y-2">
                                {secrets.map((sec, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="KEY_NAME (e.g. DATABASE_URL)"
                                            value={sec.key}
                                            onChange={(e) => handleSecretChange(idx, 'key', e.target.value)}
                                            className="flex-1 text-xs font-mono p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none uppercase"
                                        />
                                        <input
                                            type="password"
                                            placeholder="Secret Value"
                                            value={sec.value}
                                            onChange={(e) => handleSecretChange(idx, 'value', e.target.value)}
                                            className="flex-1 text-xs font-mono p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
                                        />
                                        {secrets.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSecret(idx)}
                                                className="p-2 text-slate-400 hover:text-rose-500 transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section 4: Live Interactive Editor */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <FileCode2 className="w-3.5 h-3.5 text-indigo-500" /> Live YAML Editor
                            </label>
                            <textarea
                                rows={14}
                                value={yamlContent}
                                onChange={(e) => setYamlContent(e.target.value)}
                                className="w-full text-xs font-mono p-4 bg-slate-900 text-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                            />
                        </div>

                        {/* Submit CTA */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-500/20"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <GitPullRequest className="w-4 h-4" /> Commit Workflow & Open Pull Request
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}