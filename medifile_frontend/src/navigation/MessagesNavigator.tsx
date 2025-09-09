import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DoctorsListScreen from '../screens/DoctorsListScreen';
import ChatScreen from '../screens/MessagesScreen';
import InboxPatientsScreen from '../screens/doctor/InboxPatientsScreen';
import { useAuth } from '../context/AuthContext';

export type MessagesStackParamList = {
  Doctors: undefined;
  PatientsInbox: undefined;
  Chat: { doctorId: string };
};

const Stack = createStackNavigator<MessagesStackParamList>();

const MessagesNavigator = () => {
  const { role } = useAuth();
  const isDoctor = role === 'doctor';
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isDoctor ? (
        <Stack.Screen name="PatientsInbox" component={InboxPatientsScreen} />
      ) : (
        <Stack.Screen name="Doctors" component={DoctorsListScreen} />
      )}
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
};

export default MessagesNavigator;


