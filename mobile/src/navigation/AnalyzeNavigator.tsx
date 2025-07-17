import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {AnalyzeHomeScreen} from '@/screens/analyze/AnalyzeHomeScreen';
import {PhotoAnalysisScreen} from '@/screens/analyze/PhotoAnalysisScreen';
import {ConversationAnalysisScreen} from '@/screens/analyze/ConversationAnalysisScreen';
import {VoiceAnalysisScreen} from '@/screens/analyze/VoiceAnalysisScreen';
import {ScreenMonitoringScreen} from '@/screens/analyze/ScreenMonitoringScreen';
import {SocialAnalyticsScreen} from '@/screens/analyze/SocialAnalyticsScreen';
import type {AnalyzeStackParamList} from '@/types';

const Stack = createStackNavigator<AnalyzeStackParamList>();

export const AnalyzeNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="AnalyzeHome"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6366f1',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen
        name="AnalyzeHome"
        component={AnalyzeHomeScreen}
        options={{
          title: 'AI Analysis',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PhotoAnalysis"
        component={PhotoAnalysisScreen}
        options={{
          title: 'Photo Analysis',
        }}
      />
      <Stack.Screen
        name="ConversationAnalysis"
        component={ConversationAnalysisScreen}
        options={{
          title: 'Conversation Coach',
        }}
      />
      <Stack.Screen
        name="VoiceAnalysis"
        component={VoiceAnalysisScreen}
        options={{
          title: 'Voice Coach',
        }}
      />
      <Stack.Screen
        name="ScreenMonitoring"
        component={ScreenMonitoringScreen}
        options={{
          title: 'Screen Monitor',
        }}
      />
      <Stack.Screen
        name="SocialAnalytics"
        component={SocialAnalyticsScreen}
        options={{
          title: 'Social Analytics',
        }}
      />
    </Stack.Navigator>
  );
};