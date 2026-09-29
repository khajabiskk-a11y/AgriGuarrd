/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { EmailVerificationBanner } from './components/EmailVerificationBanner';
import { AuthCard } from './components/AuthCard';
import { UserProfileDashboard } from './components/UserProfileDashboard';
import { testConnection } from './firebase';
import {
  Sprout,
  ShieldCheck,
  Mail,
  Lock,
  Wheat,
  Activity,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Database,
  Sparkles,
} from 'lucide-react';

const MainContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'activity' | 'guide'>('profile');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [connectionTested, setConnectionTested] = useState<boolean | null>(null);

  // Test Firebase connection on mount
  useEffect(() => {
    testConnection().then((connected) => {
      setConnectionTested(connected);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="relative flex items-center justify-center">
          <div className="h-20 w-20 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin dark:border-emerald-950 dark:border-t-emerald-400"></div>
          <div className="absolute flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
            <Sprout className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-4 font-semibold text-sm text-slate-700 dark:text-slate-300">
          Connecting to Firebase Auth...
        </p>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          ai-smart-agriculture-35f4d
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white transition-colors">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuthModal={() => setAuthModalOpen(true)}
      />

      {/* Email Verification Banner */}
      <EmailVerificationBanner />

      {/* Main View Area */}
      <main className="flex-1">
        {user ? (
          /* Authenticated User Management Portal */
          <UserProfileDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
        ) : (
          /* Unauthenticated Landing & Login/Register Screen */
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Hero, Features & Project Context */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100/80 px-3.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Firebase Authentication &amp; User Security</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                  Secure User Management &amp;{' '}
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                    Email Verification
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  Robust user registration, authentication, and lifecycle administration for Smart Agriculture. Built with real-time Firebase Auth, email confirmation dispatch, password strength enforcement, and extended profile storage.
                </p>

                {/* Feature highlight badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Email Verification
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Automated link dispatch, status reloads, and anti-spam cooldown protection.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Password Policies
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Entropy-based strength indicator and secure password reset workflows.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      <Wheat className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Agriculture User Roles
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Profiles tailored for Farmers, Agronomists, IoT Technicians, and Managers.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Security Audit Trail
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Track login history, verification dispatches, and profile updates.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Firebase Connection Pill */}
                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-900 px-3 py-1.5 border border-slate-200 dark:border-slate-800">
                    <Database className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Project:</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      ai-smart-agriculture-35f4d
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Firebase Auth Online</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Sign In / Register Card */}
              <div className="lg:col-span-5">
                <AuthCard initialMode="login" />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sprout className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Smart Agriculture Security Portal
            </span>
            <span>• Powered by Firebase Authentication</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="font-mono">Project: ai-smart-agriculture-35f4d</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Email Verification Active
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
