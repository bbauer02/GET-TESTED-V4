'use client';

import { useAuthContext } from 'src/auth/hooks';

import { RoleBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export default function EspaceInstitutLayout({ children }) {
  const { user } = useAuthContext();

  return (
    <RoleBasedGuard hasContent currentRole={user?.roles} allowedRoles={['institute_admin']}>
      {children}
    </RoleBasedGuard>
  );
}
