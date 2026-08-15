import { login, loginWithGithub } from "@/features/auth/actions";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const buttonClass =
  "w-full rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200";

/**
 * Server Component: `action={login}` указывает на Server Action.
 * Ошибки не через return (RSC его не покажет), а через `?error=` + redirect.
 */
export function LoginForm({ error }: { error?: string }) {
  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <form action={login} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email
          <input
            autoComplete="email"
            className={fieldClass}
            name="email"
            required
            type="email"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Password
          <input
            autoComplete="current-password"
            className={fieldClass}
            minLength={8}
            name="password"
            required
            type="password"
          />
        </label>
        <button className={buttonClass} type="submit">
          Log in
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        or
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Отдельная форма: один action на форму, без JS. */}
      <form action={loginWithGithub}>
        <button
          className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          type="submit"
        >
          Continue with GitHub
        </button>
      </form>
    </div>
  );
}
