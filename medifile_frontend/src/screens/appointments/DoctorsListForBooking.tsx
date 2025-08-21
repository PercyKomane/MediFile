import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listDoctors } from '../../api/doctors';
import { Ionicons } from '@expo/vector-icons';

export default function DoctorsListForBooking({ navigation }: any) {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { setDoctors(await listDoctors()); } finally { setLoading(false); }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={22} color="#0F8A83" /></TouchableOpacity>
        <Text style={styles.title}>Choose a doctor</Text>
        <View style={{ width: 22 }} />
      </View>
      <FlatList
        data={doctors}
        keyExtractor={(it) => String(it.doctor_id || it.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('BookAppointment', { doctorId: item.doctor_id || item.id })}>
            <View>
              <Text style={styles.name}>{item.user?.profile?.first_name} {item.user?.profile?.last_name}</Text>
              <Text style={styles.sub}>{item.specialization}</Text>
              {!!item.hospital?.name && <Text style={styles.sub}>{item.hospital.name}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8CA3A0" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ color: '#7B8F8C' }}>No doctors available</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { fontWeight: '700', color: '#0F8A83' },
  card: { backgroundColor: '#F3FAF9', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontWeight: '700', color: '#334B48' },
  sub: { color: '#7B8F8C' },
});


