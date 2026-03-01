'use client';

import { useState, useEffect } from "react"
import { authApi } from "@/lib/api"
import { User, Mail, Phone, Lock, ArrowRight, ArrowLeft, Loader2, CheckCircle2, ShieldCheck, Clock } from "lucide-react"

export function ForgotPasswordForm() {
  const [step, setStep] = useState(1);
  const [netId, setNetId] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 3 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await authApi.get(`/auth/forgot-password/search?netId=${netId}`);
      setUserInfo(resp.data);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'User not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    setError('');
    setLoading(true);
    try {
      await authApi.post('/auth/forgot-password/send-code', { netId, method });
      setTimeLeft(300);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.post('/auth/forgot-password/reset', { netId, code, newPassword });
      setStep(4);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid code or failed to reset');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full">
      {/* Intro Header */}
      <div className="mb-8 text-center md:text-left landing-fade-in" style={{ animationDelay: '0.4s' }}>
        <h2 className="text-3xl font-bold tracking-tight text-[#0a2240]" style={{ fontFamily: 'var(--font-display)' }}>
          {step === 4 ? "Success!" : "Reset password"}
        </h2>
        <p className="mt-2 text-[15px] text-gray-500">
          {step === 1 && "Enter your NetID to find your account."}
          {step === 2 && `Hi ${userInfo?.firstName}, how would you like to receive your code?`}
          {step === 3 && "Enter the 6-digit code we sent you."}
          {step === 4 && "Your password has been reset successfully."}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100 flex items-start gap-2">
          <p>{error}</p>
        </div>
      )}

      {/* STEP 1: SEARCH */}
      {step === 1 && (
        <form onSubmit={handleSearch} className="space-y-6">
          <div className="space-y-2 landing-fade-in" style={{ animationDelay: '0.5s' }}>
            <label className="text-sm font-semibold text-[#0a2240]">NetID</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. axm1234"
                required
                value={netId}
                onChange={(e) => setNetId(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm focus:border-[#c75b12] focus:ring-1 focus:ring-[#c75b12] outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#c75b12] py-3.5 font-bold text-white shadow-lg hover:bg-[#a84a0e] transition-all disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
      )}

      {/* STEP 2: CHOOSE METHOD */}
      {step === 2 && (
        <div className="space-y-4">
          <button
            onClick={() => setMethod('email')}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between ${method === 'email' ? 'border-[#c75b12] bg-[#c75b12]/5' : 'border-gray-100 bg-white hover:border-gray-200'}`}
          >
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-gray-50"><Mail className="h-5 w-5 text-[#c75b12]" /></div>
              <div>
                <p className="font-bold text-[#0a2240]">Email</p>
                <p className="text-xs text-gray-500">{userInfo.maskedEmail}</p>
              </div>
            </div>
            {method === 'email' && <CheckCircle2 className="h-5 w-5 text-[#c75b12]" />}
          </button>

          <button
            onClick={() => setMethod('phone')}
            disabled={!userInfo.hasPhone}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between ${!userInfo.hasPhone ? 'opacity-50 cursor-not-allowed' : method === 'phone' ? 'border-[#c75b12] bg-[#c75b12]/5' : 'border-gray-100 bg-white hover:border-gray-200'}`}
          >
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-gray-50"><Phone className="h-5 w-5 text-[#c75b12]" /></div>
              <div>
                <p className="font-bold text-[#0a2240]">Phone</p>
                <p className="text-xs text-gray-500">{userInfo.maskedPhone || "Not available"}</p>
              </div>
            </div>
            {method === 'phone' && <CheckCircle2 className="h-5 w-5 text-[#c75b12]" />}
          </button>

          <button
            onClick={handleSendCode}
            disabled={loading}
            className="mt-6 group flex w-full items-center justify-center gap-2 rounded-xl bg-[#c75b12] py-3.5 font-bold text-white shadow-lg hover:bg-[#a84a0e] transition-all disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Send Code <ArrowRight className="h-4 w-4" /></>}
          </button>
          
          <button onClick={() => setStep(1)} className="w-full text-center text-sm font-semibold text-gray-500 hover:text-gray-700 decoration-gray-400 hover:underline underline-offset-4">
            Back to search
          </button>
        </div>
      )}

      {/* STEP 3: VERIFY & RESET */}
      {step === 3 && (
        <form onSubmit={handleReset} className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Code expires in:</span>
              </div>
              <span className={`text-lg font-bold ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-blue-800'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#0a2240]">6-Digit Code</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 text-center text-lg font-bold tracking-[0.5em] focus:border-[#c75b12] focus:ring-1 focus:ring-[#c75b12] outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#0a2240]">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm focus:border-[#c75b12] focus:ring-1 focus:ring-[#c75b12] outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#0a2240]">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm focus:border-[#c75b12] focus:ring-1 focus:ring-[#c75b12] outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || timeLeft === 0}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#c75b12] py-3.5 font-bold text-white shadow-lg hover:bg-[#a84a0e] transition-all disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Reset Password <ArrowRight className="h-4 w-4" /></>}
          </button>

          <div className="text-center">
            <button 
              type="button"
              onClick={handleSendCode} 
              className="text-sm font-semibold text-[#c75b12] hover:text-[#a84a0e] underline decoration-[#c75b12]/30 underline-offset-4"
            >
              Resend code
            </button>
          </div>
        </form>
      )}

      {/* STEP 4: SUCCESS */}
      {step === 4 && (
        <div className="text-center space-y-6 py-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <p className="text-gray-600 leading-relaxed">
            Your password has been changed successfully. You can now use your new password to sign in to the portal.
          </p>
          <a
            href="/login"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0a2240] py-3.5 font-bold text-white shadow-lg hover:bg-[#1a3a5a] transition-all"
          >
            Go to Login <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  );
}
