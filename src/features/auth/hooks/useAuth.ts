import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { login, logout, checkAuth } from '../api';
import { useAuthStore } from '@lib/store';

export function useAuthCheck() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setAuth = useAuthStore((s) => s.setAuth);

  return useQuery({
    queryKey: ['auth-check'],
    queryFn: async () => {
      const ok = await checkAuth();
      if (ok) {
        // Recover username from sessionStorage (set during login), fallback to 'user'
        const savedUsername = sessionStorage.getItem('sv_user') || 'user';
        setAuth(savedUsername);
      } else {
        clearAuth();
      }
      return ok;
    },
    retry: false,
    staleTime: 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      login(username, password),
    onSuccess: (data) => {
      setAuth(data.username);
      queryClient.setQueryData(['auth-check'], true);
      navigate({ to: '/' });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      navigate({ to: '/login' });
    },
  });
}
