import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

interface PermissionGateProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false (default), user needs ANY permission
  fallback?: ReactNode;
  showFallback?: boolean; // If true, shows a fallback message instead of hiding completely
}

export const PermissionGate = ({ 
  children, 
  permission, 
  permissions = [], 
  requireAll = false,
  fallback,
  showFallback = false
}: PermissionGateProps) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  if (loading) {
    return null; // Don't show anything while loading
  }

  // Determine which permissions to check
  const permsToCheck = permission ? [permission] : permissions;
  
  if (permsToCheck.length === 0) {
    // No permissions specified, always show
    return <>{children}</>;
  }

  // Check permissions based on requireAll flag
  const hasAccess = requireAll 
    ? hasAllPermissions(permsToCheck)
    : hasAnyPermission(permsToCheck);

  if (!hasAccess) {
    if (showFallback) {
      return fallback || (
        <Alert className="border-yellow-500/50 bg-yellow-500/10">
          <Lock className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-400">
            You don't have permission to access this section.
          </AlertDescription>
        </Alert>
      );
    }
    return null; // Hide completely
  }

  return <>{children}</>;
};