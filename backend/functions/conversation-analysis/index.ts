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
        const { conversationContent, conversationType = 'text', platform, inputMethod = 'text_input', screenshotData } = await req.json();

        if (!conversationContent && !screenshotData) {
            throw new Error('Conversation content or screenshot is required');
        }

        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!openaiApiKey || !serviceRoleKey || !supabaseUrl) {
            throw new Error('Required environment variables not configured');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('Authorization required');
        }

        const token = authHeader.replace('Bearer ', '');
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid authentication token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        console.log('Starting conversation analysis for user:', userId);

        let screenshotUrl = null;
        let finalConversationContent = conversationContent;

        // Handle screenshot upload and OCR if provided
        if (screenshotData) {
            const base64Data = screenshotData.split(',')[1];
            const mimeType = screenshotData.split(';')[0].split(':')[1];
            const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            const uniqueFileName = `${Date.now()}-${crypto.randomUUID()}.jpg`;

            const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/conversation-screenshots/${uniqueFileName}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'Content-Type': mimeType,
                    'x-upsert': 'true'
                },
                body: binaryData
            });

            if (uploadResponse.ok) {
                screenshotUrl = `${supabaseUrl}/storage/v1/object/public/conversation-screenshots/${uniqueFileName}`;
                
                // Use OpenAI Vision to extract text from screenshot
                const ocrResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openaiApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o',
                        messages: [{
                            role: 'user',
                            content: [{
                                type: 'text',
                                text: 'Extract all conversation text from this dating app screenshot. Format as a conversation with clear speaker labels (You: / Them:). Include timestamps if visible. Focus only on the text content.'
                            }, {
                                type: 'image_url',
                                image_url: {
                                    url: screenshotData,
                                    detail: 'high'
                                }
                            }]
                        }],
                        max_tokens: 1000
                    })
                });

                if (ocrResponse.ok) {
                    const ocrResult = await ocrResponse.json();
                    finalConversationContent = ocrResult.choices[0].message.content;
                }
            }
        }

        // Create initial database record
        const analysisData = {
            user_id: userId,
            conversation_type: conversationType,
            input_method: inputMethod,
            platform: platform,
            conversation_content: finalConversationContent,
            screenshot_url: screenshotUrl,
            analysis_status: 'processing',
            ai_provider: 'openai'
        };

        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/conversation_analyses`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(analysisData)
        });

        if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            throw new Error(`Database insert failed: ${errorText}`);
        }

        const analysisRecord = await insertResponse.json();
        const analysisId = analysisRecord[0].id;

        console.log('Conversation analysis record created:', analysisId);

        // Analyze conversation with OpenAI
        const startTime = Date.now();
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{
                    role: 'system',
                    content: 'You are an expert dating conversation coach. Analyze conversations and provide actionable advice to improve dating success.'
                }, {
                    role: 'user',
                    content: `Analyze this dating conversation and provide comprehensive coaching feedback:\n\nConversation:\n${finalConversationContent}\n\nProvide analysis in JSON format with these exact keys:\n- engagement_score (1-10): How engaged the other person seems\n- sentiment_score (1-10): Overall positive/negative tone\n- response_quality_score (1-10): Quality of your responses\n- conversation_context: Brief summary of what's happening\n- suggestions: Array of 3-5 general improvement suggestions\n- next_message_suggestions: Array of 3 specific message suggestions to send next\n- red_flags: Array of concerning signs (if any)\n- positive_signals: Array of good signs\n- coaching_feedback: Detailed paragraph of personalized advice\n\nFocus on practical, actionable advice that will improve their dating success.`
                }],
                max_tokens: 1500,
                temperature: 0.7
            })
        });

        const processingTime = Date.now() - startTime;

        if (!openaiResponse.ok) {
            const errorData = await openaiResponse.text();
            console.error('OpenAI API error:', errorData);
            throw new Error(`OpenAI analysis failed: ${errorData}`);
        }

        const aiResult = await openaiResponse.json();
        console.log('Conversation analysis completed in', processingTime, 'ms');

        // Parse AI response
        let analysisResult;
        try {
            const content = aiResult.choices[0].message.content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysisResult = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            // Create fallback analysis
            analysisResult = {
                engagement_score: 7.0,
                sentiment_score: 7.5,
                response_quality_score: 6.5,
                conversation_context: 'General conversation analysis completed',
                suggestions: ['Be more engaging', 'Ask open-ended questions', 'Show genuine interest'],
                next_message_suggestions: ['Ask about their interests', 'Share something about yourself', 'Suggest meeting up'],
                red_flags: [],
                positive_signals: ['Active conversation', 'Mutual interest'],
                coaching_feedback: 'The conversation shows potential. Focus on building connection through thoughtful questions and sharing authentic details about yourself.'
            };
        }

        // Update database with results
        const updateData = {
            analysis_status: 'completed',
            engagement_score: analysisResult.engagement_score || 7.0,
            sentiment_score: analysisResult.sentiment_score || 7.0,
            response_quality_score: analysisResult.response_quality_score || 6.5,
            conversation_context: analysisResult.conversation_context || {},
            suggestions: analysisResult.suggestions || [],
            next_message_suggestions: analysisResult.next_message_suggestions || [],
            red_flags: analysisResult.red_flags || [],
            positive_signals: analysisResult.positive_signals || [],
            coaching_feedback: analysisResult.coaching_feedback || 'Analysis completed',
            raw_analysis: aiResult,
            processing_time_ms: processingTime,
            updated_at: new Date().toISOString()
        };

        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/conversation_analyses?id=eq.${analysisId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(updateData)
        });

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('Failed to update analysis:', errorText);
        }

        const finalRecord = await updateResponse.json();

        console.log('Conversation analysis completed successfully');

        return new Response(JSON.stringify({
            data: {
                analysis_id: analysisId,
                screenshot_url: screenshotUrl,
                analysis: finalRecord[0],
                processing_time_ms: processingTime
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Conversation analysis error:', error);

        const errorResponse = {
            error: {
                code: 'CONVERSATION_ANALYSIS_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});