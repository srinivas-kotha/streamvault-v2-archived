import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { SpatialNavProvider } from "./shared/providers/SpatialNavProvider";
import { initPlayerStoreBridge } from "./lib/playerStoreBridge";
import "./styles/tailwind.css";

// Bridge legacy player store → new playerStore so PlayerShell renders
initPlayerStoreBridge();

// Register service worker for PWA install (Samsung TV, Fire Stick, mobile, etc.)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // SW registration failed — app still works without it
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SpatialNavProvider>
      <App />
    </SpatialNavProvider>
  </StrictMode>,
);
