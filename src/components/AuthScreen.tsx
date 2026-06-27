import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { login, signup, getGoogleOAuthUrl } from "../auth";
import type { AuthUser } from "../types";

interface AuthScreenProps {
  onLogin: (user: AuthUser, token: string) => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [course, setCourse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const result = await login(email, password);
        onLogin(
          {
            id: result.user.id,
            email: result.user.email,
            full_name: result.user.full_name,
          },
          result.access_token
        );
      } else {
        await signup(email, password, fullName, college, course);
        setSuccess(
          "Account created! You can now sign in immediately. 🎉"
        );
        setMode("login");
        setPassword("");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const url = await getGoogleOAuthUrl();
    if (url) {
      window.location.href = url;
    } else {
      setError("Google OAuth is not configured yet.");
    }
  };

  return (
    <div className="min-h-screen bg-[#080710] flex items-center justify-center p-4 relative overflow-hidden crt-screen crt-scanlines">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-[15%] left-[10%] w-32 h-32 rounded-full bg-blue-600/10 blur-3xl auth-orb" />
        <div className="absolute bottom-[20%] right-[8%] w-48 h-48 rounded-full bg-emerald-500/8 blur-3xl" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-[60%] left-[5%] w-24 h-24 rounded-full bg-purple-600/10 blur-2xl auth-orb" style={{ animationDelay: "3s" }} />
        <div className="absolute top-[10%] right-[15%] w-40 h-40 rounded-full bg-pink-500/8 blur-3xl auth-orb" style={{ animationDelay: "0.7s" }} />

        {/* Floating pixel stars */}
        {["★", "✦", "◆", "▲", "●"].map((s, i) => (
          <span
            key={i}
            className="absolute font-press text-[8px] opacity-10 float-anim select-none"
            style={{
              top: `${20 + i * 15}%`,
              left: `${5 + i * 18}%`,
              color: ["#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#f59e0b"][i],
              animationDelay: `${i * 0.8}s`,
            }}
          >
            {s}
          </span>
        ))}
      </div>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <motion.div
            className="text-5xl mb-4 inline-block float-anim"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          >
            🕹️
          </motion.div>
          <h1 className="font-press text-white text-sm md:text-base text-retro-shadow-blue uppercase tracking-tight">
            PeerLearn Arcade
          </h1>
          <p className="font-pixel text-lg text-blue-400 mt-1 uppercase">
            Enter PeerLearn
          </p>
        </div>

        {/* Card */}
        <div className="bg-black border-4 border-[#3b82f6] shadow-[0_6px_0_#1d4ed8] p-6 md:p-8">
          {/* Mode Toggle */}
          <div className="flex bg-zinc-950 border-2 border-zinc-800 p-1 mb-6">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                  setSuccess(null);
                }}
                className={`w-full font-press text-[9px] py-2 uppercase transition-all cursor-pointer ${
                  mode === m
                    ? "bg-[#3b82f6] text-black font-bold"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {m === "login" ? "SIGN IN" : "REGISTER"}
              </button>
            ))}
          </div>

          {/* Error / Success Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-3 bg-rose-950/50 border-2 border-rose-500 font-pixel text-rose-400 text-base"
              >
                ❌ {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 p-3 bg-emerald-950/50 border-2 border-emerald-500 font-pixel text-emerald-400 text-base"
              >
                ✅ {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === "signup" && (
                <motion.div
                  key="signup-extra"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <div>
                    <label className="text-[9px] font-press text-zinc-400 uppercase block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your Nickname"
                      className="w-full bg-zinc-950 text-white font-pixel text-lg p-2.5 border-2 border-zinc-700 focus:border-[#3b82f6] outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-press text-zinc-400 uppercase block mb-1">
                        College
                      </label>
                      <input
                        type="text"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        placeholder="e.g. MIT"
                        className="w-full bg-zinc-950 text-white font-pixel text-lg p-2.5 border-2 border-zinc-700 focus:border-[#3b82f6] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-press text-zinc-400 uppercase block mb-1">
                        Course
                      </label>
                      <input
                        type="text"
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        placeholder="e.g. CS"
                        className="w-full bg-zinc-950 text-white font-pixel text-lg p-2.5 border-2 border-zinc-700 focus:border-[#3b82f6] outline-none"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="text-[9px] font-press text-zinc-400 uppercase block mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hero@college.edu"
                className="w-full bg-zinc-950 text-white font-pixel text-lg p-2.5 border-2 border-zinc-700 focus:border-[#3b82f6] outline-none"
              />
            </div>

            <div>
              <label className="text-[9px] font-press text-zinc-400 uppercase block mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full bg-zinc-950 text-white font-pixel text-lg p-2.5 border-2 border-zinc-700 focus:border-[#3b82f6] outline-none"
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full bg-[#3b82f6] text-black font-press text-[10px] py-3 border-2 border-white shadow-[0_4px_0_#1d4ed8] hover:bg-[#2563eb] disabled:opacity-60 disabled:shadow-none cursor-pointer uppercase font-bold flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="animate-pulse">
                  {mode === "login" ? "LOGGING IN..." : "CREATING ACCOUNT..."}
                </span>
              ) : mode === "login" ? (
                "🚀 ENTER PEERLEARN"
              ) : (
                "🛡️ CREATE ACCOUNT"
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-[1px] bg-zinc-800" />
            <span className="font-press text-[8px] text-zinc-600 uppercase">OR</span>
            <div className="flex-1 h-[1px] bg-zinc-800" />
          </div>

          {/* Google OAuth */}
          <motion.button
            onClick={handleGoogleLogin}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-zinc-950 text-white font-press text-[9px] py-2.5 border-2 border-zinc-700 hover:border-zinc-500 cursor-pointer uppercase flex items-center justify-center gap-2"
          >
            <span className="text-base">G</span>
            <span>Continue with Google</span>
          </motion.button>
        </div>

        {/* Footer */}
        <p className="text-center font-pixel text-zinc-600 text-base mt-4">
          {mode === "login"
            ? "New here? Switch to REGISTER above!"
            : "Already have an account? Switch to SIGN IN above!"}
        </p>
      </motion.div>
    </div>
  );
}
