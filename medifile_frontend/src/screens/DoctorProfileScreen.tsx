import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar, Image, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getDoctor } from '../api/doctors';
import { listMyAppointments, cancelAppointment } from '../api/appointments';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../context/MessagesContext';

export default function DoctorProfileScreen({ navigation, route }: any) {
  const doctorId = route?.params?.doctorId as number | undefined;
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [apptLoading, setApptLoading] = useState(false);
  const { token } = useAuth();
  const { getOrCreateBackendConversation } = useMessages();

  useEffect(() => {
    (async () => {
      if (!doctorId) return;
      setLoading(true);
      try { setDoctor(await getDoctor(doctorId)); } finally { setLoading(false); }
    })();
  }, [doctorId]);

  const loadAppointments = async () => {
    if (!token || !doctorId) return;
    setApptLoading(true);
    try {
      const data = await listMyAppointments();
      const filtered = (data || []).filter((a: any) => (a.doctor?.doctor_id || a.doctor?.id) === doctorId);
      setAppointments(filtered);
    } catch (e) {
      // noop
    } finally {
      setApptLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [token, doctorId]);

  const onBook = () => {
    navigation.navigate('BookAppointment', { doctorId });
  };

  const onChat = async () => {
    try {
      // Bridge to Messages navigator: use synthetic doctorId string used by chat demo
      const chatDoctorId = `doc-${doctorId ?? '1'}`;
      const conversationId = await getOrCreateBackendConversation(chatDoctorId);
      navigation.navigate('MainApp', {
        screen: 'Messages',
        params: { screen: 'Chat', params: { doctorId: chatDoctorId, conversationId } },
      });
    } catch (e) {
      navigation.navigate('MainApp', { screen: 'Messages' });
    }
  };

  const onCancelAppointment = async (appointmentId: number) => {
    Alert.alert('Cancel appointment', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: async () => {
        try {
          await cancelAppointment(appointmentId);
          loadAppointments();
        } catch (e) {
          Alert.alert('Error', 'Failed to cancel appointment');
        }
      } }
    ]);
  };

  const avatarSource = useMemo(() => {
    // Use local assets, pick based on id for variety
    const idx = (doctorId ?? 1) % 3;
    if (idx === 1) return require('../assets/images/doctors/doctor1.png');
    if (idx === 2) return require('../assets/images/doctors/doctor2.png');
    return require('../assets/images/doctors/doctor3.png');
  }, [doctorId]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#0F8A83" />
        </TouchableOpacity>
        <Text style={styles.title}>Doctor Profile</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading && (
        <View style={{ padding: 16 }}>
          <ActivityIndicator size="small" color="#0F8A83" />
        </View>
      )}

      {!loading && doctor && (
        <View style={{ padding: 16 }}>
          <View style={styles.profileCard}>
            <Image source={avatarSource} style={styles.avatar} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.name}>Dr. {doctor?.user?.profile?.first_name} {doctor?.user?.profile?.last_name}</Text>
              <Text style={styles.sub}>{doctor?.specialization}</Text>
              {!!doctor?.hospital?.name && <Text style={styles.sub}>{doctor?.hospital?.name}</Text>}
            </View>
          </View>

          {/* Ratings (placeholder - no model yet) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ratings</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={18} color="#f9a825" />
              <Text style={styles.ratingText}>No ratings yet</Text>
            </View>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>Specialist in {doctor?.specialization}. Licensed: {doctor?.license_number}.</Text>
          </View>

          {/* Payment summary (visual only) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Detail</Text>
            <View style={styles.paymentRow}><Text style={styles.paymentLabel}>Consultation</Text><Text style={styles.paymentValue}>R 450</Text></View>
            <View style={styles.paymentRow}><Text style={styles.paymentLabel}>Admin Fee</Text><Text style={styles.paymentValue}>R 50</Text></View>
            <View style={[styles.paymentRow, { borderTopWidth: 1, borderTopColor: '#E8F3F1', paddingTop: 8, marginTop: 8 }]}>
              <Text style={[styles.paymentLabel, { fontWeight: '700' }]}>Total</Text>
              <Text style={[styles.paymentValue, { color: '#0F8A83', fontWeight: '700' }]}>R 500</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0F8A83' }]} onPress={onBook}>
              <Text style={styles.actionText}>Book Appointment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#199A8E' }]} onPress={onChat}>
              <Text style={styles.actionText}>Chat Doctor</Text>
            </TouchableOpacity>
          </View>

          {/* Appointments with this doctor */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Appointments with this Doctor</Text>
            {apptLoading && <ActivityIndicator size="small" color="#0F8A83" />}
            {!apptLoading && appointments.length === 0 && (
              <Text style={{ color: '#7B8F8C' }}>No appointments found</Text>
            )}
            {!apptLoading && appointments.length > 0 && (
              <FlatList
                data={appointments}
                keyExtractor={(it) => String(it.appointment_id || it.id)}
                renderItem={({ item }) => (
                  <View style={styles.appointmentCard}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="calendar-outline" size={16} color="#0F8A83" />
                        <Text style={styles.apptText}>
                          {new Date(item.date_time).toLocaleDateString()} • {new Date(item.date_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </Text>
                      </View>
                      <Text style={[styles.apptStatus, { color: '#2e7d32' }]}>{(item.status || 'scheduled').toString()}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={styles.secondaryBtn} onPress={() => onCancelAppointment(item.appointment_id || item.id)}>
                        <Text style={styles.secondaryBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.primaryOutlineBtn} onPress={() => navigation.navigate('BookAppointment', { doctorId })}>
                        <Text style={styles.primaryOutlineBtnText}>Reschedule</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              />
            )}
          </View>

          
        </View>
      )}

      {!loading && !doctor && (
        <View style={{ padding: 16 }}>
          <Text style={{ color: '#7B8F8C' }}>Unable to load doctor details.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { fontWeight: '700', color: '#0F8A83' },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3FAF9', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E8F3F1' },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  name: { fontWeight: '700', color: '#334B48', fontSize: 16 },
  sub: { color: '#7B8F8C', marginTop: 2 },
  section: { marginTop: 20 },
  sectionTitle: { fontWeight: '600', color: '#334B48', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingText: { color: '#334B48' },
  aboutText: { color: '#334B48' },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 24, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '600' },
  paymentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  paymentLabel: { color: '#334B48' },
  paymentValue: { color: '#334B48' },
  appointmentCard: { backgroundColor: '#F3FAF9', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E8F3F1', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  apptText: { marginLeft: 6, color: '#334B48' },
  apptStatus: { marginTop: 6, fontWeight: '600' },
  secondaryBtn: { backgroundColor: '#E8F3F1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  secondaryBtnText: { color: '#334B48', fontWeight: '600' },
  primaryOutlineBtn: { borderWidth: 1, borderColor: '#0F8A83', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  primaryOutlineBtnText: { color: '#0F8A83', fontWeight: '600' },
});
