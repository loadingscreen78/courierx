// Supabase Edge Function: admin-create-cxbc-partner
// Creates or links a CXBC partner user + profile + role + partner record.
// Idempotent: handles existing users, blocks admin/warehouse users, links if possible.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type IndiaZone = "north" | "south" | "east" | "west" | "central" | "northeast";

type CreatePartnerBody = {
  email: string;
  password: string;
  businessName: string;
  ownerName: string;
  phone: string;
  panNumber: string;
  gstNumber?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  zone: IndiaZone;
};

type ResponseBody = {
  user_id?: string;
  partner_id?: string;
  linked_existing_user?: boolean;
  error?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: ResponseBody) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return json(500, { error: "Missing server configuration" });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    console.error("No auth token provided");
    return json(401, { error: "Missing auth token" });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Authenticate caller
  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData?.user) {
    console.error("Auth failed:", userErr?.message);
    return json(401, { error: "Unauthorized" });
  }

  console.log("Request from user:", userData.user.id);

  // Authorize caller - must be admin
  const { data: roles, error: rolesErr } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);

  if (rolesErr) {
    console.error("Failed to check caller roles:", rolesErr.message);
    return json(500, { error: "Failed to check permissions" });
  }

  const isAdmin = roles?.some((r) => r.role === "admin") ?? false;
  if (!isAdmin) {
    console.error("Caller is not admin");
    return json(403, { error: "Forbidden - Admin access required" });
  }

  // Parse request body
  let body: CreatePartnerBody;
  try {
    body = (await req.json()) as CreatePartnerBody;
  } catch {
    console.error("Invalid JSON body");
    return json(400, { error: "Invalid JSON body" });
  }

  // Validate required fields
  if (
    !body?.email ||
    !body?.password ||
    !body?.businessName ||
    !body?.ownerName ||
    !body?.phone ||
    !body?.panNumber ||
    !body?.address ||
    !body?.city ||
    !body?.state ||
    !body?.pincode ||
    !body?.zone
  ) {
    console.error("Missing required fields");
    return json(400, { error: "Missing required fields" });
  }

  const email = body.email.toLowerCase().trim();
  console.log("Creating/linking partner for email:", email);

  // Check if user already exists in auth
  const { data: existingAuthUsers, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listErr) {
    console.error("Failed to list users:", listErr.message);
    return json(500, { error: "Failed to check existing users" });
  }

  const existingUser = existingAuthUsers?.users?.find(
    (u) => u.email?.toLowerCase() === email
  );

  let userId: string;
  let linkedExistingUser = false;

  if (existingUser) {
    userId = existingUser.id;
    console.log("Found existing user with ID:", userId);

    // Check if this user has admin or warehouse_operator role (blocked)
    const { data: existingRoles, error: existRolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (existRolesErr) {
      console.error("Failed to check existing user roles:", existRolesErr.message);
      return json(500, { error: "Failed to verify user roles" });
    }

    const hasBlockedRole = existingRoles?.some(
      (r) => r.role === "admin" || r.role === "warehouse_operator"
    );

    if (hasBlockedRole) {
      console.error("User has admin/warehouse role, cannot convert to partner");
      return json(400, { 
        error: "This email belongs to an admin or warehouse operator. Cannot create partner with this email." 
      });
    }

    // Check if already a partner
    const { data: existingPartner, error: partnerCheckErr } = await supabaseAdmin
      .from("cxbc_partners")
      .select("id, status")
      .eq("user_id", userId)
      .maybeSingle();

    if (partnerCheckErr) {
      console.error("Failed to check existing partner:", partnerCheckErr.message);
      return json(500, { error: "Failed to check existing partner status" });
    }

    if (existingPartner) {
      if (existingPartner.status === "approved") {
        console.log("User is already an approved partner:", existingPartner.id);
        return json(200, { 
          user_id: userId, 
          partner_id: existingPartner.id,
          linked_existing_user: true
        });
      } else {
        // Update existing partner to approved
        const { error: updatePartnerErr } = await supabaseAdmin
          .from("cxbc_partners")
          .update({
            status: "approved",
            approved_at: new Date().toISOString(),
            business_name: body.businessName,
            owner_name: body.ownerName,
            phone: body.phone,
            pan_number: body.panNumber,
            gst_number: body.gstNumber || null,
            address: body.address,
            city: body.city,
            state: body.state,
            pincode: body.pincode,
            zone: body.zone,
          })
          .eq("id", existingPartner.id);

        if (updatePartnerErr) {
          console.error("Failed to update existing partner:", updatePartnerErr.message);
          return json(500, { error: "Failed to update partner status" });
        }

        console.log("Updated existing partner to approved:", existingPartner.id);
        return json(200, { 
          user_id: userId, 
          partner_id: existingPartner.id,
          linked_existing_user: true
        });
      }
    }

    linkedExistingUser = true;
    console.log("Will link existing user to new partner account");

    // Ensure profile exists for existing user
    const { data: existingProfile, error: profileCheckErr } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileCheckErr) {
      console.error("Failed to check profile:", profileCheckErr.message);
    }

    if (!existingProfile) {
      console.log("Creating profile for existing user");
      const { error: profileInsertErr } = await supabaseAdmin.from("profiles").insert({
        user_id: userId,
        full_name: body.ownerName,
        email: email,
        phone_number: body.phone,
        aadhaar_verified: true,
        kyc_completed_at: new Date().toISOString(),
      });

      if (profileInsertErr) {
        console.error("Failed to create profile:", profileInsertErr.message);
        // Non-fatal, continue
      }
    } else {
      // Update existing profile
      const { error: profileUpdateErr } = await supabaseAdmin
        .from("profiles")
        .update({
          full_name: body.ownerName,
          phone_number: body.phone,
          aadhaar_verified: true,
          kyc_completed_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (profileUpdateErr) {
        console.error("Failed to update profile:", profileUpdateErr.message);
      }
    }

  } else {
    // Create new auth user
    console.log("Creating new auth user");
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: body.password,
      email_confirm: true,
    });

    if (createErr || !created?.user) {
      console.error("Failed to create auth user:", createErr?.message);
      return json(400, { error: createErr?.message ?? "Failed to create user" });
    }

    userId = created.user.id;
    console.log("Created new auth user:", userId);

    // Create profile for new user
    const { error: profileErr } = await supabaseAdmin.from("profiles").insert({
      user_id: userId,
      full_name: body.ownerName,
      email: email,
      phone_number: body.phone,
      aadhaar_verified: true,
      kyc_completed_at: new Date().toISOString(),
    });

    if (profileErr) {
      console.error("Failed to create profile:", profileErr.message);
      // Delete auth user on failure
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return json(500, { error: "Failed to create user profile" });
    }
    console.log("Created profile for user:", userId);
  }

  // Ensure cxbc_partner role exists (upsert pattern)
  const { data: existingPartnerRole, error: roleCheckErr } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "cxbc_partner")
    .maybeSingle();

  if (roleCheckErr) {
    console.error("Failed to check partner role:", roleCheckErr.message);
  }

  if (!existingPartnerRole) {
    console.log("Assigning cxbc_partner role");
    const { error: roleErr } = await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role: "cxbc_partner",
    });

    if (roleErr) {
      console.error("Failed to assign role:", roleErr.message);
      // If we created a new user, clean up
      if (!linkedExistingUser) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }
      return json(500, { error: "Failed to assign partner role" });
    }
    console.log("Assigned cxbc_partner role");
  } else {
    console.log("User already has cxbc_partner role");
  }

  // Create CXBC partner record
  console.log("Creating CXBC partner record");
  const { data: partnerRow, error: partnerErr } = await supabaseAdmin
    .from("cxbc_partners")
    .insert({
      user_id: userId,
      business_name: body.businessName,
      owner_name: body.ownerName,
      email: email,
      phone: body.phone,
      pan_number: body.panNumber,
      gst_number: body.gstNumber || null,
      address: body.address,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      zone: body.zone,
      status: "approved",
      approved_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (partnerErr) {
    console.error("Failed to create partner record:", partnerErr.message);
    // If we created a new user, clean up
    if (!linkedExistingUser) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    }
    return json(400, { error: partnerErr.message });
  }

  console.log("Successfully created partner:", partnerRow?.id);

  return json(200, {
    user_id: userId,
    partner_id: partnerRow?.id,
    linked_existing_user: linkedExistingUser,
  });
});
