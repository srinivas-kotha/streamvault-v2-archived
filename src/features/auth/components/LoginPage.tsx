import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useSpatialFocusable, useSpatialContainer, FocusContext } from '@shared/hooks/useSpatialNav';
import { usePageFocus } from '@shared/hooks/usePageFocus';
import { useLogin } from '../hooks/useAuth';

interface LoginForm {
  username: string;
  password: string;
}

function FocusableInput({ id, type = 'text', placeholder, autoComplete, error, register, enterKeyHint, onEnterKey }: {
  id: string;
  type?: string;
  placeholder: string;
  autoComplete: string;
  error?: string;
  register: ReturnType<typeof useForm<LoginForm>>['register'];
  enterKeyHint?: 'next' | 'go' | 'done';
  onEnterKey?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { ref: focusRef, focused, focusProps } = useSpatialFocusable({
    focusKey: `${id}-input`,
    onEnterPress: () => inputRef.current?.focus(),
  });

  const { ref: registerRef, ...registerRest } = register(id as keyof LoginForm, {
    required: `${id.charAt(0).toUpperCase() + id.slice(1)} is required`,
  });

  return (
    <div ref={focusRef} {...focusProps}>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        enterKeyHint={enterKeyHint}
        className={`w-full px-4 py-2.5 bg-surface-raised border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal-dim transition-all ${focused ? 'border-teal ring-2 ring-teal/50' : 'border-border'}`}
        placeholder={placeholder}
        ref={(el) => {
          registerRef(el);
          inputRef.current = el;
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            inputRef.current?.blur();
          }
          if (e.key === 'Enter' && onEnterKey) {
            e.preventDefault();
            inputRef.current?.blur();
            onEnterKey();
          }
        }}
        {...registerRest}
      />
      {error && <p className="text-error text-xs mt-1">{error}</p>}
    </div>
  );
}

function FocusableSubmitButton({ isPending }: { isPending: boolean }) {
  const { ref, focused, focusProps } = useSpatialFocusable({
    focusKey: 'login-submit-button',
    onEnterPress: () => {
      document.querySelector<HTMLButtonElement>('#login-submit')?.click();
    },
  });

  return (
    <div ref={ref} {...focusProps}>
      <button
        id="login-submit"
        type="submit"
        disabled={isPending}
        className={`w-full py-2.5 px-4 bg-gradient-to-r from-teal-dim to-teal rounded-lg font-medium text-obsidian hover:opacity-90 disabled:opacity-50 transition-all focus:outline-none focus:ring-2 focus:ring-teal/50 focus:ring-offset-2 focus:ring-offset-obsidian ${focused ? 'ring-2 ring-teal/50 ring-offset-2 ring-offset-obsidian opacity-90' : ''}`}
      >
        {isPending ? (
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
    </div>
  );
}

export function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const loginMutation = useLogin();

  usePageFocus('username-input');

  const { ref: formRef, focusKey } = useSpatialContainer({ focusKey: 'login-form' });

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

          <FocusContext.Provider value={focusKey}>
            <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-1.5">
                  Username
                </label>
                <FocusableInput
                  id="username"
                  placeholder="Enter username"
                  autoComplete="username"
                  error={errors.username?.message}
                  register={register}
                  enterKeyHint="next"
                  onEnterKey={() => document.getElementById('password')?.focus()}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1.5">
                  Password
                </label>
                <FocusableInput
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  error={errors.password?.message}
                  register={register}
                  enterKeyHint="go"
                  onEnterKey={() => document.querySelector<HTMLButtonElement>('#login-submit')?.click()}
                />
              </div>

              {loginMutation.isError && (
                <div className="bg-error/10 border border-error/30 rounded-lg px-4 py-2.5 text-error text-sm">
                  {loginMutation.error?.message || 'Invalid credentials'}
                </div>
              )}

              <FocusableSubmitButton isPending={loginMutation.isPending} />
            </form>
          </FocusContext.Provider>
        </div>
      </div>
    </div>
  );
}
