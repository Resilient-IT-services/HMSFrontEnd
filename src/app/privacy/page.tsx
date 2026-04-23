'use client';

import React, { useState } from 'react';
import { Shield, Database, ArrowRightLeft, CheckCircle, Lock, Key, Eye } from 'lucide-react';
import HelpDeskModal from '@/components/HelpDeskModal';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicy() {
    const router = useRouter();
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">

            {/* ✅ HEADER (TERMS STYLE) */}
            <header className="relative z-10 w-full border-b border-[var(--primary)]/10 bg-[var(--surface)] bg-opacity-80 backdrop-blur-md px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">

                    {/* LEFT */}
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-[var(--primary)] rounded-lg flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-2xl">medical_services</span>
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-[var(--primary)]">
                            HMS System
                        </h2>
                    </div>

                    {/* RIGHT (LIKE TERMS) */}
                    <div className="flex items-center gap-3">

                        {/* 🔙 Back to Login */}
                        <button
                            onClick={() => router.push("/login")}
                            className="border border-[var(--primary)] text-[var(--primary)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--primary)] hover:text-white transition-all"
                        >
                            ← Back to Login
                        </button>

                        {/* Help Desk */}
                        <button
                            onClick={() => setIsHelpOpen(true)}
                            className="rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-bold text-white hover:bg-[var(--primary-hover)] transition-all"
                        >
                            Help Desk
                        </button>

                    </div>
                </div>
            </header>

            {/* MAIN */}
            <main className="max-w-4xl mx-auto py-10 px-4 space-y-6">

                {/* TOP CARD */}
                <div className="rounded-lg overflow-hidden shadow-sm border bg-[var(--surface)]">
                    <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] text-white p-6">
                        <h1 className="text-2xl font-semibold">Privacy Policy</h1>
                        <p className="text-xs mt-1">
                            LAST UPDATED: OCTOBER 24, 2024
                        </p>
                        <p className="mt-4 text-sm">
                            We are committed to protecting patient data and ensuring secure healthcare operations.
                        </p>
                    </div>

                    <div className="flex justify-between items-center p-4 text-sm">
                        <div className="flex gap-3">
                            <span className="bg-[var(--background)] text-[var(--text-primary)] px-3 py-1 rounded-full text-xs">
                                HIPAA Compliant
                            </span>
                            <span className="bg-[var(--background)] text-[var(--text-primary)] px-3 py-1 rounded-full text-xs">
                                256-bit Encryption
                            </span>
                        </div>
                        <span className="text-[var(--text-secondary)] text-xs">Version 1.0.0</span>
                    </div>
                </div>

                {/* DATA */}
                <div className="bg-[var(--surface)] border rounded-lg p-6 shadow-sm">
                    <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Database className="text-[var(--primary)]" /> Data Collection
                    </h2>
                    <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                        <li>• Professional Credentials</li>
                        <li>• Patient Demographics</li>
                        <li>• Technical Telemetry</li>
                    </ul>
                </div>

                {/* USE */}
                <div className="bg-[var(--surface)] border rounded-lg p-6 shadow-sm">
                    <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <ArrowRightLeft className="text-[var(--primary)]" /> Use of Information
                    </h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        {["Care Coordination","Regulatory Compliance","Audit Trails","System Integrity"]
                            .map((item, i) => (
                                <div key={i} className="bg-[var(--background)] p-4 rounded-lg text-sm">
                                    {item}
                                </div>
                            ))}
                    </div>
                </div>

                {/* HIPAA */}
                <div className="bg-[var(--surface)] border rounded-lg p-6 shadow-sm">
                    <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <CheckCircle className="text-[var(--primary)]" /> HIPAA Compliance
                    </h2>

                    <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                        <li>✔ Privacy Rule</li>
                        <li>✔ Security Rule</li>
                        <li>✔ Breach Notification</li>
                    </ul>
                </div>

                {/* SECURITY */}
                <div className="bg-[var(--surface)] border rounded-lg p-6 shadow-sm">
                    <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Lock className="text-[var(--primary)]" /> Security Measures
                    </h2>

                    <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                        <div className="flex gap-3"><Key /> Encryption</div>
                        <div className="flex gap-3"><Shield /> MFA</div>
                        <div className="flex gap-3"><Eye /> Zero Knowledge</div>
                    </div>
                </div>

                {/* ✅ BUTTONS (TERMS STYLE DOWNLOAD) */}
                <div className="bg-[var(--surface)] border rounded-lg p-4 flex justify-between items-center shadow-sm">
                    <div>
                        <p className="font-medium text-sm">Need a physical copy?</p>
                        <p className="text-xs text-[var(--text-secondary)]">
                            Download the PDF version of this Privacy Policy.
                        </p>
                    </div>

                    <button className="border border-[var(--primary)] text-[var(--primary)] px-4 py-2 rounded-md text-sm hover:bg-[var(--background)]">
                        Download PDF ↓
                    </button>
                </div>

            </main>

            <HelpDeskModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
            />
        </div>
    );
}