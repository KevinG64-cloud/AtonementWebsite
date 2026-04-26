"use client";

import type { ViewerAuthState } from "@/types/auth";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface AuthControlsProps {
  authState: ViewerAuthState;
  isAuthConfigured: boolean;
}

export function AuthControls({
  authState,
  isAuthConfigured,
}: AuthControlsProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSignIn = () => {
    setErrorMessage(null);

    startTransition(() => {
      void (async () => {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (!result || result.error) {
          setErrorMessage("Invalid email or password.");
          return;
        }

        setPassword("");
        router.refresh();
      })();
    });
  };

  return (
    <div
      className="rounded-xl border p-3"
      style={{
        borderColor: "var(--border-default)",
        background: "var(--bg-tertiary)",
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.2em]"
        style={{ color: "var(--text-tertiary)" }}
      >
        Editor Access
      </p>

      {!isAuthConfigured ? (
        <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          Authentication is not configured yet. Add editor credentials and an
          auth secret to enable editing.
        </p>
      ) : authState.isAuthenticated ? (
        <>
          <p className="mt-2 truncate text-sm" style={{ color: "var(--text-primary)" }}>
            {authState.email}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
            {authState.isEditor
              ? "Signed in with editor access."
              : "Signed in as read-only."}
          </p>
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/" })}
            className="mt-3 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-all"
            style={{
              borderColor: "var(--border-default)",
              color: "var(--text-secondary)",
              background: "var(--bg-secondary)",
            }}
          >
            Sign Out
          </button>
        </>
      ) : (
        <>
          <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            Sign in with an approved editor email and password to edit entries.
          </p>
          <div className="mt-3 space-y-2">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="editor@email.com"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
                background: "var(--bg-secondary)",
              }}
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
                background: "var(--bg-secondary)",
              }}
            />
            {errorMessage && (
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {errorMessage}
              </p>
            )}
            <button
              type="button"
              onClick={handleSignIn}
              disabled={!email.trim() || !password || isPending}
              className="w-full rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-all disabled:opacity-60"
              style={{
                borderColor: "var(--border-default)",
                color: "var(--text-link)",
                background: "var(--accent-gold-dim)",
              }}
            >
              {isPending ? "Signing In..." : "Sign In"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
