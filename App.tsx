import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from '@/navigation/RootNavigator';
import { useAppStore } from '@/store/useAppStore';
import { colors } from '@/theme/theme';
import { configureGoogleSignIn } from '@/services/googleDrive';

// Replace with your Google Cloud OAuth "Web" client ID (required on both platforms)
// and, on iOS, your iOS client ID. See README.md > Google Drive backup setup.
const GOOGLE_WEB_CLIENT_ID = '79907795990-bvslm7gvfj9q62euiulj72r1c2iqgds2.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = 'REPLACE_WITH_YOUR_IOS_CLIENT_ID.apps.googleusercontent.com';

export default function App() {
  const bootstrap = useAppStore((s) => s.bootstrap);
  const isInitializing = useAppStore((s) => s.isInitializing);

  useEffect(() => {
    bootstrap();
    configureGoogleSignIn(GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {isInitializing ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accentBlue} size="large" />
          </View>
        ) : (
          <RootNavigator />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
});
