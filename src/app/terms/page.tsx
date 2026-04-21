'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const TermsOfService = () => {
    const router = useRouter();

    return (
        <div className="min-h-screen flex flex-col bg-[var(--background)]">

            {/* HEADER */}
            <div
                className="py-6 text-center"
                style={{
                    background: "var(--surface)",
                    borderBottom: "1px solid var(--border)"
                }}
            >
                <h1
                    className="text-xl font-semibold"
                    style={{ color: "#d44d0f" }}
                >
                    Terms of Service
                </h1>

                <p
                    className="text-sm mt-1"
                    style={{ color: "var(--text-secondary)" }}
                >
                    Last updated: 2026
                </p>
            </div>

            {/* CONTENT */}
            <div className="flex-1 flex justify-center px-6 py-6">
                <div style={{ maxWidth: "64rem", width: "100%" }}>

                    <div
                        className="card space-y-6"
                        style={{ boxShadow: "0 8px 25px rgba(0,0,0,0.05)" }}
                    >

                        {/* SECTION */}
                        {[
                            {
                                title: "1. Acceptance of Terms",
                                text: "By accessing and using the HMS system, you agree to comply with these Terms of Service and all applicable laws and regulations."
                            },
                            {
                                title: "2. User Responsibilities",
                                text: "Users are responsible for maintaining the confidentiality of their login credentials and ensuring proper use of the system."
                            },
                            {
                                title: "3. System Usage",
                                text: "The system must be used only for authorized healthcare operations. Any misuse may lead to account suspension or termination."
                            },
                            {
                                title: "4. Data Security",
                                text: "We implement strict security measures, but users must also follow best practices to protect sensitive data."
                            },
                            {
                                title: "5. Account Termination",
                                text: "We reserve the right to suspend or terminate access if these terms are violated or suspicious activity is detected."
                            },
                            {
                                title: "6. Changes to Terms",
                                text: "These terms may be updated from time to time. Continued use of the system indicates acceptance of updated terms."
                            },
                            {
                                title: "7. Limitation of Liability",
                                text: "HMS is not liable for any indirect, incidental, or consequential damages arising from the use of the system."
                            },
                            {
                                title: "8. Compliance",
                                text: "Users must comply with all applicable healthcare regulations and data protection laws while using the system."
                            }
                        ].map((item, i) => (
                            <section
                                key={i}
                                className="pb-3 border-b border-[var(--border)] last:border-none"
                            >
                                <h2
                                    className="text-base font-semibold mb-1"
                                    style={{ color: "#d44d0f" }}
                                >
                                    {item.title}
                                </h2>

                                <p
                                    className="text-sm leading-relaxed"
                                    style={{ color: "var(--text-secondary)" }}
                                >
                                    {item.text}
                                </p>
                            </section>
                        ))}

                        {/* CONTACT BOX */}
                        <div
                            className="card"
                            style={{
                                background: "var(--background)",
                                border: "1px solid var(--border)",
                                boxShadow: "none"
                            }}
                        >
                            <h2
                                className="text-sm font-semibold mb-2"
                                style={{ color: "#d44d0f" }}
                            >
                                Contact Us
                            </h2>

                            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                📧 support@hms.com
                            </p>

                            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                📞 +91 9876543210
                            </p>
                        </div>

                        {/* BACK BUTTON */}
                        <div className="flex justify-start pt-2">
                            <button
                                onClick={() => router.push('/login')}
                                className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition"
                                style={{ color: "#d44d0f" }}
                            >
                <span className="material-symbols-outlined text-base">
                  arrow_back
                </span>
                                Back to Login
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <footer
                className="text-center py-4 text-xs"
                style={{ color: "var(--text-secondary)" }}
            >
                © 2026 HMS System. All rights reserved.
            </footer>

        </div>
    );
};

export default TermsOfService;