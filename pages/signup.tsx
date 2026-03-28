import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export default function SignupPage() {
  const { register } = useAuth();
  const router = useRouter();
  const { pushToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <h1 className="text-xl font-semibold text-white">Create account</h1>
        <p className="mt-1 text-sm text-slate-400">Start with your company workspace</p>
        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setLoading(true);
            try {
              if (!name.trim()) {
                pushToast({
                  type: "error",
                  title: "Name required",
                  message: "Please enter your name.",
                  durationMs: 3500,
                });
                return;
              }
              if (!email.trim() || !email.includes("@")) {
                pushToast({
                  type: "error",
                  title: "Check your email",
                  message: "Please enter a valid email address.",
                  durationMs: 3500,
                });
                return;
              }
              if (password.length < 6) {
                pushToast({
                  type: "error",
                  title: "Weak password",
                  message: "Password must be at least 6 characters.",
                  durationMs: 4000,
                });
                return;
              }
              await register(email, password, name);
              await router.push("/");
            } catch {
              setError("Could not register (email may be in use)");
              pushToast({
                type: "error",
                title: "Sign up failed",
                message: "Could not create your account. The email may already be registered.",
                durationMs: 4500,
              });
            } finally {
              setLoading(false);
            }
          }}
        >
          <label className="text-xs text-slate-400">
            Name
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-400">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label className="text-xs text-slate-400">
            Password
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-sky-600 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-sky-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
