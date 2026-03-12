import { useForm } from 'react-hook-form';
import { useLogin } from '../hooks/useAuth';

interface LoginForm {
  username: string;
  password: string;
}

export function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const loginMutation = useLogin();

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-obsidian relative overflow-hidden">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo/20 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-xl p-8 shadow-card">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-text-primary">
              Stream<span className="text-teal">Vault</span>
            </h1>
            <p className="text-text-muted mt-2 text-sm">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                className="w-full px-4 py-2.5 bg-surface-raised border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal-dim transition-all"
                placeholder="Enter username"
                {...register('username', { required: 'Username is required' })}
              />
              {errors.username && (
                <p className="text-error text-xs mt-1">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="w-full px-4 py-2.5 bg-surface-raised border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal-dim transition-all"
                placeholder="Enter password"
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password && (
                <p className="text-error text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {loginMutation.isError && (
              <div className="bg-error/10 border border-error/30 rounded-lg px-4 py-2.5 text-error text-sm">
                {loginMutation.error?.message || 'Invalid credentials'}
              </div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-dim to-teal rounded-lg font-medium text-obsidian hover:opacity-90 disabled:opacity-50 transition-all focus:outline-none focus:ring-2 focus:ring-teal/50 focus:ring-offset-2 focus:ring-offset-obsidian"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
