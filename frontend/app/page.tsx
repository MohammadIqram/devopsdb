'use client';

import { useState, useEffect } from 'react';
import {
  Play,
  AlertOctagon,
  CheckCircle2,
  Clock,
  RefreshCw,
  GitBranch,
  Sun,
  Moon,
  Terminal,
  X,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const BACKEND_URL = 'http://localhost:4000/api';

const navItems = [
  { label: 'Webhooks', path: '/webhook-manager' },
  { label: 'Deployment Manager', path: '/deployment-manager' },
  { label: 'Bug Tracker', path: '/bug-tracker' },
  { label: 'User Management', path: '/user-management' },
  { label: 'Settings', path: '/settings' },
  { label: 'Profile', path: '/profile' },
];

export default function DevOpsDashboard() {
  const [theme, setTheme] = useState('light'); // Default to light theme
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [deployments, setDeployments] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);

  // Modal / Terminal Log State
  const [activeLog, setActiveLog] = useState(null);
  const [logLoading, setLogLoading] = useState(false);

  const router = useRouter();

  // 1. Load repos on startup
  useEffect(() => {
    async function loadRepos() {
      try {
        const res = await fetch(`${BACKEND_URL}/repos`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setRepos(data);
          if (data.length > 0) setSelectedRepo(data[0].name);
        }
      } catch (err) {
        console.error('Failed to fetch repositories:', err);
      }
    }
    loadRepos();
  }, []);

  // 2. Fetch dashboard metrics
  const fetchData = async () => {
    if (!selectedRepo) return;
    setLoading(true);
    try {
      const [deployRes, bugRes] = await Promise.all([
        fetch(`${BACKEND_URL}/deployments?repo=${selectedRepo}`),
        fetch(`${BACKEND_URL}/bugs?repo=${selectedRepo}`),
      ]);

      setDeployments(await deployRes.json());
      setBugs(await bugRes.json());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // WebSocket for Real-Time Updates
    const ws = new WebSocket('ws://localhost:4000');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'GITHUB_EVENT' && data.repo === selectedRepo) {
        fetchData();
      }
    };

    return () => ws.close();
  }, [selectedRepo]);

  // 3. Trigger Deployment
  const triggerDeploy = async (env: any) => {
    if (!selectedRepo) return;
    setDeploying(true);
    try {
      await fetch(`${BACKEND_URL}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: selectedRepo,
          environment: env,
          ref: selectedBranch,
          user: 'DevOps Lead'
        }),
      });
      alert(`Deployment triggered for ${selectedRepo} (${env}) on ${selectedBranch}!`);
      setTimeout(fetchData, 2000);
    } catch (err) {
      alert('Failed to trigger deploy');
    } finally {
      setDeploying(false);
    }
  };

  // 4. Fetch Job Logs
  const viewLogs = async (jobId: any, runName: any) => {
    setLogLoading(true);
    setActiveLog({ id: jobId, name: runName, content: 'Fetching logs from GitHub...' });
    try {
      const res = await fetch(`${BACKEND_URL}/logs/${jobId}?repo=${selectedRepo}`);
      const text = await res.text();
      setActiveLog({ id: jobId, name: runName, content: text || 'No log text returned.' });
    } catch (err) {
      setActiveLog({ id: jobId, name: runName, content: 'Failed to retrieve logs.' });
    } finally {
      setLogLoading(false);
    }
  };

  // Derive environment health status
  const latestSuccess = deployments.find((d: any) => d.conclusion === 'success');

  return (
    <div className={theme === 'dark' ? 'bg-slate-950 text-slate-100 min-h-screen' : 'bg-slate-50 text-slate-800 min-h-screen'}>
      <div className="max-w-7xl mx-auto p-6 lg:p-10 font-sans transition-colors duration-200">

        {/* TOP HEADER & CONTROLS */}
        <header className={`flex flex-col md:flex-row justify-between items-start md:items-center pb-6 mb-8 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              DevOps Control Console
            </h1>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Multi-repository deployments, action logs, and live incident monitoring
            </p>
          </div>

          <div className="flex items-center gap-3 mt-4 md:mt-0 flex-wrap">
            {/* Repository Selector */}
            <div className={`flex items-center gap-2 border px-3 py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300 shadow-sm'}`}>
              <GitBranch className="w-4 h-4 text-indigo-500" />
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                {repos.map((r: any) => (
                  <option key={r.id} value={r.name} className={theme === 'dark' ? 'bg-slate-900' : 'bg-white'}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchData}
              className={`p-2 rounded-lg border text-sm font-medium transition flex items-center gap-2 ${theme === 'dark' ? 'bg-slate-900 border-slate-700 hover:bg-slate-800' : 'bg-white border-slate-300 hover:bg-slate-100 shadow-sm'}`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Light/Dark Toggle */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className={`p-2 rounded-lg border transition ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm'}`}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* NAVIGATION BAR   */}
        <div className="flex flex-wrap gap-3 py-4">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="cursor-pointer px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-150 shadow-sm"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* ENVIRONMENT STATUS BAR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className={`p-4 rounded-xl border flex items-center justify-between ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Environment Status</span>
              <p className="text-base font-semibold mt-0.5">Production</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Operational
            </span>
          </div>

          <div className={`p-4 rounded-xl border flex items-center justify-between ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Build</span>
              <p className="text-base font-semibold mt-0.5">{deployments[0]?.branch || 'main'}</p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {latestSuccess ? `Commit: ${latestSuccess?.commit?.substring(0, 7)}` : 'No runs'}
            </span>
          </div>

          <div className={`p-4 rounded-xl border flex items-center justify-between ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Open Incidents</span>
              <p className="text-base font-semibold mt-0.5">{bugs.length} Critical</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${bugs.length > 0 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
              {bugs.length > 0 ? 'Attention Required' : 'All Clear'}
            </span>
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT: Deployment Control & Pipelines */}
          <div className="lg:col-span-2 space-y-6">

            {/* ACTION CARD */}
            <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h2 className="text-lg font-semibold mb-1">
                Deploy Target: <span className="text-indigo-600 dark:text-indigo-400">{selectedRepo || 'Select Repository'}</span>
              </h2>
              <p className={`text-xs mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Triggers custom SSH & Docker deployment runners on host servers
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  disabled={deploying || !selectedRepo}
                  onClick={() => triggerDeploy('staging')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  <Play className="w-4 h-4" /> Deploy to Staging
                </button>
                <button
                  disabled={deploying || !selectedRepo}
                  onClick={() => triggerDeploy('production')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  <Play className="w-4 h-4" /> Deploy to Production
                </button>
              </div>
            </div>

            {/* PIPELINES CARD */}
            <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h2 className="text-lg font-semibold mb-4">Pipeline Execution History</h2>

              <div className="space-y-3">
                {deployments.length === 0 ? (
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>No recent workflow runs found.</p>
                ) : (
                  deployments.map((run: any) => (
                    <div
                      key={run.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border gap-3 ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <div className="flex items-center gap-3">
                        {run.status === 'in_progress' ? (
                          <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
                        ) : run.conclusion === 'success' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <AlertOctagon className="w-5 h-5 text-rose-500" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{run.name}</p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                            {run.branch} • <span className="italic">{run.commit}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => viewLogs(run.id, run.name)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition ${theme === 'dark' ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'}`}
                        >
                          <Terminal className="w-3.5 h-3.5 text-indigo-500" /> View Logs
                        </button>
                        <a
                          href={run.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          GitHub <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* RIGHT: Critical Bugs */}
          <div className="space-y-6">
            <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h2 className="text-lg font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2 mb-4">
                <AlertOctagon className="w-5 h-5" /> Critical Bugs ({bugs.length})
              </h2>

              {bugs.length === 0 ? (
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>No open critical issues reported.</p>
              ) : (
                <div className="space-y-3">
                  {bugs.map((bug: any) => (
                    <div key={bug.id} className="p-3 bg-rose-50 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50 rounded-lg">
                      <a
                        href={bug.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-rose-900 dark:text-rose-200 hover:underline block"
                      >
                        #{bug.number}: {bug.title}
                      </a>
                      <span className="text-xs text-rose-600 dark:text-rose-400/80 mt-1 block">Opened by {bug.author}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* LOG TERMINAL MODAL */}
        {activeLog && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-950 text-slate-100 border border-slate-800 rounded-xl max-w-4xl w-full max-h-[80vh] flex flex-col shadow-2xl">

              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-mono text-sm font-semibold">{activeLog.name} (Job #{activeLog.id})</h3>
                </div>
                <button
                  onClick={() => setActiveLog(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content / Terminal Output */}
              <div className="p-4 font-mono text-xs overflow-y-auto flex-1 bg-slate-900/90 text-emerald-400 whitespace-pre-wrap leading-relaxed">
                {logLoading ? (
                  <div className="flex items-center gap-2 text-amber-400">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Fetching raw logs from GitHub Actions...
                  </div>
                ) : (
                  activeLog.content
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}