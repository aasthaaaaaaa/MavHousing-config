'use client';

import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { authApi } from "@/lib/api"
import { User, Lock, ArrowRight, Loader2 } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [netId, setNetId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.post('/auth/login', {
        netId,
        password,
      });

      if (response.data && response.data.access_token) {
        login(response.data.access_token);
      } else {
        setError('Invalid response from server');
      }
    } catch (err: any) {
      if (err.response) {
        const msg = err.response.data?.message;
        const errorText = typeof msg === 'string'
          ? msg
          : Array.isArray(msg)
            ? msg.join(', ')
            : 'Login failed. Please check your NetID and password.';
        setError(errorText);
      } else {
        setError('Network error. Please check if the server is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className} {...props}>
      <div className="mb-8 text-center md:text-left landing-fade-in" style={{ animationDelay: '0.4s' }}>
        <h2 className="text-3xl font-bold tracking-tight text-[#0a2240]" style={{ fontFamily: 'var(--font-display)' }}>
          Welcome back
        </h2>
        <p className="mt-2 text-[15px] text-gray-500">
          Enter your UTA NetID and password to sign in.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2 landing-fade-in" style={{ animationDelay: '0.5s' }}>
            <label htmlFor="netId" className="text-sm font-semibold text-[#0a2240]">
              NetID
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="netId"
                type="text"
                placeholder="e.g. axm1234"
                required
                value={netId}
                onChange={(e) => setNetId(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 shadow-sm focus:border-[#c75b12] focus:outline-none focus:ring-1 focus:ring-[#c75b12] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2 landing-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-semibold text-[#0a2240]">
                Password
              </label>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 shadow-sm focus:border-[#c75b12] focus:outline-none focus:ring-1 focus:ring-[#c75b12] transition-colors"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100 flex items-start gap-2">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="landing-fade-in group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#c75b12] py-3.5 text-[15px] font-bold text-white shadow-lg transition-all hover:bg-[#a84a0e] hover:shadow-xl hover:shadow-[#c75b12]/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          style={{ animationDelay: '0.7s' }}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Sign In
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
