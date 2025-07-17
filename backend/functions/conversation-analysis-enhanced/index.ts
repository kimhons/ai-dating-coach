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
        const { conversationContent, conversationType = 'text', platform, inputMethod = 'text_input', screenshotData, preferredProvider = 'openai' } = await req.json();

        if (!conversationContent && !screenshotData) {
            throw new Error('Conversation content or screenshot is required');
        }

        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration not found');
        }

        if (!openaiApiKey && !geminiApiKey) {
            throw new Error('No AI provider API keys configured');
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

        console.log('Starting enhanced conversation analysis for user:', userId);

        let screenshotUrl = null;
        let finalConversationContent = conversationContent;

        // Determine which AI provider to use
        let aiProvider = preferredProvider;
        if (preferredProvider === 'openai' && !openaiApiKey) {
            aiProvider = 'gemini';
        } else if (preferredProvider === 'gemini' && !geminiApiKey) {
            aiProvider = 'openai';
        }

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
                
                // Use AI to extract text from screenshot
                try {
                    if (aiProvider === 'openai' && openaiApiKey) {
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
                    } else if (aiProvider === 'gemini' && geminiApiKey) {
                        const ocrResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                contents: [{
                                    parts: [
                                        { text: 'Extract all conversation text from this dating app screenshot. Format as a conversation with clear speaker labels (You: / Them:). Include timestamps if visible. Focus only on the text content.' },
                                        {
                                            inline_data: {
                                                mime_type: mimeType,
                                                data: base64Data
                                            }
                                        }
                                    ]
                                }],
                                generationConfig: {
                                    temperature: 0.3,
                                    maxOutputTokens: 1000
                                }
                            })
                        });

                        if (ocrResponse.ok) {
                            const ocrResult = await ocrResponse.json();
                            finalConversationContent = ocrResult.candidates[0].content.parts[0].text;
                        }
                    }
                } catch (ocrError) {
                    console.error('OCR failed:', ocrError);
                    // Continue with manual conversation content if OCR fails
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
            ai_provider: aiProvider,
            preferred_provider: preferredProvider
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

        console.log('Conversation analysis record created:', analysisId, 'using provider:', aiProvider);

        const analysisPrompt = `You are an expert dating conversation coach. Analyze this conversation and provide comprehensive coaching feedback:

Conversation:
${finalConversationContent}

Provide analysis in JSON format with these exact keys:
- engagement_score (1-10): How engaged the other person seems
- sentiment_score (1-10): Overall positive/negative tone
- response_quality_score (1-10): Quality of your responses
- conversation_context: Brief summary of what's happening
- suggestions: Array of 3-5 general improvement suggestions
- next_message_suggestions: Array of 3 specific message suggestions to send next
- red_flags: Array of concerning signs (if any)
- positive_signals: Array of good signs
- coaching_feedback: Detailed paragraph of personalized advice

Focus on practical, actionable advice that will improve their dating success.`;

        let analysisResult;
        let processingTime;
        let rawAnalysis;
        let usedProvider = aiProvider;

        // Try primary provider first
        try {
            const startTime = Date.now();
            
            if (aiProvider === 'openai' && openaiApiKey) {
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
                            content: analysisPrompt
                        }],
                        max_tokens: 1500,
                        temperature: 0.7
                    })
                });

                processingTime = Date.now() - startTime;

                if (!openaiResponse.ok) {
                    throw new Error(`OpenAI API error: ${await openaiResponse.text()}`);
                }

                rawAnalysis = await openaiResponse.json();
                const content = rawAnalysis.choices[0].message.content;
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                
                if (jsonMatch) {
                    analysisResult = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No valid JSON in OpenAI response');
                }

            } else if (aiProvider === 'gemini' && geminiApiKey) {
                const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: analysisPrompt }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 1500
                        }
                    })
                });

                processingTime = Date.now() - startTime;

                if (!geminiResponse.ok) {
                    throw new Error(`Gemini API error: ${await geminiResponse.text()}`);
                }

                rawAnalysis = await geminiResponse.json();
                const content = rawAnalysis.candidates[0].content.parts[0].text;
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                
                if (jsonMatch) {
                    analysisResult = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No valid JSON in Gemini response');
                }
            }

        } catch (primaryError) {
            console.error(`Primary provider (${aiProvider}) failed:`, primaryError);
            
            // Try fallback provider
            const fallbackProvider = aiProvider === 'openai' ? 'gemini' : 'openai';
            
            if ((fallbackProvider === 'openai' && openaiApiKey) || (fallbackProvider === 'gemini' && geminiApiKey)) {
                console.log(`Attempting fallback to ${fallbackProvider}`);
                
                try {
                    const startTime = Date.now();
                    usedProvider = `${aiProvider}_fallback_${fallbackProvider}`;
                    
                    if (fallbackProvider === 'openai') {
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
                                    content: analysisPrompt
                                }],
                                max_tokens: 1500,
                                temperature: 0.7
                            })
                        });

                        if (!openaiResponse.ok) {
                            throw new Error(`OpenAI fallback failed: ${await openaiResponse.text()}`);
                        }

                        rawAnalysis = await openaiResponse.json();
                        const content = rawAnalysis.choices[0].message.content;
                        const jsonMatch = content.match(/\{[\s\S]*\}/);
                        
                        if (jsonMatch) {
                            analysisResult = JSON.parse(jsonMatch[0]);
                        } else {
                            throw new Error('No valid JSON in OpenAI fallback response');
                        }

                    } else if (fallbackProvider === 'gemini') {
                        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                contents: [{
                                    parts: [{ text: analysisPrompt }]
                                }],
                                generationConfig: {
                                    temperature: 0.7,
                                    maxOutputTokens: 1500
                                }
                            })
                        });

                        if (!geminiResponse.ok) {
                            throw new Error(`Gemini fallback failed: ${await geminiResponse.text()}`);
                        }

                        rawAnalysis = await geminiResponse.json();
                        const content = rawAnalysis.candidates[0].content.parts[0].text;
                        const jsonMatch = content.match(/\{[\s\S]*\}/);
                        
                        if (jsonMatch) {
                            analysisResult = JSON.parse(jsonMatch[0]);
                        } else {
                            throw new Error('No valid JSON in Gemini fallback response');
                        }
                    }

                    processingTime = Date.now() - startTime;
                    console.log(`Fallback to ${fallbackProvider} successful`);

                } catch (fallbackError) {
                    console.error(`Fallback provider (${fallbackProvider}) also failed:`, fallbackError);
                    throw new Error(`Both AI providers failed. Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`);
                }
            } else {
                throw new Error(`Primary provider failed and no fallback available: ${primaryError.message}`);
            }
        }

        // Ensure we have a valid analysis result
        if (!analysisResult) {
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
            raw_analysis: rawAnalysis,
            processing_time_ms: processingTime,
            ai_provider: usedProvider,
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

        console.log('Enhanced conversation analysis completed successfully using:', usedProvider);

        return new Response(JSON.stringify({
            data: {
                analysis_id: analysisId,
                screenshot_url: screenshotUrl,
                analysis: finalRecord[0],
                processing_time_ms: processingTime,
                ai_provider_used: usedProvider
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Enhanced conversation analysis error:', error);

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

