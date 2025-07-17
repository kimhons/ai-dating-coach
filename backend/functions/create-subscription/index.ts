Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { priceId, customerEmail, customerName, planType } = await req.json();
    
    if (!priceId || !customerEmail || !planType) {
      throw new Error('Missing required parameters: priceId, customerEmail, planType');
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    if (!stripeSecretKey || !serviceRoleKey || !supabaseUrl) {
      throw new Error('Missing required environment variables');
    }

    // Get user ID from auth token
    let userId = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': serviceRoleKey
        }
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        userId = userData.id;
      }
    }

    console.log('Creating subscription for user:', userId, 'plan:', planType);

    // Check for existing Stripe customer
    let customerId = null;
    const customerSearchResponse = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(customerEmail)}&limit=1`, {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`
      }
    });
    
    if (customerSearchResponse.ok) {
      const customerData = await customerSearchResponse.json();
      if (customerData.data && customerData.data.length > 0) {
        customerId = customerData.data[0].id;
        console.log('Found existing customer:', customerId);
      }
    }

    // Create customer if not found
    if (!customerId) {
      const customerParams = new URLSearchParams({
        email: customerEmail,
        'metadata[user_id]': userId || '',
        'metadata[plan_type]': planType
      });
      
      if (customerName) {
        customerParams.append('name', customerName);
      }

      const createCustomerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: customerParams.toString()
      });

      if (!createCustomerResponse.ok) {
        const errorData = await createCustomerResponse.text();
        throw new Error(`Failed to create customer: ${errorData}`);
      }

      const newCustomer = await createCustomerResponse.json();
      customerId = newCustomer.id;
      console.log('Created new customer:', customerId);
    }

    // Create Checkout Session
    const checkoutParams = new URLSearchParams({
      customer: customerId,
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      success_url: `${req.headers.get('origin') || 'https://localhost:3000'}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin') || 'https://localhost:3000'}/pricing?subscription=cancelled`,
      'metadata[user_id]': userId || '',
      'metadata[plan_type]': planType,
      'subscription_data[metadata][user_id]': userId || '',
      'subscription_data[metadata][plan_type]': planType
    });

    const checkoutResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: checkoutParams.toString()
    });

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.text();
      throw new Error(`Failed to create checkout session: ${errorData}`);
    }

    const checkoutSession = await checkoutResponse.json();
    console.log('Checkout session created:', checkoutSession.id);

    return new Response(JSON.stringify({
      data: {
        checkoutSessionId: checkoutSession.id,
        checkoutUrl: checkoutSession.url,
        customerId: customerId,
        planType: planType
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    
    return new Response(JSON.stringify({
      error: {
        code: 'SUBSCRIPTION_CREATION_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});