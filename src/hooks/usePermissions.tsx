import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCustomAuth } from './useCustomAuth';

interface UserPermissions {
  permissions: string[];
  roleAssignments: any[];
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
}

export const usePermissions = (): UserPermissions => {
  const { user } = useCustomAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roleAssignments, setRoleAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    if (!user?.id) {
      setPermissions([]);
      setRoleAssignments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Check if user has admin role in custom_users (for custom authentication)
      if (user.role === 'admin') {
        // Admin gets all permissions - direct query since we have permissive policies now
        const { data: allPermissions, error } = await supabase
          .from('permissions')
          .select('name');
        
        if (error) {
          console.error('Error fetching permissions:', error);
          setPermissions([]);
        } else {
          setPermissions(allPermissions?.map(p => p.name) || []);
        }
        setRoleAssignments([]);
        setLoading(false);
        return;
      }

      // Get user's role assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_role_assignments')
        .select(`
          *,
          staff_roles!inner (
            id,
            name,
            display_name,
            hierarchy_level
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (assignmentsError) {
        console.error('Error fetching role assignments:', assignmentsError);
        setPermissions([]);
        setRoleAssignments([]);
        setLoading(false);
        return;
      }

      setRoleAssignments(assignments || []);

      if (!assignments || assignments.length === 0) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      // Get permissions for all assigned roles
      const roleIds = assignments.map(a => a.role_id);
      const { data: rolePermissions, error: permissionsError } = await supabase
        .from('role_permissions')
        .select(`
          permissions!inner (
            name
          )
        `)
        .in('role_id', roleIds);

      if (permissionsError) {
        console.error('Error fetching permissions:', permissionsError);
        setPermissions([]);
        setLoading(false);
        return;
      }

      // Extract unique permission names
      const permissionNames = [
        ...new Set(rolePermissions?.map(rp => (rp.permissions as any).name) || [])
      ];

      setPermissions(permissionNames);
    } catch (error) {
      console.error('Error in fetchPermissions:', error);
      setPermissions([]);
      setRoleAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    // Admin always has all permissions (fallback)
    if (user?.role === 'admin') return true;
    
    return permissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    // Admin always has all permissions (fallback)
    if (user?.role === 'admin') return true;
    
    return requiredPermissions.some(permission => permissions.includes(permission));
  };

  const hasAllPermissions = (requiredPermissions: string[]): boolean => {
    // Admin always has all permissions (fallback)
    if (user?.role === 'admin') return true;
    
    return requiredPermissions.every(permission => permissions.includes(permission));
  };

  useEffect(() => {
    fetchPermissions();
  }, [user?.id, user?.role]);

  return {
    permissions,
    roleAssignments,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions: fetchPermissions
  };
};