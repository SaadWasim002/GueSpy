import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "../ui";
import { AuthProvider } from "../platform/auth/AuthProvider";
import { ConfigProvider } from "../platform/config/ConfigProvider";
import { SoundProvider } from "../platform/sound/SoundProvider";
import { AppLayout } from "./AppLayout";
import { AppRoutes } from "./AppRoutes";
import { ErrorBoundary } from "./ErrorBoundary";

/**
 * Application root.
 *
 * Provider order is load-bearing: ToastProvider is outermost because
 * AuthProvider reports session expiry through it; AuthProvider comes next
 * because ConfigProvider only fetches once there is a token; the router sits
 * inside all three so any screen can reach them.
 */
export function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <ConfigProvider>
            <SoundProvider>
              <BrowserRouter>
                <AppLayout>
                  <AppRoutes />
                </AppLayout>
              </BrowserRouter>
            </SoundProvider>
          </ConfigProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
