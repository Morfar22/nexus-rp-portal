import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const sessionId = formData.get('sessionId') as string;
    const senderId = formData.get('senderId') as string;
    const senderType = formData.get('senderType') as string;
    const messageId = formData.get('messageId') as string;

    if (!file || !sessionId || !senderType) {
      throw new Error('File, session ID, and sender type are required');
    }

    console.log('Processing file upload:', {
      fileName: file.name,
      fileSize: file.size,
      sessionId,
      senderType
    });

    // Validate file size (max 10MB)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed. Supported types: Images (JPEG, PNG, GIF, WebP), PDF, Text, Word documents');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const uniqueFileName = `${sessionId}/${timestamp}_${crypto.randomUUID()}.${fileExt}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-files')
      .upload(uniqueFileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('chat-files')
      .getPublicUrl(uniqueFileName);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get file URL');
    }

    // Store file attachment record
    const { data: attachmentData, error: attachmentError } = await supabase
      .from('chat_file_attachments')
      .insert({
        session_id: sessionId,
        message_id: messageId,
        sender_id: senderId,
        sender_type: senderType,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_url: urlData.publicUrl
      })
      .select()
      .single();

    if (attachmentError) {
      console.error('Database error:', attachmentError);
      throw new Error(`Failed to save file record: ${attachmentError.message}`);
    }

    console.log('File uploaded successfully:', attachmentData);

    return new Response(JSON.stringify({
      success: true,
      attachment: attachmentData,
      fileUrl: urlData.publicUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat file upload:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});