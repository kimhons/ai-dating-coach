import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useAuth} from '@/contexts/AuthContext';
import {SplashScreen} from '@/screens/SplashScreen';
import {AuthNavigator} from './AuthNavigator';
import {MainNavigator} from './MainNavigator';
import {OnboardingScreen} from '@/screens/OnboardingScreen';
import type {RootStackParamList} from '@/types';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const {isLoading, isAuthenticated, hasCompletedOnboarding} = useAuth();

  if (isLoading) {
    return (
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : !hasCompletedOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainNavigator} />
      )}
    </Stack.Navigator>
  );
};