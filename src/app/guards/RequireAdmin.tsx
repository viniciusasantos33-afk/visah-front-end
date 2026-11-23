import { Navigate, Outlet } from 'react-router-dom';

export function RequireAdmin({ allowed }: { allowed: boolean }) {
  return allowed ? <Outlet /> : <Navigate to="/" replace />;
}
