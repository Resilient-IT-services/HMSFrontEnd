import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Card } from './Card';
import { FormField } from './FormField';
import { Table } from './Table';
import { Modal } from './Modal';
import MainLayout from './MainLayout';

// Mock components that use Redux or Next.js hooks
vi.mock('./Sidebar', () => ({ default: () => <div data-testid="sidebar">Sidebar</div> }));
vi.mock('./Topbar', () => ({ default: ({ title }: any) => <div data-testid="topbar">{title}</div> }));

describe('UI Components', () => {
  describe('MainLayout', () => {
    it('renders sidebar, topbar and children', () => {
      render(<MainLayout title="Dashboard"><div>Content</div></MainLayout>);
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('topbar')).toHaveTextContent('Dashboard');
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Modal', () => {
    it('renders when open', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Modal Title">
          <div>Modal Content</div>
        </Modal>
      );
      expect(screen.getByText('Modal Title')).toBeInTheDocument();
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<Modal isOpen={false} onClose={vi.fn()} title="Title">Content</Modal>);
      expect(screen.queryByText('Title')).not.toBeInTheDocument();
    });

    it('calls onClose when close button clicked', () => {
      const onClose = vi.fn();
      render(<Modal isOpen={true} onClose={onClose} title="Title">Content</Modal>);
      fireEvent.click(screen.getByText('close'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Card', () => {
    it('renders title and children', () => {
      render(<Card title="Test Title"><div>Test Content</div></Card>);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
      render(<Card title="Icon Card" icon="home" />);
      expect(screen.getByText('home')).toHaveClass('material-symbols-outlined');
    });
  });

  describe('FormField', () => {
    it('renders label and children', () => {
      render(
        <FormField label="Username">
          <input data-testid="test-input" />
        </FormField>
      );
      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByTestId('test-input')).toBeInTheDocument();
    });

    it('shows required asterisk when required', () => {
      render(<FormField label="Required" required><input /></FormField>);
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('Table', () => {
    const columns = [
      { header: 'Name', accessor: (row: any) => row.name },
      { header: 'Age', accessor: (row: any) => row.age },
    ];
    const data = [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }];

    it('renders headers and data', () => {
      render(<Table columns={columns} data={data} />);
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      render(<Table columns={columns} data={[]} isLoading={true} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });
});
