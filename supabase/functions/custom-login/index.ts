import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Web Crypto API functions for password hashing
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(32));
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  
  const exportedKey = await crypto.subtle.exportKey("raw", key);
  const hashBuffer = new Uint8Array(exportedKey);
  
  // Combine salt and hash
  const combined = new Uint8Array(salt.length + hashBuffer.length);
  combined.set(salt);
  combined.set(hashBuffer, salt.length);
  
  // Return base64 encoded string
  return btoa(String.fromCharCode(...combined));
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    console.log('Hash format analysis:', {
      length: hash.length,
      startsWithDollar: hash.startsWith('$2'),
      isHexOnly: /^[a-f0-9]+$/i.test(hash)
    });

    // Check if it's a SHA-256 hash (64 hex characters) - existing users
    if (hash.length === 64 && /^[a-f0-9]+$/i.test(hash)) {
      console.log('Verifying using SHA-256 method (existing user)');
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      const match = hashHex === hash;
      console.log('SHA-256 verification result:', match);
      return match;
    }
    // Check if it's a bcrypt hash
    else if (hash.startsWith('$2')) {
      console.log('Verifying using bcrypt method');
      const bcrypt = await import("https://deno.land/x/bcrypt@v0.2.4/mod.ts");
      return await bcrypt.compare(password, hash);
    }
    // Otherwise assume it's Web Crypto API format
    else {
      console.log('Verifying using Web Crypto API method (new user)');
      const encoder = new TextEncoder();
      const combined = new Uint8Array(atob(hash).split('').map(c => c.charCodeAt(0)));
      
      // Extract salt (first 32 bytes) and stored hash (remaining bytes)
      const salt = combined.slice(0, 32);
      const storedHash = combined.slice(32);
      
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
      );
      
      const key = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
      
      const derivedKey = await crypto.subtle.exportKey("raw", key);
      const derivedHash = new Uint8Array(derivedKey);
      
      // Compare hashes
      if (derivedHash.length !== storedHash.length) {
        return false;
      }
      
      for (let i = 0; i < derivedHash.length; i++) {
        if (derivedHash[i] !== storedHash[i]) {
          return false;
        }
      }
      
      return true;
    }
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log('🔐 Custom login function called:', new Date().toISOString());
  
  if (req.method === "OPTIONS") {
    console.log('⚡ Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 Processing login request');

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user by email
    const { data: user, error: userError } = await supabase
      .from('custom_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    console.log('User lookup result:', { 
      user: user ? { 
        id: user.id, 
        email: user.email, 
        banned: user.banned, 
        email_verified: user.email_verified,
        password_hash_length: user.password_hash?.length,
        password_hash_start: user.password_hash?.substring(0, 10)
      } : null, 
      error: userError 
    });

    if (userError || !user) {
      console.log('User not found or error:', userError);
      return new Response(
        JSON.stringify({ error: "Invalid email or password" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is banned
    if (user.banned) {
      return new Response(
        JSON.stringify({ error: "Account suspended", banned: true, userInfo: { username: user.username, email: user.email } }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if email is verified
    if (!user.email_verified) {
      return new Response(
        JSON.stringify({ error: "Please verify your email address before signing in", emailNotVerified: true }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify password using Web Crypto API
    console.log('Starting password verification for user:', user.email);
    console.log('Password hash details:', {
      length: user.password_hash?.length,
      start: user.password_hash?.substring(0, 10),
      format: user.password_hash?.length === 64 ? 'SHA-256' : 
              user.password_hash?.startsWith('$2') ? 'bcrypt' : 'unknown'
    });
    
    const isValidPassword = await verifyPassword(password, user.password_hash);
    console.log('Password verification result:', isValidPassword);

    if (!isValidPassword) {
      console.log('Password verification failed for user:', user.email);
      return new Response(
        JSON.stringify({ error: "Invalid email or password" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log('Password verified successfully, proceeding with login');

    // Create session
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Extract and validate IP address
    const forwardedFor = req.headers.get('x-forwarded-for');
    let ipAddress = null; // Use null instead of 'unknown' for inet type
    
    if (forwardedFor) {
      // Get first IP and clean it
      const firstIp = forwardedFor.split(',')[0].trim();
      
      // Validate IP format more strictly
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (ipRegex.test(firstIp)) {
        // Additional validation - check if octets are valid (0-255)
        const octets = firstIp.split('.');
        const validOctets = octets.every(octet => {
          const num = parseInt(octet, 10);
          return num >= 0 && num <= 255;
        });
        
        if (validOctets) {
          ipAddress = firstIp;
        }
      }
    }
    
    // If we couldn't get a valid IP, use null (which is acceptable for nullable inet column)
    console.log('Final IP address for database:', ipAddress);

    const { error: sessionError } = await supabase
      .from('custom_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: req.headers.get('user-agent') || 'unknown',
      });

    if (sessionError) {
      console.error('Session insert error:', sessionError);
      console.error('IP address being inserted:', ipAddress);
      throw new Error(`Failed to create session: ${sessionError.message}`);
    }

    // Update last login
    await supabase
      .from('custom_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Return user data and session token
    const userData = {
      id: user.id,
      email: user.email,
      username: user.username,
      email_verified: user.email_verified,
      role: user.role,
      avatar_url: user.avatar_url,
      full_name: user.full_name,
      created_at: user.created_at,
    };

    return new Response(
      JSON.stringify({ 
        success: true,
        user: userData,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in custom-login:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});