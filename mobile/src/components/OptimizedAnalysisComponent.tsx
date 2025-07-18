import React, { Suspense, lazy, useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

// Lazy load heavy components
const DetailedAnalysisView = lazy(() => import('./DetailedAnalysisView'));
const StreamingProgressIndicator = lazy(() => import('./StreamingProgressIndicator'));
const AnalysisVisualization = lazy(() => import('./AnalysisVisualization'));

// Types
interface AnalysisProps {
    analysisType: 'photo' | 'conversation' | 'voice' | 'screenshot';
    data: any;
    userTier: 'free' | 'premium' | 'pro';
    onAnalysisComplete?: (result: any) => void;
    streamingEnabled?: boolean;
}

interface StreamingData {
    chunkId: string;
    type: 'progress' | 'partial_result' | 'final_result' | 'error';
    progress: number;
    data?: any;
    error?: string;
}

interface OptimizedAnalysisState {
    isLoading: boolean;
    progress: number;
    currentStage: string;
    partialResults: any[];
    finalResult: any | null;
    error: string | null;
    estimatedTimeRemaining: number;
}

const OptimizedAnalysisComponent: React.FC<AnalysisProps> = ({
    analysisType,
    data,
    userTier,
    onAnalysisComplete,
    streamingEnabled = true
}) => {
    const [state, setState] = useState<OptimizedAnalysisState>({
        isLoading: false,
        progress: 0,
        currentStage: '',
        partialResults: [],
        finalResult: null,
        error: null,
        estimatedTimeRemaining: 0
    });

    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(50));

    // Memoized analysis service
    const analysisService = useMemo(() => {
        return {
            async startAnalysis() {
                if (streamingEnabled) {
                    return this.startStreamingAnalysis();
                } else {
                    return this.startBatchAnalysis();
                }
            },

            async startStreamingAnalysis() {
                setState(prev => ({ ...prev, isLoading: true, error: null }));

                try {
                    const response = await fetch('/api/streaming-analysis', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${userToken}`,
                        },
                        body: JSON.stringify({
                            type: analysisType,
                            data,
                            userTier,
                            streamingEnabled: true,
                            priority: userTier === 'free' ? 'speed' : 'quality'
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const reader = response.body?.getReader();
                    if (!reader) {
                        throw new Error('Response body is not readable');
                    }

                    const decoder = new TextDecoder();
                    let buffer = '';

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const streamData: StreamingData = JSON.parse(line.slice(6));
                                    this.handleStreamingData(streamData);
                                } catch (parseError) {
                                    console.error('Failed to parse streaming data:', parseError);
                                }
                            }
                        }
                    }

                } catch (error) {
                    setState(prev => ({
                        ...prev,
                        isLoading: false,
                        error: error.message
                    }));
                }
            },

            handleStreamingData(streamData: StreamingData) {
                setState(prev => {
                    const newState = { ...prev };

                    switch (streamData.type) {
                        case 'progress':
                            newState.progress = streamData.progress;
                            newState.currentStage = streamData.data?.stage || '';
                            newState.estimatedTimeRemaining = streamData.data?.eta || 0;
                            break;

                        case 'partial_result':
                            newState.progress = streamData.progress;
                            newState.partialResults = [
                                ...prev.partialResults,
                                streamData.data?.partial
                            ];
                            break;

                        case 'final_result':
                            newState.isLoading = false;
                            newState.progress = 100;
                            newState.finalResult = streamData.data;
                            if (onAnalysisComplete) {
                                onAnalysisComplete(streamData.data);
                            }
                            break;

                        case 'error':
                            newState.isLoading = false;
                            newState.error = streamData.error || 'Unknown error occurred';
                            break;
                    }

                    return newState;
                });
            },

            async startBatchAnalysis() {
                setState(prev => ({ ...prev, isLoading: true, error: null }));

                try {
                    // Simulate progress updates for batch analysis
                    const progressInterval = setInterval(() => {
                        setState(prev => {
                            if (prev.progress < 90) {
                                return {
                                    ...prev,
                                    progress: prev.progress + 10,
                                    currentStage: this.getStageForProgress(prev.progress + 10)
                                };
                            }
                            return prev;
                        });
                    }, 500);

                    const response = await fetch('/api/unified-analysis-v2', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${userToken}`,
                        },
                        body: JSON.stringify({
                            type: analysisType,
                            data,
                            userTier,
                            platform: 'mobile'
                        })
                    });

                    clearInterval(progressInterval);

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const result = await response.json();

                    setState(prev => ({
                        ...prev,
                        isLoading: false,
                        progress: 100,
                        finalResult: result.analysis,
                        currentStage: 'Complete'
                    }));

                    if (onAnalysisComplete) {
                        onAnalysisComplete(result.analysis);
                    }

                } catch (error) {
                    setState(prev => ({
                        ...prev,
                        isLoading: false,
                        error: error.message
                    }));
                }
            },

            getStageForProgress(progress: number): string {
                if (progress <= 20) return 'Initializing...';
                if (progress <= 40) return 'Processing data...';
                if (progress <= 60) return 'Analyzing with AI...';
                if (progress <= 80) return 'Generating insights...';
                if (progress <= 90) return 'Finalizing results...';
                return 'Complete';
            }
        };
    }, [analysisType, data, userTier, streamingEnabled, onAnalysisComplete]);

    // Start analysis effect
    useEffect(() => {
        if (data && !state.isLoading && !state.finalResult) {
            analysisService.startAnalysis();
        }
    }, [data, analysisService]);

    // Animation effect
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Optimized progress calculation
    const progressPercentage = useMemo(() => {
        return Math.min(Math.max(state.progress, 0), 100);
    }, [state.progress]);

    // Memoized progress color
    const progressColor = useMemo(() => {
        if (progressPercentage < 33) return '#ff6b6b';
        if (progressPercentage < 66) return '#ffd93d';
        return '#6bcf7f';
    }, [progressPercentage]);

    // Loading state component
    const LoadingState = useCallback(() => (
        <View style={styles.loadingContainer}>
            <Suspense fallback={<View style={styles.fallback} />}>
                <StreamingProgressIndicator
                    progress={progressPercentage}
                    stage={state.currentStage}
                    estimatedTime={state.estimatedTimeRemaining}
                    color={progressColor}
                    animated={true}
                />
            </Suspense>
            
            {state.partialResults.length > 0 && (
                <View style={styles.partialResultsContainer}>
                    <Text style={styles.partialResultsTitle}>Live Insights:</Text>
                    {state.partialResults.map((partial, index) => (
                        <Animated.View
                            key={index}
                            style={[
                                styles.partialResult,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }]
                                }
                            ]}
                        >
                            {renderPartialResult(partial)}
                        </Animated.View>
                    ))}
                </View>
            )}
        </View>
    ), [state, progressPercentage, progressColor, fadeAnim, slideAnim]);

    // Error state component
    const ErrorState = useCallback(() => (
        <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={48} color="#ff6b6b" />
            <Text style={styles.errorTitle}>Analysis Failed</Text>
            <Text style={styles.errorMessage}>{state.error}</Text>
            <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                    setState(prev => ({ ...prev, error: null, isLoading: false }));
                    analysisService.startAnalysis();
                }}
            >
                <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
        </View>
    ), [state.error, analysisService]);

    // Render partial result helper
    const renderPartialResult = useCallback((partial: any) => {
        if (!partial) return null;

        return (
            <View style={styles.insightCard}>
                {partial.score && (
                    <View style={styles.scoreContainer}>
                        <Text style={styles.scoreLabel}>Score:</Text>
                        <Text style={styles.scoreValue}>{partial.score}/10</Text>
                    </View>
                )}
                
                {partial.insights && partial.insights.length > 0 && (
                    <View style={styles.insightsContainer}>
                        {partial.insights.slice(0, 2).map((insight: string, index: number) => (
                            <Text key={index} style={styles.insightText}>
                                • {insight}
                            </Text>
                        ))}
                    </View>
                )}
            </View>
        );
    }, []);

    // Main render
    if (state.error) {
        return <ErrorState />;
    }

    if (state.isLoading) {
        return <LoadingState />;
    }

    if (state.finalResult) {
        return (
            <Animated.View
                style={[
                    styles.resultContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <Suspense fallback={<View style={styles.fallback} />}>
                    <DetailedAnalysisView
                        result={state.finalResult}
                        analysisType={analysisType}
                        userTier={userTier}
                    />
                </Suspense>
                
                {userTier !== 'free' && (
                    <Suspense fallback={<View style={styles.fallback} />}>
                        <AnalysisVisualization
                            data={state.finalResult}
                            type={analysisType}
                        />
                    </Suspense>
                )}
            </Animated.View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.waitingText}>Ready to analyze...</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    resultContainer: {
        flex: 1,
        padding: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ff6b6b',
        marginTop: 12,
        marginBottom: 8,
    },
    errorMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#007bff',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    partialResultsContainer: {
        marginTop: 20,
        width: '100%',
    },
    partialResultsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    partialResult: {
        marginBottom: 12,
    },
    insightCard: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    scoreLabel: {
        fontSize: 14,
        color: '#666',
        marginRight: 8,
    },
    scoreValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007bff',
    },
    insightsContainer: {
        marginTop: 8,
    },
    insightText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
        lineHeight: 20,
    },
    waitingText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 40,
    },
    fallback: {
        height: 40,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        margin: 8,
    },
});

export default React.memo(OptimizedAnalysisComponent);