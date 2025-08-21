import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DoctorsListScreen from '../screens/DoctorsListScreen';
import ChatScreen from '../screens/MessagesScreen';

export type MessagesStackParamList = {
  Doctors: undefined;
  Chat: { doctorId: string };
};

const Stack = createStackNavigator<MessagesStackParamList>();

const MessagesNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Doctors" component={DoctorsListScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
};

export default MessagesNavigator;


