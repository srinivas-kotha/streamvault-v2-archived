import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@lib/store";
import { autoLogin, checkAuth } from "@features/auth/api";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const { isAuthenticated, setAuth } = useAuthStore.getState();
    if (!isAuthenticated) {
      // Try silent cookie-based auth check (httpOnly refresh token may still be valid)
      const cookieValid = await checkAuth();
      if (cookieValid) {
        const savedUsername = localStorage.getItem("sv_user") || "user";
        setAuth(savedUsername);
        return;
      }
      // Try IP-based auto-login (LAN bypass)
      const result = await autoLogin();
      if (result) {
        setAuth(result.username);
        return;
      }
      throw redirect({ to: "/login" });
    }
  },
});
