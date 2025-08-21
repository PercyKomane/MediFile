import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listDoctorPending, approveAppointment, declineAppointment } from '../../api/appointments';
import { Ionicons } from '@expo/vector-icons';

export default function ApproveAppointmentsScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listDoctorPending();
      setItems(data);
    } catch (error) {
      console.error('Failed to load pending appointments:', error);
      Alert.alert('Error', 'Failed to load pending appointments');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const onApprove = async (id: number) => {
    Alert.alert(
      'Approve Appointment',
      'Are you sure you want to approve this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setLoading(true);
            try {
              await approveAppointment(id);
              Alert.alert('Success', 'Appointment approved successfully!');
              await load();
            } catch (error) {
              console.error('Failed to approve appointment:', error);
              Alert.alert('Error', 'Failed to approve appointment');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const onDecline = async (id: number) => {
    Alert.alert(
      'Decline Appointment',
      'Are you sure you want to decline this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await declineAppointment(id);
              Alert.alert('Success', 'Appointment declined successfully!');
              await load();
            } catch (error) {
              console.error('Failed to decline appointment:', error);
              Alert.alert('Error', 'Failed to decline appointment');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

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

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#0F8A83" />
        </TouchableOpacity>
        <Text style={styles.title}>Pending Appointments</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MyPatients')}>
          <Ionicons name="people-outline" size={22} color="#0F8A83" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.appointment_id || it.id)}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.patientInfo}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person" size={24} color="#0F8A83" />
              </View>
              <View style={styles.details}>
                <Text style={styles.patientName}>
                  {item.patient_name || `${item.patient?.user?.profile?.first_name || 'Unknown'} ${item.patient?.user?.profile?.last_name || ''}`}
                </Text>
                <Text style={styles.patientEmail}>
                  {item.patient?.user?.email || 'Email not available'}
                </Text>
                <View style={styles.datetimeRow}>
                  <Ionicons name="calendar-outline" size={16} color="#555" />
                  <Text style={styles.datetime}>
                    {new Date(item.date_time).toLocaleDateString()} at {new Date(item.date_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Text>
                </View>
                <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
                  {getStatusText(item.status)}
                </Text>
                {item.notes && (
                  <Text style={styles.notes}>Notes: {item.notes}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.approveBtn, loading && styles.btnDisabled]} 
                onPress={() => onApprove(item.appointment_id || item.id)} 
                disabled={loading}
              >
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Approve</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionBtn, styles.declineBtn, loading && styles.btnDisabled]} 
                onPress={() => onDecline(item.appointment_id || item.id)} 
                disabled={loading}
              >
                <Ionicons name="close" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No pending appointments</Text>
            <Text style={styles.emptySubtext}>All appointments have been processed</Text>
          </View>
        }
      />
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
  card: { 
    backgroundColor: '#F3FAF9', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8F3F1',
  },
  patientInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F3F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  patientName: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#334B48',
    marginBottom: 2,
  },
  patientEmail: { 
    fontSize: 14, 
    color: '#666',
    marginBottom: 8,
  },
  datetimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  datetime: {
    marginLeft: 6,
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  notes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  approveBtn: {
    backgroundColor: '#2e7d32',
  },
  declineBtn: {
    backgroundColor: '#d32f2f',
  },
  btnDisabled: {
    backgroundColor: '#ccc',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
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
});


