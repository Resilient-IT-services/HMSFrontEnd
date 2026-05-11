'use client';

import { redirect } from 'next/navigation';

export const DoctorLandingPage = () => {
  redirect('/doctor/dashboard');
  return null;
};
