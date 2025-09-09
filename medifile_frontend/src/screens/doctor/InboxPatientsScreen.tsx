import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MessagesAPI from '../../api/messages';
import { getPatient } from '../../api/patients';

export default function InboxPatientsScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const conversations = await MessagesAPI.listConversations();
      const patientIds: number[] = Array.from(new Set(conversations.map((c: any) => c.patient).filter(Boolean)));
      const details = await Promise.all(patientIds.map((id) => getPatient(id)));
      const byId: Record<number, any> = {};
      patientIds.forEach((id, idx) => { byId[id] = details[idx]; });
      setItems(conversations.map((c: any) => ({ key: `conv-${c.conversation_id}`, conversationId: c.conversation_id, patient: byId[c.patient], created_at: c.created_at })));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}> 
      <Text style={styles.title}>Messages</Text>
      {loading && <ActivityIndicator style={{ padding: 16 }} color="#0F8A83" />}
      <FlatList
        data={items}
        keyExtractor={(it) => it.key}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Chat', { doctorId: `doc-${item.patient?.user?.user_id}`, conversationId: item.conversationId })}>
            <Image source={require('../../assets/images/doctors/doctor1.png')} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.patient?.user?.profile?.first_name} {item.patient?.user?.profile?.last_name}</Text>
              <Text style={styles.sub}>{item.patient?.user?.email}</Text>
            </View>
            {!!item.created_at && (
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  title: { fontWeight: '700', color: '#0F8A83', padding: 16 },
  sep: { height: 1, backgroundColor: '#E8F3F1' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 12 },
  name: { fontWeight: '700', color: '#334B48' },
  sub: { color: '#7B8F8C' },
  date: { color: '#9AA0A6', fontSize: 12 },
});


