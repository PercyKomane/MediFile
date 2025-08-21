import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function MyPatientsScreen({ navigation }: any) {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { role, token } = useAuth();

  useEffect(() => {
    // Check if user is a doctor
    if (role !== 'doctor') {
      Alert.alert('Access Denied', 'Only doctors can view patients.');
      navigation.goBack();
      return;
    }
    
    if (!token) {
      Alert.alert('Authentication Required', 'Please log in to view patients.');
      navigation.goBack();
      return;
    }
    
    loadPatients();
  }, [role, token, navigation]);

  const loadPatients = async () => {
    try {
      const response = await API.get('/appointments/my-patients/');
      setPatients(response.data);
    } catch (error: any) {
      console.error('Failed to load patients:', error);
      if (error.response?.status === 401) {
        Alert.alert('Authentication Error', 'Please log in again.');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to load patients. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderPatient = ({ item }: any) => (
    <TouchableOpacity style={styles.patientCard} onPress={() => navigation.navigate('PatientDetails', { patientId: item.patient_id })}>
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>
          {item.patient_name || `Patient ${item.patient_id}`}
        </Text>
        <Text style={styles.patientDetails}>{item.patient_email || 'No email'}</Text>
        <Text style={styles.appointmentCount}>{item.appointment_count || 0} appointments</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#8CA3A0" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Text style={styles.loadingText}>Loading patients...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#0F8A83" />
        </TouchableOpacity>
        <Text style={styles.title}>My Patients</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={patients}
        keyExtractor={(item) => String(item.patient_id)}
        renderItem={renderPatient}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#8CA3A0" />
            <Text style={styles.emptyText}>No patients yet</Text>
            <Text style={styles.emptySubtext}>Patients will appear here once they book appointments</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F8A83',
  },
  listContainer: {
    padding: 16,
  },
  patientCard: {
    backgroundColor: '#F3FAF9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334B48',
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 14,
    color: '#7B8F8C',
    marginBottom: 2,
  },
  appointmentCount: {
    fontSize: 12,
    color: '#0F8A83',
    fontWeight: '500',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#7B8F8C',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7B8F8C',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8CA3A0',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
});

