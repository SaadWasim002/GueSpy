import { createContext, useContext } from "react";

/** Split from ConfigProvider.jsx to keep that file component-only. */
export const ConfigContext = createContext(null);

/**
 * Server-side settings, already parsed and defaulted.
 *
 * @returns {{
 *   settings: Record<string, unknown>,
 *   isLoading: boolean,
 *   reload: () => Promise<void>,
 * }}
 */
export function useAppConfig() {
  const context = useContext(ConfigContext);
  if (!context) throw new Error("useAppConfig must be used inside a <ConfigProvider>");
  return context;
}
