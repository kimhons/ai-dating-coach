import React, {useEffect} from 'react';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StatusBar, Platform, PermissionsAndroid} from 'react-native';
import Toast from 'react-native-toast-message';
import 'react-native-url-polyfill/auto';

import {AuthProvider} from '@/contexts/AuthContext';
import {SubscriptionProvider} from '@/contexts/SubscriptionContext';
import {AppNavigator} from '@/navigation/AppNavigator';
import {toastConfig} from '@/utils/toastConfig';
import {requestPermissions} from '@/utils/permissions';

const App: React.FC = () => {
  useEffect(() => {
    // Request necessary permissions on app start
    requestPermissions();
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <StatusBar
          barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
          backgroundColor={Platform.OS === 'android' ? '#6366f1' : undefined}
        />
        <AuthProvider>
          <SubscriptionProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
            <Toast config={toastConfig} />
          </SubscriptionProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;