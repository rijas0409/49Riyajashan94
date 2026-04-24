import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: caller },
    } = await anonClient.auth.getUser();

    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: callerRole } = await anonClient.rpc("get_user_role", {
      _user_id: caller.id,
    });

    if (callerRole !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent self-deletion
    if (user_id === caller.id) {
      return new Response(
        JSON.stringify({ error: "Cannot delete your own account" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use service role client to perform deletions
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Delete related data first (in order to avoid FK issues)
    // These may fail silently if no rows exist, that's fine
    await adminClient.from("messages").delete().eq("sender_id", user_id);
    await adminClient.from("chats").delete().or(`buyer_id.eq.${user_id},seller_id.eq.${user_id}`);
    await adminClient.from("favorites").delete().eq("user_id", user_id);
    await adminClient.from("wishlist_pets").delete().eq("user_id", user_id);
    await adminClient.from("wishlist_products").delete().eq("user_id", user_id);
    await adminClient.from("reports").delete().eq("reporter_id", user_id);
    await adminClient.from("addresses").delete().eq("user_id", user_id);
    await adminClient.from("vet_reviews").delete().eq("user_id", user_id);
    await adminClient.from("vet_appointments").delete().or(`user_id.eq.${user_id},vet_id.eq.${user_id}`);
    await adminClient.from("vet_earnings").delete().eq("vet_id", user_id);
    await adminClient.from("seller_earnings").delete().eq("seller_id", user_id);
    await adminClient.from("subscriptions").delete().eq("seller_id", user_id);
    await adminClient.from("transport_requests").delete().or(`buyer_id.eq.${user_id},seller_id.eq.${user_id},assigned_partner_id.eq.${user_id}`);
    await adminClient.from("orders").delete().or(`buyer_id.eq.${user_id},seller_id.eq.${user_id}`);

    // Delete pets and their related data
    const { data: userPets } = await adminClient.from("pets").select("id").eq("owner_id", user_id);
    if (userPets && userPets.length > 0) {
      const petIds = userPets.map((p: any) => p.id);
      await adminClient.from("pet_vaccinations").delete().in("pet_id", petIds);
      await adminClient.from("pet_documents").delete().in("pet_id", petIds);
      await adminClient.from("pets").delete().eq("owner_id", user_id);
    }

    // Delete products
    await adminClient.from("shop_products").delete().eq("seller_id", user_id);

    // Delete vet profile
    await adminClient.from("vet_profiles").delete().eq("user_id", user_id);

    // Delete user_roles and profile
    await adminClient.from("user_roles").delete().eq("user_id", user_id);
    await adminClient.from("profiles").delete().eq("id", user_id);

    // Finally delete from auth.users
    const { error: authError } = await adminClient.auth.admin.deleteUser(user_id);

    if (authError) {
      return new Response(
        JSON.stringify({ error: `Failed to delete auth user: ${authError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "User permanently deleted" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
