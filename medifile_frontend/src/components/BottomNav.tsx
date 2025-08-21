// BottomNav.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const BottomNav = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const tabs = [
    { name: 'Home', icon: 'home-outline' },
    { name: 'Messages', icon: 'chatbubble-ellipses-outline' },
    { name: 'Calendar', icon: 'calendar-outline' },
    { name: 'Profile', icon: 'person-outline' },
  ];

  const isActive = (name: string) => route.name === name;

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          style={styles.tab}
          onPress={() => navigation.navigate(tab.name as never)}
        >
          <Ionicons
            name={tab.icon as any}
            size={24}
            color={isActive(tab.name) ? '#008080' : '#999'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    borderColor: '#eee',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BottomNav;
