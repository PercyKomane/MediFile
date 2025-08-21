import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listAvailableSlots, bookAppointment } from '../../api/appointments';
import { listDoctors } from '../../api/doctors';
import { API } from '../../api/client';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function BookAppointmentScreen({ navigation, route }: any) {
  const doctorId = route?.params?.doctorId as number | undefined;
  const [slots, setSlots] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<number | undefined>(doctorId);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickedDate, setPickedDate] = useState<Date | null>(null);
  const [symptoms, setSymptoms] = useState<string>('');
  const { token, role } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAvailableSlots(selectedDoctor);
      setSlots(data);
    } catch (error) {
      console.error('Failed to load slots:', error);
      Alert.alert('Error', 'Failed to load available slots');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const data = await listDoctors();
      setDoctors(data);
    } catch (error) {
      console.error('Failed to load doctors:', error);
      Alert.alert('Error', 'Failed to load doctors');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), loadDoctors()]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => { 
    if (selectedDoctor) {
      load(); 
    } else {
      setSlots([]);
    }
  }, [selectedDoctor]);

  const onBook = async (slotId: number) => {
    // Check if user is authenticated
    if (!token) {
      Alert.alert(
        'Authentication Required', 
        'You need to be logged in to book an appointment. Please log in first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    // Check if user is a patient
    if (role !== 'patient') {
      Alert.alert('Error', 'Only patients can book appointments');
      return;
    }

    setLoading(true);
    try {
      await bookAppointment(slotId);
      Alert.alert('Success', 'Appointment booked successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Failed to book appointment:', error);
      if (error?.response?.status === 401) {
        Alert.alert(
          'Authentication Error', 
          'Your session has expired. Please log in again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => navigation.navigate('Login') }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to book appointment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRequest = async () => {
    if (!selectedDoctor || !pickedDate) {
      Alert.alert('Error', 'Please select a doctor and date/time');
      return;
    }

    // Check if user is authenticated
    if (!token) {
      Alert.alert(
        'Authentication Required', 
        'You need to be logged in to request an appointment. Please log in first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    // Check if user is a patient
    if (role !== 'patient') {
      Alert.alert('Error', 'Only patients can request appointments');
      return;
    }

    setLoading(true);
    try {
      await API.post('/appointments/request/', { 
        doctor_id: selectedDoctor, 
        date_time: pickedDate.toISOString(), 
        symptoms 
      });
      Alert.alert('Success', 'Appointment request sent successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Failed to request appointment:', error);
      if (error?.response?.status === 401) {
        Alert.alert(
          'Authentication Error', 
          'Your session has expired. Please log in again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => navigation.navigate('Login') }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to send appointment request. Please try again.');
      }
    } finally { 
      setLoading(false); 
    }
  };

  const getSelectedDoctor = () => {
    return doctors.find(d => (d.doctor_id || d.id) === selectedDoctor);
  };

  // Show authentication warning if not logged in
  if (!token) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#0F8A83" />
          </TouchableOpacity>
          <Text style={styles.title}>Book Appointment</Text>
          <View style={{ width: 22 }} />
        </View>
        
        <View style={styles.authWarning}>
          <Ionicons name="lock-closed" size={48} color="#f9a825" />
          <Text style={styles.authWarningTitle}>Authentication Required</Text>
          <Text style={styles.authWarningText}>
            You need to be logged in to book appointments. Please log in with your patient account.
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

  // Show role warning if not a patient
  if (role !== 'patient') {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#0F8A83" />
          </TouchableOpacity>
          <Text style={styles.title}>Book Appointment</Text>
          <View style={{ width: 22 }} />
        </View>
        
        <View style={styles.authWarning}>
          <Ionicons name="person" size={48} color="#d32f2f" />
          <Text style={styles.authWarningTitle}>Access Denied</Text>
          <Text style={styles.authWarningText}>
            Only patients can book appointments. You are currently logged in as a {role}.
          </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Switch Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#0F8A83" />
        </TouchableOpacity>
        <Text style={styles.title}>Book Appointment</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Doctor picker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Doctor</Text>
        <FlatList
          data={doctors}
          horizontal
          keyExtractor={(it) => String(it.doctor_id || it.id)}
          style={{ marginBottom: 16 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.pill, selectedDoctor === (item.doctor_id || item.id) && styles.pillActive]}
              onPress={() => setSelectedDoctor(item.doctor_id || item.id)}
            >
              <Text style={[styles.pillText, selectedDoctor === (item.doctor_id || item.id) && styles.pillTextActive]}>
                Dr. {item.user?.profile?.last_name || 'Unknown'}
              </Text>
              <Text style={[styles.pillSubtext, selectedDoctor === (item.doctor_id || item.id) && styles.pillTextActive]}>
                {item.specialization || 'General'}
              </Text>
            </TouchableOpacity>
          )}
        />
        
        {getSelectedDoctor() && (
          <View style={styles.doctorInfo}>
            <Ionicons name="medical" size={24} color="#0F8A83" />
            <View style={styles.doctorDetails}>
              <Text style={styles.doctorName}>
                Dr. {getSelectedDoctor()?.user?.profile?.first_name} {getSelectedDoctor()?.user?.profile?.last_name}
              </Text>
              <Text style={styles.doctorSpecialty}>
                {getSelectedDoctor()?.specialization}
              </Text>
              <Text style={styles.doctorHospital}>
                {getSelectedDoctor()?.hospital?.name || 'Hospital not specified'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Available slots */}
      {selectedDoctor && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Slots</Text>
          <FlatList
            data={slots}
            keyExtractor={(it) => String(it.slot_id || it.id)}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item }) => (
              <View style={styles.slotCard}>
                <View style={styles.slotInfo}>
                  <Ionicons name="time-outline" size={20} color="#0F8A83" />
                  <Text style={styles.slotTime}>
                    {new Date(item.start_time).toLocaleDateString()} at {new Date(item.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.btn, loading && styles.btnDisabled]} 
                  onPress={() => onBook(item.slot_id || item.id)} 
                  disabled={loading}
                >
                  <Text style={styles.btnLabel}>Book</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={32} color="#ccc" />
                <Text style={styles.emptyText}>No slots available</Text>
                <Text style={styles.emptySubtext}>Try selecting a different doctor or request a custom time</Text>
              </View>
            }
          />
        </View>
      )}

      {/* Manual request */}
      {selectedDoctor && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Request Custom Time</Text>
          <View style={{ paddingHorizontal: 16 }}>
            <TouchableOpacity 
              style={styles.datePickerCard} 
              onPress={() => {
                Alert.prompt(
                  'Choose Date & Time',
                  'Enter date and time (YYYY-MM-DD HH:MM)',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'OK', 
                      onPress: (text) => {
                        if (text) {
                          try {
                            const date = new Date(text);
                            if (!isNaN(date.getTime())) {
                              setPickedDate(date);
                            } else {
                              Alert.alert('Invalid Date', 'Please enter a valid date and time');
                            }
                          } catch {
                            Alert.alert('Invalid Date', 'Please enter a valid date and time');
                          }
                        }
                      }
                    }
                  ],
                  'plain-text',
                  pickedDate ? pickedDate.toISOString().slice(0, 16).replace('T', ' ') : ''
                );
              }}
            >
              <Ionicons name="calendar-outline" size={18} color="#0F8A83" />
              <Text style={styles.datePickerText}>
                {pickedDate ? pickedDate.toLocaleString() : 'Choose date & time'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.symptomsContainer}>
              <Text style={styles.symptomsLabel}>Symptoms (optional)</Text>
              <TextInput
                style={styles.symptomsInput}
                placeholder="Describe your symptoms (optional)"
                placeholderTextColor="#7B8F8C"
                value={symptoms}
                onChangeText={setSymptoms}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity 
                style={[styles.btn, (loading || !pickedDate || !selectedDoctor) && styles.btnDisabled]} 
                onPress={onRequest} 
                disabled={loading || !pickedDate || !selectedDoctor}
              >
                <Text style={styles.btnLabel}>Request Appointment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F3F1',
  },
  title: { fontWeight: '700', color: '#0F8A83', fontSize: 18 },
  authWarning: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  authWarningTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#334B48',
    marginTop: 16,
    marginBottom: 8,
  },
  authWarningText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#0F8A83',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#334B48',
    marginBottom: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  pill: { 
    borderWidth: 1, 
    borderColor: '#0F8A83', 
    borderRadius: 16, 
    paddingHorizontal: 12, 
    paddingVertical: 8,
    alignItems: 'center',
  },
  pillActive: { backgroundColor: '#0F8A83' },
  pillText: { color: '#0F8A83', fontWeight: '600', fontSize: 14 },
  pillSubtext: { color: '#0F8A83', fontSize: 12, opacity: 0.8 },
  pillTextActive: { color: '#fff' },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3FAF9',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8F3F1',
  },
  doctorDetails: {
    marginLeft: 12,
    flex: 1,
  },
  doctorName: {
    fontWeight: '600',
    color: '#334B48',
    fontSize: 16,
  },
  doctorSpecialty: {
    color: '#0F8A83',
    fontSize: 14,
    marginTop: 2,
  },
  doctorHospital: {
    color: '#7B8F8C',
    fontSize: 12,
    marginTop: 2,
  },
  slotCard: { 
    backgroundColor: '#F3FAF9', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E8F3F1',
  },
  slotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  slotTime: { 
    color: '#334B48', 
    marginLeft: 8,
    fontWeight: '500',
  },
  btn: { 
    backgroundColor: '#0F8A83', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: '#ccc',
  },
  btnLabel: { color: '#fff', fontWeight: '600' },
  datePickerCard: {
    backgroundColor: '#F3FAF9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8F3F1',
  },
  datePickerText: { 
    marginLeft: 8, 
    color: '#334B48',
    flex: 1,
  },
  symptomsContainer: {
    backgroundColor: '#F3FAF9',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8F3F1',
  },
  symptomsLabel: { 
    color: '#334B48', 
    marginBottom: 8,
    fontWeight: '500',
  },
  symptomsInput: { 
    borderWidth: 1, 
    borderColor: '#CCE7E3', 
    borderRadius: 8, 
    padding: 12, 
    color: '#334B48',
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#7B8F8C',
    marginTop: 12,
    fontWeight: '500',
  },
  emptySubtext: {
    color: '#7B8F8C',
    marginTop: 4,
    textAlign: 'center',
    fontSize: 12,
  },
});


