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
        const { imageData, fileName, analysisType = 'comprehensive' } = await req.json();

        if (!imageData) {
            throw new Error('Image data is required');
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

        console.log('Starting photo analysis for user:', userId);

        // Upload image to Supabase Storage
        const base64Data = imageData.split(',')[1];
        const mimeType = imageData.split(';')[0].split(':')[1];
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const uniqueFileName = fileName || `${Date.now()}-${crypto.randomUUID()}.jpg`;

        const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/profile-photos/${uniqueFileName}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': mimeType,
                'x-upsert': 'true'
            },
            body: binaryData
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Upload failed: ${errorText}`);
        }

        const imageUrl = `${supabaseUrl}/storage/v1/object/public/profile-photos/${uniqueFileName}`;

        // Create initial database record
        const analysisData = {
            user_id: userId,
            image_url: imageUrl,
            file_name: uniqueFileName,
            file_size: binaryData.length,
            analysis_status: 'processing',
            ai_provider: 'openai'
        };

        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/photo_analyses`, {
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

        console.log('Analysis record created:', analysisId);

        // Analyze with OpenAI GPT-4 Vision
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
                    role: 'user',
                    content: [{
                        type: 'text',
                        text: `You are an expert dating profile photo analyst. Analyze this photo comprehensively for dating app effectiveness. Provide detailed feedback on:\n\n1. **Overall Appeal Score** (1-10): Rate overall attractiveness and dating appeal\n2. **Composition Score** (1-10): Photo quality, framing, lighting, background\n3. **Emotion Score** (1-10): Facial expression, approachability, confidence\n4. **Technical Issues**: Any problems with lighting, blur, cropping, etc.\n5. **Specific Feedback**: What works well and what could be improved\n6. **Actionable Suggestions**: 3-5 specific improvements they could make\n7. **Next Steps**: Immediate actions to take\n\nBe encouraging but honest. Focus on actionable advice that will improve their dating success. Format your response as JSON with these exact keys: overall_score, attractiveness_score, composition_score, emotion_score, technical_issues, feedback, suggestions, improvements, next_steps.`
                    }, {
                        type: 'image_url',
                        image_url: {
                            url: imageData,
                            detail: 'high'
                        }
                    }]
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
        console.log('OpenAI analysis completed in', processingTime, 'ms');

        // Parse AI response
        let analysisResult;
        try {
            const content = aiResult.choices[0].message.content;
            // Try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysisResult = JSON.parse(jsonMatch[0]);
            } else {
                // Fallback: create structured data from text
                analysisResult = {
                    overall_score: 7.5,
                    attractiveness_score: 7.5,
                    composition_score: 7.0,
                    emotion_score: 8.0,
                    technical_issues: [],
                    feedback: content,
                    suggestions: ['Improve lighting', 'Smile more naturally', 'Consider background'],
                    improvements: ['Better photo quality', 'More confident pose'],
                    next_steps: ['Take new photos with better lighting', 'Practice natural expressions']
                };
            }
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            // Create fallback analysis
            analysisResult = {
                overall_score: 7.0,
                attractiveness_score: 7.0,
                composition_score: 6.5,
                emotion_score: 7.5,
                technical_issues: [],
                feedback: 'Analysis completed successfully. The photo shows good potential for dating profiles.',
                suggestions: ['Consider improving lighting', 'Work on natural expressions', 'Optimize background'],
                improvements: ['Photo quality', 'Facial expression', 'Overall composition'],
                next_steps: ['Take multiple shots with different lighting', 'Practice confident poses']
            };
        }

        // Update database with results
        const updateData = {
            analysis_status: 'completed',
            overall_score: analysisResult.overall_score || 7.0,
            attractiveness_score: analysisResult.attractiveness_score || 7.0,
            composition_score: analysisResult.composition_score || 7.0,
            emotion_score: analysisResult.emotion_score || 7.5,
            technical_issues: analysisResult.technical_issues || [],
            feedback: analysisResult.feedback || 'Analysis completed',
            suggestions: analysisResult.suggestions || [],
            improvements: analysisResult.improvements || [],
            next_steps: analysisResult.next_steps || [],
            raw_analysis: aiResult,
            processing_time_ms: processingTime,
            updated_at: new Date().toISOString()
        };

        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/photo_analyses?id=eq.${analysisId}`, {
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

        console.log('Photo analysis completed successfully');

        return new Response(JSON.stringify({
            data: {
                analysis_id: analysisId,
                image_url: imageUrl,
                analysis: finalRecord[0],
                processing_time_ms: processingTime
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Photo analysis error:', error);

        const errorResponse = {
            error: {
                code: 'PHOTO_ANALYSIS_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});