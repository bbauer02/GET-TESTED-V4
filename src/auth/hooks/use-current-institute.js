import { useAuthContext } from './use-auth-context';

// ----------------------------------------------------------------------

export function useCurrentInstitute() {
  const { user } = useAuthContext();
  return user?.currentInstitute ?? null;
}
