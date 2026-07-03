import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import carelogoDark from "../assets/carelogo.png";
import carelogoLight from "../assets/carelogo-light.png";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      alert("Please enter your email address first");
      return;
    }

    const redirectUrl = new URL(
      "/reset-password",
      window.location.origin,
    ).toString();

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert(
      "If an account exists for this email address, a password reset link has been sent.",
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert("Invalid email or password");
        return;
      }

      const user = data.user;

      if (!user) {
        alert("User not found");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        alert(profileError.message);
        return;
      }

      if (!profile) {
        alert("Profile not found");
        return;
      }

      const role = profile.role?.toLowerCase()?.trim();

      if (role === "admin") {
        navigate("/admin-dashboard");
        return;
      }

      if (role === "staff") {
        navigate("/staff-dashboard");
        return;
      }

      if (role === "patient") {
        navigate("/patient-dashboard");
        return;
      }

      alert("Unauthorized role");
      await supabase.auth.signOut();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white flex items-center justify-center px-3 sm:px-6 py-6 sm:py-10 overflow-x-hidden overflow-y-auto relative transition-colors duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(134,239,172,0.10),transparent_30%)]" />

      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-8 flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white text-xs sm:text-sm transition-all duration-300 z-20"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="relative z-10 w-full max-w-[480px] mx-auto rounded-[20px] sm:rounded-[28px] border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0b0f14]/95 backdrop-blur-2xl px-4 py-5 sm:p-7 shadow-2xl shadow-black/20 dark:shadow-black/40 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-sky-400/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-300/10 blur-3xl rounded-full" />

        <div className="relative z-10 flex justify-center mb-4 sm:mb-6">
          <>
            <img
              src={carelogoLight}
              alt="JAES Care Logo"
              className="h-16 sm:h-20 w-auto object-contain block dark:hidden"
            />
            <img
              src={carelogoDark}
              alt="JAES Care Logo"
              className="h-16 sm:h-20 w-auto object-contain hidden dark:block"
            />
          </>
        </div>

        <div className="relative z-10 text-center mb-7">
          <h1 className="text-lg sm:text-2xl font-bold mb-3 leading-tight">
            Sign In To JAES Care
          </h1>

          <p className="text-gray-600 dark:text-gray-500 text-xs sm:text-sm leading-6 max-w-md mx-auto">
            Accounts are securely created and managed by your organisation
            administrator.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="relative z-10 space-y-4 sm:space-y-5"
        >
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl border border-black/10 dark:border-white/5 bg-gray-100 dark:bg-[#11161d]/90 px-5 text-black dark:text-white placeholder:text-gray-500 outline-none focus:border-sky-400/40 transition-all duration-300"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl border border-black/10 dark:border-white/5 bg-gray-100 dark:bg-[#11161d]/90 px-5 pr-14 text-black dark:text-white placeholder:text-gray-500 outline-none focus:border-emerald-300/40 transition-all duration-300"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black dark:hover:text-white transition-all duration-300"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-3">
            <label className="flex items-center gap-2 text-gray-600 dark:text-gray-500 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border border-black/10 dark:border-white/10 bg-white dark:bg-[#11161d]"
              />
              Keep me signed in
            </label>

            <button
              type="button"
              className="text-sky-300 hover:text-sky-200 transition-all duration-300"
              onClick={handleResetPassword}
            >
              Reset Password
            </button>
          </div>

          <button
            type="submit"
            className="w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl border border-black/10 dark:border-white/10 bg-gradient-to-r from-sky-400 to-emerald-300 text-black text-sm sm:text-base font-semibold tracking-wide shadow-lg shadow-sky-500/10 hover:opacity-95 transition-all duration-300"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <div className="rounded-xl sm:rounded-2xl border border-black/10 dark:border-white/5 bg-gray-100 dark:bg-[#11161d]/70 p-3 sm:p-4 text-center backdrop-blur-xl">
            <p className="text-gray-600 dark:text-gray-500 text-xs leading-6">
              Need access? Contact your administrator to create your employee or
              resident account.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
