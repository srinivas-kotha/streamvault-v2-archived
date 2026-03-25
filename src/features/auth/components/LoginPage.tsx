import { useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  useSpatialFocusable,
  useSpatialContainer,
  FocusContext,
} from "@shared/hooks/useSpatialNav";
import { usePageFocus } from "@shared/hooks/usePageFocus";
import { useLogin } from "../hooks/useAuth";
import { useToastStore } from "@lib/toastStore";
import { isTVMode } from "@shared/utils/isTVMode";

interface LoginForm {
  username: string;
  password: string;
}

function FocusableInput({
  id,
  type = "text",
  placeholder,
  autoComplete,
  error,
  register,
  enterKeyHint,
  onEnterKey,
}: {
  id: string;
  type?: string;
  placeholder: string;
  autoComplete: string;
  error?: string;
  register: ReturnType<typeof useForm<LoginForm>>["register"];
  enterKeyHint?: "next" | "go" | "done";
  onEnterKey?: () => void;
}) {
  const errorId = `${id}-error`;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    ref: focusRef,
    focused,
    focusProps,
  } = useSpatialFocusable({
    focusKey: `${id}-input`,
    onEnterPress: () => inputRef.current?.focus(),
  });

  const { ref: registerRef, ...registerRest } = register(
    id as keyof LoginForm,
    {
      required: `${id.charAt(0).toUpperCase() + id.slice(1)} is required`,
    },
  );

  return (
    <div ref={focusRef} {...focusProps}>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        enterKeyHint={enterKeyHint}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? errorId : undefined}
        className={[
          "w-full px-4 py-3 rounded-[var(--radius-lg)] text-text-primary",
          `${isTVMode ? "bg-bg-primary/90" : "bg-bg-primary/60 backdrop-blur-sm"} border`,
          "placeholder:text-text-tertiary",
          "focus:outline-none focus:ring-2 focus:ring-accent-teal/50 focus:border-accent-teal",
          "transition-[border-color,box-shadow]",
          focused
            ? "border-accent-teal ring-2 ring-accent-teal/50"
            : "border-white/10 hover-capable:border-white/20",
        ].join(" ")}
        placeholder={placeholder}
        ref={(el) => {
          registerRef(el);
          inputRef.current = el;
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            inputRef.current?.blur();
          }
          if (e.key === "Enter" && onEnterKey) {
            e.preventDefault();
            inputRef.current?.blur();
            onEnterKey();
          }
        }}
        {...registerRest}
      />
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-[var(--color-error)] text-xs mt-1.5"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function FocusableSubmitButton({ isPending }: { isPending: boolean }) {
  const { ref, focused, focusProps } = useSpatialFocusable({
    focusKey: "login-submit-button",
    onEnterPress: () => {
      document.querySelector<HTMLButtonElement>("#login-submit")?.click();
    },
  });

  return (
    <div ref={ref} {...focusProps}>
      <button
        id="login-submit"
        type="submit"
        disabled={isPending}
        className={[
          "w-full py-3 px-4 rounded-[var(--radius-lg)] font-semibold text-bg-primary",
          "bg-gradient-to-r from-accent-teal to-accent-indigo",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-[opacity,box-shadow,transform]",
          "hover-capable:opacity-90",
          "active:scale-[0.98]",
          "focus:outline-none",
          focused
            ? "ring-2 ring-accent-teal/60 ring-offset-2 ring-offset-bg-primary opacity-90"
            : "",
        ].join(" ")}
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Signing in...
          </span>
        ) : (
          "Sign In"
        )}
      </button>
    </div>
  );
}

export function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();
  const loginMutation = useLogin();
  const addToast = useToastStore((s) => s.addToast);

  usePageFocus("username-input");

  const { ref: formRef, focusKey } = useSpatialContainer({
    focusKey: "login-form",
  });

  // Show error toast on login failure
  useEffect(() => {
    if (loginMutation.isError && loginMutation.error) {
      addToast(
        loginMutation.error.message || "Invalid credentials. Please try again.",
        "error",
      );
    }
  }, [loginMutation.isError, loginMutation.error, addToast]);

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, var(--color-bg-primary) 0%, color-mix(in srgb, var(--color-accent-indigo) 10%, transparent) 50%, color-mix(in srgb, var(--color-accent-teal) 10%, transparent) 100%)`,
      }}
    >
      {/* Ambient background orbs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]"
          style={{ background: "var(--color-accent-indigo)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]"
          style={{ background: "var(--color-accent-teal)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Card with ambient glow */}
        <div
          className={`${isTVMode ? "bg-bg-secondary/95" : "bg-bg-secondary/80 backdrop-blur-xl"} border border-white/10 rounded-[var(--radius-xl)] p-8`}
          style={{
            boxShadow: `0 0 60px color-mix(in srgb, var(--color-accent-teal) 12%, transparent), 0 24px 64px rgba(0,0,0,0.5)`,
          }}
        >
          {/* Logo / Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-[var(--radius-lg)] bg-gradient-to-br from-accent-teal to-accent-indigo mb-4 shadow-lg">
              <svg
                className="w-6 h-6 text-bg-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="font-[var(--font-family-heading)] text-3xl font-bold text-text-primary tracking-tight">
              Stream<span className="text-accent-teal">Vault</span>
            </h1>
            <p className="text-text-tertiary mt-2 text-sm">
              Sign in to your account
            </p>
          </div>

          <FocusContext.Provider value={focusKey}>
            <form
              ref={formRef}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
              noValidate
            >
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Username
                </label>
                <FocusableInput
                  id="username"
                  placeholder="Enter your username"
                  autoComplete="username"
                  error={errors.username?.message}
                  register={register}
                  enterKeyHint="next"
                  onEnterKey={() =>
                    document.getElementById("password")?.focus()
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Password
                </label>
                <FocusableInput
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  error={errors.password?.message}
                  register={register}
                  enterKeyHint="go"
                  onEnterKey={() =>
                    document
                      .querySelector<HTMLButtonElement>("#login-submit")
                      ?.click()
                  }
                />
              </div>

              {/* Inline error (kept in addition to toast for accessibility) */}
              {loginMutation.isError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-[var(--radius-md)] px-4 py-3 text-[var(--color-error)] text-sm"
                >
                  {loginMutation.error?.message || "Invalid credentials"}
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
