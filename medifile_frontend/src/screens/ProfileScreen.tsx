// src/screens/ProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { API } from '../api/client';

const ProfileScreen = ({ navigation }: any) => {
  const { logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await API.get('/me/');
        if (!mounted) return;
        const first = (data?.first_name ?? '').trim();
        const last = (data?.last_name ?? '').trim();
        setDisplayName([first, last].filter(Boolean).join(' ') || data?.email || '');
        setAvatarUrl(data?.avatar_url || null);
      } catch {
        // ignore; placeholder will be used
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔄 Starting logout process...');
              await logout();
              console.log('✅ Logout completed - should redirect to login');
            } catch (error) {
              console.error('❌ Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleMenuAction = (action: string) => {
    setShowMenu(false);
    
    switch (action) {
      case 'edit_profile':
        navigation.navigate('EditProfile');
        break;
      case 'notifications':
        Alert.alert('Notifications', 'Notification settings coming soon!');
        break;
      case 'privacy':
        navigation.navigate('PrivacySettings');
        break;
      case 'help':
        navigation.navigate('HelpSupport');
        break;
      case 'about':
        navigation.navigate('About');
        break;
      case 'rate':
        Alert.alert('Rate App', 'Thank you for using MediFile! Please rate us on the app store.');
        break;
      case 'share':
        Alert.alert('Share App', 'Share MediFile with your friends and family!');
        break;
      case 'security':
        navigation.navigate('AccountSecurity');
        break;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuIcon}
          onPress={() => setShowMenu(true)}
        >
          <Ionicons name="ellipsis-vertical" size={22} color="white" />
        </TouchableOpacity>

        <Image
          source={avatarUrl ? { uri: avatarUrl } : require('../assets/images/avatars/profile_avatar.png')}
          style={styles.avatar}
        />
        <Text style={styles.name}>{displayName || 'My Profile'}</Text>
      </View>

      {/* White Card Options */}
      <View style={styles.card}>
        <Option icon="heart-outline" label="My Saved" />
        <Option icon="calendar-outline" label="Appointment" onPress={() => navigation.navigate('Appointment')} />
        <Option icon="receipt-outline" label="My Orders" onPress={() => navigation.navigate('Orders')} />
        <Option icon="card-outline" label="Payment Method" onPress={() => navigation.navigate('PaymentMethod')} />
        <Option icon="help-circle-outline" label="FAQs" onPress={() => navigation.navigate('FAQ')} />
        <Option icon="log-out-outline" label="Logout" isLogout onPress={handleLogout} />
      </View>

      {/* Settings Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setShowMenu(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.menuItems}>
              <MenuOption 
                icon="person-outline" 
                label="Edit Profile" 
                onPress={() => handleMenuAction('edit_profile')} 
              />
              <MenuOption 
                icon="notifications-outline" 
                label="Notifications" 
                onPress={() => handleMenuAction('notifications')} 
              />
              <MenuOption 
                icon="shield-checkmark-outline" 
                label="Privacy Settings" 
                onPress={() => handleMenuAction('privacy')} 
              />
              <MenuOption 
                icon="lock-closed-outline" 
                label="Account Security" 
                onPress={() => handleMenuAction('security')} 
              />
              <MenuOption 
                icon="help-circle-outline" 
                label="Help & Support" 
                onPress={() => handleMenuAction('help')} 
              />
              <MenuOption 
                icon="information-circle-outline" 
                label="About MediFile" 
                onPress={() => handleMenuAction('about')} 
              />
              <MenuOption 
                icon="star-outline" 
                label="Rate App" 
                onPress={() => handleMenuAction('rate')} 
              />
              <MenuOption 
                icon="share-outline" 
                label="Share App" 
                onPress={() => handleMenuAction('share')} 
              />
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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

const MenuOption = ({
  icon,
  label,
  onPress,
}: {
  icon: any;
  label: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.menuOptionRow} onPress={onPress}>
    <View style={styles.menuIconWrapper}>
      <Ionicons name={icon} size={20} color="#008080" />
    </View>
    <Text style={styles.menuOptionText}>{label}</Text>
    <Ionicons name="chevron-forward" size={16} color="#ccc" />
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '85%',
    maxHeight: '70%',
    elevation: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  menuItems: {
    paddingVertical: 10,
  },
  menuOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  menuIconWrapper: {
    backgroundColor: '#f0f8f8',
    padding: 8,
    borderRadius: 8,
    marginRight: 15,
  },
  menuOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
});

export default ProfileScreen;
