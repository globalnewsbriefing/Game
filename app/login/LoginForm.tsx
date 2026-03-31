"use client";

import { useSearchParams } from "next/navigation";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const error = searchParams.get("error");
  const safeNext = next && next.startsWith("/") ? next : "/";

  return (
    <form className="login-form" method="post" action="/api/auth/login">
      <input type="hidden" name="next" value={safeNext} />
      <label>
        <span>Username</span>
        <input name="username" type="text" autoComplete="username" required />
      </label>

      <label>
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>

      {error === "invalid" ? <p className="error-copy">Login failed.</p> : null}

      <button className="primary-button" type="submit">
        Sign in
      </button>
    </form>
  );
}
