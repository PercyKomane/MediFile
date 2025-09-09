import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ApproveAppointmentsScreen from '../../screens/doctor/ApproveAppointmentsScreen';
import MyPatientsScreen from '../../screens/doctor/MyPatientsScreen';
import InboxPatientsScreen from '../../screens/doctor/InboxPatientsScreen';

const Stack = createStackNavigator();

const DoctorNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ApproveAppointments" component={ApproveAppointmentsScreen} />
    <Stack.Screen name="MyPatients" component={MyPatientsScreen} />
    <Stack.Screen name="InboxPatients" component={InboxPatientsScreen} />
  </Stack.Navigator>
);

export default DoctorNavigator;


