import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  AlertTriangle,
  Mail,
  RefreshCw,
  Send,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';

export const EmailVerificationBanner: React.FC = () => {
  const { user, refreshUser, resendVerificationEmail, resendCooldown } = useAuth();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  if (!user || user.emailVerified) {
    return null;
  }

  const handleCheckStatus = async () => {
    setChecking(true);
    setFeedback(null);
    try {
      const isVerified = await refreshUser();
      if (isVerified) {
        setFeedback({
          type: 'success',
          text: 'Congratulations! Your email address has been successfully verified.',
        });
      } else {
        setFeedback({
          type: 'info',
          text: 'Email not verified yet. Please click the link sent to your inbox, then click this button again.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Could not verify status. Please check your internet connection.',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    setFeedback(null);
    try {
      const res = await resendVerificationEmail();
      setFeedback({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Failed to dispatch verification email.',
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white shadow-md">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Status Message */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-semibold text-sm">
                <span>Email Verification Required</span>
                <span className="rounded bg-black/20 px-2 py-0.5 text-[11px] font-mono">
                  Pending Verification
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                We sent a confirmation link to <span className="font-semibold text-white underline decoration-amber-300">{user.email}</span>. Click the link to complete verification.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
            {/* Check status button */}
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm hover:bg-amber-50 disabled:opacity-75 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Checking...' : "I've Verified (Check Status)"}</span>
            </button>

            {/* Resend button with cooldown */}
            <button
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-black/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-black/30 disabled:opacity-60 transition-all border border-white/20"
            >
              <Send className={`h-3.5 w-3.5 ${resending ? 'animate-pulse' : ''}`} />
              <span>
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : resending
                  ? 'Sending...'
                  : 'Resend Email'}
              </span>
            </button>

            {/* Toggle Troubleshooting details */}
            <button
              onClick={() => setShowTroubleshooting(!showTroubleshooting)}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-amber-100 hover:text-white transition-colors"
              title="Troubleshooting tips"
            >
              <Info className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Help</span>
              {showTroubleshooting ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Dynamic inline feedback alert */}
        {feedback && (
          <div
            className={`mt-2.5 flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-900/40 text-emerald-100 border border-emerald-300/40'
                : feedback.type === 'error'
                ? 'bg-rose-900/40 text-rose-100 border border-rose-300/40'
                : 'bg-black/30 text-white border border-white/20'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Collapsible Troubleshooting Box */}
        {showTroubleshooting && (
          <div className="mt-3 rounded-lg bg-black/25 p-3.5 text-xs text-amber-50 backdrop-blur-sm border border-white/10">
            <h4 className="font-semibold text-white mb-1.5 flex items-center gap-1.5">
              <Mail className="h-4 w-4" /> Did not receive the verification email?
            </h4>
            <ul className="list-disc list-inside space-y-1 text-amber-100/90 leading-relaxed">
              <li>Check your <strong>Spam</strong>, <strong>Junk</strong>, or <strong>Promotions</strong> folder.</li>
              <li>The verification email comes from <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-[11px] text-white">noreply@ai-smart-agriculture-35f4d.firebaseapp.com</code>.</li>
              <li>Ensure your email address <span className="font-mono text-white underline">{user.email}</span> is spelled correctly.</li>
              <li>If you are testing locally or in an iframe, clicking the link in your email will open Firebase's hosted handler and update your account immediately. Return here and click <strong>"I've Verified (Check Status)"</strong>.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
