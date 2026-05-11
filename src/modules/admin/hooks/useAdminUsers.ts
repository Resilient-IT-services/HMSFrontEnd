'use client';

import { useState, useEffect, useCallback } from 'react';
import { userService } from '@/services/userService';
import { Role, UserSummaryDTO } from '@/types/api';
import { useDebounce } from '@/hooks/useDebounce';

export const useAdminUsers = () => {
  const [users, setUsers] = useState<(UserSummaryDTO & { roles: Role[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const userRes = await userService.listUsers(page, 20, debouncedSearch, roleFilter, activeFilter);
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
  }, [page, debouncedSearch, roleFilter, activeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, roleFilter, activeFilter]);

  return {
    users,
    loading,
    searchTerm,
    setSearchTerm,
    page,
    setPage,
    totalElements,
    roleFilter,
    setRoleFilter,
    activeFilter,
    setActiveFilter,
    refresh: fetchData
  };
};
