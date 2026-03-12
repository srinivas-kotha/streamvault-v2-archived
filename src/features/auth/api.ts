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
