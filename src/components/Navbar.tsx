import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sprout,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  User,
  Activity,
  Key,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'profile' | 'security' | 'activity' | 'guide';
  setActiveTab: (tab: 'profile' | 'security' | 'activity' | 'guide') => void;
  onOpenAuthModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAuthModal }) => {
  const { user, profileData, logOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-900/10 bg-white/95 backdrop-blur-md dark:border-emerald-500/10 dark:bg-slate-900/95 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                AgriGuard
              </span>
              <span className="hidden sm:inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Firebase Auth
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Secure User Management &amp; Verification
            </p>
          </div>
        </div>

        {/* Center / Navigation items if authenticated */}
        {user ? (
          <nav className="hidden md:flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-sm">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeTab === 'profile'
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Profile &amp; User</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeTab === 'security'
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              <Key className="h-4 w-4" />
              <span>Credentials</span>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeTab === 'activity'
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Audit Log</span>
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium transition-all ${
                activeTab === 'guide'
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Setup Guide</span>
            </button>
          </nav>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 font-mono text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              ai-smart-agriculture-35f4d
            </span>
          </div>
        )}

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Verification status chip */}
              <div
                title={user.emailVerified ? 'Email is verified' : 'Email verification pending'}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
                  user.emailVerified
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                }`}
              >
                {user.emailVerified ? (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="hidden sm:inline">Verified</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 animate-bounce" />
                    <span className="hidden sm:inline">Unverified</span>
                  </>
                )}
              </div>

              {/* User display badge */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold text-xs shadow-inner">
                  {profileData?.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="text-left text-xs leading-tight">
                  <div className="font-semibold text-slate-800 dark:text-slate-100 max-w-[130px] truncate">
                    {profileData?.displayName || 'User'}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 max-w-[130px] truncate">
                    {user.email}
                  </div>
                </div>
              </div>

              {/* Sign out button */}
              <button
                onClick={logOut}
                title="Sign out of Firebase Auth"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-red-400 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Sign In / Register</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile subnavigation if logged in */}
      {user && (
        <div className="flex md:hidden border-t border-slate-200 dark:border-slate-800 px-4 py-2 justify-around text-xs bg-slate-50 dark:bg-slate-900/90">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1 py-1 px-2 rounded font-medium ${
              activeTab === 'profile' ? 'text-emerald-600 font-semibold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1 py-1 px-2 rounded font-medium ${
              activeTab === 'security' ? 'text-emerald-600 font-semibold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            Security
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-1 py-1 px-2 rounded font-medium ${
              activeTab === 'activity' ? 'text-emerald-600 font-semibold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Logs
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1 py-1 px-2 rounded font-medium ${
              activeTab === 'guide' ? 'text-emerald-600 font-semibold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Guide
          </button>
        </div>
      )}
    </header>
  );
};
