import { api } from '@lib/api';

interface LoginResponse {
  message: string;
  userId: number;
  username: string;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return api<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function logout(): Promise<void> {
  await api<{ message: string }>('/auth/logout', { method: 'POST' });
}

export async function checkAuth(): Promise<boolean> {
  try {
    await api<unknown[]>('/favorites');
    return true;
  } catch {
    return false;
  }
}

export async function autoLogin(): Promise<{ username: string } | null> {
  try {
    const res = await fetch('/api/auth/auto-login', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      return { username: data.username };
    }
    return null;
  } catch {
    return null;
  }
}
