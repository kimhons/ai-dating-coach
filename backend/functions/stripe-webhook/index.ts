// Web Crypto API signature verification for Deno
async function verifyStripeSignature(body: string, signatureHeader: string, secret: string): Promise<boolean> {
    const elements = signatureHeader.split(',');
    const timestamp = elements.find(el => el.startsWith('t='))?.split('=')[1];
    const receivedSignature = elements.find(el => el.startsWith('v1='))?.split('=')[1];
    
    if (!timestamp || !receivedSignature) {
        console.log('Missing timestamp or signature in header');
        return false;
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );
    
    const data = encoder.encode(`${timestamp}.${body}`);
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');
    
    return expectedSignature === receivedSignature;
}

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || 'whsec_test_placeholder';
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Missing required environment variables');
        }

        const body = await req.text();
        const signature = req.headers.get('stripe-signature');

        console.log('Received webhook:', { hasSignature: !!signature, bodyLength: body.length });

        // Verify webhook signature (skip in development if no secret)
        if (signature && webhookSecret !== 'whsec_test_placeholder') {
            const valid = await verifyStripeSignature(body, signature, webhookSecret);
            if (!valid) {
                throw new Error('Invalid signature');
            }

            const elements = signature.split(',');
            const timestamp = elements.find(el => el.startsWith('t='))?.split('=')[1];
            const currentTime = Math.floor(Date.now() / 1000);
            const webhookTime = parseInt(timestamp || '0');
            const tolerance = 300; // 5 minutes
            
            if (Math.abs(currentTime - webhookTime) > tolerance) {
                throw new Error('Timestamp too old');
            }
        }

        const event = JSON.parse(body);
        console.log('Processing webhook event:', event.type, event.id);

        switch (event.type) {
            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object, supabaseUrl, serviceRoleKey);
                break;
            
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object, supabaseUrl, serviceRoleKey);
                break;
            
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object, supabaseUrl, serviceRoleKey);
                break;
            
            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object, supabaseUrl, serviceRoleKey);
                break;
            
            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object, supabaseUrl, serviceRoleKey);
                break;
                
            case 'customer.subscription.trial_will_end':
                await handleTrialWillEnd(event.data.object, supabaseUrl, serviceRoleKey);
                break;
                
            default:
                console.log('Unhandled event type:', event.type);
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Webhook error:', error);
        return new Response(JSON.stringify({ 
            error: error.message,
            timestamp: new Date().toISOString()
        }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper functions
async function handleSubscriptionCreated(subscription: any, supabaseUrl: string, serviceRoleKey: string) {
    console.log('Handling subscription created:', subscription.id);
    
    try {
        await updateSubscriptionInDatabase(subscription, supabaseUrl, serviceRoleKey);
        await updateUserPlanFromSubscription(subscription, supabaseUrl, serviceRoleKey);
        console.log('Subscription created successfully processed');
    } catch (error) {
        console.error('Error handling subscription created:', error);
        throw error;
    }
}

async function handleSubscriptionUpdated(subscription: any, supabaseUrl: string, serviceRoleKey: string) {
    console.log('Handling subscription updated:', subscription.id);
    
    try {
        await updateSubscriptionInDatabase(subscription, supabaseUrl, serviceRoleKey);
        await updateUserPlanFromSubscription(subscription, supabaseUrl, serviceRoleKey);
        
        if (subscription.cancel_at_period_end) {
            console.log('Subscription marked for cancellation at period end');
        }
        
        console.log('Subscription updated successfully processed');
    } catch (error) {
        console.error('Error handling subscription updated:', error);
        throw error;
    }
}

async function handleSubscriptionDeleted(subscription: any, supabaseUrl: string, serviceRoleKey: string) {
    console.log('Handling subscription deleted:', subscription.id);
    
    try {
        await updateSubscriptionInDatabase(subscription, supabaseUrl, serviceRoleKey);
        
        const userId = subscription.metadata?.user_id;
        if (userId) {
            await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subscription_tier: 'spark',
                    monthly_limit: 5,
                    updated_at: new Date().toISOString()
                })
            });
        }
        
        console.log('Subscription deletion successfully processed');
    } catch (error) {
        console.error('Error handling subscription deleted:', error);
        throw error;
    }
}

async function handlePaymentSucceeded(invoice: any, supabaseUrl: string, serviceRoleKey: string) {
    console.log('Handling payment succeeded for subscription:', invoice.subscription);
    
    try {
        if (invoice.billing_reason === 'subscription_cycle') {
            const customerId = invoice.customer;
            
            const subResponse = await fetch(`${supabaseUrl}/rest/v1/subscriptions?stripe_customer_id=eq.${customerId}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });
            
            if (subResponse.ok) {
                const subscriptions = await subResponse.json();
                const userSubscription = subscriptions[0];
                
                if (userSubscription && userSubscription.user_id) {
                    await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userSubscription.user_id}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            usage_count: 0,
                            last_usage_reset: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        })
                    });
                    
                    console.log('Usage count reset for new billing period');
                }
            }
        }
        
        console.log('Payment succeeded successfully processed');
    } catch (error) {
        console.error('Error handling payment succeeded:', error);
    }
}

async function handlePaymentFailed(invoice: any, supabaseUrl: string, serviceRoleKey: string) {
    console.log('Handling payment failed for subscription:', invoice.subscription);
    console.log('Payment failed - subscription may be suspended');
}

async function handleTrialWillEnd(subscription: any, supabaseUrl: string, serviceRoleKey: string) {
    console.log('Handling trial will end:', subscription.id);
    console.log('Trial ending soon notification');
}

async function updateSubscriptionInDatabase(subscription: any, supabaseUrl: string, serviceRoleKey: string) {
    const updateData = {
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/subscriptions?stripe_subscription_id=eq.${subscription.id}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update subscription in database:', errorText);
        throw new Error('Failed to update subscription in database');
    }

    console.log('Subscription updated in database successfully');
}

async function updateUserPlanFromSubscription(subscription: any, supabaseUrl: string, serviceRoleKey: string) {
    const userId = subscription.metadata?.user_id;
    const planType = subscription.metadata?.plan_type;
    
    if (!userId) {
        console.log('No user_id in subscription metadata');
        return;
    }
    
    let finalPlanType = 'spark';
    let monthlyLimit = 5;
    
    if (planType === 'premium') {
        finalPlanType = 'premium';
        monthlyLimit = 25;
    } else if (planType === 'elite') {
        finalPlanType = 'elite';
        monthlyLimit = 100;
    }
    
    const response = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            subscription_tier: finalPlanType,
            monthly_limit: monthlyLimit,
            updated_at: new Date().toISOString()
        })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update user plan:', errorText);
        throw new Error('Failed to update user plan');
    }
    
    console.log(`User plan updated to ${finalPlanType} with ${monthlyLimit} monthly limit`);
}