import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const locale = url.searchParams.get('locale');

    // Fetch active translation overrides
    let query = supabase
      .from('translation_overrides')
      .select('*')
      .eq('is_active', true);

    if (locale) {
      query = query.eq('locale', locale);
    }

    const { data: overrides, error } = await query;

    if (error) {
      console.error('Error fetching translation overrides:', error);
      throw error;
    }

    // Group by locale
    const translationsByLocale: Record<string, Record<string, string>> = {};

    for (const override of overrides || []) {
      if (!translationsByLocale[override.locale]) {
        translationsByLocale[override.locale] = {};
      }

      // Build nested object from dot-notated key
      const keys = override.translation_key.split('.');
      let current = translationsByLocale[override.locale];
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = override.value;
    }

    return new Response(
      JSON.stringify({ translations: translationsByLocale, success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Translation sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
