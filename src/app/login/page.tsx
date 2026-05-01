'use client';

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, clearAuthSession } from '@/state/authSlice';
import { authService } from '@/services/authService';
import HelpDeskModal from '@/components/HelpDeskModal';
const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLocalError(null);

    try {
      const loginResponse = await authService.login(username, password);
      if (loginResponse.success) {
        // Clear previous session selection (role/hospital)
        dispatch(clearAuthSession());
        
        // Fetch user profile after login sets cookie
        const meResponse = await authService.me();
        if (meResponse.success && meResponse.data) {
          dispatch(setUser(meResponse.data));
          // AuthProvider will now handle redirection based on roles/hospitals
        } else {
          setLocalError('Failed to fetch user profile');
        }
      } else {
        setLocalError(loginResponse.error?.message || 'Login failed');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      setLocalError(err.response?.data?.error?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-display bg-[var(--background)] text-[var(--text-primary)] min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Decoration */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBsPQrpZJU1PL-cun16k3MT1Fz9Z4JmkDuuOBVqgc3eU6VuS7V6VwBZV53kNT10EPRX7ArZWsqrcgJDQEGzeXyVnoPHgaBcjbBl__KsuGKwOBnbWt1N-SvaNvFcmUGuEJxJHoyr3NL5B-v8aI_k2s_3PMFihbPLPkHCBfxSZUQdzlSqLHG9OYua-CvHgmxWhG1FEGS6nfCiibJritansQGkuy1iOWeQFx5SLfnTdzvYUl15IiV8t6_JVW6ohNNomZfSxb__jqD4YSxR')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/20 to-transparent"></div>
      </div>

      {/* Navigation */}
      <header className="relative z-10 w-full border-b border-[var(--primary)]/10 bg-[var(--surface)] bg-opacity-80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-[var(--primary)] rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-2xl">medical_services</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--primary)]">CareFlow</h2>
          </div>
          <div className="flex items-center gap-4">

            <button
                onClick={() => setIsHelpOpen(true)}
                className="flex items-center justify-center rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-bold text-white hover:bg-[var(--primary-hover)] transition-all shadow-sm"
            >
              Help Desk
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[480px]">
          {/* Login Card */}
          <div className="bg-[var(--surface)] shadow-2xl rounded-xl overflow-hidden border border-[var(--primary)]/5">
            {/* Card Header Image */}
            <div className="h-32 bg-[var(--primary)] relative overflow-hidden">
              <div 
                className="absolute inset-0 opacity-30 bg-cover bg-center" 
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA5z4sfZTPHNtf_A89G_kSaJ7AU5kI_qz2qEMkhU8rKPC_6SjNh8XYcpyXoyWy7GoGGD0dxuUeTvjQLvxpegEXZZhbHAXqEGNg1XC81vracaXdMmBqM61ef7vUKOiLBBNVzn2-1W31oTzsJ5Vq5lIZFi0L7zsIMypLBU4FHX1mHjouXfSkNfaQ9zfEDYFU4yI-2rj5ht-DfO85Hl2ZjRhhHf4v9WncHQgskt9lORG24AffxZzzz5aFJ1J3J54wKCtGoIpEMmn7TUbvi')" }}
              ></div>
              <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-[var(--primary)] to-transparent">
                <h1 className="text-2xl font-black text-white leading-tight">Welcome Back</h1>
                <p className="text-white/80 text-sm">Portal Access for Healthcare Professionals</p>
              </div>
            </div>

            {/* Form */}
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--text-primary)] ml-1" htmlFor="identifier">
                    Username
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-xl">person</span>
                    <input 
                      className="w-full pl-12 pr-4 py-3.5 bg-[var(--background)] border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" 
                      id="identifier" 
                      placeholder="Enter your username" 
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-sm font-semibold text-[var(--text-primary)]" htmlFor="password">
                      Password
                    </label>
                    <a className="text-xs font-bold text-[var(--primary)] hover:underline" href="/forgot-password">Forgot Password?</a>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-xl">lock</span>
                    <input 
                      className="w-full pl-12 pr-12 py-3.5 bg-[var(--background)] border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" 
                      id="password" 
                      placeholder="••••••••" 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {localError && (
                  <div className="p-3 bg-[var(--error-light)] text-[var(--error)] text-sm rounded-md border border-[var(--error)]/20">
                    {localError}
                  </div>
                )}

                {/* Sign In Button */}
                <button 
                  className="w-full py-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-lg shadow-lg shadow-[var(--primary)]/20 transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Sign In to Dashboard
                      <span className="material-symbols-outlined">login</span>
                    </>
                  )}
                </button>
              </form>
              <HelpDeskModal
                  isOpen={isHelpOpen}
                  onClose={() => setIsHelpOpen(false)}
              />
              {/* Footer Info */}
              <div className="mt-8 pt-6 border-t border-[var(--border)] text-center">
                <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest font-bold mb-4">Authorized Access Only</p>
                <div className="flex justify-center gap-6">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <span className="material-symbols-outlined text-sm">verified_user</span>
                    HIPAA Compliant
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <span className="material-symbols-outlined text-sm">encrypted</span>
                    256-bit Encryption
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Language/Links Footer */}
          <div className="mt-8 flex justify-between items-center px-2">
            <div className="flex gap-4">
              <a className="text-xs text-[var(--text-secondary)] hover:text-[var(--primary)]" href="/privacy">Privacy Policy</a>
            </div>
            <a href="/terms" className="text-xs text-[var(--text-secondary)] hover:text-[var(--primary)]">
              Terms of Service
            </a>
          </div>
        </div>
      </main>

      {/* Footer Copyright */}
      <footer className="relative z-10 py-6 text-center text-sm text-[var(--text-secondary)]">
        © 2026 CareFlow <span className="text-[10px] opacity-70">by Resilient</span>. All rights reserved.
      </footer>
    </div>
  );
};

export default LoginPage;
