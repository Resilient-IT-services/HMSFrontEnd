"use client";
import React, { useState } from 'react';
import HelpDeskModal from '@/components/HelpDeskModal';
import { useRouter } from 'next/navigation';


export default function TermsPage() {

    const router = useRouter();

    const [isHelpOpen, setIsHelpOpen] = useState(false);
    return (
        <div className="min-h-screen bg-[#f5f6f8] text-gray-800">
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

                    <div className="flex items-center gap-3">

                        {/* 🔙 Back to Login Button */}
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

            {/* Main */}
            <main className="max-w-4xl mx-auto py-10 px-4 space-y-6">
                {/* Top Card */}
                <div className="rounded-lg overflow-hidden shadow-sm border bg-white">
                    <div className="bg-gradient-to-r from-orange-700 to-orange-500 text-white p-6">
                        <h1 className="text-2xl font-semibold">Terms of Service</h1>
                        <p className="text-xs mt-1">
                            EFFECTIVE DATE: OCTOBER 24, 2024
                        </p>
                        <p className="mt-4 text-sm">
                            Please read these terms carefully before using the HMS System.
                            This agreement governs your access to and use of our clinical
                            management services.
                        </p>
                    </div>

                    <div className="flex justify-between items-center p-4 text-sm">
                        <div className="flex gap-3">
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
                HIPAA Compliant
              </span>
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs">
                256-bit Encryption
              </span>
                        </div>
                        <span className="text-gray-400 text-xs">Version 4.2.0</span>
                    </div>
                </div>

                {/* Section Component */}
                {sections.map((sec, i) => (
                    <div
                        key={i}
                        className="bg-white border rounded-lg p-6 shadow-sm"
                    >
                        <h2 className="font-semibold text-lg mb-3">
                            {i + 1} &nbsp; {sec.title}
                        </h2>
                        <div className="text-sm text-gray-600 space-y-2">
                            {sec.content}
                        </div>
                    </div>
                ))}

                {/* Highlight Card */}
                <div className="bg-white border rounded-lg p-8 text-center shadow-sm">
                    <div className="text-orange-600 text-xl mb-2">✔</div>
                    <h3 className="font-semibold text-lg">
                        Patient Privacy is Our Priority
                    </h3>
                    <p className="text-sm text-gray-500 mt-2">
                        Our systems are audited quarterly to ensure 100% compliance
                        with international healthcare data standards.
                    </p>
                </div>


            </main>


            <HelpDeskModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
            />
        </div>

    );
}

const sections = [
    {
        title: "Acceptance of Terms",
        content: (
            <>
                <p>
                    By accessing or using the HMS System ("Service"), you agree to be
                    bound by these Terms of Service and all applicable laws.
                </p>
                <p>
                    The materials contained in this Service are protected by
                    applicable copyright and trademark law.
                </p>
            </>
        ),
    },
    {
        title: "User Responsibilities",
        content: (
            <ul className="list-disc ml-5 space-y-1">
                <li>Maintain confidentiality of login credentials.</li>
                <li>Report security breaches immediately.</li>
                <li>Do not reverse engineer or misuse system.</li>
                <li>Use only for intended clinical purposes.</li>
            </ul>
        ),
    },
    {
        title: "Limitation of Liability",
        content: (
            <>
                <p>
                    HMS System shall not be liable for any damages including loss of
                    data or profit.
                </p>
                <p>
                    Clinical decisions remain responsibility of practitioners.
                </p>
            </>
        ),
    },
    {
        title: "Governing Law",
        content: (
            <>
                <p>
                    These terms are governed by applicable laws and disputes will be
                    resolved through arbitration.
                </p>

            </>
        ),
    },
];