'use client';

import React, { useState } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const HelpDeskModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const [showForm, setShowForm] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-all">

            {/* Modal Card */}
            <div className="relative w-full max-w-lg bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--primary)]/10 overflow-hidden animate-[fadeIn_0.3s_ease]">

                {/* Top Gradient Header */}
                <div className="bg-gradient-to-r from-[var(--primary)] to-orange-200 p-6 text-white">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined">support_agent</span>
                        Support Center
                    </h2>
                    <p className="text-sm opacity-90 mt-1">
                        We are here to help you 24/7
                    </p>
                </div>

                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/80 hover:text-white"
                >
                    ✕
                </button>

                {/* Body */}
                <div className="p-6 space-y-5">

                    { showForm ? (
                        <>
                            {/* FORM */}
                            <div className="space-y-4">

                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    className="w-full px-4 py-3 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] outline-none"
                                />

                                <input
                                    type="email"
                                    placeholder="Your Email"
                                    className="w-full px-4 py-3 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)] outline-none"
                                />

                                <textarea
                                    placeholder="Describe your issue..."
                                    className="w-full px-4 py-3 rounded-lg bg-[var(--background)] border border-[var(--border)] h-28 focus:ring-2 focus:ring-[var(--primary)] outline-none"
                                />

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowForm(false)}
                                        className="w-1/2 border border-[var(--border)] py-3 rounded-lg font-semibold hover:bg-[var(--background)] transition"
                                    >
                                        Back
                                    </button>

                                    <button
                                        type="submit"
                                        className="w-1/2 bg-[var(--primary)] text-white py-3 rounded-lg font-bold hover:bg-[var(--primary-hover)] transition"
                                    >
                                        Submit
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Contact Cards */}
                            <div className="grid gap-4">

                                <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:shadow-md transition">
                                    <span className="material-symbols-outlined text-[var(--primary)] text-2xl">mail</span>
                                    <div>
                                        <p className="text-sm text-[var(--text-secondary)]">Email Support</p>
                                        <p className="font-semibold">support@hms.com</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:shadow-md transition">
                                    <span className="material-symbols-outlined text-[var(--primary)] text-2xl">call</span>
                                    <div>
                                        <p className="text-sm text-[var(--text-secondary)]">Call Us</p>
                                        <p className="font-semibold">+91 9876543210</p>
                                    </div>
                                </div>

                            </div>

                            <button
                                onClick={() => setShowForm(true)}
                                className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[var(--primary)]/20 transition"
                            >
                                <span className="material-symbols-outlined">confirmation_number</span>
                                Raise a Ticket
                            </button>
                            <div className="mt-2 p-5 rounded-2xl bg-[var(--background)] border border-[var(--border)] space-y-3">

                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[var(--primary)]">schedule</span>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Available: <span className="font-medium text-[var(--text-primary)]">24/7 Support</span>
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[var(--primary)]">bolt</span>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Response Time: <span className="font-medium text-[var(--text-primary)]">10-15 mins</span>
                                    </p>
                                </div>

                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
};

export default HelpDeskModal;
