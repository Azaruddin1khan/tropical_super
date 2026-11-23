'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { SuperAdminApi } from '@/lib/api';

const QUICK_ACCOUNTS = [
  {
    name: 'Master Authority',
    email: 'superadmin@tropicalgyros.com',
    role: 'Super Administrator',
    badge: 'Master Authority',
    color: 'amber',
  },
  {
    name: 'Sarah Jenkins',
    email: 'sarah.j@tropicalgyros.com',
    role: 'Front Counter Clerk',
    badge: 'Front Counter Clerk',
    color: 'sky',
  },
];

type AuthView = 'login' | 'forgot_step_email' | 'forgot_step_reset' | 'forgot_success';

export default function SuperAdminLoginPage() {
  const router = useRouter();

  // Mode state
  const [authView, setAuthView] = useState<AuthView>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetErrors, setResetErrors] = useState<{
    email?: string;
    otp?: string;
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [resetLoading, setResetLoading] = useState(false);

  const handleQuickFill = (accEmail: string) => {
    setEmail(accEmail);
    setPassword('Admin@123');
    setErrors({});
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const errs: typeof errors = {};

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      errs.email = 'Please enter your administrator email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Please enter your password';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsLoading(true);
    try {
      const res = await SuperAdminApi.login(cleanEmail, password);
      if (res && res.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('superadmin_token', res.token || 'jwt_active');
          if (res.user) {
            localStorage.setItem('superadmin_user', JSON.stringify(res.user));
          }
        }
        router.push('/');
      } else {
        setErrors({ general: res?.error || 'Invalid credentials. Please verify email and password.' });
      }
    } catch (err: any) {
      setErrors({ general: err?.message || 'A network error occurred during login' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrors({});
    const clean = forgotEmail.trim().toLowerCase();
    if (!clean) {
      setResetErrors({ email: 'Please enter your registered email' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setResetErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setResetLoading(true);
    try {
      const res = await SuperAdminApi.forgotPassword(clean);
      if (res && res.success) {
        setResetToken(res.token || '');
        setResetOtp('');
        setAuthView('forgot_step_reset');
      } else {
        setResetErrors({ general: res?.error || 'Account not found with this email' });
      }
    } catch (err: any) {
      setResetErrors({ general: err?.message || 'Failed to request reset code' });
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrors({});
    const errs: typeof resetErrors = {};

    if (!resetOtp.trim()) {
      errs.otp = '6-digit verification code is required';
    } else if (resetOtp.trim().length !== 6) {
      errs.otp = 'Verification code must be 6 digits';
    }

    if (!newPassword) {
      errs.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      errs.newPassword = 'Password must be at least 6 characters';
    }

    if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errs).length > 0) {
      setResetErrors(errs);
      return;
    }

    setResetLoading(true);
    try {
      const res = await SuperAdminApi.resetPassword({
        email: forgotEmail.trim().toLowerCase(),
        otp: resetOtp.trim(),
        token: resetToken,
        newPassword,
      });

      if (res && res.success) {
        setAuthView('forgot_success');
      } else {
        setResetErrors({ general: res?.error || 'Failed to reset password. Please check your verification code.' });
      }
    } catch (err: any) {
      setResetErrors({ general: err?.message || 'An error occurred during password reset' });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] bg-gradient-to-br from-amber-50/90 via-slate-50 to-orange-50/80 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Dot Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.25]"
        style={{
          backgroundImage: 'radial-gradient(circle, #b45309 0.75px, transparent 0.75px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Warm Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-[28rem] h-[28rem] bg-orange-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/4 w-[32rem] h-[32rem] bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Decorative Badges (Desktop) */}
      <div className="hidden xl:flex items-center gap-3 absolute top-10 left-10 p-3.5 rounded-2xl bg-white/85 backdrop-blur-md border border-amber-200/60 shadow-lg shadow-amber-900/5 animate-in fade-in duration-700 pointer-events-none">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center text-xl">
          🌴
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900">Palmdale, Nassau</p>
          <p className="text-[10px] text-slate-500">Rosetta St & Mackey St • The Bahamas</p>
        </div>
      </div>

      <div className="hidden xl:flex items-center gap-3 absolute top-10 right-10 p-3.5 rounded-2xl bg-white/85 backdrop-blur-md border border-emerald-200/60 shadow-lg shadow-emerald-900/5 animate-in fade-in duration-700 pointer-events-none">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
        <div>
          <p className="text-xs font-bold text-slate-900">Live Governance Console</p>
          <p className="text-[10px] text-emerald-600 font-semibold">Tier-1 Master Authority</p>
        </div>
      </div>

      <div className="hidden xl:flex items-center gap-3 absolute bottom-10 left-10 p-3.5 rounded-2xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-lg shadow-slate-900/5 animate-in fade-in duration-700 pointer-events-none">
        <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-700 flex items-center justify-center text-xl">
          🥙
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900">Authentic Mediterranean & Bahamian</p>
          <p className="text-[10px] text-slate-500">Meat Gyros, Seafood, Salads & Drinks</p>
        </div>
      </div>

      <div className="hidden xl:flex items-center gap-3 absolute bottom-10 right-10 p-3.5 rounded-2xl bg-white/85 backdrop-blur-md border border-amber-200/60 shadow-lg shadow-amber-900/5 animate-in fade-in duration-700 pointer-events-none">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-900 flex items-center justify-center font-black text-xs">
          BSD
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900">Bahamian Dollar Standard</p>
          <p className="text-[10px] text-slate-500">Multi-Panel Synchronization</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(217,119,6,0.18),0_10px_25px_-5px_rgba(0,0,0,0.06)] border border-amber-200/50 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Banner */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-400 to-amber-500 p-8 text-center relative">
          <div className="w-48 h-20 mx-auto rounded-2xl overflow-hidden border-2 border-white shadow-lg bg-white relative mb-3">
            <Image
              src="/images/tropical_gyros_logo.png"
              alt="Tropical Gyros Official Logo"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">Tropical Gyros</h1>
          <p className="text-xs font-semibold text-amber-950 mt-1 uppercase tracking-wider flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Super Admin Console
          </p>
        </div>

        {/* 1. SIGN IN VIEW */}
        {authView === 'login' && (
          <div className="p-8">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">Executive Sign In</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your master authority credentials to manage policies, roles & multi-panel governance.
              </p>
            </div>

            {errors.general && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" required>
                  Administrator Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="superadmin@tropicalgyros.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  error={errors.email}
                  icon={<Mail className="w-4 h-4" />}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="password" required className="mb-0">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setAuthView('forgot_step_email');
                    }}
                    className="text-xs text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    error={errors.password}
                    icon={<Lock className="w-4 h-4" />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md"
                size="lg"
                isLoading={isLoading}
              >
                Sign In to Console
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>

            {/* Quick Demo Access Pills */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
                Quick Fill Demo Authority
              </span>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleQuickFill(acc.email)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-left transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-bold text-slate-800 group-hover:text-amber-900 block truncate">
                      {acc.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                      {acc.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. FORGOT PASSWORD: STEP 1 (EMAIL) */}
        {authView === 'forgot_step_email' && (
          <div className="p-8">
            <button
              type="button"
              onClick={() => setAuthView('login')}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-semibold mb-4 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>

            <div className="mb-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-3 shadow-xs">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Reset Console Password</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Enter your registered administrator email. We will send a secure 6-digit verification code directly to your inbox.
              </p>
            </div>

            {resetErrors.general && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetErrors.general}</span>
              </div>
            )}

            <form onSubmit={handleSendResetCode} className="space-y-4">
              <div>
                <Label htmlFor="forgot-email" required>
                  Administrator Email
                </Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="superadmin@tropicalgyros.com"
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    if (resetErrors.email) setResetErrors({ ...resetErrors, email: undefined });
                  }}
                  error={resetErrors.email}
                  icon={<Mail className="w-4 h-4" />}
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md"
                size="lg"
                isLoading={resetLoading}
              >
                Send Verification Code
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          </div>
        )}

        {/* 3. FORGOT PASSWORD: STEP 2 (OTP + NEW PASSWORD) */}
        {authView === 'forgot_step_reset' && (
          <div className="p-8">
            <button
              type="button"
              onClick={() => setAuthView('forgot_step_email')}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-semibold mb-3 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Change Email
            </button>

            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900">Set New Password</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verification code sent to <strong className="text-slate-800">{forgotEmail}</strong>
              </p>
            </div>

            {/* Check Email Alert */}
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-950 block">Check Your Email</span>
                <span className="text-[11px] text-amber-800 leading-relaxed block mt-0.5">
                  We sent a 6-digit verification code to <strong>{forgotEmail}</strong>. Please check your inbox (or Spam folder) and enter the code below.
                </span>
              </div>
            </div>

            {resetErrors.general && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetErrors.general}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
              <div>
                <Label htmlFor="otp" required>
                  6-Digit Verification Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 482910"
                  value={resetOtp}
                  onChange={(e) => {
                    setResetOtp(e.target.value.replace(/\D/g, ''));
                    if (resetErrors.otp) setResetErrors({ ...resetErrors, otp: undefined });
                  }}
                  error={resetErrors.otp}
                  icon={<KeyRound className="w-4 h-4" />}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="new-password" required className="mb-0">
                    New Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showNewPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (resetErrors.newPassword) setResetErrors({ ...resetErrors, newPassword: undefined });
                  }}
                  error={resetErrors.newPassword}
                  icon={<Lock className="w-4 h-4" />}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="confirm-password" required className="mb-0">
                    Confirm New Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (resetErrors.confirmPassword) setResetErrors({ ...resetErrors, confirmPassword: undefined });
                  }}
                  error={resetErrors.confirmPassword}
                  icon={<Lock className="w-4 h-4" />}
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md"
                size="lg"
                isLoading={resetLoading}
              >
                Reset Password & Continue
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          </div>
        )}

        {/* 4. SUCCESS VIEW */}
        {authView === 'forgot_success' && (
          <div className="p-8 text-center animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 border border-emerald-300 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Password Reset Successfully!
            </h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-xs mx-auto">
              Your master password for <strong className="text-slate-800">{forgotEmail}</strong> has been updated in MongoDB Atlas.
            </p>

            <div className="mt-6">
              <Button
                type="button"
                onClick={() => setAuthView('login')}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md"
                size="lg"
              >
                Return to Sign In
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Tropical Gyros Super Admin Console</span>
          <a
            href="https://tropical-admin-six.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            Store Admin <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
