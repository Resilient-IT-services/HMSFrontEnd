'use client';

import React, { use } from 'react';
import { PatientProfile } from '@/modules/reception/pages/PatientProfile';

export default function PatientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PatientProfile id={id} />;
}
