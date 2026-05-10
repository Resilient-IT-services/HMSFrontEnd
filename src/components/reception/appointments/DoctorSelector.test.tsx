import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DoctorSelector } from './DoctorSelector';
import { DoctorStaffResponse } from '@/types/api';

const mockDoctors: DoctorStaffResponse[] = [
  { userId: '1', fullName: 'Dr. Smith', specialization: 'General', departmentName: 'OPD' },
  { userId: '2', fullName: 'Dr. Jones', specialization: 'Cardiology', departmentName: 'Cardio' },
] as any;

describe('DoctorSelector', () => {
  it('renders loading state', () => {
    render(
      <DoctorSelector 
        doctors={[]} 
        selectedDoctor={null} 
        onSelectDoctor={() => {}} 
        loading={true} 
      />
    );
    expect(screen.getByText(/Loading physicians.../i)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(
      <DoctorSelector 
        doctors={[]} 
        selectedDoctor={null} 
        onSelectDoctor={() => {}} 
        loading={false} 
      />
    );
    expect(screen.getByText(/No physicians found./i)).toBeInTheDocument();
  });

  it('renders doctor list and handles selection', () => {
    const onSelectDoctor = vi.fn();
    render(
      <DoctorSelector 
        doctors={mockDoctors} 
        selectedDoctor={null} 
        onSelectDoctor={onSelectDoctor} 
        loading={false} 
      />
    );

    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('Dr. Jones')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Dr. Smith'));
    expect(onSelectDoctor).toHaveBeenCalledWith(mockDoctors[0]);
  });

  it('highlights selected doctor', () => {
    render(
      <DoctorSelector 
        doctors={mockDoctors} 
        selectedDoctor={mockDoctors[0]} 
        onSelectDoctor={() => {}} 
        loading={false} 
      />
    );

    const doctorCard = screen.getByText('Dr. Smith').closest('div');
    // We check for some class that indicates selection, e.g. bg-orange-50
    expect(doctorCard?.parentElement).toHaveClass('bg-orange-50');
  });
});
