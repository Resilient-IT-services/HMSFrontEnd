'use client';

import { useState, useEffect, useCallback } from 'react';
import { userService } from '@/services/userService';
import { Role, UserSummaryDTO } from '@/types/api';
import { useDebounce } from '@/hooks/useDebounce';
import { DEFAULT_PAGE_SIZE, DEFAULT_DEBOUNCE_MS } from '@/utils/constants';

export const useAdminUsers = () => {
  const [users, setUsers] = useState<(UserSummaryDTO & { roles: Role[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, DEFAULT_DEBOUNCE_MS);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const userRes = await userService.listUsers(page, pageSize, debouncedSearch, roleFilter, activeFilter);
      if (userRes.success && userRes.data) {
        const usersWithRoles = (userRes.data.content || []).map(u => {
          const allRoles = new Set<string>();
          if (u.memberships) {
            u.memberships.forEach((m: any) => {
              if (m.roles && Array.isArray(m.roles)) {
                m.roles.forEach((r: string) => allRoles.add(r));
              }
              if (m.roleAssignments) {
                m.roleAssignments.forEach((ra: any) => {
                  if (ra.roleCode) allRoles.add(ra.roleCode);
                });
              }
            });
          }
          if (u.superuser) allRoles.add('SUPER_ADMIN');
          return { ...u, roles: [...allRoles] as Role[] };
        });
        setUsers(usersWithRoles);
        setTotalElements(userRes.data.totalElements);
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, roleFilter, activeFilter]);

  useEffect(() => {
    const trigger = async () => {
      await fetchData();
    };
    void trigger();
  }, [fetchData]);

  const handleSearchTermChange = (term: string) => {
    setSearchTerm(term);
    setPage(0);
  };

  const handleRoleFilterChange = (role?: string) => {
    setRoleFilter(role);
    setPage(0);
  };

  const handleActiveFilterChange = (active?: boolean) => {
    setActiveFilter(active);
    setPage(0);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(0);
  };

  return {
    users,
    loading,
    searchTerm,
    setSearchTerm: handleSearchTermChange,
    page,
    setPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    totalElements,
    roleFilter,
    setRoleFilter: handleRoleFilterChange,
    activeFilter,
    setActiveFilter: handleActiveFilterChange,
    refresh: fetchData
  };
};
