'use client';

import React from 'react';
import {useRouter} from 'next/navigation';

const PrivacyPolicy = () => {
    const router = useRouter();

    return (
        <div className="min-h-screen flex flex-col">

            {/* HEADER */}
            <div
                style={{
                    background: "var(--surface)",
                    borderBottom: "1px solid var(--border)"
                }}
                className="py-8 px-6 text-center"
            >
                <h1
                    style={{color: "var(--primary)"}}
                    className="text-3xl font-bold"
                >
                    Privacy Policy
                </h1>

                <p
                    className="text-sm mt-2"
                    style={{color: "var(--text-secondary)"}}
                >
                    Last updated: 2026
                </p>
            </div>

            {/* CONTENT */}
            <div className="flex-1 flex justify-center px-4 py-10">
                <div style={{maxWidth: "42rem", width: "100%"}}>

                    <div className="card space-y-8">

                        {/* Section 1 */}
                        <section>
                            <h2
                                style={{color: "var(--primary)"}}
                                className="text-lg font-semibold mb-2"
                            >
                                1. Information We Collect
                            </h2>
                            <p style={{color: "var(--text-secondary)"}}>
                                We collect personal information such as your name, email, and
                                login credentials to provide secure access to the HMS system.
                            </p>
                        </section>

                        {/* Section 2 */}
                        <section>
                            <h2
                                style={{color: "var(--primary)"}}
                                className="text-lg font-semibold mb-2"
                            >
                                2. How We Use Your Data
                            </h2>
                            <p style={{color: "var(--text-secondary)"}}>
                                Your data is used to manage hospital operations, authenticate
                                users, and improve system performance and security.
                            </p>
                        </section>

                        {/* Section 3 */}
                        <section>
                            <h2
                                style={{color: "var(--primary)"}}
                                className="text-lg font-semibold mb-2"
                            >
                                3. Data Protection
                            </h2>
                            <p style={{color: "var(--text-secondary)"}}>
                                We use industry-standard encryption and security measures to
                                protect your information from unauthorized access.
                            </p>
                        </section>

                        {/* Section 4 */}
                        <section>
                            <h2
                                style={{color: "var(--primary)"}}
                                className="text-lg font-semibold mb-2"
                            >
                                4. Sharing of Information
                            </h2>
                            <p style={{color: "var(--text-secondary)"}}>
                                We do not sell or share your personal data with third parties
                                except when required by law or for system functionality.
                            </p>
                        </section>

                        {/* Section 5 */}
                        <section>
                            <h2
                                style={{color: "var(--primary)"}}
                                className="text-lg font-semibold mb-2"
                            >
                                5. Your Rights
                            </h2>
                            <p style={{color: "var(--text-secondary)"}}>
                                You have the right to access, update, or delete your personal
                                data by contacting our support team.
                            </p>
                        </section>

                        {/* CONTACT BOX */}
                        <div className="card" style={{background: "var(--background)"}}>
                            <h2
                                style={{color: "var(--primary)"}}
                                className="text-md font-semibold mb-3"
                            >
                                Contact Us
                            </h2>

                            <p
                                style={{color: "var(--text-secondary)"}}
                                className="text-sm"
                            >
                                📧 support@hms.com
                            </p>

                            <p
                                style={{color: "var(--text-secondary)"}}
                                className="text-sm"
                            >
                                📞 +91 9876543210
                            </p>
                        </div>
                        <div className="flex justify-start pt-4">
                            <button
                                onClick={() => router.push('/login')}
                                className="flex items-center gap-2 font-semibold hover:underline transition-all hover:-translate-x-1"
                                style={{color: "var(--primary)"}}
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
                className="text-center py-6 text-sm"
                style={{color: "var(--text-secondary)"}}
            >
                © 2026 HMS System. All rights reserved.
            </footer>
        </div>
    );
};

export default PrivacyPolicy;