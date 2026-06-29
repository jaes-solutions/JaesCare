import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-[#050a11] px-4">
      <div className="w-full max-w-md rounded-2xl border border-sky-500/20 bg-[#11161d] p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-white">Reset Password</h1>
        <p className="mt-2 text-sm text-gray-400">
          Enter your new password below.
        </p>

        <div className="mt-6 space-y-4">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-[#0b1018] p-3 text-white outline-none focus:border-sky-400"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-[#0b1018] p-3 text-white outline-none focus:border-sky-400"
          />

          <button
            onClick={handleUpdatePassword}
            disabled={loading}
            className="w-full rounded-lg bg-sky-500 p-3 font-semibold text-white transition hover:bg-sky-600 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
