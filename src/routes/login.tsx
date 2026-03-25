import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@lib/store";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: "/" });
    }
  },
});
