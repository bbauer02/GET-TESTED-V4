import { AuthSplitLayout } from 'src/layouts/auth-split';

import { GuestGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export default function Layout({ children }) {
  return (
    <GuestGuard>
      <AuthSplitLayout
        slotProps={{
          section: { title: 'Bon retour parmi nous' },
        }}
      >
        {children}
      </AuthSplitLayout>
    </GuestGuard>
  );
}
