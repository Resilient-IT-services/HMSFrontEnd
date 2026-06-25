'use client';

import React from 'react';
import { PageSurface } from '@/components/ui/PageSurface';
import { IpdAdmissionsContent } from '@/modules/ipd/components/IpdAdmissionsContent';

export const IpdDashboard = () => {
  return (
    <PageSurface>
      <IpdAdmissionsContent />
    </PageSurface>
  );
};
