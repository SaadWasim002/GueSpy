import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../platform/auth/authContext";

/**
 * Gate for signed-in routes.
 *
 * No loading state is needed: the stored session is restored at module load,
 * so `isAuthenticated` is already correct on the first render and a returning
 * user is never bounced to /login mid-boot.
 *
 * The attempted path is stashed in location state so sign-in can return the
 * user to where they were headed.
 */
export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

/** Inverse gate: keeps a signed-in user off the login and register screens. */
export function RequireAnonymous() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) return <Navigate to="/" replace />;

  return <Outlet />;
}
