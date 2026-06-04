import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Table, Column } from './Table';

describe('Table Component - Advanced Features', () => {
  const columns: Column<{ name: string; age: number }>[] = [
    { header: 'Name', key: 'name', sortable: true, filterable: true },
    { header: 'Age', key: 'age', sortable: true },
  ];
  const data = [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 },
  ];

  it('renders sorting indicators for sortable columns', () => {
    render(<Table columns={columns} data={data} />);
    // Check for swap_vert icon which indicates sortable
    const sortIcons = screen.getAllByText('swap_vert');
    expect(sortIcons.length).toBe(2);
  });

  it('calls onSort when a header is clicked', () => {
    const onSort = vi.fn();
    render(<Table columns={columns} data={data} onSort={onSort} />);
    
    fireEvent.click(screen.getByText('Name'));
    expect(onSort).toHaveBeenCalledWith('name', 'asc');
  });

  it('renders inline filters when filterable is true', () => {
    const onFilter = vi.fn();
    render(<Table columns={columns} data={data} onFilter={onFilter} />);

    const filterInput = screen.getByPlaceholderText('Filter...');
    expect(filterInput).toBeInTheDocument();

    fireEvent.change(filterInput, { target: { value: 'Ali' } });
    expect(onFilter).toHaveBeenCalledWith('name', 'Ali');
  });

  it('renders select filter when filterType is select', () => {
    const selectColumns: Column<{ name: string; status: string }>[] = [
      { 
        header: 'Status', 
        key: 'status', 
        filterable: true, 
        filterType: 'select',
        filterOptions: [
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Inactive', value: 'INACTIVE' },
        ]
      },
    ];
    const onFilter = vi.fn();
    render(<Table columns={selectColumns} data={[]} onFilter={onFilter} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('All Status')).toBeInTheDocument();

    fireEvent.change(select, { target: { value: 'ACTIVE' } });
    expect(onFilter).toHaveBeenCalledWith('status', 'ACTIVE');
  });

  it('renders custom filter using renderFilter', () => {
    const customColumns: Column<{ name: string }>[] = [
      { 
        header: 'Name', 
        key: 'name', 
        filterable: true, 
        renderFilter: (onFilter) => (
          <button onClick={() => onFilter('name', 'custom')}>Custom Filter</button>
        )
      },
    ];
    const onFilter = vi.fn();
    render(<Table columns={customColumns} data={[]} onFilter={onFilter} />);

    const customButton = screen.getByText('Custom Filter');
    expect(customButton).toBeInTheDocument();

    fireEvent.click(customButton);
    expect(onFilter).toHaveBeenCalledWith('name', 'custom');
  });

  it('highlights sorted column', () => {
    const activeSort = { key: 'name', direction: 'asc' as const };
    render(<Table columns={columns} data={data} activeSort={activeSort} />);
    
    const upIcon = screen.getByText('arrow_upward');
    expect(upIcon).toBeInTheDocument();
    expect(upIcon).toHaveClass('text-orange-600');
  });
});
