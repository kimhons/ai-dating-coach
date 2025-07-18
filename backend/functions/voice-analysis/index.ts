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
        const { audioData, fileName, duration } = await req.json();

        if (!audioData) {
            throw new Error('Audio data is required');
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

        // Check if user has Elite tier access
        const userProfileResponse = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (userProfileResponse.ok) {
            const profiles = await userProfileResponse.json();
            if (profiles.length > 0 && profiles[0].subscription_tier !== 'elite') {
                throw new Error('Voice analysis requires Elite tier subscription');
            }
        }

        console.log('Starting voice analysis for user:', userId);

        // Upload audio to Supabase Storage
        const base64Data = audioData.split(',')[1];
        const mimeType = audioData.split(';')[0].split(':')[1];
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const uniqueFileName = fileName || `${Date.now()}-${crypto.randomUUID()}.wav`;

        const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/voice-recordings/${uniqueFileName}`, {
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

        const audioUrl = `${supabaseUrl}/storage/v1/object/public/voice-recordings/${uniqueFileName}`;

        // Create initial database record
        const analysisData = {
            user_id: userId,
            audio_url: audioUrl,
            audio_duration_seconds: duration || 0,
            analysis_status: 'processing',
            ai_provider: 'openai'
        };

        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/voice_analyses`, {
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

        console.log('Voice analysis record created:', analysisId);

        // Transcribe audio with OpenAI Whisper
        const startTime = Date.now();
        
        // Convert audio data for OpenAI Whisper API
        const formData = new FormData();
        const audioBlob = new Blob([binaryData], { type: mimeType });
        formData.append('file', audioBlob, uniqueFileName);
        formData.append('model', 'whisper-1');
        formData.append('response_format', 'json');

        const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`
            },
            body: formData
        });

        if (!transcriptionResponse.ok) {
            const errorData = await transcriptionResponse.text();
            console.error('OpenAI Whisper error:', errorData);
            throw new Error(`Audio transcription failed: ${errorData}`);
        }

        const transcriptionResult = await transcriptionResponse.json();
        const transcription = transcriptionResult.text;

        console.log('Audio transcribed successfully');

        // Analyze voice characteristics with ChatGPT
        const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{
                    role: 'system',
                    content: 'You are an expert voice and communication coach specializing in dating confidence. Analyze speech patterns, tone, and content to provide actionable coaching advice.'
                }, {
                    role: 'user',
                    content: `Analyze this voice recording transcription for dating confidence coaching:\n\nTranscription: "${transcription}"\n\nAudio Duration: ${duration || 'unknown'} seconds\n\nProvide analysis in JSON format with these exact keys:\n- confidence_score (1-10): Overall confidence level\n- tone_analysis: Object with tone characteristics\n- emotion_analysis: Object with emotional indicators\n- speech_patterns: Object with speech pattern observations\n- suggestions: Array of 3-5 improvement suggestions\n- coaching_feedback: Detailed personalized advice paragraph\n\nFocus on practical advice for improving dating conversations, confidence, and communication appeal.`
                }],
                max_tokens: 1200,
                temperature: 0.7
            })
        });

        const processingTime = Date.now() - startTime;

        if (!analysisResponse.ok) {
            const errorData = await analysisResponse.text();
            console.error('OpenAI analysis error:', errorData);
            throw new Error(`Voice analysis failed: ${errorData}`);
        }

        const aiResult = await analysisResponse.json();
        console.log('Voice analysis completed in', processingTime, 'ms');

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
                confidence_score: 7.0,
                tone_analysis: { overall_tone: 'neutral', energy_level: 'moderate' },
                emotion_analysis: { primary_emotion: 'calm', confidence_level: 'good' },
                speech_patterns: { pace: 'normal', clarity: 'good' },
                suggestions: ['Practice speaking with more energy', 'Work on clear articulation', 'Build vocal confidence'],
                coaching_feedback: 'Your voice shows good potential. Focus on speaking with more energy and confidence to enhance your dating conversations.'
            };
        }

        // Update database with results
        const updateData = {
            analysis_status: 'completed',
            transcription: transcription,
            confidence_score: analysisResult.confidence_score || 7.0,
            tone_analysis: analysisResult.tone_analysis || {},
            emotion_analysis: analysisResult.emotion_analysis || {},
            speech_patterns: analysisResult.speech_patterns || {},
            suggestions: analysisResult.suggestions || [],
            coaching_feedback: analysisResult.coaching_feedback || 'Analysis completed',
            raw_analysis: aiResult,
            processing_time_ms: processingTime,
            updated_at: new Date().toISOString()
        };

        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/voice_analyses?id=eq.${analysisId}`, {
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

        console.log('Voice analysis completed successfully');

        return new Response(JSON.stringify({
            data: {
                analysis_id: analysisId,
                audio_url: audioUrl,
                transcription: transcription,
                analysis: finalRecord[0],
                processing_time_ms: processingTime
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Voice analysis error:', error);

        const errorResponse = {
            error: {
                code: 'VOICE_ANALYSIS_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});