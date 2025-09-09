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
import AppointmentCheckoutScreen from './src/screens/appointments/AppointmentCheckoutScreen';


const Stack = createStackNavigator<any>();

export default function App() {
  return (
    <SafeAreaProvider>
      <MessagesProvider>
        <AuthProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Auth" component={AuthNavigator as React.ComponentType<any>} />
              <Stack.Screen name="BookAppointment" component={BookAppointmentScreen as React.ComponentType<any>} />
              <Stack.Screen name="DoctorsListForBooking" component={DoctorsListForBooking as React.ComponentType<any>} />
              <Stack.Screen name="ApproveAppointments" component={ApproveAppointmentsScreen as React.ComponentType<any>} />
              <Stack.Screen name="MyPatients" component={MyPatientsScreen as React.ComponentType<any>} />
              <Stack.Screen name="AppointmentDetails" component={AppointmentDetailsScreen as React.ComponentType<any>} />
              <Stack.Screen name="AppointmentCheckout" component={AppointmentCheckoutScreen as React.ComponentType<any>} />
              <Stack.Screen name="NewsDetail" component={NewsDetailScreen as React.ComponentType<any>} />
              <Stack.Screen name="Pharmacy" component={PharmacyScreen as React.ComponentType<any>} />
              <Stack.Screen name="MedicineDetail" component={MedicineDetailScreen as React.ComponentType<any>} />
              <Stack.Screen name="Cart" component={CartScreen as React.ComponentType<any>} />
              <Stack.Screen name="Checkout" component={CheckoutScreen as React.ComponentType<any>} />
              <Stack.Screen name="Orders" component={OrdersScreen as React.ComponentType<any>} />
              <Stack.Screen name="OrderDetail" component={OrderDetailScreen as React.ComponentType<any>} />
              <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen as React.ComponentType<any>} />
              <Stack.Screen name="FAQ" component={FAQScreen as React.ComponentType<any>} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen as React.ComponentType<any>} />
              <Stack.Screen name="EmergencyRequest" component={EmergencyRequestScreen as React.ComponentType<any>} />
              <Stack.Screen name="EmergencyTracking" component={EmergencyTrackingScreen as React.ComponentType<any>} />
            </Stack.Navigator>
          </NavigationContainer>
        </AuthProvider>
      </MessagesProvider>
    </SafeAreaProvider>
  );
}
