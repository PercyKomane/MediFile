import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API } from '../../api/client';
import { cancelAppointment, updateAppointment } from '../../api/appointments';
import { useAuth } from '../../context/AuthContext';

export default function AppointmentDetailsScreen({ navigation, route }: any) {
  const appointment = route?.params?.appointment;
  const { role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(appointment?.notes || '');
  const [showNotesInput, setShowNotesInput] = useState(false);

  // Listen for when screen comes back into focus to refresh parent
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // This will be called when the screen comes back into focus
    });

    return unsubscribe;
  }, [navigation]);

  if (!appointment) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#0F8A83" />
          </TouchableOpacity>
          <Text style={styles.title}>Appointment Details</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Appointment not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '#2e7d32';
      case 'scheduled':
        return '#f9a825';
      case 'canceled':
        return '#d32f2f';
      default:
        return '#555';
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

  const onCancelAppointment = () => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await cancelAppointment(appointment.appointment_id);
              Alert.alert('Success', 'Appointment cancelled successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error: any) {
              console.error('Failed to cancel appointment:', error);
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
                Alert.alert('Error', 'Failed to cancel appointment. Please try again.');
              }
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const onRescheduleAppointment = () => {
    Alert.alert(
      'Reschedule Appointment',
      'This will cancel your current appointment and allow you to book a new one. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            setLoading(true);
            try {
              // First cancel the current appointment
              await cancelAppointment(appointment.appointment_id);
              Alert.alert('Success', 'Appointment cancelled. You can now book a new appointment.', [
                { text: 'OK', onPress: () => navigation.navigate('BookAppointment') }
              ]);
            } catch (error: any) {
              console.error('Failed to reschedule appointment:', error);
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
                Alert.alert('Error', 'Failed to reschedule appointment. Please try again.');
              }
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const onSaveNotes = async () => {
    setLoading(true);
    try {
      await updateAppointment(appointment.appointment_id, { notes });
      setShowNotesInput(false);
      Alert.alert('Success', 'Notes updated successfully!');
    } catch (error: any) {
      console.error('Failed to update notes:', error);
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
        Alert.alert('Error', 'Failed to update notes. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleString()
    };
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

  const getDoctorSpecialty = (appointment: any) => {
    const doctor = appointment.doctor;
    if (!doctor) return 'General Medicine';
    
    return doctor.specialization || 'General Medicine';
  };

  const getDoctorHospital = (appointment: any) => {
    const doctor = appointment.doctor;
    if (!doctor) return 'Hospital not specified';
    
    return doctor.hospital?.name || 'Hospital not specified';
  };

  const dateTime = formatDateTime(appointment.date_time);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#0F8A83" />
        </TouchableOpacity>
        <Text style={styles.title}>Appointment Details</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="medical" size={24} color="#0F8A83" />
            <Text style={styles.statusTitle}>Appointment Status</Text>
          </View>
          <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
            {getStatusText(appointment.status)}
          </Text>
        </View>

        {/* Doctor Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={20} color="#0F8A83" />
            <Text style={styles.cardTitle}>Doctor Information</Text>
          </View>
          <Text style={styles.doctorName}>
            {getDoctorName(appointment)}
          </Text>
          <Text style={styles.doctorSpecialty}>
            {getDoctorSpecialty(appointment)}
          </Text>
          <Text style={styles.doctorHospital}>
            {getDoctorHospital(appointment)}
          </Text>
        </View>

        {/* Appointment Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={20} color="#0F8A83" />
            <Text style={styles.cardTitle}>Appointment Details</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>Date: {dateTime.date}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>Time: {dateTime.time}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="information-circle-outline" size={16} color="#666" />
            <Text style={styles.detailText}>ID: #{appointment.appointment_id}</Text>
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={20} color="#0F8A83" />
            <Text style={styles.cardTitle}>Notes</Text>
            {role === 'patient' && (
              <TouchableOpacity 
                onPress={() => setShowNotesInput(!showNotesInput)}
                style={styles.editButton}
              >
                <Ionicons name="pencil" size={16} color="#0F8A83" />
              </TouchableOpacity>
            )}
          </View>
          
          {showNotesInput ? (
            <View style={styles.notesInputContainer}>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add your notes here..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
              <View style={styles.notesActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setNotes(appointment.notes || '');
                    setShowNotesInput(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveButton, loading && styles.buttonDisabled]}
                  onPress={onSaveNotes}
                  disabled={loading}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.notesText}>
              {appointment.notes || 'No notes available'}
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        {role === 'patient' && appointment.status === 'scheduled' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rescheduleButton, loading && styles.buttonDisabled]}
              onPress={onRescheduleAppointment}
              disabled={loading}
            >
              <Ionicons name="calendar" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Reschedule</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelAppointmentButton, loading && styles.buttonDisabled]}
              onPress={onCancelAppointment}
              disabled={loading}
            >
              <Ionicons name="close-circle" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Cancel Appointment</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  statusCard: {
    backgroundColor: '#F3FAF9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8F3F1',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334B48',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#F3FAF9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8F3F1',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334B48',
    marginLeft: 8,
    flex: 1,
  },
  editButton: {
    padding: 4,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334B48',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#0F8A83',
    marginBottom: 4,
  },
  doctorHospital: {
    fontSize: 14,
    color: '#666',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#334B48',
    marginLeft: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#334B48',
    lineHeight: 20,
  },
  notesInputContainer: {
    marginTop: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#CCE7E3',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#334B48',
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  notesActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#0F8A83',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  actionsContainer: {
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  rescheduleButton: {
    backgroundColor: '#f9a825',
  },
  cancelAppointmentButton: {
    backgroundColor: '#d32f2f',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
