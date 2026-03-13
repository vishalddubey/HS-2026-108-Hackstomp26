'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Heart, Wifi } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = () => {
    setEmail('demo@gramhealth.org');
    setPassword('demo1234');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-800 via-green-700 to-green-600">
      {/* Top decoration */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        {/* Logo */}
        <div className="mb-8 text-center animate-fade-in-scale">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
            <Heart className="text-white" size={40} fill="white" />
          </div>
          <h1 className="text-3xl font-bold text-white font-display">GramHealth AI</h1>
          <p className="text-green-200 mt-1 text-sm">Rural Healthcare Guidance System</p>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 animate-slide-in-up">
          <h2 className="text-xl font-bold text-gray-800 mb-1 font-display">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-6">Sign in to access the health dashboard</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input-field"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={demoLogin}
              className="btn-secondary w-full text-sm"
            >
              🧪 Use Demo Credentials
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">
              demo@gramhealth.org / demo1234
            </p>
          </div>
        </div>

        {/* Offline note */}
        <div className="mt-6 flex items-center gap-2 text-green-200 text-xs">
          <Wifi size={14} />
          <span>Works offline after first login</span>
        </div>
      </div>
    </div>
  );
}
