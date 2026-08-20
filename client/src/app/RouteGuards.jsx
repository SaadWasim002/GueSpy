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

/**
 * Gate for admin-only routes. Nests inside RequireAuth, which has already
 * established there is a session.
 *
 * A non-admin is sent to the hub rather than shown a refusal: they did not
 * ask for a restricted page, they typed a URL that is not theirs, and a
 * dead end would be worse than the place they meant to be.
 *
 * This decides what to *render* and nothing more. Every admin endpoint is
 * guarded server-side by `@PreAuthorize("hasRole('ADMIN')")` off the same
 * token, so editing the stored claim buys a page of 403s, not access.
 */
export function RequireAdmin() {
  const { user } = useAuth();

  // The claim is the bare enum name. JwtUtil writes `user.getRole()` and it
  // is JwtFilter that prefixes `ROLE_` when building authorities — matching
  // on "ROLE_ADMIN" here would silently never fire.
  if (user?.role !== "ADMIN") return <Navigate to="/" replace />;

  return <Outlet />;
}

/** Inverse gate: keeps a signed-in user off the login and register screens. */
export function RequireAnonymous() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) return <Navigate to="/" replace />;

  return <Outlet />;
}
