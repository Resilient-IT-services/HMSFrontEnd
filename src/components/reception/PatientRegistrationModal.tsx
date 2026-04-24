'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { patientService } from '@/services/patientService';
import { CreatePatientRequest, Gender, PatientResponse } from '@/types/api';
import { MapPin, Phone } from 'lucide-react';

interface PatientRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (patient?: PatientResponse) => void;
}

export const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({
                                                                                      isOpen,
                                                                                      onClose,
                                                                                      onSuccess,
                                                                                  }) => {
    const [formData, setFormData] = useState<CreatePatientRequest>({
        fullName: '',
        gender: 'MALE',
        dob: '',
        phone: '',
        address: ''
    });

    const [loading, setLoading] = useState(false);
    const [age, setAge] = useState<number | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const calculateAge = (dob: string) => {
        if (!dob) return null;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const handleDOBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData({ ...formData, dob: value });
        setAge(calculateAge(value));
    };

    const parseFlexibleDate = (input: string) => {
        const clean = input.replace(/\D/g, '');
        let day, month, year;

        if (clean.length === 6) {
            day = clean.slice(0, 2);
            month = clean.slice(2, 4);
            year = clean.slice(4, 6);
            const currentYear = new Date().getFullYear() % 100;
            year = parseInt(year) > currentYear ? `19${year}` : `20${year}`;
        } else if (clean.length === 8) {
            day = clean.slice(0, 2);
            month = clean.slice(2, 4);
            year = clean.slice(4, 8);
        } else {
            return null;
        }

        const d = parseInt(day);
        const m = parseInt(month);
        const y = parseInt(year);

        if (d > 0 && d <= 31 && m > 0 && m <= 12 && y > 1900 && y <= new Date().getFullYear()) {
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return null;
    };

    const handleDOBBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const parsed = parseFlexibleDate(e.target.value);
        if (parsed) {
            setFormData({ ...formData, dob: parsed });
            setAge(calculateAge(parsed));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        if (!formData.dob) {
            newErrors.dob = 'Date of birth is required';
        } else {
            const dobDate = new Date(formData.dob);
            const today = new Date();

            if (dobDate > today) {
                newErrors.dob = 'DOB cannot be in future';
            }

            const calculatedAge = calculateAge(formData.dob);
            if (calculatedAge !== null && (calculatedAge < 0 || calculatedAge > 120)) {
                newErrors.dob = 'Invalid age';
            }
        }

        const phoneRegex = /^[6-9]\d{9}$/;
        const cleanedPhone = formData.phone.replace(/\D/g, '');

        if (!cleanedPhone) {
            newErrors.phone = 'Phone number is required';
        } else if (!phoneRegex.test(cleanedPhone)) {
            newErrors.phone = 'Enter valid 10-digit phone number';
        }

        if (!formData.address.trim()) {
            newErrors.address = 'Address is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setLoading(true);
            const res = await patientService.create(formData);
            if (res.success && res.data) {
                onSuccess(res.data);
                onClose();
                setFormData({ fullName: '', gender: 'MALE', dob: '', phone: '', address: '' });
                setAge(null);
                setErrors({});
            }
        } catch (error) {
            console.error('Registration failed', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Patient Registration">
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[var(--primary)] border-b border-[var(--border)] pb-2 mb-4">
                        <span className="material-symbols-outlined text-xl">badge</span>
                        <h3 className="font-bold uppercase tracking-wider text-xs">Personal Information</h3>
                    </div>

                    <FormField label="Full Name" required>
                        <input
                            className="form-input"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="e.g. John Doe"
                        />
                        {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName}</p>}
                    </FormField>

                    <div className="grid grid-cols-2 gap-4">

                        <FormField label="Gender" required>
                            <select
                                className="form-input"
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                            >
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </FormField>

                        <FormField label="Date of Birth" required>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="form-input pr-16"
                                    value={formData.dob}
                                    onChange={handleDOBChange}
                                    onBlur={handleDOBBlur}
                                    placeholder="YYYY-MM-DD"
                                />
                                {age !== null && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black bg-[var(--primary-light)] text-[var(--primary)] px-2 py-1 rounded">
                    {age} YRS
                  </span>
                                )}
                            </div>
                            {errors.dob && <p className="text-red-500 text-xs">{errors.dob}</p>}
                        </FormField>
                    </div>

                    <FormField label="Phone Number" required>
                        <div className="relative">
                            <Phone className="absolute left-0 top-1/2 -translate-y-1/2 size-4 text-[var(--text-secondary)]" />
                            <input
                                className="form-input pl-10"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="e.g. 9876543210"
                            />
                        </div>
                        {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
                    </FormField>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[var(--primary)] border-b border-[var(--border)] pb-2 mb-4">
                        <span className="material-symbols-outlined text-xl">location_on</span>
                        <h3 className="font-bold uppercase tracking-wider text-xs">Residential Address</h3>
                    </div>

                    <FormField label="Full Address" required>
                        <div className="relative">
                            <MapPin className="absolute left-0 top-4 size-4 text-[var(--text-secondary)]" />
                            <textarea
                                className="form-input pl-10 min-h-[100px] resize-none"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Street, City, State, ZIP..."
                            />
                        </div>
                        {errors.address && <p className="text-red-500 text-xs">{errors.address}</p>}
                    </FormField>
                </div>

                <div className="pt-4 flex gap-3 sticky bottom-0 bg-[var(--surface)] py-2 border-t border-[var(--border)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--background)] rounded-xl transition-all"
                    >
                        Discard Draft
                    </button>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 btn-primary flex items-center justify-center gap-2"
                    >
                        {loading ? 'Registering...' : (
                            <>
                                <span>Register Patient</span>
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                            </>
                        )}
                    </button>
                </div>

            </form>
        </Modal>
    );
};