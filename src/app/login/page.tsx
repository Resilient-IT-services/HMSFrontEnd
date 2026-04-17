'use client';

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, setError } from '@/state/authSlice';
import { authService } from '@/services/authService';
import { useRouter } from 'next/navigation';
import { FormField } from '@/components/ui/FormField';
import { Card } from '@/components/ui/Card';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const dispatch = useDispatch();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLocalError(null);

    try {
      const response = await authService.login(username, password);
      if (response.success && response.data) {
        dispatch(setUser(response.data));
        router.push(`/${response.data.role.toLowerCase()}/dashboard`);
      } else {
        setLocalError(response.message || 'Login failed');
      }
    } catch (err: any) {
      setLocalError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--primary)] items-center justify-center p-12 text-white">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-6">🏥 HMS System</h1>
          <p className="text-xl opacity-90">
            A comprehensive Hospital Management System designed for efficiency and care.
          </p>
          <div className="mt-12 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 rounded-full bg-white"></div>
              <span>Role-driven operational workflows</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 rounded-full bg-white"></div>
              <span>Real-time patient management</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 rounded-full bg-white"></div>
              <span>Secure and compliant architecture</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[var(--background)] p-8">
        <div className="w-full max-w-md">
          <Card className="shadow-xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">Welcome Back</h2>
              <p className="text-[var(--text-secondary)]">Please enter your credentials to login</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField label="Username" required>
                <input
                  type="text"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                />
              </FormField>

              <FormField label="Password" required>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </FormField>

              {localError && (
                <div className="p-3 bg-[var(--error)] bg-opacity-10 text-[var(--error)] text-sm rounded-md border border-[var(--error)] border-opacity-20">
                  {localError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 flex items-center justify-center"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="text-center mt-4">
                <a href="#" className="text-sm text-[var(--primary)] hover:underline">
                  Forgot your password?
                </a>
              </div>
            </form>
          </Card>
          
          <p className="text-center mt-8 text-sm text-[var(--text-secondary)]">
            &copy; 2026 HMS System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
