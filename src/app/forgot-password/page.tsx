"use client";

import { useRouter } from "next/navigation";
import { Mail, Lock, ShieldCheck } from "lucide-react";
import HelpDeskModal from '@/components/HelpDeskModal';

import React, {useState} from "react";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#f3f4f6] flex flex-col justify-between">

            {/* Header */}
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
            <div className="w-full bg-yellow-50 border-b border-yellow-200 text-center py-2 text-sm text-yellow-700">
                🚧 This page is currently under development. Some features may not work as expected.
            </div>
            {/* Center */}
            <div className="flex justify-center items-center flex-1 px-4">

                <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden">

                    {/* Top border */}
                    <div className="h-1.5 bg-orange-600"></div>

                    <div className="px-8 py-10 text-center">

                        {/* Icon */}
                        <div className="flex justify-center mb-4 text-orange-600">
                            <Lock size={28} />
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-semibold text-gray-800">
                            Forgot Password?
                        </h2>

                        {/* Subtitle */}
                        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                            Enter your verified email address and we will send you instructions
                            to reset your password.
                        </p>

                        {/* Input */}
                        <div className="text-left mt-6">
                            <label className="text-sm font-medium text-gray-700">
                                Email Address
                            </label>

                            <div className="mt-2 flex items-center bg-gray-100 rounded-lg px-3 py-2">
                                <Mail size={16} className="text-gray-400 mr-2" />
                                <input
                                    type="email"
                                    placeholder="dr.smith@hms-system.com"
                                    className="bg-transparent outline-none text-sm w-full text-gray-600"
                                />
                            </div>
                        </div>

                        {/* Button */}
                        <button className="w-full mt-6 bg-orange-700 hover:bg-orange-800 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-md transition">
                            Reset Password →
                        </button>

                        {/* Back */}
                        <div className="mt-4">
                            <button
                                onClick={() => router.push("/login")}
                                className="text-orange-600 text-sm flex items-center justify-center gap-1 hover:underline"
                            >
                                ← Back to Login
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="border-t mt-6 pt-4 flex justify-between text-xs text-gray-500">

                            <div className="flex items-center gap-1">
                                <ShieldCheck size={14} />
                                HIPAA Compliant
                            </div>

                            <div className="flex items-center gap-1">
                                🔒 256-bit Encryption
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Text */}
            <div className="text-center text-sm text-gray-500 mb-6">
                Need immediate assistance?{" "}
                <span className="text-orange-600 cursor-pointer font-medium">
          Contact HMS Support
        </span>
            </div>


            <HelpDeskModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
            />
        </div>

    );
}