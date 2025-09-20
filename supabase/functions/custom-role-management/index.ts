import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOM-ROLE-MANAGEMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { action, data } = await req.json();
    logStep("Function started", { action });

    switch (action) {
      case "get_staff_roles":
        return await getStaffRoles(supabaseClient);
      
      case "get_permissions":
        return await getPermissions(supabaseClient);
      
      case "get_role_permissions":
        if (!data.roleId) {
          throw new Error("Role ID is required for get_role_permissions");
        }
        return await getRolePermissions(supabaseClient, data.roleId);
      
      case "get_user_role_assignments":
        return await getUserRoleAssignments(supabaseClient);
      
      case "create_role":
        return await createRole(supabaseClient, data);
      
      case "update_role":
        return await updateRole(supabaseClient, data);
      
      case "delete_role":
        return await deleteRole(supabaseClient, data.roleId);
      
      case "update_role_permissions":
        return await updateRolePermissions(supabaseClient, data.roleId, data.permissionIds);
      
      case "assign_role_to_user":
        return await assignRoleToUser(supabaseClient, data);
      
      case "remove_user_role":
        return await removeUserRole(supabaseClient, data.assignmentId);
      
      case "get_user_data":
        return await getUserData(supabaseClient);

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    logStep("ERROR", { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function getStaffRoles(supabaseClient: any) {
  logStep("Getting staff roles");
  
  const { data, error } = await supabaseClient
    .from('staff_roles')
    .select('*')
    .order('hierarchy_level', { ascending: true });

  if (error) throw error;

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function getPermissions(supabaseClient: any) {
  logStep("Getting permissions");
  
  const { data, error } = await supabaseClient
    .from('permissions')
    .select('*')
    .order('category, display_name');

  if (error) throw error;

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function getRolePermissions(supabaseClient: any, roleId: string) {
  logStep("Getting role permissions", { roleId });
  
  if (!roleId) {
    throw new Error("Role ID is required");
  }
  
  const { data, error } = await supabaseClient
    .from('role_permissions')
    .select(`
      role_id,
      permission_id,
      permissions!inner(name)
    `)
    .eq('role_id', roleId);

  if (error) {
    logStep("Error in getRolePermissions", { error: error.message, roleId });
    throw error;
  }

  const formattedData = data?.map((item: any) => ({
    role_id: item.role_id,
    permission_id: item.permission_id,
    permission_name: item.permissions.name
  })) || [];

  return new Response(JSON.stringify(formattedData), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function getUserRoleAssignments(supabaseClient: any) {
  logStep("Getting user role assignments");
  
  const { data, error } = await supabaseClient
    .from('user_role_assignments')
    .select(`
      *,
      staff_roles!inner(
        id,
        name,
        display_name,
        color,
        hierarchy_level
      ),
      custom_users!inner(
        id,
        username,
        email
      )
    `)
    .eq('is_active', true)
    .order('assigned_at', { ascending: false });

  if (error) {
    logStep("Error in getUserRoleAssignments", { error: error.message });
    throw error;
  }

  const formattedData = data?.map((item: any) => ({
    id: item.id,
    user_id: item.user_id,
    role_id: item.role_id,
    assigned_at: item.assigned_at,
    assigned_by: item.assigned_by,
    expires_at: item.expires_at,
    is_active: item.is_active,
    display_name: item.staff_roles.display_name,
    color: item.staff_roles.color,
    hierarchy_level: item.staff_roles.hierarchy_level,
    username: item.custom_users?.username || 'Ukendt bruger',
    email: item.custom_users?.email || 'Ukendt email'
  })) || [];

  return new Response(JSON.stringify(formattedData), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function createRole(supabaseClient: any, roleData: any) {
  logStep("Creating role", roleData);
  
  const { data, error } = await supabaseClient
    .from('staff_roles')
    .insert([{
      name: roleData.name,
      display_name: roleData.display_name,
      description: roleData.description,
      color: roleData.color,
      hierarchy_level: roleData.hierarchy_level,
      is_active: true
    }])
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function updateRole(supabaseClient: any, roleData: any) {
  logStep("Updating role", roleData);
  
  const { data, error } = await supabaseClient
    .from('staff_roles')
    .update({
      display_name: roleData.display_name,
      description: roleData.description,
      color: roleData.color,
      hierarchy_level: roleData.hierarchy_level,
      is_active: roleData.is_active
    })
    .eq('id', roleData.id)
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function deleteRole(supabaseClient: any, roleId: string) {
  logStep("Deleting role", { roleId });
  
  // First check if role is assigned to any users
  const { data: assignments } = await supabaseClient
    .from('user_role_assignments')
    .select('id')
    .eq('role_id', roleId)
    .eq('is_active', true);

  if (assignments && assignments.length > 0) {
    throw new Error("Cannot delete role that is assigned to users. Remove assignments first.");
  }

  const { error } = await supabaseClient
    .from('staff_roles')
    .delete()
    .eq('id', roleId);

  if (error) throw error;

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function updateRolePermissions(supabaseClient: any, roleId: string, permissionIds: string[]) {
  logStep("Updating role permissions", { roleId, permissionCount: permissionIds.length });
  
  // First delete existing permissions for this role
  const { error: deleteError } = await supabaseClient
    .from('role_permissions')
    .delete()
    .eq('role_id', roleId);

  if (deleteError) throw deleteError;

  // Then insert new permissions
  if (permissionIds.length > 0) {
    const newRolePermissions = permissionIds.map(permissionId => ({
      role_id: roleId,
      permission_id: permissionId
    }));

    const { error: insertError } = await supabaseClient
      .from('role_permissions')
      .insert(newRolePermissions);

    if (insertError) throw insertError;
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function assignRoleToUser(supabaseClient: any, assignmentData: any) {
  logStep("Assigning role to user", assignmentData);
  
  const { data, error } = await supabaseClient
    .from('user_role_assignments')
    .insert([{
      user_id: assignmentData.user_id,
      role_id: assignmentData.role_id,
      expires_at: assignmentData.expires_at || null,
      is_active: true
    }])
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function removeUserRole(supabaseClient: any, assignmentId: string) {
  logStep("Removing user role", { assignmentId });
  
  const { error } = await supabaseClient
    .from('user_role_assignments')
    .update({ is_active: false })
    .eq('id', assignmentId);

  if (error) throw error;

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function getUserData(supabaseClient: any) {
  logStep("Getting user data");
  
  const { data, error } = await supabaseClient
    .from('custom_users')
    .select('id, username, email, role, created_at')
    .eq('banned', false)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}