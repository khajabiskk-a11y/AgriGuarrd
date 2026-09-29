import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { auth, formatAuthError } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { AuthMode } from '../types';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sprout,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Send,
  AlertCircle,
  CheckCircle2,
  Wheat,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface AuthCardProps {
  initialMode?: AuthMode;
  onSuccess?: () => void;
}

export const AuthCard: React.FC<AuthCardProps> = ({ initialMode = 'login', onSuccess }) => {
  const { refreshUser, resendVerificationEmail, resendCooldown, signInWithGoogle, addActivityLog } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'farmer' | 'agronomist' | 'manager' | 'technician' | 'viewer'>('farmer');
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string>('');

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    try {
      // Set persistence based on "remember me"
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      addActivityLog('Logged in with email & password', 'auth');

      // If user email is not verified, take them to the notice or prompt
      if (!userCredential.user.emailVerified) {
        setRegisteredEmail(userCredential.user.email || email);
        setMode('verify_notice');
      } else if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!displayName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('Please agree to the Terms of Service to register.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const newUser = userCredential.user;

      // 2. Set profile display name
      await updateProfile(newUser, {
        displayName: displayName.trim(),
      });

      // 3. Immediately trigger verification email
      try {
        await sendEmailVerification(newUser);
        addActivityLog('Registered account and sent verification link', 'verification', `Email: ${email}`);
      } catch (verificationErr: any) {
        console.warn('Could not auto-send verification email on registration:', verificationErr);
      }

      setRegisteredEmail(newUser.email || email);
      setInfoMsg('Account created successfully! A verification email has been sent.');
      setMode('verify_notice');
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, email.trim());
      addActivityLog('Requested password reset link', 'security', `Email: ${email}`);
      setInfoMsg(`Password reset instructions have been dispatched to ${email.trim()}.`);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-in
  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle "I have verified my email" check from notice screen
  const handleVerifyCheck = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const isVerified = await refreshUser();
      if (isVerified) {
        setInfoMsg('Great news! Your email is verified. Access granted.');
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg('Not verified yet. Please click the confirmation link in the email, then click Check again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to check verification status.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend from notice screen
  const handleResendNotice = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await resendVerificationEmail();
      if (res.success) {
        setInfoMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to resend email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none border border-slate-200/80 dark:border-slate-800 transition-all">
        {/* Top Header Card */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-6 pt-7 pb-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-xl"></div>
          <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-teal-400/20 blur-xl"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner mb-3">
              <Sprout className="h-7 w-7 text-emerald-100" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'register' && 'Create Your Account'}
              {mode === 'forgot_password' && 'Reset Password'}
              {mode === 'verify_notice' && 'Verify Your Email'}
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1 max-w-xs">
              {mode === 'login' && 'Sign in to access your agricultural dashboard & user profile'}
              {mode === 'register' && 'Register for secure access with instant email verification'}
              {mode === 'forgot_password' && 'Enter your registered email to receive recovery instructions'}
              {mode === 'verify_notice' && 'One last step to secure your agricultural user identity'}
            </p>
          </div>

          {/* Mode Switcher Tabs (Only if not verify_notice) */}
          {mode !== 'verify_notice' && (
            <div className="mt-5 grid grid-cols-2 rounded-xl bg-black/20 p-1 backdrop-blur-sm border border-white/10 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className={`rounded-lg py-2 transition-all ${
                  mode === 'login'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className={`rounded-lg py-2 transition-all ${
                  mode === 'register'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-6">
          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Info/Success Message */}
          {infoMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-emerald-50 p-3.5 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="flex-1 leading-relaxed">{infoMsg}</div>
            </div>
          )}

          {/* VIEW: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="farmer@example.com"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setErrorMsg(null);
                      setInfoMsg(null);
                    }}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                  <span>Keep me signed in</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-70 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-slate-400 dark:bg-slate-900">
                    or continue with
                  </span>
                </div>
              </div>

              {/* Google Auth Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white py-2 px-4 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </form>
          )}

          {/* VIEW: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name / Display Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Maria Gonzalez"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maria@smartagri.org"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Agricultural Organization Role
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Wheat className="h-4 w-4" />
                  </div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-colors"
                  >
                    <option value="farmer">Farmer / Crop Producer</option>
                    <option value="agronomist">Agronomist &amp; Crop Consultant</option>
                    <option value="manager">Agricultural Operations Manager</option>
                    <option value="technician">Smart Agriculture IoT Technician</option>
                    <option value="viewer">Research Analyst / Observer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Create Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6-8 chars"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Live Password Strength Meter */}
                <PasswordStrengthIndicator password={password} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className={`w-full rounded-xl border bg-white py-2 pl-9 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 transition-colors ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-rose-400 focus:ring-rose-500/20'
                        : confirmPassword && password === confirmPassword
                        ? 'border-emerald-500 focus:ring-emerald-500/20'
                        : 'border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-[11px] text-rose-500 font-medium">Passwords do not match.</p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Passwords match!
                  </p>
                )}
              </div>

              {/* Agreement */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="h-4 w-4 mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                  <span>
                    I agree to the verification policy and accept that an activation email will be sent immediately upon registration.
                  </span>
                </label>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-70 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Registering user &amp; dispatching email...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Register &amp; Verify Email</span>
                  </>
                )}
              </button>

              {/* Alternative Google Sign Up */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>Quick Sign Up with Google</span>
              </button>
            </form>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {mode === 'forgot_password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Provide your registered email address below. Firebase will dispatch an authorized password reset link directly to your inbox.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="registered.user@example.com"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-70 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Dispatching reset link...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send Password Reset Email</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setInfoMsg(null);
                  }}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  &larr; Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* VIEW: VERIFY NOTICE */}
          {mode === 'verify_notice' && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 animate-pulse">
                <Mail className="h-8 w-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Check Your Inbox
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  A verification link was dispatched to:
                </p>
                <div className="mt-1.5 inline-block rounded-lg bg-slate-100 px-3 py-1 font-mono text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  {registeredEmail || email || auth.currentUser?.email || 'your email'}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-left text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 space-y-1.5 border border-slate-200 dark:border-slate-700">
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Next steps:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                  <li>Open your email provider and look for an email from <strong>noreply@ai-smart-agriculture-35f4d.firebaseapp.com</strong>.</li>
                  <li>Click the secure verification link inside.</li>
                  <li>Come back and tap <strong>"I've Verified (Check Status)"</strong> below.</li>
                </ol>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleVerifyCheck}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-4 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 disabled:opacity-70 transition-all cursor-pointer"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>{loading ? 'Checking...' : "I've Verified (Check Status)"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendNotice}
                  disabled={loading || resendCooldown > 0}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 disabled:opacity-60 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>
                    {resendCooldown > 0
                      ? `Resend available in ${resendCooldown}s`
                      : 'Resend Verification Email'}
                  </span>
                </button>

                {onSuccess && (
                  <button
                    type="button"
                    onClick={onSuccess}
                    className="mt-1 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    Continue to Dashboard &rarr;
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
