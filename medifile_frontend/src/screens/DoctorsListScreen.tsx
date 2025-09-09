import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMessages } from '../context/MessagesContext';
import * as MessagesAPI from '../api/messages';
import { listDoctors } from '../api/doctors';
import { getDoctor } from '../api/doctors';

const DoctorsListScreen = () => {
  const navigation = useNavigation();
  const anyNav = navigation as any;
  const { getOrCreateBackendConversation } = useMessages();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      // Fetch existing conversations; if none, fall back to listing doctors so the user can start one
      const conversations = await MessagesAPI.listConversations();
      if (Array.isArray(conversations) && conversations.length > 0) {
        const doctorIds: number[] = Array.from(new Set(conversations.map((c: any) => c.doctor).filter(Boolean)));
        const doctorDetails = await Promise.all(doctorIds.map((id) => getDoctor(id)));
        const byId: Record<number, any> = {};
        doctorIds.forEach((id, idx) => { byId[id] = doctorDetails[idx]; });

        setItems(conversations.map((c: any) => ({
          key: `conv-${c.conversation_id}`,
          conversationId: c.conversation_id,
          doctor: byId[c.doctor],
          created_at: c.created_at,
        })));
      } else {
        const doctors = await listDoctors();
        setItems(doctors.map((d: any) => ({ key: `doc-${d.doctor_id || d.id}`, doctor: d })));
      }
    } catch (e) {
      const doctors = await listDoctors();
      setItems(doctors.map((d: any) => ({ key: `doc-${d.doctor_id || d.id}`, doctor: d })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Text style={styles.title}>Messages</Text>
      {loading && <ActivityIndicator style={{ padding: 16 }} color="#0F8A83" />}
      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={async () => {
              // If it already has a conversation, go straight to it; otherwise create
              const backendDoctorId = item?.doctor?.doctor_id || item?.doctor?.id;
              let conversationId = item?.conversationId;
              if (!conversationId) {
                // MessagesContext expects a string doctor id for local chat key; build one
                const chatDoctorId = `doc-${backendDoctorId ?? '1'}`;
                conversationId = await getOrCreateBackendConversation(chatDoctorId);
              }
              const chatDoctorId = `doc-${backendDoctorId ?? '1'}`;
              anyNav.navigate('Chat', { doctorId: chatDoctorId, conversationId });
            }}
          >
            <Image source={require('../assets/images/doctors/doctor1.png')} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {item.doctor?.user?.profile ? `Dr. ${item.doctor.user.profile.first_name} ${item.doctor.user.profile.last_name}` : 'Doctor'}
              </Text>
              <Text style={styles.sub}>{item.doctor?.specialization || ''}</Text>
            </View>
            {!!item.created_at && (
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  sep: { height: 1, backgroundColor: '#F0F2F4' },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  name: { fontSize: 16, fontWeight: '600' },
  sub: { fontSize: 12, color: '#6B7280' },
  date: { fontSize: 12, color: '#9AA0A6' },
  badge: { backgroundColor: '#E6F7F3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#12876F', fontSize: 12, fontWeight: '600' },
});

export default DoctorsListScreen;


