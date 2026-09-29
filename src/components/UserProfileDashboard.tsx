import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Key,
  Copy,
  Check,
  RefreshCw,
  Send,
  Building,
  Phone,
  Calendar,
  Lock,
  Trash2,
  ExternalLink,
  Sprout,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Wheat,
  Globe,
  Settings,
  HelpCircle,
} from 'lucide-react';

interface UserProfileDashboardProps {
  activeTab: 'profile' | 'security' | 'activity' | 'guide';
  setActiveTab: (tab: 'profile' | 'security' | 'activity' | 'guide') => void;
}

export const UserProfileDashboard: React.FC<UserProfileDashboardProps> = ({ activeTab, setActiveTab }) => {
  const {
    user,
    profileData,
    profileLoading,
    refreshUser,
    resendVerificationEmail,
    resendCooldown,
    updateUserProfileData,
    sendUserPasswordReset,
    updateUserPassword,
    deleteUserAccount,
    activityLogs,
    clearActivityLogs,
  } = useAuth();

  // Edit profile state
  const [displayName, setDisplayName] = useState(profileData?.displayName || user?.displayName || '');
  const [organization, setOrganization] = useState(profileData?.organization || 'Smart Agriculture Operations');
  const [role, setRole] = useState<any>(profileData?.role || 'farmer');
  const [phoneNumber, setPhoneNumber] = useState(profileData?.phoneNumber || '');
  const [bio, setBio] = useState(profileData?.bio || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Security credentials state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [updatingPass, setUpdatingPass] = useState(false);
  const [passFeedback, setPassFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reset email state
  const [sendingReset, setSendingReset] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Verification state
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [verifyFeedback, setVerifyFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Copy UID feedback
  const [copiedUid, setCopiedUid] = useState(false);

  // Sync state if profileData updates
  useEffect(() => {
    if (profileData) {
      setDisplayName(profileData.displayName || user?.displayName || '');
      setOrganization(profileData.organization || 'Smart Agriculture Operations');
      setRole(profileData.role || 'farmer');
      setPhoneNumber(profileData.phoneNumber || '');
      setBio(profileData.bio || '');
    }
  }, [profileData, user]);

  if (!user) return null;

  const handleCopyUid = () => {
    navigator.clipboard.writeText(user.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileFeedback(null);
    try {
      const res = await updateUserProfileData({
        displayName: displayName.trim(),
        organization: organization.trim(),
        role,
        phoneNumber: phoneNumber.trim(),
        bio: bio.trim(),
      });
      setProfileFeedback({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
    } catch (err: any) {
      setProfileFeedback({
        type: 'error',
        text: err?.message || 'Could not update profile.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassFeedback(null);

    if (newPassword.length < 6) {
      setPassFeedback({ type: 'error', text: 'New password must have at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPassFeedback({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setUpdatingPass(true);
    try {
      const res = await updateUserPassword(currentPassword, newPassword);
      setPassFeedback({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
      if (res.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err: any) {
      setPassFeedback({ type: 'error', text: err?.message || 'Password update failed.' });
    } finally {
      setUpdatingPass(false);
    }
  };

  const handleSendResetEmail = async () => {
    setSendingReset(true);
    setResetFeedback(null);
    try {
      const res = await sendUserPasswordReset(user.email || undefined);
      setResetFeedback({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
    } catch (err: any) {
      setResetFeedback({ type: 'error', text: err?.message || 'Failed to dispatch reset email.' });
    } finally {
      setSendingReset(false);
    }
  };

  const handleCheckVerification = async () => {
    setCheckingVerification(true);
    setVerifyFeedback(null);
    try {
      const isVerified = await refreshUser();
      if (isVerified) {
        setVerifyFeedback({
          type: 'success',
          text: 'Great news! Your email address is now verified and your profile is fully unlocked.',
        });
      } else {
        setVerifyFeedback({
          type: 'info',
          text: 'Email not verified yet. Please click the link in your inbox first, then click Check Status again.',
        });
      }
    } catch (err: any) {
      setVerifyFeedback({ type: 'error', text: err?.message || 'Could not check status.' });
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setResendingEmail(true);
    setVerifyFeedback(null);
    try {
      const res = await resendVerificationEmail();
      setVerifyFeedback({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
    } catch (err: any) {
      setVerifyFeedback({ type: 'error', text: err?.message || 'Failed to dispatch verification email.' });
    } finally {
      setResendingEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmPassword) {
      setDeleteError('Please provide your current password to confirm deletion.');
      return;
    }
    setDeletingAccount(true);
    setDeleteError(null);
    try {
      const res = await deleteUserAccount(deleteConfirmPassword);
      if (!res.success) {
        setDeleteError(res.message);
      }
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete account.');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Identity Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 -mb-12 h-48 w-48 rounded-full bg-teal-400/10 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Avatar Circle */}
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner text-2xl sm:text-3xl font-bold text-white">
              {displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {displayName || 'Agricultural Specialist'}
                </h1>
                {/* Verification badge */}
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold shadow-sm border ${
                    user.emailVerified
                      ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                      : 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                  }`}
                >
                  {user.emailVerified ? (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Verified Email</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                      <span>Email Unverified</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-100/80">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1">
                  <Wheat className="h-3.5 w-3.5" />
                  {organization} ({role})
                </span>
              </div>

              {/* UID with copy button */}
              <div className="flex items-center gap-2 pt-1">
                <span className="font-mono text-[11px] text-emerald-200/70 bg-black/25 px-2 py-0.5 rounded border border-white/10">
                  UID: {user.uid}
                </span>
                <button
                  onClick={handleCopyUid}
                  className="rounded p-1 text-emerald-200/70 hover:bg-white/10 hover:text-white transition-colors"
                  title="Copy UID"
                >
                  {copiedUid ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Quick stats / metadata */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 text-xs text-emerald-100/90">
            <div>
              <div className="text-[11px] text-emerald-200/60 uppercase tracking-wider font-semibold">
                Account Created
              </div>
              <div className="font-medium text-white mt-0.5">
                {user.metadata.creationTime
                  ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Recent'}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-emerald-200/60 uppercase tracking-wider font-semibold">
                Last Signed In
              </div>
              <div className="font-medium text-white mt-0.5">
                {user.metadata.lastSignInTime
                  ? new Date(user.metadata.lastSignInTime).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Now'}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-emerald-200/60 uppercase tracking-wider font-semibold">
                Auth Method
              </div>
              <div className="font-medium text-white mt-0.5 capitalize">
                {user.providerData[0]?.providerId.replace('.com', '') || 'Password'}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-emerald-200/60 uppercase tracking-wider font-semibold">
                Security Level
              </div>
              <div className="font-medium text-white mt-0.5">
                {user.emailVerified ? 'High (Verified)' : 'Restricted (Unverified)'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area based on Active Tab */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Tab Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* TAB 1: PROFILE MANAGEMENT */}
          {activeTab === 'profile' && (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 space-y-6">
              <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-600" />
                  <span>User Profile &amp; Agriculture Settings</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update your display name, role, contact information, and farm organization details.
                </p>
              </div>

              {profileFeedback && (
                <div
                  className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
                    profileFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                  }`}
                >
                  {profileFeedback.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                  )}
                  <span>{profileFeedback.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Maria Gonzalez"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address (Locked)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user.email || ''}
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Organization / Farm Name
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Building className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="e.g. Green Valley Precision Farm"
                        className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Agricultural Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="farmer">Farmer / Crop Producer</option>
                      <option value="agronomist">Agronomist &amp; Crop Consultant</option>
                      <option value="manager">Operations Manager</option>
                      <option value="technician">Smart Agriculture IoT Technician</option>
                      <option value="viewer">Research Analyst / Observer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Field Notes &amp; Bio
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Focusing on precision irrigation, automated crop monitoring, and sustainable soil management..."
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-70 transition-all cursor-pointer"
                  >
                    {savingProfile ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Save Profile Details</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: SECURITY & PASSWORDS */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Change Password Card */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 space-y-5">
                <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Key className="h-5 w-5 text-emerald-600" />
                    <span>Change Account Password</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Update your password regularly to protect your agricultural telemetry and credentials.
                  </p>
                </div>

                {passFeedback && (
                  <div
                    className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
                      passFeedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                    }`}
                  >
                    {passFeedback.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                    )}
                    <span>{passFeedback.text}</span>
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-2">
                    <button
                      type="submit"
                      disabled={updatingPass}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-70 transition-all cursor-pointer"
                    >
                      {updatingPass ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          <span>Update Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Password Reset via Email */}
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Mail className="h-5 w-5 text-emerald-600" />
                    <span>Send Password Reset Email</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Prefer to reset via a secure link? We'll dispatch a link directly to {user.email}.
                  </p>
                </div>

                {resetFeedback && (
                  <div
                    className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
                      resetFeedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                    }`}
                  >
                    {resetFeedback.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                    )}
                    <span>{resetFeedback.text}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Target: <strong className="text-slate-900 dark:text-white">{user.email}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendResetEmail}
                    disabled={sendingReset}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 disabled:opacity-60 transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{sendingReset ? 'Sending...' : 'Send Reset Link'}</span>
                  </button>
                </div>
              </div>

              {/* Danger Zone: Delete Account */}
              <div className="rounded-2xl bg-rose-50/50 p-6 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
                      <Trash2 className="h-5 w-5 text-rose-600" />
                      <span>Danger Zone: Delete Account</span>
                    </h3>
                    <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-1">
                      Permanently remove your account and all associated profile data from Firebase. This action cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="shrink-0 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT LOG */}
          {activeTab === 'activity' && (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-600" />
                    <span>Security Audit &amp; Activity Log</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Real-time trail of authentication, verification, and profile actions.
                  </p>
                </div>
                {activityLogs.length > 0 && (
                  <button
                    onClick={clearActivityLogs}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {activityLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Activity className="mx-auto h-8 w-8 stroke-1 text-slate-300 mb-2" />
                  <p className="text-xs">No activity recorded yet in this session.</p>
                </div>
              ) : (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {activityLogs.map((log, idx) => (
                      <li key={log.id}>
                        <div className="relative pb-8">
                          {idx !== activityLogs.length - 1 && (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800"
                              aria-hidden="true"
                            />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span
                                className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-slate-900 ${
                                  log.type === 'verification'
                                    ? 'bg-amber-100 text-amber-600'
                                    : log.type === 'security'
                                    ? 'bg-blue-100 text-blue-600'
                                    : log.type === 'profile'
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {log.type === 'verification' ? (
                                  <Mail className="h-4 w-4" />
                                ) : log.type === 'security' ? (
                                  <Key className="h-4 w-4" />
                                ) : log.type === 'profile' ? (
                                  <User className="h-4 w-4" />
                                ) : (
                                  <ShieldCheck className="h-4 w-4" />
                                )}
                              </span>
                            </div>
                            <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                              <div>
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                  {log.action}
                                </p>
                                {log.details && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {log.details}
                                  </p>
                                )}
                              </div>
                              <div className="whitespace-nowrap text-right text-[11px] text-slate-400">
                                {new Date(log.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FIREBASE SETUP GUIDE */}
          {activeTab === 'guide' && (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 space-y-6">
              <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="h-5 w-5 text-emerald-600" />
                  <span>Firebase Authentication &amp; Verification Guide</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  How your project <code className="font-mono text-emerald-600 font-semibold">ai-smart-agriculture-35f4d</code> handles emails and auth providers.
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px]">1</span>
                    Email/Password &amp; Google Sign-in Methods
                  </h3>
                  <p>
                    In your Firebase Console under <strong>Authentication &gt; Sign-in method</strong>, ensure that:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    <li><strong>Email/Password</strong> provider is <em>Enabled</em>.</li>
                    <li><strong>Google</strong> provider is <em>Enabled</em> with support email selected.</li>
                  </ul>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px]">2</span>
                    Customizing the Verification Email Template
                  </h3>
                  <p>
                    Firebase lets you customize the sender display name, subject line, and reply-to email under <strong>Authentication &gt; Templates &gt; Email address verification</strong>:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    <li>Sender name: <em>Smart Agriculture System</em></li>
                    <li>Subject: <em>Verify your email for Smart Agriculture</em></li>
                    <li>Custom action link URL: Optional custom domain to handle verification</li>
                  </ul>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px]">3</span>
                    Authorized Domains
                  </h3>
                  <p>
                    Under <strong>Authentication &gt; Settings &gt; Authorized domains</strong>, Firebase automatically includes <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">localhost</code> and <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">ai-smart-agriculture-35f4d.firebaseapp.com</code>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Verification Action Center & Project Diagnostics */}
        <div className="space-y-6">
          {/* Verification Action Center Card */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Email Verification</span>
              </h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  user.emailVerified
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {user.emailVerified ? 'Verified' : 'Pending'}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {user.emailVerified
                ? 'Your email address is verified. You have full administrative and field data modification capabilities.'
                : 'Click the link sent to your inbox to unlock all permissions and ensure secure account recovery.'}
            </p>

            {verifyFeedback && (
              <div
                className={`rounded-xl p-3 text-xs font-medium flex items-start gap-2 ${
                  verifyFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : verifyFeedback.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                    : 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                }`}
              >
                {verifyFeedback.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <span>{verifyFeedback.text}</span>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleCheckVerification}
                disabled={checkingVerification}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-75 transition-all"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${checkingVerification ? 'animate-spin' : ''}`} />
                <span>{checkingVerification ? 'Checking...' : "Check Verification Status"}</span>
              </button>

              {!user.emailVerified && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendingEmail || resendCooldown > 0}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 disabled:opacity-60 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>
                    {resendCooldown > 0
                      ? `Resend link in ${resendCooldown}s`
                      : resendingEmail
                      ? 'Dispatching email...'
                      : 'Resend Verification Email'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Firebase Configuration Inspector */}
          <div className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span className="font-semibold text-emerald-400">Firebase Config</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                ACTIVE
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Project ID:</span>
                <span className="text-white">ai-smart-agriculture-35f4d</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Auth Domain:</span>
                <span className="text-white">ai-smart-agriculture...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">App ID:</span>
                <span className="text-white">1:138437875985:web...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Measurement ID:</span>
                <span className="text-white">G-7NVVGCQKTX</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Permanently Delete Account?
                </h3>
                <p className="text-xs text-slate-500">This action cannot be reversed.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              To confirm deletion, please enter your current account password. Your credentials, verification record, and profile will be permanently deleted from Firebase Auth.
            </p>

            {deleteError && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                {deleteError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Account Password
              </label>
              <input
                type="password"
                value={deleteConfirmPassword}
                onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmPassword('');
                  setDeleteError(null);
                }}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 disabled:opacity-75"
              >
                {deletingAccount ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
