import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { IS_DEV } from "../config/env";
import { Gallery } from "../dev/Gallery/Gallery";
import { LoginScreen } from "../platform/auth/screens/LoginScreen";
import { RegisterScreen } from "../platform/auth/screens/RegisterScreen";
import { GameHubScreen } from "../platform/games/GameHubScreen";
import { LoadingBlock, Screen } from "../ui";
import { GameHost } from "./GameHost";
import { NotFoundScreen } from "./NotFoundScreen";
import { RequireAdmin, RequireAnonymous, RequireAuth } from "./RouteGuards";

/*
 * The admin area is split out of the main bundle.
 *
 * Almost nobody who loads this app is an admin, and the area is a large slice
 * of code — every category and word screen, the settings editors — that a
 * player will never open. Fetching it only when an admin actually navigates
 * there keeps it out of the download for everyone else.
 */
const AdminScreen = lazy(() =>
  import("../platform/admin/AdminScreen").then((module) => ({ default: module.AdminScreen })),
);

/**
 * Remounts the host whenever the routed game changes.
 *
 * The host calls the selected module's own session hook. Swapping modules
 * without a remount would swap one set of hooks for another between renders,
 * which React cannot reconcile — the key forces a clean unmount instead.
 */
function KeyedGameHost() {
  const { gameId } = useParams();
  return <GameHost key={gameId} />;
}

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
        <Route index element={<GameHubScreen />} />

        {/*
          Keyed on the game id so switching games remounts the host. The host
          calls the module's own session hook, and remounting is what keeps
          one module's hooks from being swapped for another's mid-render.
        */}
        <Route path="/play/:gameId/*" element={<KeyedGameHost />} />

        {/* Nested rather than a sibling: admin implies a session, and this
            way a signed-out visit lands on /login instead of the hub. */}
        <Route element={<RequireAdmin />}>
          <Route
            path="/admin"
            element={
              <Suspense
                fallback={
                  <Screen center width="narrow">
                    <LoadingBlock label="Opening the admin area…" />
                  </Screen>
                }
              >
                <AdminScreen />
              </Suspense>
            }
          />
        </Route>
      </Route>

      {/* Living component reference. Dev builds only. */}
      {IS_DEV ? <Route path="/dev/ui" element={<Gallery />} /> : null}

      <Route path="/404" element={<NotFoundScreen />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default AppRoutes;
