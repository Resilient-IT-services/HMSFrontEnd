import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SessionGrid } from './SessionGrid';
import { SessionInfo } from '@/types/api';

const mockAvailability: SessionInfo[] = [
  { 
    id: 's1', 
    startTime: '09:00', 
    endTime: '12:00', 
    available: true, 
    currentPatients: 0, 
    maxPatients: 10,
    dayOfWeek: 'MONDAY',
    sessionType: 'OPD',
    roomNumber: '101'
  },
  { 
    id: 's2', 
    startTime: '14:00', 
    endTime: '17:00', 
    available: false, 
    currentPatients: 10, 
    maxPatients: 10,
    dayOfWeek: 'MONDAY',
    sessionType: 'OPD',
    roomNumber: '101'
  },
] as any;

const dateOptions = [
  { iso: '2026-05-10', label: 'Today', active: true },
  { iso: '2026-05-11', label: 'Tomorrow', active: false },
];

describe('SessionGrid', () => {
  const defaultProps = {
    fetchingAvailability: false,
    selectedDoctor: { userId: '1', fullName: 'Dr. Smith' } as any,
    availability: mockAvailability,
    selectedSession: null,
    setSelectedSession: vi.fn(),
    onSessionSelect: vi.fn(),
    selectedDate: '2026-05-10',
    setSelectedDate: vi.fn(),
    dateOptions: dateOptions,
    formatLocalTime: (t: string) => t,
    editableTime: '09:30',
    setEditableTime: vi.fn()
  };

  it('renders date options', () => {
    render(<SessionGrid {...defaultProps} />);
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('renders available and full sessions', () => {
    render(<SessionGrid {...defaultProps} />);
    expect(screen.getByText('09:00 - 12:00')).toBeInTheDocument();
    expect(screen.getByText('14:00 - 17:00')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Full')).toBeInTheDocument();
  });

  it('handles session selection', () => {
    const onSessionSelect = vi.fn();
    render(<SessionGrid {...defaultProps} onSessionSelect={onSessionSelect} />);
    fireEvent.click(screen.getByText('09:00 - 12:00'));
    expect(onSessionSelect).toHaveBeenCalledWith(mockAvailability[0]);
  });

  it('renders loading state', () => {
    render(<SessionGrid {...defaultProps} fetchingAvailability={true} />);
    expect(screen.getByText(/Querying sessions.../i)).toBeInTheDocument();
  });

  it('renders no doctor state', () => {
    render(<SessionGrid {...defaultProps} selectedDoctor={null} />);
    expect(screen.getByText(/Select doctor first/i)).toBeInTheDocument();
  });

  it('renders empty availability state', () => {
    render(<SessionGrid {...defaultProps} availability={[]} />);
    expect(screen.getByText(/No active sessions/i)).toBeInTheDocument();
  });

  it('shows warning when no matching session for editable time', () => {
    render(<SessionGrid {...defaultProps} editableTime="13:00" />);
    expect(screen.getByText(/No available slot found for the selected appointment time./i)).toBeInTheDocument();
  });

  it('shows correct session name for different times', () => {
    const { rerender } = render(<SessionGrid {...defaultProps} editableTime="09:00" />);
    expect(screen.getByText('Morning')).toBeInTheDocument();

    rerender(<SessionGrid {...defaultProps} editableTime="14:00" />);
    expect(screen.getByText('Afternoon')).toBeInTheDocument();

    rerender(<SessionGrid {...defaultProps} editableTime="19:00" />);
    expect(screen.getByText('Evening')).toBeInTheDocument();
  });
});
