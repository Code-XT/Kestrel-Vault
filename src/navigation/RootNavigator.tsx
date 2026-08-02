import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '@/theme/theme';
import { useAppStore } from '@/store/useAppStore';

import LockScreen from '@/screens/LockScreen';
import VaultListScreen from '@/screens/VaultListScreen';
import AddCardScreen from '@/screens/AddCardScreen';
import AddTicketScreen from '@/screens/AddTicketScreen';
import DetailScreen from '@/screens/DetailScreen';
import SettingsScreen from '@/screens/SettingsScreen';

export type RootStackParamList = {
  VaultList: undefined;
  AddCard: undefined;
  AddTicket: undefined;
  Detail: { id: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.background,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.accentBlue,
  },
};

export default function RootNavigator() {
  const isUnlocked = useAppStore((s) => s.isUnlocked);

  if (!isUnlocked) {
    return (
      <NavigationContainer theme={navTheme}>
        <LockScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="VaultList" component={VaultListScreen} />
        <Stack.Screen name="AddCard" component={AddCardScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="AddTicket" component={AddTicketScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Detail" component={DetailScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
