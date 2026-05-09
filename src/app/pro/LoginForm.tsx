"use client";

import { useActionState } from "react";
import { useState } from "react";
import { login, type LoginState } from "@/app/actions";
import { clientConfig } from "@/config/client";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    login,
    {}
  );
  const [showPass, setShowPass] = useState(false);

  return (
    <form action={formAction} aria-label={`${clientConfig.proPortalName} sign in`} className="flex flex-col gap-4" noValidate>

      {state.error && (
        <div
          role="alert"
          aria-live="assertive"
          className="border border-red-900/60 bg-red-950/20 px-3.5 py-2.5"
        >
          <p className="text-red-400 text-[10px] tracking-wide leading-relaxed">{state.error}</p>
        </div>
      )}

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="pro-email"
          className="text-steel-light text-[10px] tracking-[0.25em] uppercase"
        >
          Email
        </label>
        <input
          id="pro-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={256}
          placeholder={`you@${clientConfig.email.split("@")[1]}`}
          disabled={isPending}
          className="bg-obsidian/60 border border-steel-dark text-wake placeholder-steel text-xs px-3.5 py-2.5 focus:outline-none focus:border-navy transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="pro-password"
          className="text-steel-light text-[10px] tracking-[0.25em] uppercase"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="pro-password"
            name="password"
            type={showPass ? "text" : "password"}
            required
            autoComplete="current-password"
            maxLength={128}
            placeholder="••••••••"
            disabled={isPending}
            className="w-full bg-obsidian/60 border border-steel-dark text-wake placeholder-steel text-xs px-3.5 py-2.5 pr-12 focus:outline-none focus:border-navy transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            aria-label={showPass ? "Hide password" : "Show password"}
            onClick={() => setShowPass((v) => !v)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-steel hover:text-wake transition-colors duration-200 text-[9px] tracking-widest uppercase"
          >
            {showPass ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        aria-disabled={isPending}
        className="chrome-btn font-bold text-xs tracking-[0.3em] uppercase py-3 transition-all duration-300 hover:scale-[1.02] w-full mt-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isPending ? "Signing In…" : "Sign In"}
      </button>
    </form>
  );
}
