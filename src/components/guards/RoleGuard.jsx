import { Navigate, Outlet } from 'react-router-dom';
import { useRoles } from '../../hooks/useRoles';

export default function RoleGuard({ allowedRoles }) {
  const { roles } = useRoles();
  const hasAccess = allowedRoles.some((r) => roles.includes(r));

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
