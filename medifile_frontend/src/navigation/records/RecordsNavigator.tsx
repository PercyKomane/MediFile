import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import RecordsHomeScreen from '../../screens/records/RecordsHomeScreen';
import AllergiesScreen from '../../screens/records/AllergiesScreen';
import DiagnosesScreen from '../../screens/records/DiagnosesScreen';
import ReportsScreen from '../../screens/records/ReportsScreen';
import ChartsScreen from '../../screens/records/ChartsScreen';

const Stack = createStackNavigator();

const RecordsNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RecordsHome" component={RecordsHomeScreen} />
      <Stack.Screen name="Allergies" component={AllergiesScreen} />
      <Stack.Screen name="Diagnoses" component={DiagnosesScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="Charts" component={ChartsScreen} />
    </Stack.Navigator>
  );
};

export default RecordsNavigator;


