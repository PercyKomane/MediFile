// src/screens/ProfileScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const ProfileScreen = ({ navigation } : any) => {
  return (
    <ScrollView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuIcon}>
          <Ionicons name="ellipsis-vertical" size={22} color="white" />
        </TouchableOpacity>

        <Image
          source={require('../assets/images/avatars/profile_avatar.png')}
          style={styles.avatar}
        />
        <Text style={styles.name}>Amelia Renata</Text>
      </View>

      {/* White Card Options */}
      <View style={styles.card}>
        <Option icon="heart-outline" label="My Saved" />
        <Option icon="calendar-outline" label="Appointment" onPress={() => navigation.navigate('Appointment')}/>
        <Option icon="card-outline" label="Payment Method" />
        <Option icon="help-circle-outline" label="FAQs" />
        <Option icon="log-out-outline" label="Logout" isLogout />
      </View>
    </ScrollView>
  );
};

const Option = ({
  icon,
  label,
  isLogout = false,
  onPress,
}: {
  icon: any;
  label: string;
  isLogout?: boolean;
  onPress?: () => void;
}) => (
  <TouchableOpacity style={styles.optionRow} onPress={onPress}>
    <View style={styles.iconWrapper}>
      <Ionicons name={icon} size={20} color={isLogout ? 'red' : '#008080'} />
    </View>
    <Text style={[styles.optionText, isLogout && { color: 'red' }]}>
      {label}
    </Text>
    <Ionicons name="chevron-forward" size={20} color="#ccc" />
  </TouchableOpacity>
);


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#008080',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: '#199A8E',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  menuIcon: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'white',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 80,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginTop: -20,
    elevation: 5,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  iconWrapper: {
    backgroundColor: '#e6f3f3',
    padding: 8,
    borderRadius: 10,
    marginRight: 15,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
});

export default ProfileScreen;
