"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { clientConfig } from "@/config/client";

type Step = "loading" | "set-password" | "error";

export default function SetPasswordClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("loading");
  const [role, setRole] = useState("admin");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // createBrowserClient auto-detects #access_token= in the URL hash
    // and calls setSession internally. We just need to wait for it.
    const supabase = createBrowserSupabase();

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userRole = (session.user.app_metadata?.role as string) ?? "admin";
        setRole(userRole);
        setStep("set-password");
      } else {
        // Give the client a moment to process the hash, then try once more
        setTimeout(async () => {
          const { data: { session: s2 } } = await supabase.auth.getSession();
          if (s2?.user) {
            setRole((s2.user.app_metadata?.role as string) ?? "admin");
            setStep("set-password");
          } else {
            setStep("error");
          }
        }, 1200);
      }
    };

    check();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError("");

    if (password.length < 8) {
      setFieldError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setFieldError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setFieldError(error.message);
      setSubmitting(false);
      return;
    }

    router.replace(role === "crew" ? "/pro/contacts" : "/pro/pipeline");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{
        background:
          "radial-gradient(ellipse 100% 80% at 50% 0%, #000040 0%, #000010 50%, #000000 100%)",
      }}
    >
      <Link
        href="/"
        className="absolute top-7 left-7 text-steel text-[9px] tracking-[0.3em] uppercase hover:text-wake transition-colors duration-200 flex items-center gap-2"
      >
        <span aria-hidden="true">←</span> {clientConfig.companyName}
      </Link>

      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <Image
            src={clientConfig.logoWhiteSvg}
            alt={clientConfig.companyName}
            width={52}
            height={52}
            className="h-13 w-auto opacity-90"
            priority
          />
          <div className="flex flex-col items-center gap-1">
            <p className="text-wake text-[11px] tracking-[0.5em] uppercase font-semibold">
              {clientConfig.companyShortName}
            </p>
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="text-navy text-[8px]">◈</span>
              <p className="text-steel text-[9px] tracking-[0.4em] uppercase">Pro</p>
              <span aria-hidden="true" className="text-navy text-[8px]">◈</span>
            </div>
          </div>
        </div>

        <div className="w-full chrome-stage bg-obsidian/80 backdrop-blur-md p-8 flex flex-col gap-6">
          {step === "loading" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-5 h-5 border-2 border-steel border-t-wake rounded-full animate-spin" />
              <p className="text-steel text-[10px] tracking-wide">Verifying invite…</p>
            </div>
          )}

          {step === "error" && (
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-wake text-lg font-bold tracking-tight">Link Expired</h1>
                <p className="text-steel text-[10px] tracking-wide leading-relaxed mt-1">
                  Your invite link has expired or is invalid. Contact{" "}
                  <a href={`mailto:${clientConfig.email}`} className="text-steel-light hover:text-wake transition-colors">
                    {clientConfig.email}
                  </a>{" "}
                  to request a new one.
                </p>
              </div>
              <Link
                href="/pro"
                className="text-center chrome-btn font-bold text-xs tracking-[0.3em] uppercase py-3 transition-all duration-300 hover:scale-[1.02] w-full"
              >
                Back to Sign In
              </Link>
            </div>
          )}

          {step === "set-password" && (
            <>
              <div className="flex flex-col gap-1">
                <h1 className="text-wake text-lg font-bold tracking-tight">Welcome</h1>
                <p className="text-steel text-[10px] tracking-wide leading-relaxed">
                  Create a password to activate your account and access the {clientConfig.proPortalName} portal.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {fieldError && (
                  <div className="border border-red-900/60 bg-red-950/20 px-3.5 py-2.5">
                    <p className="text-red-400 text-[10px] tracking-wide leading-relaxed">{fieldError}</p>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="new-password" className="text-steel-light text-[10px] tracking-[0.25em] uppercase">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      maxLength={128}
                      autoComplete="new-password"
                      placeholder="Min. 8 characters"
                      disabled={submitting}
                      className="w-full bg-obsidian/60 border border-steel-dark text-wake placeholder-steel text-xs px-3.5 py-2.5 pr-12 focus:outline-none focus:border-navy transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-steel hover:text-wake transition-colors duration-200 text-[9px] tracking-widest uppercase"
                    >
                      {showPass ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="confirm-password" className="text-steel-light text-[10px] tracking-[0.25em] uppercase">
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    type={showPass ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    maxLength={128}
                    autoComplete="new-password"
                    placeholder="Re-enter password"
                    disabled={submitting}
                    className="w-full bg-obsidian/60 border border-steel-dark text-wake placeholder-steel text-xs px-3.5 py-2.5 focus:outline-none focus:border-navy transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="chrome-btn font-bold text-xs tracking-[0.3em] uppercase py-3 transition-all duration-300 hover:scale-[1.02] w-full mt-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {submitting ? "Activating Account…" : "Set Password & Continue"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-steel text-[9px] tracking-widest uppercase opacity-50">
          {clientConfig.companyName} · {clientConfig.city}, {clientConfig.state}
        </p>
      </div>
    </div>
  );
}
