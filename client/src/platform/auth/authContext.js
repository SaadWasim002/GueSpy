import { createContext, useContext } from "react";

/**
 * Split from AuthProvider.jsx so that file exports only a component and
 * keeps Fast Refresh working.
 */
export const AuthContext = createContext(null);

/**
 * @returns {{
 *   user: { userId: number, username: string, role: string }|null,
 *   isAuthenticated: boolean,
 *   isBooting: boolean,
 *   login: (credentials: { email: string, password: string }) => Promise<void>,
 *   register: (details: { username: string, email: string, password: string }) => Promise<void>,
 *   logout: () => void,
 * }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an <AuthProvider>");
  return context;
}
