import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ToastProvider } from "@/ui";
import { Gallery } from "@/dev/Gallery/Gallery";
import "@/styles/global.css";

/*
 * The router, auth and game providers land in the app-shell branch. Until
 * then the root renders the component gallery, which keeps the design system
 * runnable (`npm run dev`) while the screens are rebuilt on top of it.
 */
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider>
      <Gallery />
    </ToastProvider>
  </StrictMode>,
);
