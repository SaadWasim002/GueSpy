import { Navigate, Route, Routes } from "react-router-dom";
import { IS_DEV } from "../config/env";
import { Gallery } from "../dev/Gallery/Gallery";
import { LoginScreen } from "../platform/auth/screens/LoginScreen";
import { RegisterScreen } from "../platform/auth/screens/RegisterScreen";
import { NotFoundScreen } from "./NotFoundScreen";
import { RequireAnonymous, RequireAuth } from "./RouteGuards";
import { ScaffoldScreen } from "./ScaffoldScreen";

/*
 * There is deliberately no cross-fade between routes.
 *
 * The obvious implementation — AnimatePresence keyed on the pathname — is a
 * trap here, in two ways. Wrapping <Outlet> makes the "exiting" copy resolve
 * to the *incoming* route, so it fades out the screen that just arrived.
 * Pinning <Routes location={…}> fixes that but leaves the outgoing subtree
 * mounted, and this app redirects during render (the auth guards): a stale
 * copy pinned to "/" re-fires <Navigate to="/login"> on every render, which
 * is an infinite update loop and a blank page.
 *
 * <Screen> already animates its own entrance, which carries the sense of
 * movement between screens on its own. Exit choreography would need a
 * redirect-free route structure to be safe, and it isn't worth that.
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* Signed out only — an authenticated visit bounces to "/". */}
      <Route element={<RequireAnonymous />}>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
      </Route>

      {/* Everything below requires a session. */}
      <Route element={<RequireAuth />}>
        <Route
          index
          element={
            <ScaffoldScreen
              title="Choose a game"
              subtitle="The platform's home. Games come from the active_games config."
              branch="feature/game-hub"
              showConfig
            />
          }
        />
        <Route
          path="/play/:gameId/*"
          element={
            <ScaffoldScreen
              title="Game"
              subtitle="Each game module drives its own screens from here."
              branch="feature/game-hub"
            />
          }
        />
      </Route>

      {/* Living component reference. Dev builds only. */}
      {IS_DEV ? <Route path="/dev/ui" element={<Gallery />} /> : null}

      <Route path="/404" element={<NotFoundScreen />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default AppRoutes;
