import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");

    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !authUser.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", authUser.user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        {
          status: 403,
          headers: corsHeaders,
        }
      );
    }

    const { full_name, email, password, role } = await req.json();

    const allowedRoles = ["admin", "staff", "patient"];

    if (!allowedRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: "Invalid role" }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    if (!full_name || !email || !password) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    if (password.length < 12) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 12 characters" }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) throw error;

    const { error: profileInsertError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: data.user.id,
        full_name,
        role,
      });

    if (profileInsertError) {
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);
      throw profileInsertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId: data.user.id,
      }),
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        error: "Failed to create user",
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
