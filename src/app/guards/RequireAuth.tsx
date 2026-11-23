import { Navigate, Outlet, useLocation } from 'react-router-dom';

type RequireAuthProps = { authenticated: boolean; loading: boolean };

export function RequireAuth({ authenticated, loading }: RequireAuthProps) {
  const location = useLocation();
  if (loading)
    return (
      <div className="catalog-status">
        <span className="catalog-spinner" />
        Verificando sessão…
      </div>
    );
  return authenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/entrar" replace state={{ from: location }} />
  );
}
