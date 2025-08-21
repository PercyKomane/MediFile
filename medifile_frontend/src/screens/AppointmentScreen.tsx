import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, RefreshControl, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import FloatingButton from '../components/FloatingButton';
import { listMyAppointments } from '../api/appointments';
import { useAuth } from '../context/AuthContext';

const AppointmentScreen = ({ navigation }: any) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { role, token } = useAuth();



  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await listMyAppointments();
      setAppointments(data);
    } catch (error: any) {
      console.error('Failed to load appointments:', error);
      if (error?.response?.status === 401) {
        // Authentication error - user needs to log in
        Alert.alert(
          'Authentication Required',
          'Your session has expired. Please log in again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => navigation.navigate('Login') }
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return { color: '#2e7d32' }; // green
      case 'scheduled':
        return { color: '#f9a825' }; // amber
      case 'canceled':
        return { color: '#d32f2f' }; // red
      default:
        return { color: '#555' };
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'Completed';
      case 'scheduled':
        return 'Scheduled';
      case 'canceled':
        return 'Cancelled';
      default:
        return status || 'Unknown';
    }
  };

  const getDoctorName = (appointment: any) => {
    const doctor = appointment.doctor;
    if (!doctor) return 'Unknown Doctor';
    
    // Try different possible data structures
    if (doctor.user?.profile?.first_name && doctor.user?.profile?.last_name) {
      return `Dr. ${doctor.user.profile.first_name} ${doctor.user.profile.last_name}`;
    }
    if (doctor.user?.profile?.last_name) {
      return `Dr. ${doctor.user.profile.last_name}`;
    }
    if (doctor.user?.email) {
      return `Dr. ${doctor.user.email.split('@')[0]}`;
    }
    return 'Unknown Doctor';
  };

  const getPatientName = (appointment: any) => {
    const patient = appointment.patient;
    if (!patient) return 'Unknown Patient';
    
    // Try different possible data structures
    if (patient.user?.profile?.first_name && patient.user?.profile?.last_name) {
      return `${patient.user.profile.first_name} ${patient.user.profile.last_name}`;
    }
    if (patient.user?.profile?.first_name) {
      return patient.user.profile.first_name;
    }
    if (patient.user?.email) {
      return patient.user.email.split('@')[0];
    }
    return 'Unknown Patient';
  };

  const getDoctorSpecialty = (appointment: any) => {
    const doctor = appointment.doctor;
    if (!doctor) return 'General Medicine';
    
    return doctor.specialization || 'General Medicine';
  };

  const onAppointmentPress = (appointment: any) => {
    navigation.navigate('AppointmentDetails', { appointment });
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => onAppointmentPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Ionicons name="medical" size={30} color="#0F8A83" />
      </View>
      <View style={styles.details}>
        <Text style={styles.name}>
          {role === 'patient' 
            ? getDoctorName(item)
            : getPatientName(item)
          }
        </Text>
        <Text style={styles.specialty}>
          {role === 'patient' 
            ? getDoctorSpecialty(item)
            : 'Patient'
          }
        </Text>
        <View style={styles.datetimeRow}>
          <Ionicons name="calendar-outline" size={16} color="#555" />
          <Text style={styles.datetime}>
            {new Date(item.date_time).toLocaleDateString()}, {new Date(item.date_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </View>
        <Text style={[styles.status, getStatusStyle(item.status)]}>
          {getStatusText(item.status)}
        </Text>
        {item.notes && (
          <Text style={styles.notes}>Notes: {item.notes}</Text>
        )}
      </View>
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  const handleBookAppointment = () => {
    if (role === 'patient') {
      navigation.navigate('DoctorsListForBooking');
    } else if (role === 'doctor') {
      navigation.navigate('ApproveAppointments');
    }
  };

  // Show login prompt if not authenticated
  if (!token) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <Text style={styles.heading}>My Appointments</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Authentication Required</Text>
          <Text style={styles.emptySubtext}>
            Please log in to view your appointments
          </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <Text style={styles.heading}>My Appointments</Text>
        {role === 'doctor' && (
          <TouchableOpacity 
            onPress={() => navigation.navigate('ApproveAppointments')}
            style={styles.headerButton}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="#0F8A83" />
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={appointments}
        keyExtractor={(item) => String(item.appointment_id || item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No appointments found</Text>
            <Text style={styles.emptySubtext}>
              {role === 'patient' 
                ? 'Book your first appointment with a doctor'
                : 'No appointments scheduled yet'
              }
            </Text>
          </View>
        }
      />

      <FloatingButton onPress={handleBookAppointment} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#008080',
  },
  headerButton: {
    padding: 8,
  },
  card: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: "#E8F3F1",
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    width: 65,
    height: 65,
    borderRadius: 50,
    marginRight: 15,
    backgroundColor: '#F3FAF9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  name: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  specialty: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 6 
  },
  datetimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datetime: {
    marginLeft: 5,
    fontSize: 13,
    color: '#555',
  },
  status: {
    marginTop: 5,
    fontWeight: '600',
  },
  notes: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  arrowContainer: {
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 20,
    backgroundColor: '#0F8A83',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AppointmentScreen;
