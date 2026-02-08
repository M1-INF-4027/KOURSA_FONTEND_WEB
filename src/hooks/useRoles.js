import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useRoles() {
  const { user } = useAuth();

  return useMemo(() => {
    const roles = user?.roles?.map((r) => r.nom_role || r) || [];

    // Django superusers without explicit Koursa roles still get admin access
    if (user?.is_superuser && !roles.includes('Super Administrateur')) {
      roles.push('Super Administrateur');
    }

    // Also check is_staff as fallback for admin detection
    if (user?.is_staff && !roles.includes('Super Administrateur') && roles.length === 0) {
      roles.push('Super Administrateur');
    }

    return {
      roles,
      isEnseignant: roles.includes('Enseignant'),
      isChef: roles.includes('Chef de Département'),
      isDelegue: roles.includes('Délégué'),
      isAdmin: roles.includes('Super Administrateur'),
      isAnyAdmin: roles.includes('Super Administrateur') || roles.includes('Chef de Département'),
    };
  }, [user]);
}
