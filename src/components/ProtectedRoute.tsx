import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole: "admin" | "staff" | "patient";
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (error || !profile) {
        setAuthorized(false);
      } else {
        setAuthorized(profile.role === requiredRole);
      }
    } catch {
      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authorized) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
