import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/authContext";
import { ConfigContext } from "./configContext";
import { resolveSettings } from "./configKeys";
import { fetchConfigs } from "./configService";

const DEFAULT_SETTINGS = resolveSettings([]);

/**
 * Loads `/config/get` once per session and shares the parsed result.
 *
 * Config is fetched here rather than per screen because half a dozen screens
 * need a slice of it (player limits, spy bounds, discussion duration, the
 * games list) and the values do not change mid-game.
 *
 * A failure is never fatal: the resolved defaults stand in, so the app runs
 * with sensible bounds even if the endpoint 404s. The 5xx/network cases are
 * already announced by the API client's global notifier, so nothing is
 * silently swallowed.
 */
export function ConfigProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = (requestId.current += 1);
    setIsLoading(true);
    try {
      const rows = await fetchConfigs();
      // Drop a response that a newer request has already superseded.
      if (id === requestId.current) setSettings(resolveSettings(rows));
    } catch {
      if (id === requestId.current) setSettings(DEFAULT_SETTINGS);
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      // Signing out invalidates the fetch: the next user re-reads config.
      requestId.current += 1;
      setSettings(DEFAULT_SETTINGS);
      setIsLoading(false);
      return;
    }
    load();
  }, [isAuthenticated, load]);

  const value = useMemo(() => ({ settings, isLoading, reload: load }), [settings, isLoading, load]);

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export default ConfigProvider;
