import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import MessagesNavigator from './MessagesNavigator';
import CalendarScreen from '../screens/CalendarScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AppointmentScreen from '../screens/AppointmentScreen';
import { Ionicons } from '@expo/vector-icons';
import RecordsNavigator from './records/RecordsNavigator';
import DoctorNavigator from './doctor/DoctorNavigator';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { role } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#008080',
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = '';

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Records':
              iconName = focused ? 'documents' : 'documents-outline';
              break;
            case 'Messages':
              iconName = focused ? 'chatbubble' : 'chatbubble-outline';
              break;
            case 'Appointment':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            case 'Doctor':
              iconName = focused ? 'medical' : 'medical-outline';
              break;
          }

          return <Ionicons name={iconName as any} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Records" component={RecordsNavigator} />
      <Tab.Screen name="Messages" component={MessagesNavigator} />
      <Tab.Screen name="Appointment" component={AppointmentScreen} />
      {role === 'doctor' && <Tab.Screen name="Doctor" component={DoctorNavigator} />}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
