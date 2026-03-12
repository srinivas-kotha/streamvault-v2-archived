import { createFileRoute, redirect } from '@tanstack/react-router';
import { LoginPage } from '@features/auth/components/LoginPage';
import { useAuthStore } from '@lib/store';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});
