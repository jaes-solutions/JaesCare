import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        console.log("Password recovery session started.");
      }
    });

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/login", { replace: true });
      }
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleUpdatePassword = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

    if (!strongPassword.test(password)) {
      alert(
        "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.",
      );
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    await supabase.auth.signOut();

    alert(
      "Password updated successfully. Please log in with your new password.",
    );

    navigate("/login", { replace: true });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-white via-slate-100 to-slate-300 dark:from-[#050a11] dark:via-[#11161d] dark:to-[#050a11] transition-colors duration-500">
      {/* Decorative blurred glows */}
      <div className="pointer-events-none absolute -top-40 -left-32 w-96 h-96 rounded-full bg-sky-400 opacity-30 blur-3xl dark:opacity-40 dark:bg-sky-500" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 w-96 h-96 rounded-full bg-emerald-300 opacity-20 blur-3xl dark:opacity-30 dark:bg-emerald-400" />
      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-300/40 dark:border-slate-700/70 bg-white/80 dark:bg-[#10151c]/80 shadow-2xl backdrop-blur-2xl p-8 pt-10">
        {/* Logos */}
        <img
          src="/logo-dark.png"
          alt="JAES Care Logo Dark"
          className="hidden dark:block h-14 mx-auto"
        />
        <img
          src="/logo-light.png"
          alt="JAES Care Logo Light"
          className="block dark:hidden h-14 mx-auto"
        />

        {/* Heading */}
        <h1 className="text-3xl font-bold text-center text-slate-900 dark:text-white mt-2">
          Reset Password
        </h1>
        <p className="mt-2 text-center text-base text-slate-600 dark:text-slate-300 font-medium">
          Enter a new password for your JAES Care account.
        </p>
        {/* Password Inputs */}
        <div className="mt-8 space-y-5">
          <div>
            <p className="mb-2 ml-1 text-sm font-medium text-slate-600 dark:text-slate-300">
              Enter Password
            </p>
            <div className="flex items-center rounded-2xl border-2 border-sky-400 bg-white/50 dark:bg-[#151b23]/60 backdrop-blur-xl px-4 py-3 shadow-[0_0_25px_rgba(14,165,233,0.25)] focus-within:shadow-[0_0_30px_rgba(14,165,233,0.45)] focus-within:border-sky-400 transition-all">
              <Lock className="w-5 h-5 text-sky-400 mr-3" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-0 rounded-xl px-2 py-2"
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                className="ml-2 p-1 text-slate-500 hover:text-sky-500 focus:outline-none"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <div>
            <p className="mb-2 ml-1 text-sm font-medium text-slate-600 dark:text-slate-300">
              Re-enter Password
            </p>
            <div className="flex items-center rounded-2xl border-2 border-sky-400 bg-white/50 dark:bg-[#151b23]/60 backdrop-blur-xl px-4 py-3 shadow-[0_0_25px_rgba(14,165,233,0.25)] focus-within:shadow-[0_0_30px_rgba(14,165,233,0.45)] focus-within:border-sky-400 transition-all">
              <Lock className="w-5 h-5 text-sky-400 mr-3" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-0 rounded-xl px-2 py-2"
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                className="ml-2 p-1 text-slate-500 hover:text-sky-500 focus:outline-none"
                onClick={() => setShowConfirmPassword((v) => !v)}
                tabIndex={-1}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <button
            onClick={handleUpdatePassword}
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 transition-all duration-200 py-3 font-semibold text-white shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
        {/* Password Requirements */}
        <div className="mt-7 bg-white/70 dark:bg-[#151b23]/70 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 flex items-start gap-3 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-500 mt-1 shrink-0" />
          <div className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-sky-600 dark:text-sky-400">
              Password requirements:
            </span>
            <ul className="list-disc ml-5 mt-1 space-y-0.5">
              <li>Minimum 8 characters</li>
              <li>Uppercase &amp; lowercase letter</li>
              <li>Number</li>
              <li>Special character</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
