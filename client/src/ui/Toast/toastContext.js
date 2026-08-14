import { createContext, useContext } from "react";

/**
 * Kept out of ToastProvider.jsx so that file exports a component and nothing
 * else — mixing component and non-component exports breaks Fast Refresh.
 */
export const ToastContext = createContext(null);

/**
 * The app's notification channel.
 *
 * @returns {{
 *   toast: (options: object) => number,
 *   success: (message: string, options?: object) => number,
 *   error: (message: string, options?: object) => number,
 *   warning: (message: string, options?: object) => number,
 *   info: (message: string, options?: object) => number,
 *   dismiss: (id: number) => void,
 * }}
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside a <ToastProvider>");
  return context;
}
