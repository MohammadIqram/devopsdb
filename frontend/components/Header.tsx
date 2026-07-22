'use client';

import { ChangeEvent } from 'react';
import { ShieldCheck, GitBranch, Moon, Sun, Home, Link as LinkIcon, Users } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useRepoStore, useUIStore } from '@/lib/store';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { repos, selectedRepo, setSelectedRepo, loading } = useRepoStore();
  const { theme, toggleTheme } = useUIStore();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: Home },
    { label: 'Webhooks', path: '/webhook-manager', icon: LinkIcon },
    { label: 'Contributors', path: '/contributers', icon: Users },
  ];

  return (
    <header className={`border-b ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Title and Branding */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
          <ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">DevOps Control Console</h1>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Multi-repository deployments & monitoring
            </p>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Navigation Links */}
          <nav className="flex gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? (theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-indigo-600 shadow-sm')
                      : (theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-950')
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Repo Selector */}
          <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg text-xs font-medium ${
            theme === 'dark' ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-300'
          }`}>
            <GitBranch className="w-3.5 h-3.5 text-indigo-500" />
            <select
              value={selectedRepo}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedRepo(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer text-xs"
              disabled={loading}
            >
              {loading && <option>Loading...</option>}
              {!loading && repos.length === 0 && <option>No repositories</option>}
              {repos.map((r) => (
                <option key={r.id} value={r.name} className={theme === 'dark' ? 'bg-slate-900' : 'bg-white'}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Light/Dark Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition cursor-pointer ${
              theme === 'dark' ? 'bg-slate-950 border-slate-700 text-amber-400 hover:bg-slate-800' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm'
            }`}
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>
        </div>

      </div>
    </header>
  );
}
