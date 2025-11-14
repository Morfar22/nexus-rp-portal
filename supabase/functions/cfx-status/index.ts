import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Fetching CFX status...')
    
    const response = await fetch('https://status.cfx.re/history.atom')
    
    if (!response.ok) {
      throw new Error(`CFX status API returned ${response.status}`)
    }

    const text = await response.text()
    console.log('CFX status fetched successfully')

    return new Response(
      JSON.stringify({ text }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error fetching CFX status:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        text: null 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
