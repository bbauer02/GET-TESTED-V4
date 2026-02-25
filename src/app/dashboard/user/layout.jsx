'use client';

import { useAuthContext } from 'src/auth/hooks';
import { RoleBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export default function Layout({ children }) {
  const { user } = useAuthContext();

  return (
    <RoleBasedGuard hasContent currentRole={user?.role} allowedRoles={['admin']}>
      {children}
    </RoleBasedGuard>
  );
}
