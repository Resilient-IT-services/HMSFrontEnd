
'use client';

import React, { useState } from 'react';
import { Shield, Database, ArrowRightLeft, CheckCircle, Lock, Key, Eye } from 'lucide-react';
import HelpDeskModal from '@/components/HelpDeskModal';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicy() {
    const router = useRouter();

    const [isHelpOpen, setIsHelpOpen] = useState(false);

    return (
        <>
            {/* ✅ CUSTOM HEADER */}
            <header className="relative z-10 w-full border-b border-[var(--primary)]/10 bg-[var(--surface)] bg-opacity-80 backdrop-blur-md px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">

                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-[var(--primary)] rounded-lg flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-2xl">medical_services</span>
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-[var(--primary)]">
                            HMS System
                        </h2>
                    </div>

                    <button
                        onClick={() => setIsHelpOpen(true)}
                        className="rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-bold text-white hover:bg-[var(--primary-hover)] transition-all"
                    >
                        Help Desk
                    </button>

                </div>
            </header>

            {/* ✅ MAIN UI */}
            <div className="min-h-screen bg-[var(--background)] py-10 px-4">

                <div className="max-w-4xl mx-auto">

                    {/* TITLE */}
                    <div className="mb-6">
                        <p className="text-sm text-[var(--primary)] font-semibold flex items-center gap-2">
                            <Shield size={16} /> LEGAL DOCUMENT
                        </p>

                        <h1 className="text-4xl font-bold mt-2 text-[var(--text-primary)]">
                            Privacy Policy
                        </h1>

                        <p className="text-[var(--text-secondary)] mt-2">
                            {/*Last Updated: October 24, 2024*/}
                        </p>

                        <div className="flex gap-3 mt-3">
              <span className="px-3 py-1 text-sm bg-[var(--surface)] rounded-full">
                HIPAA Compliant
              </span>
                            <span className="px-3 py-1 text-sm bg-[var(--surface)] rounded-full">
                252-bit Encryption
              </span>
                        </div>
                    </div>

                    {/* CARD */}
                    <div className="bg-[var(--surface)] rounded-xl shadow-md overflow-hidden border border-[var(--primary)]/10">

                        {/* NOTICE */}
                        <div className="bg-[var(--primary)]/10 p-6 text-[var(--text-secondary)]">
                            At HMS System, we recognize the critical importance of privacy in healthcare.
                        </div>

                        <div className="p-6 space-y-8">

                            {/* DATA */}
                            <section>
                                <h2 className="text-xl font-semibold flex items-center gap-2 mb-3 text-[var(--text-primary)]">
                                    <Database className="text-[var(--primary)]" /> Data Collection
                                </h2>

                                <ul className="space-y-2 text-[var(--text-secondary)]">
                                    <li>• Professional Credentials</li>
                                    <li>• Patient Demographics</li>
                                    <li>• Technical Telemetry</li>
                                </ul>
                            </section>

                            {/* USE */}
                            <section>
                                <h2 className="text-xl font-semibold flex items-center gap-2 mb-3 text-[var(--text-primary)]">
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
                            </section>

                            {/* HIPAA */}
                            <section className="border-l-4 border-[var(--primary)] bg-[var(--background)] p-5 rounded-lg">
                                <h2 className="text-xl font-semibold flex items-center gap-2 mb-3 text-[var(--text-primary)]">
                                    <CheckCircle className="text-[var(--primary)]" /> HIPAA Compliance
                                </h2>

                                <ul className="space-y-2 text-[var(--text-secondary)]">
                                    <li>✔ Privacy Rule</li>
                                    <li>✔ Security Rule</li>
                                    <li>✔ Breach Notification</li>
                                </ul>
                            </section>

                            {/* SECURITY */}
                            <section>
                                <h2 className="text-xl font-semibold flex items-center gap-2 mb-4 text-[var(--text-primary)]">
                                    <Lock className="text-[var(--primary)]" /> Security Measures
                                </h2>

                                <div className="space-y-4">
                                    <div className="flex gap-3">
                                        <Key className="text-[var(--text-secondary)]" />
                                        <p>Encryption</p>
                                    </div>

                                    <div className="flex gap-3">
                                        <Shield className="text-[var(--text-secondary)]" />
                                        <p>MFA</p>
                                    </div>

                                    <div className="flex gap-3">
                                        <Eye className="text-[var(--text-secondary)]" />
                                        <p>Zero Knowledge</p>
                                    </div>
                                </div>
                            </section>

                            {/* BUTTONS */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => router.push('login')}
                                    className="bg-[var(--primary)] text-white px-5 py-2 rounded-lg hover:bg-[var(--primary-hover)]">
                                    Go to login
                                </button>

                                <button

                                    className="border border-[var(--primary)]/20 px-5 py-2 rounded-lg hover:bg-[var(--background)]">
                                    Download PDF
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
            <HelpDeskModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
            />   </>
    );
}