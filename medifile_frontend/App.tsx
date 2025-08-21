// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import TabNavigator from './src/navigation/TabNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MessagesProvider } from './src/context/MessagesContext';
import { AuthProvider } from './src/context/AuthContext';
import ApproveAppointmentsScreen from './src/screens/doctor/ApproveAppointmentsScreen';
import BookAppointmentScreen from './src/screens/appointments/BookAppointmentScreen';
import DoctorsListForBooking from './src/screens/appointments/DoctorsListForBooking';
import MyPatientsScreen from './src/screens/doctor/MyPatientsScreen';
import AppointmentDetailsScreen from './src/screens/appointments/AppointmentDetailsScreen';
import NewsDetailScreen from './src/screens/NewsDetailScreen';
import PharmacyScreen from './src/screens/pharmacy/PharmacyScreen';
import MedicineDetailScreen from './src/screens/pharmacy/MedicineDetailScreen';
import CartScreen from './src/screens/pharmacy/CartScreen';
import CheckoutScreen from './src/screens/pharmacy/CheckoutScreen';
import OrdersScreen from './src/screens/pharmacy/OrdersScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <MessagesProvider>
        <AuthProvider>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="Onboarding" screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="SignUp" component={SignUpScreen} />
              <Stack.Screen name="MainApp" component={TabNavigator} />
              <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} />
              <Stack.Screen name="DoctorsListForBooking" component={DoctorsListForBooking} />
              <Stack.Screen name="ApproveAppointments" component={ApproveAppointmentsScreen} />
              <Stack.Screen name="MyPatients" component={MyPatientsScreen} />
              <Stack.Screen name="AppointmentDetails" component={AppointmentDetailsScreen} />
              <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
        <Stack.Screen name="Pharmacy" component={PharmacyScreen} />
        <Stack.Screen name="MedicineDetail" component={MedicineDetailScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="Orders" component={OrdersScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </AuthProvider>
      </MessagesProvider>
    </SafeAreaProvider>
  );
}
