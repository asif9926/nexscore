"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, MessageCircle, ShieldAlert, Sparkles } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // ১. Firebase Auth দিয়ে ক্লায়েন্ট সাইন-ইন
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await userCredential.user.getIdToken(true);

      if (!idToken) {
        throw new Error("Failed to retrieve ID Token from Firebase.");
      }

      // ২. Body এবং Header উভয় মাধ্যমে টোকেন পাঠানো
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(data?.error || "Failed to secure session. Please try again.");
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Invalid email address or password.");
      } else {
        setError(err.message || "Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-ink text-fg selection:bg-electric/30">
      <Navbar />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div className="mb-3 flex items-center justify-end">
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-fg-faint">
              <Sparkles size={12} className="text-signal-gold" /> Scorer Control Room
            </span>
          </div>

          <div className="rounded-3xl border border-border bg-panel p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-electric font-broadcast text-xl font-bold text-white shadow-lg shadow-electric/25">
                N<span className="text-signal-gold">S</span>
              </div>
              <h1 className="text-2xl font-black uppercase tracking-wide text-fg">Admin Access</h1>
              <p className="mt-1 text-xs text-fg-muted sm:text-sm">
                NexScore Match Control Room & Broadcast PCR
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-crimson/40 bg-crimson/10 p-3 text-xs font-medium text-crimson">
                <ShieldAlert size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-fg-muted">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-faint" />
                  <input
                    type="email"
                    required
                    placeholder="admin@nexscore.com"
                    className="min-h-[48px] w-full rounded-xl border border-border bg-ink pl-10 pr-3 text-sm text-fg outline-none transition-colors focus:border-electric"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-fg-muted">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-faint" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
                    className="min-h-[48px] w-full rounded-xl border border-border bg-ink pl-10 pr-10 text-sm text-fg outline-none transition-colors focus:border-electric"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-faint transition-colors hover:text-fg"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-electric px-4 py-3 font-bold text-white shadow-lg shadow-electric/25 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              >
                {loading ? "Authenticating..." : "Login to Control Room"}
              </button>
            </form>

            <div className="mt-6 border-t border-border pt-5">
              <div className="rounded-2xl border border-border/80 bg-ink/70 p-4 text-center">
                <p className="text-xs font-medium text-fg-muted">
                  Need scoring permissions for your tournament?
                </p>
                <div className="mt-3 flex justify-center">
                  <a
                    href="https://wa.me/8801XXXXXXXXX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 rounded-full border border-[#25D366]/30 bg-[#25D366]/10 px-4 py-2 text-xs font-bold text-[#25D366] shadow-sm transition-all hover:bg-[#25D366]/20 hover:text-white"
                  >
                    <MessageCircle size={15} />
                    <span>Contact Developer on WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}