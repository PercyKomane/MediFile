import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import TabNavigator from './TabNavigator';
import HospitalListScreen from '../screens/HospitalListScreen';
import HospitalDetailScreen from '../screens/HospitalDetailScreen';
import HospitalMapScreen from '../screens/HospitalMapScreen';
import PrivacySettingsScreen from '../screens/PrivacySettingsScreen';
import AccountSecurityScreen from '../screens/AccountSecurityScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import TicketDetailScreen from '../screens/TicketDetailScreen';
import AboutScreen from '../screens/AboutScreen';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  const { token, isLoading } = useAuth();

  console.log('🔐 AuthNavigator - Token status:', token ? 'Authenticated' : 'Not authenticated', 'Loading:', isLoading);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Loading" component={() => null} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName={token ? "MainApp" : "Login"}
    >
      {token ? (
        // User is authenticated - show main app
        <>
          <Stack.Screen name="MainApp" component={TabNavigator} />
          <Stack.Screen name="HospitalList" component={HospitalListScreen} />
          <Stack.Screen name="HospitalDetail" component={HospitalDetailScreen} />
          <Stack.Screen name="HospitalMap" component={HospitalMapScreen} />
          <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
          <Stack.Screen name="AccountSecurity" component={AccountSecurityScreen} />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
          <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
        </>
      ) : (
        // User is not authenticated - show auth screens
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AuthNavigator;
