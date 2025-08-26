// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MessagesProvider } from './src/context/MessagesContext';
import { AuthProvider } from './src/context/AuthContext';
import AuthNavigator from './src/navigation/AuthNavigator';
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
import OrderDetailScreen from './src/screens/pharmacy/OrderDetailScreen';
import PaymentMethodScreen from './src/screens/payment/PaymentMethodScreen';
import FAQScreen from './src/screens/FAQScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import EmergencyRequestScreen from './src/screens/EmergencyRequestScreen';
import EmergencyTrackingScreen from './src/screens/EmergencyTrackingScreen';


const Stack = createStackNavigator<any>();

export default function App() {
  return (
    <SafeAreaProvider>
      <MessagesProvider>
        <AuthProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Auth" component={AuthNavigator} />
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
              <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
              <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen} />
              <Stack.Screen name="FAQ" component={FAQScreen} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
              <Stack.Screen name="EmergencyRequest" component={EmergencyRequestScreen} />
              <Stack.Screen name="EmergencyTracking" component={EmergencyTrackingScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </AuthProvider>
      </MessagesProvider>
    </SafeAreaProvider>
  );
}
