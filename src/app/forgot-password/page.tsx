'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const ForgotPassword = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">

            {/* BIG CARD */}
            <div
                className="w-full max-w-lg p-10 rounded-2xl bg-[var(--surface)] border border-[var(--border)]"
                style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}
            >

                {/* ICON */}
                <div className="flex justify-center mb-6">
                    <div className="w-14 h-14 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-2xl">
              lock_reset
            </span>
                    </div>
                </div>

                {/* TITLE */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
                        Reset Your Password
                    </h2>

                    <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
                        Enter your email to receive reset instructions
                    </p>
                </div>

                {!submitted ? (
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* EMAIL */}
                        <div>
                            <label className="form-label">Email Address</label>

                            <div className="relative mt-2">

                                {/* ICON */}
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-xl">
                  mail
                </span>

                                {/* INPUT */}
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full pl-12 pr-4 py-4 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                />
                            </div>
                        </div>

                        {/* BUTTON */}
                        <button
                            type="submit"
                            className="w-full py-4 text-sm font-bold text-white rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                            Send Reset Link
                            <span className="material-symbols-outlined">
                send
              </span>
                        </button>

                    </form>
                ) : (
                    <div className="text-center space-y-4">

                        <div className="text-4xl">📩</div>

                        <p className="text-base font-semibold" style={{ color: "var(--success)" }}>
                            Reset link sent successfully
                        </p>

                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            Check your email inbox
                        </p>

                    </div>
                )}

                {/* BACK */}
                <div className="text-center mt-6">
                    <button
                        onClick={() => router.push('/login')}
                        className="text-sm font-medium hover:underline"
                        style={{ color: "var(--primary)" }}
                    >
                        ← Back to Login
                    </button>
                </div>

            </div>

            {/* FOOTER */}
            <div className="absolute bottom-9 text-xs text-[var(--text-secondary)] text-center w-full">
              This feature is under development. More functionality coming soon.
            </div>

        </div>
    );
};

export default ForgotPassword;